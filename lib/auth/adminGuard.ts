import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "./jwt";
import { obterUserPorId, UserRow } from "@/lib/db/users";

export interface AdminAuthResult {
  admin: Omit<UserRow, "password_hash">;
  erroResponse?: never;
}

export interface AdminAuthError {
  admin?: never;
  erroResponse: NextResponse;
}

export type AdminAuthGuard = AdminAuthResult | AdminAuthError;

export async function verificarAdmin(request: NextRequest): Promise<AdminAuthGuard> {
  const authHeader = request.headers.get("Authorization");
  const token = obterTokenDoHeader(authHeader);

  if (!token) {
    return {
      erroResponse: NextResponse.json(
        { sucesso: false, erro: "Autenticação necessária." },
        { status: 401 }
      ),
    };
  }

  const userId = obterUserIdDoToken(token);
  if (!userId) {
    return {
      erroResponse: NextResponse.json(
        { sucesso: false, erro: "Token inválido ou expirado." },
        { status: 401 }
      ),
    };
  }

  const user = await obterUserPorId(userId);
  if (!user) {
    return {
      erroResponse: NextResponse.json(
        { sucesso: false, erro: "Usuário não encontrado." },
        { status: 404 }
      ),
    };
  }

  if (user.suspenso) {
    return {
      erroResponse: NextResponse.json(
        { sucesso: false, erro: "Conta suspensa.", suspenso: true },
        { status: 403 }
      ),
    };
  }

  if (user.role !== "admin") {
    return {
      erroResponse: NextResponse.json(
        { sucesso: false, erro: "Acesso restrito a administradores." },
        { status: 403 }
      ),
    };
  }

  return { admin: user };
}
