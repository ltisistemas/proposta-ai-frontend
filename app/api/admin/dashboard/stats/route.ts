import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/auth/adminGuard";
import { obterMetricasAdminDashboard } from "@/lib/db/admin-dashboard";

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verificarAdmin(request);
    if (authCheck.erroResponse) {
      return authCheck.erroResponse;
    }

    const metricas = await obterMetricasAdminDashboard();

    return NextResponse.json({
      sucesso: true,
      metricas,
    });
  } catch (error: any) {
    console.error("Erro em GET /api/admin/dashboard/stats:", error);
    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro interno ao processar métricas do dashboard administrativo.",
      },
      { status: 500 }
    );
  }
}
