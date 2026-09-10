import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import { obterUserPorId, agendarCancelamentoAssinatura } from "@/lib/db/users";
import { z } from "zod";

const downgradeSchema = z.object({
  acao: z.enum(["agendar", "reativar"]),
});

export async function POST(request: NextRequest) {
  try {
    const token = obterTokenDoHeader(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json(
        { sucesso: false, erro: "Não autenticado." },
        { status: 401 }
      );
    }

    const userId = obterUserIdDoToken(token);
    if (!userId) {
      return NextResponse.json(
        { sucesso: false, erro: "Token inválido." },
        { status: 401 }
      );
    }

    const user = await obterUserPorId(userId);
    if (!user) {
      return NextResponse.json(
        { sucesso: false, erro: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = downgradeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Ação inválida. Utilize 'agendar' ou 'reativar'.",
        },
        { status: 400 }
      );
    }

    const { acao } = parsed.data;

    if (user.plano !== "pro") {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Apenas usuários com o plano Pro ativo podem gerenciar o cancelamento de assinatura.",
        },
        { status: 400 }
      );
    }

    const isCancelar = acao === "agendar";
    const updatedUser = await agendarCancelamentoAssinatura(userId, isCancelar);

    return NextResponse.json({
      sucesso: true,
      mensagem: isCancelar
        ? "Cancelamento da assinatura agendado com sucesso. Seus recursos Pro permanecerão ativos até o término do ciclo atual."
        : "Sua assinatura Pro foi reativada com sucesso! As renovações automáticas continuarão normalmente.",
      usuario: updatedUser,
      cancelamentoAgendado: isCancelar,
      dataFimAcesso: user.data_proxima_cobranca || null,
    });
  } catch (error: any) {
    console.error("Erro em /api/auth/downgrade:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno ao processar a solicitação de downgrade." },
      { status: 500 }
    );
  }
}
