import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB
vi.mock("@/lib/db/propostas", () => ({
  obterPropostasPorUsuario: vi.fn(),
  salvarProposta: vi.fn(),
  obterPropostaPorId: vi.fn(),
  atualizarStatusProposta: vi.fn(),
  deletarProposta: vi.fn(),
  assinarProposta: vi.fn(),
}));

vi.mock("@/lib/db/users", () => ({
  obterUserPorId: vi.fn(),
}));

import { GET as listPropostas, POST as createProposta } from "@/app/api/propostas/route";
import {
  GET as getProposta,
  PATCH as patchProposta,
  DELETE as deletePropostaRoute,
} from "@/app/api/propostas/[id]/route";
import { POST as assinarRoute } from "@/app/api/propostas/[id]/assinar/route";
import { GET as getPublicProposta } from "@/app/api/public/propostas/[id]/route";
import {
  obterPropostasPorUsuario,
  salvarProposta,
  obterPropostaPorId,
  atualizarStatusProposta,
  deletarProposta,
  assinarProposta,
} from "@/lib/db/propostas";
import { obterUserPorId } from "@/lib/db/users";
import { gerarToken } from "@/lib/auth/jwt";

describe("API /api/propostas", () => {
  const token = gerarToken({
    userId: "u_1",
    email: "test@user.com",
    nome: "Test",
    plano: "pro",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when listing propostas without auth", async () => {
    const req = new NextRequest("http://localhost:3000/api/propostas");
    const res = await listPropostas(req);
    expect(res.status).toBe(401);
  });

  it("should return list of user propostas when authenticated", async () => {
    vi.mocked(obterPropostasPorUsuario).mockResolvedValueOnce([
      { id: "p1", numero: "PROP-1", total: 100 } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/propostas?status=enviada", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await listPropostas(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.propostas).toHaveLength(1);
  });

  it("should create new proposta when authenticated", async () => {
    vi.mocked(salvarProposta).mockResolvedValueOnce({
      id: "p_new",
      numero: "PROP-2026-100",
      total: 500,
    } as any);

    const req = new NextRequest("http://localhost:3000/api/propostas", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        clienteNome: "Cliente Teste",
        descricao: "Serviço",
        conteudoHtml: "<p>Conteudo</p>",
        itens: [{ descricao: "Item A", quantidade: 1, valorUnitario: 500 }],
      }),
    });

    const res = await createProposta(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.proposta.id).toBe("p_new");
  });
});

describe("API /api/propostas/[id]", () => {
  const tokenPro = gerarToken({
    userId: "u_pro",
    email: "pro@user.com",
    nome: "Pro",
    plano: "pro",
  });
  const tokenFree = gerarToken({
    userId: "u_free",
    email: "free@user.com",
    nome: "Free",
    plano: "free",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 if proposta not found", async () => {
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/propostas/p_not_found");
    const res = await getProposta(req, { params: Promise.resolve({ id: "p_not_found" }) });
    expect(res.status).toBe(404);
  });

  it("should return 200 with proposta details", async () => {
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce({
      id: "p_1",
      cliente_nome: "Acme",
      total: 1000,
    } as any);

    const req = new NextRequest("http://localhost:3000/api/propostas/p_1");
    const res = await getProposta(req, { params: Promise.resolve({ id: "p_1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.proposta.id).toBe("p_1");
  });

  it("should block free users from manually setting status to aceita", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u_free",
      plano: "free",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/propostas/p_1", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenFree}` },
      body: JSON.stringify({ status: "aceita" }),
    });

    const res = await patchProposta(req, { params: Promise.resolve({ id: "p_1" }) });
    expect(res.status).toBe(403);
  });

  it("should allow pro user to update status", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u_pro",
      plano: "pro",
    } as any);
    vi.mocked(atualizarStatusProposta).mockResolvedValueOnce({
      id: "p_1",
      status: "aceita",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/propostas/p_1", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenPro}` },
      body: JSON.stringify({ status: "aceita" }),
    });

    const res = await patchProposta(req, { params: Promise.resolve({ id: "p_1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
  });

  it("should delete proposta when authenticated", async () => {
    vi.mocked(deletarProposta).mockResolvedValueOnce(true);

    const req = new NextRequest("http://localhost:3000/api/propostas/p_1", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenPro}` },
    });

    const res = await deletePropostaRoute(req, { params: Promise.resolve({ id: "p_1" }) });
    expect(res.status).toBe(200);
  });
});

describe("API /api/propostas/[id]/assinar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for invalid signature payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/propostas/p_1/assinar", {
      method: "POST",
      body: JSON.stringify({ nome: "A" }),
    });

    const res = await assinarRoute(req, { params: Promise.resolve({ id: "p_1" }) });
    expect(res.status).toBe(400);
  });

  it("should return 403 if creator is on free plan", async () => {
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce({
      id: "p_1",
      usuario_id: "u_free",
      status: "enviada",
    } as any);
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u_free",
      plano: "free",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/propostas/p_1/assinar", {
      method: "POST",
      body: JSON.stringify({ nome: "Signatário Oficial", documento: "123.456.789-00" }),
    });

    const res = await assinarRoute(req, { params: Promise.resolve({ id: "p_1" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.precisaUpgrade).toBe(true);
  });

  it("should sign proposta successfully if creator is pro", async () => {
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce({
      id: "p_1",
      usuario_id: "u_pro",
      status: "enviada",
    } as any);
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u_pro",
      plano: "pro",
    } as any);
    vi.mocked(assinarProposta).mockResolvedValueOnce({
      id: "p_1",
      status: "aceita",
      assinante_nome: "Signatário Oficial",
      assinante_documento: "123.456.789-00",
      assinatura_hash: "hash123",
      assinado_em: new Date(),
    } as any);

    const req = new NextRequest("http://localhost:3000/api/propostas/p_1/assinar", {
      method: "POST",
      body: JSON.stringify({ nome: "Signatário Oficial", documento: "123.456.789-00" }),
    });

    const res = await assinarRoute(req, { params: Promise.resolve({ id: "p_1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.proposta.status).toBe("aceita");
  });
});

describe("API /api/public/propostas/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 if proposal does not exist", async () => {
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/public/propostas/missing");
    const res = await getPublicProposta(req, { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("should return 403 if proposal creator is on free plan", async () => {
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce({
      id: "p_free",
      usuario_id: "u_free",
    } as any);
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u_free",
      plano: "free",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/public/propostas/p_free");
    const res = await getPublicProposta(req, { params: Promise.resolve({ id: "p_free" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.bloqueadoPlanoFree).toBe(true);
  });

  it("should return 200 with proposal and issuer info if creator is pro", async () => {
    vi.mocked(obterPropostaPorId).mockResolvedValueOnce({
      id: "p_pro",
      usuario_id: "u_pro",
      cliente_nome: "Cliente VIP",
    } as any);
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u_pro",
      nome: "Emissor Pro",
      plano: "pro",
      empresa_nome: "Minha Empresa Pro",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/public/propostas/p_pro");
    const res = await getPublicProposta(req, { params: Promise.resolve({ id: "p_pro" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.emissor.empresaNome).toBe("Minha Empresa Pro");
  });
});
