import { NextRequest, NextResponse } from "next/server";
import { verifyAbacateSignature } from "@/lib/abacate/client";
import { atualizarUserPlano } from "@/lib/db/users";
import {
  verificarEventoProcessado,
  registrarEventoProcessado,
} from "@/lib/db/webhooks";
import { query } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Webhook Oficial do Abacate Pay (v2)
 * Documentação: https://docs.abacatepay.com/pages/webhooks
 * Segurança: https://docs.abacatepay.com/pages/webhooks/security
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("X-Webhook-Signature") ||
      request.headers.get("X-Abacate-Signature") ||
      "";

    const { searchParams } = new URL(request.url);
    const secretFromQuery =
      searchParams.get("webhookSecret") || searchParams.get("secret") || "";

    const expectedSecret =
      process.env.WEBHOOK_SECRET ||
      process.env.ABACATE_WEBHOOK_SECRET ||
      process.env.ABACATEPAY_WEBHOOK_SECRET ||
      "";

    // 1. Validação de Segurança (Secret na URL + Assinatura HMAC no Header)
    let isAuthorized = false;

    if (process.env.NODE_ENV === "development") {
      isAuthorized = true;
    } else {
      const isQuerySecretValid = expectedSecret
        ? secretFromQuery === expectedSecret
        : true;
      const isHmacValid = verifyAbacateSignature(rawBody, signature);

      // Autorizado se HMAC válido ou Secret válido
      isAuthorized = isHmacValid || (Boolean(expectedSecret) && isQuerySecretValid);
    }

    if (!isAuthorized) {
      console.warn("⚠️ Webhook Abacate Pay rejeitado por falha de autenticação HMAC/Secret.");
      return NextResponse.json(
        { erro: "Assinatura ou Secret de webhook inválido" },
        { status: 401 }
      );
    }

    // 2. Parsing flexível do payload JSON
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      return NextResponse.json(
        { erro: "Payload JSON inválido" },
        { status: 400 }
      );
    }

    const eventId = payload.id || `evt_${Date.now()}`;
    const eventName = payload.event || payload.event_type || "";
    const eventData = payload.data || {};
    const transactionId =
      eventData.id || payload.subscription_id || payload.charge_id || "";
    const customerId =
      eventData.customer?.id || payload.customer_id || "";
    const metadata = eventData.metadata || payload.metadata || {};
    const userId = metadata.userId || metadata.user_id || "";

    console.log(`📥 Recebido Webhook Abacate Pay [${eventName}] (ID: ${eventId}):`, {
      transactionId,
      customerId,
      userId,
    });

    // 3. Verificação de Idempotência (Descarte de retentativas duplicadas)
    if (payload.id) {
      const alreadyProcessed = await verificarEventoProcessado(payload.id);
      if (alreadyProcessed) {
        console.log(`ℹ️ Evento ${payload.id} já foi processado anteriormente. Respondendo 200 OK.`);
        return NextResponse.json({
          ok: true,
          duplicado: true,
          id: payload.id,
          evento: eventName,
        });
      }
    }

    // 4. Tratamento do Ciclo Completo de Eventos
    const isActivationEvent =
      eventName === "transparent.completed" ||
      eventName === "checkout.completed" ||
      eventName === "subscription.completed" ||
      eventName === "subscription.renewed" ||
      eventName === "subscription.confirmed" ||
      eventName === "charge.paid";

    const isCancellationEvent =
      eventName === "subscription.cancelled" ||
      eventName === "subscription.canceled" ||
      eventName === "subscription.failed" ||
      eventName === "transparent.refunded" ||
      eventName === "transparent.disputed" ||
      eventName === "checkout.refunded" ||
      eventName === "checkout.disputed";

    if (isActivationEvent) {
      // Ativa o plano Pro do usuário
      if (userId) {
        await query(
          `UPDATE users 
           SET plano = 'pro', data_assinatura = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [userId]
        );
      } else if (customerId) {
        await atualizarUserPlano(customerId, "pro", transactionId || null);
      }

      // Atualiza ou insere registro de pagamento concluído
      if (transactionId) {
        await query(
          `UPDATE pagamentos 
           SET status = 'pago', pago_em = CURRENT_TIMESTAMP 
           WHERE abacate_transaction_id = $1`,
          [transactionId]
        );
      }
    } else if (isCancellationEvent) {
      // Reverte o plano para Free em cancelamento ou disputa
      if (userId) {
        await query(
          `UPDATE users 
           SET plano = 'free', atualizado_em = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [userId]
        );
      } else if (customerId) {
        await atualizarUserPlano(customerId, "free", null);
      }

      if (transactionId) {
        await query(
          `UPDATE pagamentos 
           SET status = 'cancelado' 
           WHERE abacate_transaction_id = $1`,
          [transactionId]
        );
      }
    }

    // 5. Registra o evento no histórico de idempotência
    if (payload.id) {
      await registrarEventoProcessado(payload.id, eventName, payload);
    }

    // 6. Resposta 200 OK com confirmação de processamento
    return NextResponse.json({
      ok: true,
      recebido: true,
      id: eventId,
      evento: eventName,
    });
  } catch (error: any) {
    console.error("Erro no processamento do webhook Abacate Pay:", error);
    return NextResponse.json(
      { erro: "Erro interno no servidor ao processar webhook" },
      { status: 500 }
    );
  }
}
