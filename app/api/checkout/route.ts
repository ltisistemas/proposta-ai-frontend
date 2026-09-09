import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import { obterUserPorId, atualizarUserCustomerId } from "@/lib/db/users";
import { criarAssinatura } from "@/lib/abacate/client";
import { query } from "@/lib/db/client";

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

    const usuario = await obterUserPorId(userId);
    if (!usuario) {
      return NextResponse.json(
        { erro: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const payload = {
      customer_email: usuario.email,
      customer_name: usuario.nome,
      customer_tax_id: usuario.empresa_cnpj || undefined,
      plan_id: "pro-39",
      payment_method: "credit_card" as const,
      auto_renew: true,
      idempotency_key: `sub_${userId}_${Date.now()}`,
      return_url: `${appUrl}/dashboard?upgrade=sucesso`,
    };

    const subscription = await criarAssinatura(payload);

    if (subscription.customer_id) {
      await atualizarUserCustomerId(userId, subscription.customer_id);
    }

    // Save pending payment record
    await query(
      `INSERT INTO pagamentos (usuario_id, abacate_transaction_id, valor, status, tipo)
       VALUES ($1, $2, $3, 'pendente', 'assinatura_pro')`,
      [userId, subscription.subscription_id, 39.0]
    );

    return NextResponse.json({
      sucesso: true,
      checkoutUrl: subscription.checkout_url,
      subscriptionId: subscription.subscription_id,
    });
  } catch (error: any) {
    console.error("Erro em /api/checkout:", error);
    return NextResponse.json(
      { erro: "Erro ao gerar checkout de assinatura" },
      { status: 500 }
    );
  }
}
