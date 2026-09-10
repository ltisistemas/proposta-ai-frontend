import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/propostas", () => ({
  obterPropostaPorId: vi.fn(),
  regenerarConteudoIA: vi.fn(),
}));

vi.mock("@/lib/db/users", () => ({
  obterUserPorId: vi.fn(),
}));

vi.mock("@/lib/gemini/client", () => ({
  gerarPropostacComIA: vi.fn(),
}));

import { POST as regerarIARoute } from "@/app/api/propostas/[id]/regerar-ia/route";
import { obterPropostaPorId, regenerarConteudoIA } from "@/lib/db/propostas";
import { obterUserPorId } from "@/lib/db/users";
import { gerarPropostacComIA } from "@/lib/gemini/client";
import { gerarToken } from "@/lib/auth/jwt";

describe("API POST /api/propostas/[id]/regerar-ia", () => {
  const userId = "user-123";
  const propostaId = "prop-456";
  const validToken = gerarToken({
    userId,
    email: "user@test.com",
    nome: "Consultor Pro",
    plano: "pro",
  });

  const mockUser = {
    id: userId,
    email: "user@test.com",
    nome: "Consultor Pro",
    empresa_nome: "Consultoria Top",
    empresa_cnpj: "12345678000190",
    empresa_email: "contato@top.com",
    empresa_telefone: "11999999999",
    empresa_logo_url: "data:image/png;base64,logo",
    plano: "pro",
  };

  const mockProposta = {
    id: propostaId,
    usuario_id: userId,
    numero: "PROP-2026-001",
    cliente_nome: "Cliente Alvo",
    cliente_empresa: "Empresa Alvo",
    cliente_email: "alvo@empresa.com",
    cliente_telefone: "11888888888",
    descricao: "Escopo inicial",
    conteudo_html: "<html><body>Original</body></html>",
    subtotal: 1000,
    total: 1000,
    prazo_pagamento: "À Vista",
    validade_dias: 30,
    status: "rascunho",
    regeneracoes_ia: 0,
    itens: [
      { descricao: "Item 1", quantidade: 1, valor_unitario: "1000.00" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthenticated", async () => {
    const req = new NextRequest(`http://localhost:3000/api/propostas/${propostaId}/regerar-ia`, {
      method: "POST",
    });
    const res = await regerarIARoute(req, { params: Promise.resolve({ id: propostaId }) });
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.sucesso).toBe(false);
  });

  it("should return 404 if proposal does not exist", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce(mockUser as any);
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce(null);

    const req = new NextRequest(`http://localhost:3000/api/propostas/${propostaId}/regerar-ia`, {
      method: "POST",
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await regerarIARoute(req, { params: Promise.resolve({ id: propostaId }) });
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.erro).toContain("não encontrada");
  });

  it("should return 400 if proposal is already accepted / signed", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce(mockUser as any);
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce({
      ...mockProposta,
      status: "aceita",
      assinante_nome: "Cliente Aceitou",
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/propostas/${propostaId}/regerar-ia`, {
      method: "POST",
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await regerarIARoute(req, { params: Promise.resolve({ id: propostaId }) });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.erro).toContain("já aceitas ou assinadas");
  });

  it("should return 400 if proposal has reached maximum 3 regenerations", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce(mockUser as any);
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce({
      ...mockProposta,
      regeneracoes_ia: 3,
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/propostas/${propostaId}/regerar-ia`, {
      method: "POST",
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await regerarIARoute(req, { params: Promise.resolve({ id: propostaId }) });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.limiteAtingido).toBe(true);
    expect(json.regeneracoesRestantes).toBe(0);
  });

  it("should successfully regenerate proposal with AI and increment count", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce(mockUser as any);
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce({
      ...mockProposta,
      regeneracoes_ia: 1,
    } as any);
    vi.mocked(gerarPropostacComIA).mockResolvedValueOnce("<html><body>Novo Escopo Consultivo</body></html>");
    vi.mocked(regenerarConteudoIA).mockResolvedValueOnce({
      sucesso: true,
      proposta: {
        ...mockProposta,
        conteudo_html: "<html><body>Novo Escopo Consultivo</body></html>",
        regeneracoes_ia: 2,
      } as any,
    });

    const req = new NextRequest(`http://localhost:3000/api/propostas/${propostaId}/regerar-ia`, {
      method: "POST",
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await regerarIARoute(req, { params: Promise.resolve({ id: propostaId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.sucesso).toBe(true);
    expect(json.proposta.regeneracoes_ia).toBe(2);
    expect(json.regeneracoesRestantes).toBe(1);
    expect(vi.mocked(gerarPropostacComIA)).toHaveBeenCalled();
    expect(vi.mocked(regenerarConteudoIA)).toHaveBeenCalledWith(
      propostaId,
      userId,
      expect.stringContaining("Novo Escopo Consultivo")
    );
  });

  it("should handle unexpected internal errors gracefully", async () => {
    vi.mocked(obterUserPorId).mockRejectedValueOnce(new Error("Database connection lost"));

    const req = new NextRequest(`http://localhost:3000/api/propostas/${propostaId}/regerar-ia`, {
      method: "POST",
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await regerarIARoute(req, { params: Promise.resolve({ id: propostaId }) });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.sucesso).toBe(false);
  });
});
