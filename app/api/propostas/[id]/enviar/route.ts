import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import { obterPropostaPorId, atualizarStatusProposta } from "@/lib/db/propostas";
import { query } from "@/lib/db/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = obterTokenDoHeader(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }

    const userId = obterUserIdDoToken(token);
    if (!userId) {
      return NextResponse.json({ erro: "Token inválido" }, { status: 401 });
    }

    const proposta = await obterPropostaPorId(id, userId);
    if (!proposta) {
      return NextResponse.json(
        { erro: "Proposta não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const emailDestinatario = body.email || proposta.cliente_email;

    // Log the send action in emails_log
    if (emailDestinatario) {
      await query(
        `INSERT INTO emails_log (usuario_id, proposta_id, email_para, assunto, tipo, status, enviado_em)
         VALUES ($1, $2, $3, $4, 'envio_proposta', 'enviado', CURRENT_TIMESTAMP)`,
        [
          userId,
          id,
          emailDestinatario,
          `Proposta Comercial: ${proposta.numero}`,
        ]
      );
    }

    const atualizada = await atualizarStatusProposta(id, userId, "enviada");

    return NextResponse.json({
      sucesso: true,
      mensagem: "Proposta marcada como enviada com sucesso",
      proposta: atualizada,
    });
  } catch (error) {
    console.error("Erro em POST /api/propostas/[id]/enviar:", error);
    return NextResponse.json({ erro: "Erro ao registrar envio" }, { status: 500 });
  }
}
