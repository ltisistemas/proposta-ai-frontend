import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mocks
vi.mock("@/lib/db/client", () => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
}));

vi.mock("@/lib/db/users", () => ({
  obterUserPorId: vi.fn(),
  atualizarUserAsaasCustomerId: vi.fn(),
  garantirColunaVerificacaoAssinatura: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/asaas/client", () => ({
  criarOuBuscarClienteAsaas: vi.fn(),
  criarAssinaturaAsaas: vi.fn(),
  obterPagamentosAssinaturaAsaas: vi.fn(),
  obterPixQrCodeAsaas: vi.fn(),
  obterStatusCobrancaAsaas: vi.fn(),
  simularPagamentoDevAsaas: vi.fn(),
}));

import { POST as checkoutRoute } from "@/app/api/checkout/route";
import {
  GET as checkoutStatusGetRoute,
  POST as checkoutStatusPostRoute,
} from "@/app/api/checkout/status/route";
import { obterUserPorId } from "@/lib/db/users";
import {
  criarOuBuscarClienteAsaas,
  criarAssinaturaAsaas,
  obterPagamentosAssinaturaAsaas,
  obterPixQrCodeAsaas,
  obterStatusCobrancaAsaas,
  simularPagamentoDevAsaas,
} from "@/lib/asaas/client";
import { query } from "@/lib/db/client";
import { gerarToken } from "@/lib/auth/jwt";

describe("API /api/checkout & /api/checkout/status (Asaas)", () => {
  const token = gerarToken({
    userId: "u123",
    email: "user@test.com",
    nome: "User Test",
    plano: "free",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when token is missing in POST /api/checkout", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout", { method: "POST" });
    const res = await checkoutRoute(req);
    expect(res.status).toBe(401);
  });

  it("should create customer, subscription, and return PIX QR Code in POST /api/checkout", async () => {
    vi.mocked(obterUserPorId).mockResolvedValue({
      id: "u123",
      email: "user@test.com",
      nome: "User Test",
      plano: "free",
      criado_em: new Date(),
      atualizado_em: new Date(),
    } as any);

    vi.mocked(criarOuBuscarClienteAsaas).mockResolvedValue({
      id: "cus_asaas_123",
      name: "User Test",
      email: "user@test.com",
    });

    vi.mocked(criarAssinaturaAsaas).mockResolvedValue({
      id: "sub_asaas_123",
      customer: "cus_asaas_123",
      value: 45.9,
      cycle: "MONTHLY",
      billingType: "PIX",
      status: "ACTIVE",
      nextDueDate: "2026-09-11",
    });

    vi.mocked(obterPagamentosAssinaturaAsaas).mockResolvedValue([
      {
        id: "pay_asaas_123",
        customer: "cus_asaas_123",
        subscription: "sub_asaas_123",
        value: 45.9,
        status: "PENDING",
        dueDate: "2026-09-11",
        invoiceUrl: "https://sandbox.asaas.com/i/pay_asaas_123",
        billingType: "PIX",
      },
    ]);

    vi.mocked(obterPixQrCodeAsaas).mockResolvedValue({
      encodedImage: "iVBORw0KGgoAAAANSUhEUgAA...",
      payload: "00020126580014BR.GOV.BCB.PIX...",
      expirationDate: "2026-09-11T23:59:59Z",
    });

    const req = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await checkoutRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.sucesso).toBe(true);
    expect(json.chargeId).toBe("pay_asaas_123");
    expect(json.subscriptionId).toBe("sub_asaas_123");
    expect(json.amount).toBe(45.9);
    expect(json.brCode).toContain("BR.GOV.BCB.PIX");
    expect(json.brCodeBase64).toContain("data:image/png;base64,");
    expect(json.invoiceUrl).toBe("https://sandbox.asaas.com/i/pay_asaas_123");
  });

  it("should check status in GET /api/checkout/status", async () => {
    vi.mocked(query).mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: "SELECT",
      oid: 0,
      fields: [],
    });

    vi.mocked(obterStatusCobrancaAsaas).mockResolvedValue({
      id: "pay_asaas_123",
      status: "RECEIVED",
      invoiceUrl: "https://sandbox.asaas.com/i/pay_asaas_123",
    });

    const req = new NextRequest(
      "http://localhost:3000/api/checkout/status?chargeId=pay_asaas_123",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const res = await checkoutStatusGetRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("PAID");
    expect(json.isPro).toBe(true);
    expect(json.plano).toBe("pro");
    expect(json.invoiceUrl).toBe("https://sandbox.asaas.com/i/pay_asaas_123");
  });

  it("should simulate payment in POST /api/checkout/status", async () => {
    vi.mocked(simularPagamentoDevAsaas).mockReturnValue(true);

    const req = new NextRequest("http://localhost:3000/api/checkout/status", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        chargeId: "pay_asaas_123",
        simulatePaid: true,
      }),
    });

    const res = await checkoutStatusPostRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.sucesso).toBe(true);
    expect(json.status).toBe("PAID");
    expect(json.isPro).toBe(true);
    expect(json.plano).toBe("pro");
  });
});
