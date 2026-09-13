import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/auth/adminGuard";
import { atualizarVencimentoUsuarioAdmin, obterUserPorId } from "@/lib/db/users";
import { z } from "zod";

const updateVencimentoSchema = z.object({
  data_proxima_cobranca: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de vencimento inválida",
  }),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authCheck = await verificarAdmin(request);
    if (authCheck.erroResponse) return authCheck.erroResponse;

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const body = await request.json();
    const validation = updateVencimentoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    const { data_proxima_cobranca } = validation.data;

    // Check if target user exists
    const targetUser = await obterUserPorId(id);
    if (!targetUser) {
      return NextResponse.json(
        { sucesso: false, erro: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const updated = await atualizarVencimentoUsuarioAdmin(
      id,
      data_proxima_cobranca
    );

    return NextResponse.json({
      sucesso: true,
      usuario: updated,
    });
  } catch (error) {
    console.error("Erro em PATCH /api/admin/users/[id]/vencimento:", error);
    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro interno ao atualizar data de vencimento.",
      },
      { status: 500 }
    );
  }
}
