import { NextRequest, NextResponse } from "next/server";
import { validarAssinaturaWebhook } from "@/lib/abacate/client";
import { atualizarUserPlano } from "@/lib/db/users";
import { query } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("X-Webhook-Signature") ||
      request.headers.get("X-Abacate-Signature") ||
      "";

    const { searchParams } = new URL(request.url);
    const secretQuery = searchParams.get("webhookSecret") || "";

    const secretExpected =
      process.env.ABACATE_WEBHOOK_SECRET ||
      process.env.ABACATEPAY_WEBHOOK_SECRET ||
      "default_webhook_secret";

    // Valida secret por query string ou assinatura HMAC no header
    const isValid =
      process.env.NODE_ENV === "development" ||
      (secretQuery && secretQuery === secretExpected) ||
      validarAssinaturaWebhook(rawBody, signature);

    if (!isValid) {
      return NextResponse.json(
        { erro: "Assinatura de webhook inválida" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    
    // Normalização de eventos v2 e v1
    const eventName = payload.event || payload.event_type || "";
    const eventData = payload.data || {};
    const transactionId = eventData.id || payload.subscription_id || payload.charge_id || "";
    const customerId = eventData.customer?.id || payload.customer_id || "";
    const metadata = eventData.metadata || payload.metadata || {};
    const userId = metadata.userId || metadata.user_id || "";

    console.log(`Recebido webhook Abacate Pay [${eventName}]:`, {
      transactionId,
      customerId,
      userId,
    });

    const isPaidEvent =
      eventName === "transparent.completed" ||
      eventName === "checkout.completed" ||
      eventName === "subscription.completed" ||
      eventName === "subscription.confirmed" ||
      eventName === "charge.paid";

    const isCanceledEvent =
      eventName === "subscription.cancelled" ||
      eventName === "subscription.canceled" ||
      eventName === "subscription.failed" ||
      eventName === "transparent.refunded";

    if (isPaidEvent) {
      // 1. Atualiza por userId direto se presente no metadata
      if (userId) {
        await query(
          `UPDATE users 
           SET plano = 'pro', data_assinatura = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [userId]
        );
      } else if (customerId) {
        // 2. Ou atualiza por customerId
        await atualizarUserPlano(customerId, "pro", transactionId || null);
      }

      // 3. Atualiza registro em pagamentos
      if (transactionId) {
        await query(
          `UPDATE pagamentos 
           SET status = 'pago', pago_em = CURRENT_TIMESTAMP 
           WHERE abacate_transaction_id = $1`,
          [transactionId]
        );
      }
    } else if (isCanceledEvent) {
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
    }

    return NextResponse.json({
      recebido: true,
      evento: eventName,
      status: "processado",
    });
  } catch (error: any) {
    console.error("Erro em webhook Abacate Pay:", error);
    return NextResponse.json(
      { erro: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}
