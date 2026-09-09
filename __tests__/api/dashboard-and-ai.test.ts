import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB, Auth, and Gemini
vi.mock("@/lib/db/propostas", () => ({
  obterMetricasDashboard: vi.fn(),
  salvarProposta: vi.fn(),
}));

vi.mock("@/lib/db/users", () => ({
  obterUserPorId: vi.fn(),
  verificarLimiteProposta: vi.fn(),
  incrementarContadorPropostas: vi.fn(),
}));

vi.mock("@/lib/gemini/client", () => ({
  gerarPropostacComIA: vi.fn(),
}));

import { GET as getStatsRoute } from "@/app/api/dashboard/stats/route";
import { POST as gerarPropostaRoute } from "@/app/api/gerar-proposta/route";
import { obterMetricasDashboard, salvarProposta } from "@/lib/db/propostas";
import {
  obterUserPorId,
  verificarLimiteProposta,
  incrementarContadorPropostas,
} from "@/lib/db/users";
import { gerarPropostacComIA } from "@/lib/gemini/client";
import { gerarToken } from "@/lib/auth/jwt";

describe("API /api/dashboard/stats", () => {
  const token = gerarToken({
    userId: "u_dash",
    email: "dash@test.com",
    nome: "Dash User",
    plano: "pro",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/dashboard/stats");
    const res = await getStatsRoute(req);
    expect(res.status).toBe(401);
  });

  it("should return metrics for authenticated user", async () => {
    vi.mocked(obterMetricasDashboard).mockResolvedValueOnce({
      totalPropostas: 12,
      propostasAceitas: 8,
      propostasEnviadas: 3,
      propostasRascunho: 1,
      propostasRecusadas: 0,
      valorTotalPipeline: 50000,
      valorTotalFechado: 35000,
      taxaConversao: "66.7%",
    });

    const req = new NextRequest("http://localhost:3000/api/dashboard/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await getStatsRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.metricas.totalPropostas).toBe(12);
  });
});

describe("API /api/gerar-proposta", () => {
  const token = gerarToken({
    userId: "u_ai",
    email: "ai@test.com",
    nome: "AI User",
    plano: "pro",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when unauthenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/gerar-proposta", { method: "POST" });
    const res = await gerarPropostaRoute(req);
    expect(res.status).toBe(401);
  });

  it("should return 402 when free user reaches proposal limit", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u_ai",
      email: "ai@test.com",
      nome: "AI User",
      plano: "free",
    } as any);
    vi.mocked(verificarLimiteProposta).mockResolvedValueOnce(false);

    const req = new NextRequest("http://localhost:3000/api/gerar-proposta", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        clienteNome: "Cliente Limite",
        descricao: "Descrição completa do projeto com mais de 10 caracteres",
        itens: [{ descricao: "Item 1", quantidade: 1, valorUnitario: 100 }],
      }),
    });

    const res = await gerarPropostaRoute(req);
    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.precisaUpgrade).toBe(true);
  });

  it("should generate proposal and save to database successfully", async () => {
    vi.mocked(verificarLimiteProposta).mockResolvedValueOnce(true);
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u_ai",
      plano: "pro",
      nome: "Empresa Emissora",
    } as any);
    vi.mocked(gerarPropostacComIA).mockResolvedValueOnce(
      "<!DOCTYPE html><html><body>Proposta Gerada</body></html>"
    );
    vi.mocked(salvarProposta).mockResolvedValueOnce({
      id: "prop_ai_1",
      numero: "PROP-2026-999",
      total: 2500,
    } as any);

    const req = new NextRequest("http://localhost:3000/api/gerar-proposta", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        clienteNome: "Cliente Sucesso",
        descricao: "Descrição detalhada do escopo técnico para teste",
        itens: [{ descricao: "Desenvolvimento", quantidade: 1, valorUnitario: 2500 }],
      }),
    });

    const res = await gerarPropostaRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.proposta.id).toBe("prop_ai_1");
    expect(json.proposta.conteudoHtml).toContain("Proposta Gerada");
    expect(incrementarContadorPropostas).toHaveBeenCalledWith("u_ai");
  });
});
