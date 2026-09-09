import { NextRequest, NextResponse } from "next/server";
import { obterUserPorEmail } from "@/lib/db/users";
import { comparePassword } from "@/lib/auth/password";
import { gerarToken } from "@/lib/auth/jwt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const user = await obterUserPorEmail(email);
    if (!user) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Credenciais inválidas. Verifique seu email e senha.",
        },
        { status: 401 }
      );
    }

    const senhaCorreta = await comparePassword(password, user.password_hash);
    if (!senhaCorreta) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Credenciais inválidas. Verifique seu email e senha.",
        },
        { status: 401 }
      );
    }

    const token = gerarToken({
      userId: user.id,
      email: user.email,
      nome: user.nome,
      plano: user.plano,
    });

    const { password_hash, ...userSemSenha } = user;

    return NextResponse.json({
      sucesso: true,
      token,
      usuario: userSemSenha,
    });
  } catch (error: any) {
    console.error("Erro em /api/auth/login:", error);
    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro interno ao realizar login.",
      },
      { status: 500 }
    );
  }
}
