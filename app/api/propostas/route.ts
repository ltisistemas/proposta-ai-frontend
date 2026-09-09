import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import {
  obterPropostasPorUsuario,
  salvarProposta,
  ItemPropostaInput,
} from "@/lib/db/propostas";

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
    const status = searchParams.get("status") || undefined;
    const busca = searchParams.get("busca") || undefined;

    const propostas = await obterPropostasPorUsuario(userId, { status, busca });

    return NextResponse.json({
      sucesso: true,
      propostas,
    });
  } catch (error) {
    console.error("Erro em GET /api/propostas:", error);
    return NextResponse.json({ erro: "Erro ao buscar propostas" }, { status: 500 });
  }
}

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

    const dados = await request.json();
    const subtotal = (dados.itens || []).reduce(
      (acc: number, item: any) => acc + (item.quantidade || 1) * (item.valorUnitario || 0),
      0
    );
    const total = subtotal - (dados.descontoValor || 0);
    const anoAtual = new Date().getFullYear();
    const numero = dados.numero || `PROP-${anoAtual}-${Date.now().toString().slice(-4)}`;

    const proposta = await salvarProposta({
      usuarioId: userId,
      numero,
      clienteNome: dados.clienteNome,
      clienteEmpresa: dados.clienteEmpresa,
      clienteEmail: dados.clienteEmail,
      clienteTelefone: dados.clienteTelefone,
      descricao: dados.descricao || "",
      conteudoHtml: dados.conteudoHtml || "<p>Proposta</p>",
      templateId: dados.templateId || "template-1",
      subtotal,
      descontoValor: dados.descontoValor || 0,
      total,
      prazoPagamento: dados.prazoPagamento,
      validadeDias: dados.validadeDias || 30,
      observacoes: dados.observacoes,
      status: dados.status || "rascunho",
      itens: (dados.itens || []) as ItemPropostaInput[],
    });

    return NextResponse.json({ sucesso: true, proposta }, { status: 201 });
  } catch (error) {
    console.error("Erro em POST /api/propostas:", error);
    return NextResponse.json({ erro: "Erro ao salvar proposta" }, { status: 500 });
  }
}
