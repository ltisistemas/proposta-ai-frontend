import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/auth/adminGuard";
import {
  listarUsuariosAdmin,
  criarUser,
  obterUserPorEmail,
} from "@/lib/db/users";
import { z } from "zod";

const createUserAdminSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  empresaNome: z.string().optional(),
  empresaCnpj: z.string().optional(),
  role: z.enum(["admin", "cliente"]).optional().default("cliente"),
  plano: z.enum(["free", "pro"]).optional().default("free"),
});

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verificarAdmin(request);
    if (authCheck.erroResponse) return authCheck.erroResponse;

    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca") || undefined;
    const plano = searchParams.get("plano") || undefined;
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;
    const pagina = searchParams.get("pagina")
      ? parseInt(searchParams.get("pagina")!, 10)
      : 1;
    const limite = searchParams.get("limite")
      ? parseInt(searchParams.get("limite")!, 10)
      : 20;

    const dados = await listarUsuariosAdmin({
      busca,
      plano,
      role,
      status,
      pagina,
      limite,
    });

    return NextResponse.json({
      sucesso: true,
      ...dados,
    });
  } catch (error) {
    console.error("Erro em GET /api/admin/users:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro ao listar usuários." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verificarAdmin(request);
    if (authCheck.erroResponse) return authCheck.erroResponse;

    const body = await request.json();
    const validation = createUserAdminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    const { email, password, nome, empresaNome, empresaCnpj, role, plano } =
      validation.data;

    const existing = await obterUserPorEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Este email já está cadastrado no sistema.",
        },
        { status: 409 }
      );
    }

    const novoUsuario = await criarUser({
      email,
      password,
      nome,
      empresaNome,
      empresaCnpj,
      role,
      plano,
    });

    return NextResponse.json(
      {
        sucesso: true,
        usuario: novoUsuario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro em POST /api/admin/users:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno ao criar usuário via admin." },
      { status: 500 }
    );
  }
}
