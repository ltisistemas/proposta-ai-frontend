import { NextRequest, NextResponse } from "next/server";
import { obterTokenDoHeader, obterUserIdDoToken } from "@/lib/auth/jwt";
import { obterMetricasDashboard } from "@/lib/db/propostas";

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

    const metricas = await obterMetricasDashboard(userId);

    return NextResponse.json({
      sucesso: true,
      metricas,
    });
  } catch (error) {
    console.error("Erro em /api/dashboard/stats:", error);
    return NextResponse.json({ erro: "Erro ao buscar métricas" }, { status: 500 });
  }
}
