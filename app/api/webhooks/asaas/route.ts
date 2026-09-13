import { NextRequest, NextResponse } from "next/server";
import { validarWebhookTokenAsaas } from "@/lib/asaas/client";
import {
  obterUserPorId,
  garantirColunaVerificacaoAssinatura,
} from "@/lib/db/users";
import {
  verificarEventoProcessado,
  registrarEventoAuditoria,
} from "@/lib/db/webhooks";
import { query } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Webhook Oficial do Asaas (v3) com Observabilidade & Downgrade Automático
 * Documentação: https://docs.asaas.com/docs/webhook-para-cobrancas
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let eventId = `asaas_evt_${Date.now()}`;
  let eventName = "UNKNOWN";
  let payload: any = {};

  try {
    const rawBody = await request.text();
    const tokenHeader =
      request.headers.get("asaas-access-token") ||
      request.headers.get("access_token") ||
      request.headers.get("X-Asaas-Token") ||
      "";

    const { searchParams } = new URL(request.url);
    const tokenQuery =
      searchParams.get("token") ||
      searchParams.get("secret") ||
      searchParams.get("webhookSecret") ||
      "";

    const receivedToken = tokenHeader || tokenQuery;

    // 1. Validação de Segurança (Header asaas-access-token ou Query param)
    const isAuthorized = validarWebhookTokenAsaas(receivedToken);

    if (!isAuthorized && process.env.NODE_ENV !== "development") {
      console.warn("⚠️ Webhook Asaas rejeitado: token de autorização inválido ou ausente.");
      return NextResponse.json(
        { erro: "Token de webhook do Asaas inválido" },
        { status: 401 }
      );
    }

    // 2. Parsing do payload JSON
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr: any) {
      return NextResponse.json(
        { erro: "Payload JSON inválido" },
        { status: 400 }
      );
    }

    eventId = payload.id || eventId;
    eventName = payload.event || "UNKNOWN";
    const payment = payload.payment || {};
    const subscription = payload.subscription || {};

    const paymentId = payment.id || "";
    const subscriptionId = payment.subscription || subscription.id || "";
    const customerId = payment.customer || subscription.customer || "";
    const externalReference =
      payment.externalReference || subscription.externalReference || "";
    const invoiceUrl = payment.invoiceUrl || "";

    console.log(`📥 Recebido Webhook Asaas [${eventName}] (ID: ${eventId}):`, {
      paymentId,
      subscriptionId,
      customerId,
      externalReference,
    });

    await garantirColunaVerificacaoAssinatura();

    // 3. Verificação de Idempotência (Deduplicação de retentativas)
    if (payload.id) {
      const alreadyProcessed = await verificarEventoProcessado(payload.id);
      if (alreadyProcessed) {
        console.log(`ℹ️ Evento ${payload.id} do Asaas já foi processado anteriormente. Respondendo 200 OK.`);
        await registrarEventoAuditoria({
          id: `${payload.id}_dup_${Date.now()}`,
          evento: eventName,
          gateway: "asaas",
          status: "duplicado",
          acao: "DUPLICATE_SKIPPED",
          duracaoMs: Date.now() - startTime,
          payload,
        });

        return NextResponse.json({
          ok: true,
          duplicado: true,
          id: payload.id,
          evento: eventName,
        });
      }
    }

    // 4. Resolução Multi-Chave do Usuário
    let targetUser: any = null;

    if (externalReference) {
      targetUser = await obterUserPorId(externalReference);
    }

    if (!targetUser && subscriptionId) {
      const res = await query(
        "SELECT id, email, nome, role, plano FROM users WHERE asaas_subscription_id = $1 AND deletado_em IS NULL",
        [subscriptionId]
      );
      if (res.rows[0]) targetUser = res.rows[0];
    }

    if (!targetUser && customerId) {
      const res = await query(
        "SELECT id, email, nome, role, plano FROM users WHERE asaas_customer_id = $1 AND deletado_em IS NULL",
        [customerId]
      );
      if (res.rows[0]) targetUser = res.rows[0];
    }

    const targetUserId = targetUser?.id || null;

    // 5. Categorização e Execução dos Eventos
    const isActivationEvent =
      eventName === "PAYMENT_RECEIVED" ||
      eventName === "PAYMENT_CONFIRMED" ||
      eventName === "PAYMENT_RECEIVED_IN_CASH_UNDONE" ||
      eventName === "PAYMENT_DUNNING_RECEIVED" ||
      payment.status === "RECEIVED" ||
      payment.status === "CONFIRMED";

    const isCancellationEvent =
      eventName === "PAYMENT_OVERDUE" ||
      eventName === "PAYMENT_REFUNDED" ||
      eventName === "PAYMENT_DELETED" ||
      eventName === "PAYMENT_CHARGEBACK_REQUESTED" ||
      eventName === "SUBSCRIPTION_CANCELED" ||
      eventName === "SUBSCRIPTION_DELETED";

    let executedAction = "IGNORED";

    if (isActivationEvent) {
      if (targetUserId) {
        await query(
          `UPDATE users 
           SET plano = 'pro', 
               data_assinatura = CURRENT_TIMESTAMP, 
               data_proxima_cobranca = CURRENT_TIMESTAMP + INTERVAL '30 days',
               cancelamento_agendado = FALSE,
               asaas_customer_id = COALESCE(NULLIF($2, ''), asaas_customer_id),
               asaas_subscription_id = COALESCE(NULLIF($3, ''), asaas_subscription_id),
               atualizado_em = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [targetUserId, customerId, subscriptionId]
        );
        executedAction = "PLAN_ACTIVATED";
        console.log(`✨ Plano PRO ativado/renovado para o usuário ${targetUserId} via [${eventName}].`);
      } else {
        executedAction = "UNMATCHED_USER";
        console.warn(`⚠️ Webhook [${eventName}] não encontrou usuário para ativar PRO:`, {
          externalReference,
          subscriptionId,
          customerId,
        });
      }

      // Atualiza registro de pagamento
      if (paymentId) {
        await query(
          `UPDATE pagamentos 
           SET status = 'pago', pago_em = CURRENT_TIMESTAMP, invoice_url = COALESCE(NULLIF($2, ''), invoice_url)
           WHERE asaas_payment_id = $1 OR abacate_transaction_id = $1`,
          [paymentId, invoiceUrl]
        );
      }
    } else if (isCancellationEvent) {
      if (targetUserId) {
        if (targetUser?.role === "admin") {
          executedAction = "ADMIN_DOWNGRADE_SKIPPED";
          console.log(`🛡️ Usuário administrador ${targetUserId} protegido contra downgrade via evento Asaas [${eventName}].`);
        } else {
          // Rebaixa imediatamente o plano para Free e limpa vencimento/concessão
          await query(
            `UPDATE users 
             SET plano = 'free', 
                 cancelamento_agendado = FALSE,
                 data_proxima_cobranca = NULL,
                 pro_tipo_concessao = NULL,
                 atualizado_em = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [targetUserId]
          );
          executedAction = "DOWNGRADE_TO_FREE";
          console.log(`🔻 Downgrade para Free executado com sucesso para o usuário ${targetUserId} via evento Asaas [${eventName}].`);
        }
      } else {
        executedAction = "UNMATCHED_USER";
        console.warn(`⚠️ Webhook [${eventName}] não encontrou usuário para rebaixar para Free:`, {
          externalReference,
          subscriptionId,
          customerId,
        });
      }

      if (paymentId) {
        const novoStatus = eventName === "PAYMENT_REFUNDED" ? "estornado" : "cancelado";
        await query(
          `UPDATE pagamentos 
           SET status = $2 
           WHERE asaas_payment_id = $1 OR abacate_transaction_id = $1`,
          [paymentId, novoStatus]
        );
      }
    }

    // 6. Registra auditoria completa de observabilidade
    const durationMs = Date.now() - startTime;
    await registrarEventoAuditoria({
      id: eventId,
      evento: eventName,
      gateway: "asaas",
      status: executedAction === "UNMATCHED_USER" ? "aviso" : "sucesso",
      acao: executedAction,
      usuarioId: targetUserId,
      duracaoMs: durationMs,
      payload,
    });

    // 7. Resposta de sucesso ao Asaas
    return NextResponse.json({
      ok: true,
      recebido: true,
      id: eventId,
      evento: eventName,
      acao: executedAction,
      duracaoMs: durationMs,
    });
  } catch (error: any) {
    console.error("Erro no processamento do webhook Asaas:", error);
    const durationMs = Date.now() - startTime;

    try {
      await registrarEventoAuditoria({
        id: eventId,
        evento: eventName,
        gateway: "asaas",
        status: "erro",
        acao: "ERROR",
        duracaoMs: durationMs,
        erroMensagem: error.message || "Erro desconhecido",
        payload,
      });
    } catch {}

    return NextResponse.json(
      { erro: "Erro interno ao processar webhook Asaas", detalhes: error.message },
      { status: 500 }
    );
  }
}
