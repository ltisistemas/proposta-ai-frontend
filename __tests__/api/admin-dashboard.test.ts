import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB and Auth
vi.mock("@/lib/db/admin-dashboard", () => ({
  obterMetricasAdminDashboard: vi.fn(),
}));

vi.mock("@/lib/db/users", () => ({
  obterUserPorId: vi.fn(),
  garantirColunasAdmin: vi.fn(),
  garantirColunaVerificacaoAssinatura: vi.fn(),
}));

import { GET as adminDashboardStatsHandler } from "@/app/api/admin/dashboard/stats/route";
import { obterMetricasAdminDashboard } from "@/lib/db/admin-dashboard";
import { obterUserPorId } from "@/lib/db/users";
import { gerarToken } from "@/lib/auth/jwt";

describe("API GET /api/admin/dashboard/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 Unauthorized when no token is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const res = await adminDashboardStatsHandler(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.sucesso).toBe(false);
    expect(data.erro).toContain("Autenticação necessária");
  });

  it("should return 403 Forbidden when user is not admin", async () => {
    const token = gerarToken({
      userId: "user_cliente_123",
      email: "cliente@teste.com",
      nome: "Cliente Silva",
      plano: "pro",
      role: "cliente",
    });

    (obterUserPorId as any).mockResolvedValue({
      id: "user_cliente_123",
      email: "cliente@teste.com",
      role: "cliente",
      plano: "pro",
      suspenso: false,
    });

    const req = new NextRequest("http://localhost:3000/api/admin/dashboard/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await adminDashboardStatsHandler(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.sucesso).toBe(false);
    expect(data.erro).toContain("Acesso restrito a administradores");
  });

  it("should return 200 OK with complete metrics when user is admin", async () => {
    const token = gerarToken({
      userId: "admin_user_999",
      email: "admin@virapropo.com",
      nome: "Admin Master",
      plano: "pro",
      role: "admin",
    });

    (obterUserPorId as any).mockResolvedValue({
      id: "admin_user_999",
      email: "admin@virapropo.com",
      role: "admin",
      plano: "pro",
      suspenso: false,
    });

    const mockMetricas = {
      financeiro: {
        totalHoje: 91.80,
        totalMes: 1377.00,
        totalHistorico: 5500.00,
        mrrEstimado: 1377.00,
        transacoesHojeCount: 2,
        transacoesMesCount: 30,
        ticketMedio: 45.90,
      },
      usuarios: {
        total: 100,
        ativos: 98,
        suspensos: 2,
        pro: 30,
        proAsaas: 25,
        proCortesia: 5,
        free: 70,
        admins: 1,
        novosHoje: 5,
        novosMes: 40,
        taxaConversaoPro: 30.0,
      },
      plataforma: {
        totalPropostas: 450,
        propostasAceitas: 180,
        volumeTotalPipeline: 250000.00,
        volumeTotalFechado: 120000.00,
        taxaConversaoGlobal: 40.0,
      },
      ultimosPagamentos: [
        {
          id: "pay_1",
          usuarioId: "usr_1",
          usuarioNome: "Carlos Mendes",
          usuarioEmail: "carlos@empresa.com",
          usuarioPlano: "pro",
          valor: 45.90,
          status: "pago",
          pagoEm: new Date().toISOString(),
          criadoEm: new Date().toISOString(),
        },
      ],
      ultimosUsuarios: [
        {
          id: "usr_1",
          nome: "Carlos Mendes",
          email: "carlos@empresa.com",
          plano: "pro",
          role: "cliente",
          suspenso: false,
          criadoEm: new Date().toISOString(),
        },
      ],
    };

    (obterMetricasAdminDashboard as any).mockResolvedValue(mockMetricas);

    const req = new NextRequest("http://localhost:3000/api/admin/dashboard/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await adminDashboardStatsHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sucesso).toBe(true);
    expect(data.metricas).toBeDefined();
    expect(data.metricas.financeiro.totalHoje).toBe(91.80);
    expect(data.metricas.usuarios.ativos).toBe(98);
    expect(data.metricas.usuarios.suspensos).toBe(2);
    expect(data.metricas.plataforma.totalPropostas).toBe(450);
    expect(data.metricas.ultimosPagamentos.length).toBe(1);
  });
});
