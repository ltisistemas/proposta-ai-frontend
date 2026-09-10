import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import { obterUserPorId } from "@/lib/db/users";
import { criarCobrancaPixTransparente } from "@/lib/abacate/client";
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

    // Cria cobrança PIX transparente no Abacate Pay v2 (R$ 45,90 = 4590 centavos)
    const charge = await criarCobrancaPixTransparente({
      amount: 4590,
      description: "Assinatura Propex AI Pro (Mensal)",
      expiresIn: 3600, // 1 hora
      customer: {
        name: usuario.nome || "Assinante Propex AI",
        email: usuario.email,
        taxId: usuario.empresa_cnpj || undefined,
        cellphone: usuario.empresa_telefone || undefined,
      },
      metadata: {
        userId: usuario.id,
        plano: "pro",
        origem: "upgrade-modal-pix",
      },
    });

    // Salva ou atualiza registro de pagamento pendente
    try {
      await query(
        `INSERT INTO pagamentos (usuario_id, abacate_transaction_id, valor, status, tipo)
         VALUES ($1, $2, $3, 'pendente', 'assinatura_pro')
         ON CONFLICT (id) DO NOTHING`,
        [userId, charge.id, 45.9]
      );
    } catch (dbErr) {
      console.warn("Aviso ao salvar pagamento no banco:", dbErr);
    }

    return NextResponse.json({
      sucesso: true,
      chargeId: charge.id,
      amount: 45.9,
      amountCents: charge.amount,
      brCode: charge.brCode,
      brCodeBase64: charge.brCodeBase64,
      expiresAt: charge.expiresAt,
      status: charge.status,
      devMode: charge.devMode,
    });
  } catch (error: any) {
    console.error("Erro em /api/checkout:", error);
    return NextResponse.json(
      { erro: "Erro ao gerar cobrança PIX transparente" },
      { status: 500 }
    );
  }
}
