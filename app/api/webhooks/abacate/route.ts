import { NextRequest, NextResponse } from "next/server";
import { validarAssinaturaWebhook } from "@/lib/abacate/client";
import { atualizarUserPlano, obterUserPorAbacateId } from "@/lib/db/users";
import { query } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("X-Abacate-Signature") || "";

    // In production, validate HMAC-SHA256 signature
    const isValid =
      process.env.NODE_ENV === "development" ||
      validarAssinaturaWebhook(body, signature);

    if (!isValid) {
      return NextResponse.json(
        { erro: "Assinatura de webhook inválida" },
        { status: 401 }
      );
    }

    const evento = JSON.parse(body);
    const { event_type, subscription_id, customer_id } = evento;

    console.log(`Recebido webhook Abacate Pay [${event_type}]:`, {
      subscription_id,
      customer_id,
    });

    if (event_type === "subscription.confirmed" || event_type === "charge.paid") {
      if (customer_id) {
        await atualizarUserPlano(customer_id, "pro", subscription_id || null);
        
        // Update payment log
        await query(
          `UPDATE pagamentos 
           SET status = 'pago', pago_em = CURRENT_TIMESTAMP 
           WHERE abacate_transaction_id = $1`,
          [subscription_id]
        );
      }
    } else if (
      event_type === "subscription.failed" ||
      event_type === "subscription.canceled"
    ) {
      if (customer_id) {
        await atualizarUserPlano(customer_id, "free", null);
      }
    }

    return NextResponse.json({ recebido: true, evento: event_type });
  } catch (error: any) {
    console.error("Erro em webhook Abacate Pay:", error);
    return NextResponse.json(
      { erro: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}
