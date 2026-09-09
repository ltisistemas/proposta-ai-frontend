import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import { obterUserPorId, atualizarUserPlano } from "@/lib/db/users";
import { obterCobrancaPix, simularPagamentoDev } from "@/lib/abacate/client";
import { query } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const token = obterTokenDoHeader(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }

    const userId = obterUserIdDoToken(token);
    if (!userId) {
      return NextResponse.json({ erro: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chargeId = searchParams.get("chargeId");

    if (!chargeId) {
      return NextResponse.json(
        { erro: "chargeId não informado" },
        { status: 400 }
      );
    }

    // 1. Verifica no banco se já foi marcado como pago por webhook
    const pagResult = await query(
      `SELECT status FROM pagamentos WHERE abacate_transaction_id = $1 AND usuario_id = $2`,
      [chargeId, userId]
    );

    if (pagResult.rows.length > 0 && pagResult.rows[0].status === "pago") {
      return NextResponse.json({
        status: "PAID",
        isPro: true,
        plano: "pro",
      });
    }

    // 2. Consulta status na API do Abacate Pay (ou store de dev)
    const chargeStatus = await obterCobrancaPix(chargeId);

    if (chargeStatus.status === "PAID" || chargeStatus.status === "APPROVED") {
      // Atualiza usuário para PRO no banco
      await query(
        `UPDATE users 
         SET plano = 'pro', data_assinatura = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [userId]
      );

      await query(
        `UPDATE pagamentos 
         SET status = 'pago', pago_em = CURRENT_TIMESTAMP 
         WHERE abacate_transaction_id = $1`,
        [chargeId]
      );

      return NextResponse.json({
        status: "PAID",
        isPro: true,
        plano: "pro",
      });
    }

    return NextResponse.json({
      status: chargeStatus.status || "PENDING",
      isPro: false,
      plano: "free",
    });
  } catch (error: any) {
    console.error("Erro ao verificar status do PIX:", error);
    return NextResponse.json(
      { erro: "Erro ao verificar status do pagamento" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/checkout/status - Simulação de pagamento imediato em ambiente de desenvolvimento/sandbox
 */
export async function POST(request: NextRequest) {
  try {
    const token = obterTokenDoHeader(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }

    const userId = obterUserIdDoToken(token);
    if (!userId) {
      return NextResponse.json({ erro: "Token inválido" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { chargeId, simulatePaid } = body;

    if (!chargeId) {
      return NextResponse.json(
        { erro: "chargeId não informado" },
        { status: 400 }
      );
    }

    if (simulatePaid) {
      simularPagamentoDev(chargeId);

      // Promove usuário no banco
      await query(
        `UPDATE users 
         SET plano = 'pro', data_assinatura = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [userId]
      );

      await query(
        `UPDATE pagamentos 
         SET status = 'pago', pago_em = CURRENT_TIMESTAMP 
         WHERE abacate_transaction_id = $1`,
        [chargeId]
      );

      return NextResponse.json({
        sucesso: true,
        status: "PAID",
        isPro: true,
        plano: "pro",
        mensagem: "Pagamento simulado e Plano Pro ativado com sucesso!",
      });
    }

    return NextResponse.json({ status: "PENDING" });
  } catch (error: any) {
    console.error("Erro em simulação de pagamento:", error);
    return NextResponse.json(
      { erro: "Erro ao processar simulação" },
      { status: 500 }
    );
  }
}
