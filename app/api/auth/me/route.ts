import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import { obterUserPorId, atualizarUserProfile } from "@/lib/db/users";

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

    const user = await obterUserPorId(userId);
    if (!user) {
      return NextResponse.json(
        { erro: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ sucesso: true, usuario: user });
  } catch (error) {
    console.error("Erro em /api/auth/me GET:", error);
    return NextResponse.json({ erro: "Erro no servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = obterTokenDoHeader(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }

    const userId = obterUserIdDoToken(token);
    if (!userId) {
      return NextResponse.json({ erro: "Token inválido" }, { status: 401 });
    }

    const body = await request.json();
    const updated = await atualizarUserProfile(userId, body);

    return NextResponse.json({ sucesso: true, usuario: updated });
  } catch (error) {
    console.error("Erro em /api/auth/me PUT:", error);
    return NextResponse.json({ erro: "Erro no servidor" }, { status: 500 });
  }
}
