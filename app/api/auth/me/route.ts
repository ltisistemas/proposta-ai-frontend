import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import { obterUserPorId, atualizarUserProfile, validarAssinaturaUsuario } from "@/lib/db/users";
import { sincronizarLogoPropostasDoUsuario } from "@/lib/db/propostas";

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

    const validacao = await validarAssinaturaUsuario(user);

    return NextResponse.json({
      sucesso: true,
      usuario: validacao.user,
      emPeriodoGraca: validacao.emPeriodoGraca,
      diasRestantesGraca: validacao.diasRestantesGraca,
      statusAssinatura: validacao.statusAssinatura,
      cancelamentoAgendado: !!validacao.cancelamentoAgendado,
      dataFimAcesso: (validacao.user as any).data_proxima_cobranca || null,
    });
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

    if (body.empresa_logo_url !== undefined && updated) {
      const user = await obterUserPorId(userId);
      if (user && user.plano === "pro") {
        await sincronizarLogoPropostasDoUsuario(
          userId,
          user.empresa_logo_url,
          user.empresa_nome || user.nome
        );
      }
    }

    return NextResponse.json({ sucesso: true, usuario: updated });
  } catch (error) {
    console.error("Erro em /api/auth/me PUT:", error);
    return NextResponse.json({ erro: "Erro no servidor" }, { status: 500 });
  }
}
