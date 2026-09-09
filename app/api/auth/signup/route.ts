import { NextRequest, NextResponse } from "next/server";
import { criarUser, obterUserPorEmail } from "@/lib/db/users";
import { gerarToken } from "@/lib/auth/jwt";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  empresaNome: z.string().optional(),
  empresaCnpj: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    const { email, password, nome, empresaNome, empresaCnpj } = validation.data;

    // Check if user already exists
    const existing = await obterUserPorEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Este email já está cadastrado. Faça login.",
        },
        { status: 409 }
      );
    }

    const user = await criarUser({
      email,
      password,
      nome,
      empresaNome,
      empresaCnpj,
    });

    const token = gerarToken({
      userId: user.id,
      email: user.email,
      nome: user.nome,
      plano: user.plano,
    });

    return NextResponse.json(
      {
        sucesso: true,
        token,
        usuario: user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro em /api/auth/signup:", error);
    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro interno ao cadastrar usuário. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
