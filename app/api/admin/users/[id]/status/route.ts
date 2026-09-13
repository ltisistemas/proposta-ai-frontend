import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/auth/adminGuard";
import { atualizarStatusUsuarioAdmin, obterUserPorId } from "@/lib/db/users";
import { z } from "zod";

const updateStatusSchema = z.object({
  suspenso: z.boolean(),
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
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    const { suspenso } = validation.data;

    // Check if target user exists
    const targetUser = await obterUserPorId(id);
    if (!targetUser) {
      return NextResponse.json(
        { sucesso: false, erro: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // Prevent self-suspension
    if (authCheck.admin.id === id && suspenso === true) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Você não pode suspender sua própria conta de administrador.",
        },
        { status: 400 }
      );
    }

    const updated = await atualizarStatusUsuarioAdmin(id, suspenso);

    return NextResponse.json({
      sucesso: true,
      usuario: updated,
    });
  } catch (error) {
    console.error("Erro em PATCH /api/admin/users/[id]/status:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno ao atualizar status do usuário." },
      { status: 500 }
    );
  }
}
