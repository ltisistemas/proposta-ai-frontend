import { NextRequest, NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/auth/adminGuard";
import { listarEventosWebhookAdmin } from "@/lib/db/webhooks";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verificarAdmin(request);
    if (authCheck.erroResponse) return authCheck.erroResponse;

    const { searchParams } = new URL(request.url);
    const gateway = searchParams.get("gateway") || undefined;
    const status = searchParams.get("status") || undefined;
    const evento = searchParams.get("evento") || undefined;
    const pagina = searchParams.get("pagina")
      ? parseInt(searchParams.get("pagina")!, 10)
      : 1;
    const limite = searchParams.get("limite")
      ? parseInt(searchParams.get("limite")!, 10)
      : 20;

    const dados = await listarEventosWebhookAdmin({
      gateway,
      status,
      evento,
      pagina,
      limite,
    });

    return NextResponse.json({
      sucesso: true,
      ...dados,
    });
  } catch (error: any) {
    console.error("Erro em GET /api/admin/webhooks:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro ao listar eventos de webhook." },
      { status: 500 }
    );
  }
}
