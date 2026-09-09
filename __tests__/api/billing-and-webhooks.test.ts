import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB, Auth, and Abacate client
vi.mock("@/lib/db/client", () => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
}));

vi.mock("@/lib/db/users", () => ({
  obterUserPorId: vi.fn(),
  atualizarUserPlano: vi.fn(),
}));

vi.mock("@/lib/db/webhooks", () => ({
  verificarEventoProcessado: vi.fn().mockResolvedValue(false),
  registrarEventoProcessado: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/abacate/client", () => ({
  criarCobrancaPixTransparente: vi.fn(),
  obterCobrancaPix: vi.fn(),
  verifyAbacateSignature: vi.fn(),
}));

import { POST as checkoutRoute } from "@/app/api/checkout/route";
import { GET as checkoutStatusRoute } from "@/app/api/checkout/status/route";
import { POST as webhookRoute } from "@/app/api/webhooks/abacate/route";
import { obterUserPorId, atualizarUserPlano } from "@/lib/db/users";
import {
  criarCobrancaPixTransparente,
  obterCobrancaPix,
  verifyAbacateSignature,
} from "@/lib/abacate/client";
import { query } from "@/lib/db/client";
import { gerarToken } from "@/lib/auth/jwt";

describe("API /api/checkout", () => {
  const token = gerarToken({
    userId: "u123",
    email: "user@test.com",
    nome: "User Test",
    plano: "free",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout", { method: "POST" });
    const res = await checkoutRoute(req);
    expect(res.status).toBe(401);
  });

  it("should create PIX charge for authenticated user", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u123",
      email: "user@test.com",
      nome: "User Test",
      plano: "free",
    } as any);

    vi.mocked(criarCobrancaPixTransparente).mockResolvedValueOnce({
      id: "pix_123",
      amount: 4590,
      status: "PENDING",
      devMode: true,
      brCode: "BR.GOV.BCB.PIX...",
      brCodeBase64: "data:image/png;base64,...",
      expiresAt: new Date().toISOString(),
    });

    const req = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await checkoutRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.chargeId).toBe("pix_123");
    expect(json.brCode).toBeDefined();
  });
});

describe("API /api/checkout/status", () => {
  const token = gerarToken({
    userId: "u123",
    email: "user@test.com",
    nome: "User Test",
    plano: "free",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if chargeId parameter is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await checkoutStatusRoute(req);
    expect(res.status).toBe(400);
  });

  it("should check status and upgrade user when payment is confirmed", async () => {
    vi.mocked(query).mockResolvedValueOnce({ rows: [], rowCount: 0 }); // pagamentos check
    vi.mocked(obterCobrancaPix).mockResolvedValueOnce({
      id: "pix_123",
      status: "PAID",
      devMode: true,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/checkout/status?chargeId=pix_123",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const res = await checkoutStatusRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("PAID");
    expect(json.isPro).toBe(true);
  });
});

describe("API /api/webhooks/abacate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "production";
    process.env.ABACATE_WEBHOOK_SECRET = "secret_webhook_test";
  });

  it("should reject invalid webhook signature with 401 in production", async () => {
    vi.mocked(verifyAbacateSignature).mockReturnValueOnce(false);

    const req = new NextRequest("http://localhost:3000/api/webhooks/abacate", {
      method: "POST",
      headers: { "X-Webhook-Signature": "invalid" },
      body: JSON.stringify({ event: "billing.paid" }),
    });

    const res = await webhookRoute(req);
    expect(res.status).toBe(401);
  });

  it("should process transparent.completed webhook and upgrade user plan", async () => {
    vi.mocked(verifyAbacateSignature).mockReturnValueOnce(true);
    vi.mocked(atualizarUserPlano).mockResolvedValueOnce({
      id: "u123",
      plano: "pro",
    } as any);

    const payload = {
      eventId: "evt_test_100",
      event: "transparent.completed",
      data: {
        id: "pix_char_999",
        metadata: { userId: "u123" },
        customer: { id: "cust_abc" },
      },
    };

    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/abacate?webhookSecret=secret_webhook_test",
      {
        method: "POST",
        headers: { "X-Webhook-Signature": "valid_sig" },
        body: JSON.stringify(payload),
      }
    );

    const res = await webhookRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.recebido).toBe(true);
    expect(json.ok).toBe(true);
  });
});
