import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import {
  obterPropostaPorId,
  atualizarStatusProposta,
  deletarProposta,
} from "@/lib/db/propostas";
import { obterUserPorId } from "@/lib/db/users";
import { query } from "@/lib/db/client";
import { injetarOuAtualizarLogoHtml } from "@/lib/gemini/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = obterTokenDoHeader(request.headers.get("Authorization"));
    const userId = token ? obterUserIdDoToken(token) : undefined;

    const proposta = await obterPropostaPorId(id, userId || undefined);

    if (!proposta) {
      return NextResponse.json(
        { sucesso: false, erro: "Proposta não encontrada" },
        { status: 404 }
      );
    }

    const criador = await obterUserPorId(proposta.usuario_id);
    let conteudoHtml = proposta.conteudo_html;

    if (criador) {
      if (criador.plano === "pro") {
        conteudoHtml = injetarOuAtualizarLogoHtml(
          conteudoHtml,
          criador.empresa_logo_url,
          criador.empresa_nome || criador.nome
        );
      } else {
        conteudoHtml = injetarOuAtualizarLogoHtml(conteudoHtml, null);
      }
    }

    const regeneracoesIa = proposta.regeneracoes_ia || 0;
    const regeneracoesRestantes = Math.max(0, 3 - regeneracoesIa);

    return NextResponse.json({
      sucesso: true,
      proposta: {
        ...proposta,
        conteudo_html: conteudoHtml,
        regeneracoes_ia: regeneracoesIa,
        regeneracoes_restantes: regeneracoesRestantes,
      },
    });
  } catch (error) {
    console.error("Erro em GET /api/propostas/[id]:", error);
    return NextResponse.json({ erro: "Erro ao buscar proposta" }, { status: 500 });
  }
}

export async function PATCH(
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

    const user = await obterUserPorId(userId);
    if (!user) {
      return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 });
    }

    const body = await request.json();

    if (body.status) {
      if ((body.status === "aceita" || body.status === "recusada") && user.plano !== "pro") {
        return NextResponse.json(
          {
            sucesso: false,
            erro: "A alteração de status para Aceita/Recusada é exclusiva do Plano Pro.",
            precisaUpgrade: true,
          },
          { status: 403 }
        );
      }

      const proposta = await atualizarStatusProposta(
        id,
        userId,
        body.status
      );
      if (!proposta) {
        return NextResponse.json(
          { erro: "Proposta não encontrada ou não pertence ao usuário" },
          { status: 404 }
        );
      }
      return NextResponse.json({ sucesso: true, proposta });
    }

    // Update general fields
    if (body.conteudoHtml || body.observacoes) {
      const result = await query(
        `UPDATE propostas 
         SET conteudo_html = COALESCE($1, conteudo_html),
             observacoes = COALESCE($2, observacoes),
             atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $3 AND usuario_id = $4 AND deletado_em IS NULL
         RETURNING *`,
        [body.conteudoHtml || null, body.observacoes || null, id, userId]
      );
      return NextResponse.json({ sucesso: true, proposta: result.rows[0] });
    }

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro em PATCH /api/propostas/[id]:", error);
    return NextResponse.json({ erro: "Erro ao atualizar proposta" }, { status: 500 });
  }
}

export async function DELETE(
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

    const sucesso = await deletarProposta(id, userId);

    if (!sucesso) {
      return NextResponse.json(
        { erro: "Proposta não encontrada ou não pôde ser excluída" },
        { status: 404 }
      );
    }

    return NextResponse.json({ sucesso: true, mensagem: "Proposta excluída com sucesso" });
  } catch (error) {
    console.error("Erro em DELETE /api/propostas/[id]:", error);
    return NextResponse.json({ erro: "Erro ao deletar proposta" }, { status: 500 });
  }
}
