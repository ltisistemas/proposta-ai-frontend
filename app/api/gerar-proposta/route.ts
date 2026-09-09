import { NextRequest, NextResponse } from "next/server";
import { gerarPropostacComIA } from "@/lib/gemini/client";
import {
  salvarProposta,
  ItemPropostaInput,
} from "@/lib/db/propostas";
import {
  obterUserIdDoToken,
  obterTokenDoHeader,
} from "@/lib/auth/jwt";
import {
  verificarLimiteProposta,
  incrementarContadorPropostas,
  obterUserPorId,
} from "@/lib/db/users";
import { z } from "zod";

const itemSchema = z.object({
  descricao: z.string().min(1, "A descrição do item é obrigatória"),
  quantidade: z.number().min(1, "A quantidade deve ser de no mínimo 1"),
  valorUnitario: z.number().min(0, "O valor unitário deve ser positivo"),
});

const gerarPropostaSchema = z.object({
  clienteNome: z.string().min(2, "Nome do cliente é obrigatório"),
  clienteEmpresa: z.string().optional(),
  clienteEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  clienteTelefone: z.string().optional(),
  descricao: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item à proposta"),
  prazoPagamento: z.string().optional(),
  validadeDias: z.number().optional().default(30),
  observacoes: z.string().optional(),
  templateId: z.string().optional().default("template-1"),
  empresaNome: z.string().optional(),
  empresaCNPJ: z.string().optional(),
  empresaEmail: z.string().optional(),
  empresaTelefone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const token = obterTokenDoHeader(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json(
        { sucesso: false, erro: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const usuarioId = obterUserIdDoToken(token);
    if (!usuarioId) {
      return NextResponse.json(
        { sucesso: false, erro: "Sessão inválida ou expirada" },
        { status: 401 }
      );
    }

    // 2. Validate user & limits
    const user = await obterUserPorId(usuarioId);
    if (!user) {
      return NextResponse.json(
        { sucesso: false, erro: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const temLimite = await verificarLimiteProposta(usuarioId);
    if (!temLimite) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Limite de propostas do plano gratuito atingido (3/mês). Faça upgrade para o plano Pro!",
          precisaUpgrade: true,
        },
        { status: 402 }
      );
    }

    // 3. Parse input body
    const body = await request.json();
    const validation = gerarPropostaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    const dados = validation.data;

    // 4. Synthesize Proposal HTML via Gemini AI
    const empresaInfo = {
      empresaNome: dados.empresaNome || user.empresa_nome || user.nome,
      empresaCNPJ: dados.empresaCNPJ || user.empresa_cnpj || undefined,
      empresaEmail: dados.empresaEmail || user.empresa_email || user.email,
      empresaTelefone: dados.empresaTelefone || user.empresa_telefone || undefined,
    };

    const htmlContent = await gerarPropostacComIA({
      ...empresaInfo,
      clienteNome: dados.clienteNome,
      clienteEmpresa: dados.clienteEmpresa,
      clienteEmail: dados.clienteEmail || undefined,
      clienteTelefone: dados.clienteTelefone,
      descricao: dados.descricao,
      itens: dados.itens,
      prazoPagamento: dados.prazoPagamento,
      validade: dados.validadeDias,
      observacoes: dados.observacoes,
      template: dados.templateId,
    });

    // 5. Generate proposal number and calculate totals
    const anoAtual = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const numeroProposta = `PROP-${anoAtual}-${Date.now().toString().slice(-4)}${randomCode}`;

    const subtotal = dados.itens.reduce(
      (acc, item) => acc + item.quantidade * item.valorUnitario,
      0
    );
    const total = subtotal;

    // 6. Save in database
    const proposta = await salvarProposta({
      usuarioId,
      numero: numeroProposta,
      clienteNome: dados.clienteNome,
      clienteEmpresa: dados.clienteEmpresa,
      clienteEmail: dados.clienteEmail || undefined,
      clienteTelefone: dados.clienteTelefone,
      descricao: dados.descricao,
      conteudoHtml: htmlContent,
      templateId: dados.templateId,
      subtotal,
      total,
      prazoPagamento: dados.prazoPagamento,
      validadeDias: dados.validadeDias,
      observacoes: dados.observacoes,
      status: "rascunho",
      itens: dados.itens as ItemPropostaInput[],
    });

    // 7. Increment user's proposal usage counter
    await incrementarContadorPropostas(usuarioId);

    return NextResponse.json({
      sucesso: true,
      proposta: {
        id: proposta.id,
        numero: proposta.numero,
        total: proposta.total,
        status: proposta.status,
        conteudoHtml: htmlContent,
        criadoEm: proposta.criado_em,
      },
    });
  } catch (error: any) {
    console.error("Erro em /api/gerar-proposta:", error);
    return NextResponse.json(
      {
        sucesso: false,
        erro: "Falha ao gerar proposta comercial. Verifique os dados e tente novamente.",
      },
      { status: 500 }
    );
  }
}
