import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import { obterPropostaPorId, regenerarConteudoIA } from "@/lib/db/propostas";
import { obterUserPorId } from "@/lib/db/users";
import { gerarPropostacComIA, DadosGeracaoProposta } from "@/lib/gemini/client";
import { ajustarHtmlResponsivoProposta } from "@/lib/utils/proposal-html";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = obterTokenDoHeader(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ sucesso: false, erro: "Não autenticado" }, { status: 401 });
    }

    const userId = obterUserIdDoToken(token);
    if (!userId) {
      return NextResponse.json({ sucesso: false, erro: "Token inválido" }, { status: 401 });
    }

    const user = await obterUserPorId(userId);
    if (!user) {
      return NextResponse.json({ sucesso: false, erro: "Usuário não encontrado" }, { status: 404 });
    }

    const proposta = await obterPropostaPorId(id, userId);
    if (!proposta) {
      return NextResponse.json(
        { sucesso: false, erro: "Proposta não encontrada ou não pertence ao usuário" },
        { status: 404 }
      );
    }

    if (proposta.status === "aceita") {
      return NextResponse.json(
        { sucesso: false, erro: "Propostas já aceitas ou assinadas não podem ser alteradas." },
        { status: 400 }
      );
    }

    const regeneracoesAtuais = proposta.regeneracoes_ia || 0;
    if (regeneracoesAtuais >= 3) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Esta proposta já atingiu o limite máximo de 3 regenerações com IA.",
          limiteAtingido: true,
          regeneracoesRestantes: 0,
        },
        { status: 400 }
      );
    }

    const itensMapeados = (proposta.itens || []).map((item: any) => ({
      descricao: item.descricao,
      quantidade: parseInt(item.quantidade, 10) || 1,
      valorUnitario: parseFloat(item.valor_unitario) || 0,
    }));

    const dadosGeracao: DadosGeracaoProposta = {
      empresaNome: user.empresa_nome || user.nome || "Empresa Especializada",
      empresaCNPJ: user.empresa_cnpj || undefined,
      empresaEmail: user.empresa_email || user.email,
      empresaTelefone: user.empresa_telefone || undefined,
      empresaLogoUrl: user.plano === "pro" ? user.empresa_logo_url || undefined : undefined,
      clienteNome: proposta.cliente_nome,
      clienteEmpresa: proposta.cliente_empresa || undefined,
      clienteEmail: proposta.cliente_email || undefined,
      clienteTelefone: proposta.cliente_telefone || undefined,
      descricao: proposta.descricao,
      itens: itensMapeados.length > 0 ? itensMapeados : [{ descricao: "Serviços Especializados", quantidade: 1, valorUnitario: Number(proposta.total) || 0 }],
      prazoPagamento: proposta.prazo_pagamento || "À Vista",
      validade: proposta.validade_dias || 30,
      observacoes: proposta.observacoes || undefined,
      plano: user.plano === "pro" ? "pro" : "free",
    };

    // Re-generate HTML via Gemini AI with consultative SPIN selling prompts
    const novoHtmlGerado = await gerarPropostacComIA(dadosGeracao);
    const htmlResponsivo = ajustarHtmlResponsivoProposta(novoHtmlGerado);

    // Save and increment regeneracoes_ia counter atomically
    const resultado = await regenerarConteudoIA(id, userId, htmlResponsivo);

    if (!resultado.sucesso || !resultado.proposta) {
      return NextResponse.json(
        { sucesso: false, erro: resultado.erro || "Falha ao salvar proposta regenerada." },
        { status: 400 }
      );
    }

    const regeneracoesFeitas = resultado.proposta.regeneracoes_ia || (regeneracoesAtuais + 1);
    const regeneracoesRestantes = Math.max(0, 3 - regeneracoesFeitas);

    return NextResponse.json({
      sucesso: true,
      mensagem: "Proposta reescrita e enriquecida com sucesso pela IA!",
      proposta: {
        ...resultado.proposta,
        regeneracoes_ia: regeneracoesFeitas,
        regeneracoes_restantes: regeneracoesRestantes,
      },
      regeneracoesRestantes,
    });
  } catch (error) {
    console.error("Erro em POST /api/propostas/[id]/regerar-ia:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno ao processar regeneração com IA." },
      { status: 500 }
    );
  }
}
