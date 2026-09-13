import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/auth/adminGuard";
import { atualizarPlanoUsuarioAdmin, obterUserPorId } from "@/lib/db/users";
import { z } from "zod";

const updatePlanoSchema = z.object({
  tipo: z.enum(["vitalicio", "temporario", "free"]),
  meses: z.number().int().min(1).max(120).optional(),
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
    const validation = updatePlanoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    const { tipo, meses } = validation.data;

    // Check if target user exists
    const targetUser = await obterUserPorId(id);
    if (!targetUser) {
      return NextResponse.json(
        { sucesso: false, erro: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const updated = await atualizarPlanoUsuarioAdmin(id, tipo, meses);

    return NextResponse.json({
      sucesso: true,
      usuario: updated,
    });
  } catch (error) {
    console.error("Erro em PATCH /api/admin/users/[id]/plano:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno ao atualizar plano do usuário." },
      { status: 500 }
    );
  }
}
