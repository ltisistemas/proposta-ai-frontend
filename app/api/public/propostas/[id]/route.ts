import { NextRequest, NextResponse } from "next/server";
import { obterPropostaPorId } from "@/lib/db/propostas";
import { obterUserPorId } from "@/lib/db/users";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposta = await obterPropostaPorId(id);

    if (!proposta) {
      return NextResponse.json(
        { sucesso: false, erro: "Proposta comercial não encontrada ou expirada." },
        { status: 404 }
      );
    }

    const criador = await obterUserPorId(proposta.usuario_id);

    // Gating: only Pro user proposals can be viewed via public link
    if (!criador || criador.plano !== "pro") {
      return NextResponse.json(
        {
          sucesso: false,
          bloqueadoPlanoFree: true,
          erro: "O compartilhamento público de propostas via link é uma funcionalidade exclusiva do Plano Pro.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      proposta,
      emissor: {
        nome: criador.nome,
        empresaNome: criador.empresa_nome || criador.nome,
        empresaEmail: criador.empresa_email || criador.email,
        empresaTelefone: criador.empresa_telefone,
        empresaLogoUrl: criador.empresa_logo_url,
      },
    });
  } catch (error: any) {
    console.error("Erro em GET /api/public/propostas/[id]:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro ao carregar proposta pública." },
      { status: 500 }
    );
  }
}
