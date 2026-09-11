import { NextRequest, NextResponse } from "next/server";
import { validarWebhookTokenAsaas } from "@/lib/asaas/client";
import {
  atualizarUserPlanoAsaas,
  garantirColunaVerificacaoAssinatura,
} from "@/lib/db/users";
import {
  verificarEventoProcessado,
  registrarEventoProcessado,
} from "@/lib/db/webhooks";
import { query } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Webhook Oficial do Asaas (v3)
 * Documentação: https://docs.asaas.com/docs/webhook-para-cobrancas
 */
export async function POST(request: NextRequest) {
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
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      return NextResponse.json(
        { erro: "Payload JSON inválido" },
        { status: 400 }
      );
    }

    const eventId = payload.id || `asaas_evt_${Date.now()}`;
    const eventName = payload.event || "";
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
        return NextResponse.json({
          ok: true,
          duplicado: true,
          id: payload.id,
          evento: eventName,
        });
      }
    }

    // 4. Tratamento dos Eventos de Pagamento e Assinatura
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

    if (isActivationEvent) {
      // Ativa o plano Pro do usuário
      if (externalReference) {
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
          [externalReference, customerId, subscriptionId]
        );
      } else if (customerId) {
        await atualizarUserPlanoAsaas(customerId, "pro", subscriptionId || null);
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
      if (eventName === "PAYMENT_REFUNDED" || eventName === "PAYMENT_DELETED") {
        if (externalReference) {
          await query(
            `UPDATE users 
             SET plano = 'free', atualizado_em = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [externalReference]
          );
        } else if (customerId) {
          await atualizarUserPlanoAsaas(customerId, "free", null);
        }

        if (paymentId) {
          await query(
            `UPDATE pagamentos 
             SET status = 'cancelado' 
             WHERE asaas_payment_id = $1 OR abacate_transaction_id = $1`,
            [paymentId]
          );
        }
      } else if (eventName === "SUBSCRIPTION_CANCELED" || eventName === "SUBSCRIPTION_DELETED") {
        if (externalReference) {
          await query(
            `UPDATE users 
             SET cancelamento_agendado = TRUE, atualizado_em = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [externalReference]
          );
        }
      }
    }

    // 5. Registra idempotência
    if (payload.id) {
      await registrarEventoProcessado(payload.id, eventName, payload);
    }

    // 6. Resposta de sucesso ao Asaas
    return NextResponse.json({
      ok: true,
      recebido: true,
      id: eventId,
      evento: eventName,
    });
  } catch (error: any) {
    console.error("Erro no processamento do webhook Asaas:", error);
    return NextResponse.json(
      { erro: "Erro interno ao processar webhook Asaas" },
      { status: 500 }
    );
  }
}
