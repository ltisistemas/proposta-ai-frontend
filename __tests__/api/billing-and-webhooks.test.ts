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
  simularPagamentoDev: vi.fn(),
  verifyAbacateSignature: vi.fn(),
}));

import { POST as checkoutRoute } from "@/app/api/checkout/route";
import {
  GET as checkoutStatusGetRoute,
  POST as checkoutStatusPostRoute,
} from "@/app/api/checkout/status/route";
import { POST as webhookRoute } from "@/app/api/webhooks/abacate/route";
import { obterUserPorId, atualizarUserPlano } from "@/lib/db/users";
import {
  criarCobrancaPixTransparente,
  obterCobrancaPix,
  simularPagamentoDev,
  verifyAbacateSignature,
} from "@/lib/abacate/client";
import {
  verificarEventoProcessado,
  registrarEventoProcessado,
} from "@/lib/db/webhooks";
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

  it("should return 401 when token is missing or invalid in POST /api/checkout", async () => {
    const reqNoTok = new NextRequest("http://localhost:3000/api/checkout", { method: "POST" });
    const resNoTok = await checkoutRoute(reqNoTok);
    expect(resNoTok.status).toBe(401);

    const reqInvalid = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { Authorization: "Bearer invalid_tok" },
    });
    const resInvalid = await checkoutRoute(reqInvalid);
    expect(resInvalid.status).toBe(401);
  });

  it("should return 404 when user is not found in database", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await checkoutRoute(req);
    expect(res.status).toBe(404);
  });

  it("should create PIX charge with fallback name when user profile fields are empty", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "u123",
      email: "user@test.com",
      nome: "",
      empresa_cnpj: null,
      empresa_telefone: null,
      plano: "free",
    } as any);

    vi.mocked(criarCobrancaPixTransparente).mockResolvedValueOnce({
      id: "pix_fallback_1",
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
    expect(criarCobrancaPixTransparente).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({
          name: "Assinante Propex AI",
        }),
      })
    );
  });

  it("should return 500 when POST /api/checkout throws", async () => {
    vi.mocked(obterUserPorId).mockRejectedValueOnce(new Error("Fatal error"));
    const req = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await checkoutRoute(req);
    expect(res.status).toBe(500);
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

  it("should return 401 when token is missing or invalid in GET and POST /api/checkout/status", async () => {
    const reqNoToken = new NextRequest("http://localhost:3000/api/checkout/status");
    const resGetNoTok = await checkoutStatusGetRoute(reqNoToken);
    expect(resGetNoTok.status).toBe(401);

    const resPostNoTok = await checkoutStatusPostRoute(reqNoToken);
    expect(resPostNoTok.status).toBe(401);

    const reqInvalidTok = new NextRequest("http://localhost:3000/api/checkout/status", {
      headers: { Authorization: "Bearer bad_tok" },
    });
    const resGetBadTok = await checkoutStatusGetRoute(reqInvalidTok);
    expect(resGetBadTok.status).toBe(401);

    const resPostBadTok = await checkoutStatusPostRoute(reqInvalidTok);
    expect(resPostBadTok.status).toBe(401);
  });

  it("should return 400 if chargeId parameter is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await checkoutStatusGetRoute(req);
    expect(res.status).toBe(400);

    const reqPost = new NextRequest("http://localhost:3000/api/checkout/status", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    const resPost = await checkoutStatusPostRoute(reqPost);
    expect(resPost.status).toBe(400);
  });

  it("should return already paid status when pagamentos row has pago", async () => {
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ status: "pago" }],
      rowCount: 1,
    } as any);

    const req = new NextRequest(
      "http://localhost:3000/api/checkout/status?chargeId=pix_already_paid",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const res = await checkoutStatusGetRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("PAID");
    expect(json.isPro).toBe(true);
  });

  it("should check status and return pending if not paid", async () => {
    vi.mocked(query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    vi.mocked(obterCobrancaPix).mockResolvedValueOnce({
      id: "pix_pending",
      status: "PENDING",
      devMode: true,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/checkout/status?chargeId=pix_pending",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const res = await checkoutStatusGetRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("PENDING");
    expect(json.isPro).toBe(false);
  });

  it("should check status and upgrade user when payment is confirmed", async () => {
    vi.mocked(query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // pagamentos check
    vi.mocked(obterCobrancaPix).mockResolvedValueOnce({
      id: "pix_123",
      status: "PAID",
      devMode: true,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/checkout/status?chargeId=pix_123",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const res = await checkoutStatusGetRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("PAID");
    expect(json.isPro).toBe(true);
  });

  it("should support sandbox simulation via POST and handle simulatePaid=false", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout/status", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ chargeId: "pix_123", simulatePaid: true }),
    });

    const res = await checkoutStatusPostRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.status).toBe("PAID");
    expect(simularPagamentoDev).toHaveBeenCalledWith("pix_123");

    const reqNoSim = new NextRequest("http://localhost:3000/api/checkout/status", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ chargeId: "pix_123", simulatePaid: false }),
    });
    const resNoSim = await checkoutStatusPostRoute(reqNoSim);
    expect(resNoSim.status).toBe(200);
    const jsonNoSim = await resNoSim.json();
    expect(jsonNoSim.status).toBe("PENDING");
  });

  it("should return 500 when GET /api/checkout/status or POST throws", async () => {
    vi.mocked(query).mockRejectedValueOnce(new Error("DB Fatal"));
    const reqGet = new NextRequest(
      "http://localhost:3000/api/checkout/status?chargeId=pix_err",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const resGet = await checkoutStatusGetRoute(reqGet);
    expect(resGet.status).toBe(500);

    vi.mocked(query).mockRejectedValueOnce(new Error("DB Fatal"));
    const reqPost = new NextRequest("http://localhost:3000/api/checkout/status", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ chargeId: "pix_err", simulatePaid: true }),
    });
    const resPost = await checkoutStatusPostRoute(reqPost);
    expect(resPost.status).toBe(500);
  });
});

describe("API /api/webhooks/abacate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (process.env as any).NODE_ENV = "production";
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

  it("should allow in dev mode when signature is absent", async () => {
    (process.env as any).NODE_ENV = "development";
    const req = new NextRequest("http://localhost:3000/api/webhooks/abacate", {
      method: "POST",
      body: JSON.stringify({ event: "billing.paid", data: { id: "pix_dev" } }),
    });

    const res = await webhookRoute(req);
    expect(res.status).toBe(200);
  });

  it("should return 400 when body cannot be parsed as JSON", async () => {
    vi.mocked(verifyAbacateSignature).mockReturnValueOnce(true);
    const req = new NextRequest("http://localhost:3000/api/webhooks/abacate?webhookSecret=secret_webhook_test", {
      method: "POST",
      headers: { "X-Webhook-Signature": "valid_sig" },
      body: "invalid-not-json",
    });

    const res = await webhookRoute(req);
    expect(res.status).toBe(400);
  });

  it("should process transparent.completed webhook and upgrade user plan", async () => {
    vi.mocked(verifyAbacateSignature).mockReturnValueOnce(true);
    vi.mocked(atualizarUserPlano).mockResolvedValueOnce({
      id: "u123",
      plano: "pro",
    } as any);

    const payload = {
      id: "evt_test_100",
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

  it("should process billing.paid webhook", async () => {
    vi.mocked(verifyAbacateSignature).mockReturnValueOnce(true);
    vi.mocked(atualizarUserPlano).mockResolvedValueOnce({
      id: "u123",
      plano: "pro",
    } as any);

    const payload = {
      id: "evt_billing_paid_1",
      event: "billing.paid",
      data: {
        id: "pix_999",
        metadata: { userId: "u123" },
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
  });

  it("should process subscription.cancelled webhook and downgrade user to free via userId or customerId", async () => {
    vi.mocked(verifyAbacateSignature).mockReturnValue(true);
    vi.mocked(atualizarUserPlano).mockResolvedValue({
      id: "u123",
      plano: "free",
    } as any);

    // With customerId
    const payloadCust = {
      id: "evt_test_cancelled_cust",
      event: "subscription.cancelled",
      data: {
        id: "sub_123",
        customer: { id: "cust_abc" },
      },
    };

    const reqCust = new NextRequest(
      "http://localhost:3000/api/webhooks/abacate?webhookSecret=secret_webhook_test",
      {
        method: "POST",
        headers: { "X-Webhook-Signature": "valid_sig" },
        body: JSON.stringify(payloadCust),
      }
    );

    const resCust = await webhookRoute(reqCust);
    expect(resCust.status).toBe(200);
    expect(atualizarUserPlano).toHaveBeenCalledWith("cust_abc", "free", null);

    // With userId
    const payloadUser = {
      id: "evt_test_cancelled_user",
      event: "subscription.failed",
      data: {
        id: "sub_456",
        metadata: { userId: "u123" },
      },
    };

    const reqUser = new NextRequest(
      "http://localhost:3000/api/webhooks/abacate?webhookSecret=secret_webhook_test",
      {
        method: "POST",
        headers: { "X-Webhook-Signature": "valid_sig" },
        body: JSON.stringify(payloadUser),
      }
    );

    const resUser = await webhookRoute(reqUser);
    expect(resUser.status).toBe(200);
  });

  it("should process charge.paid webhook with customerId when userId is not in metadata", async () => {
    vi.mocked(verifyAbacateSignature).mockReturnValueOnce(true);

    const payload = {
      id: "evt_charge_paid_cust",
      event: "charge.paid",
      data: {
        id: "char_888",
        customer: { id: "cust_vip" },
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
    expect(atualizarUserPlano).toHaveBeenCalledWith("cust_vip", "pro", "char_888");
  });

  it("should handle unknown events gracefully", async () => {
    vi.mocked(verifyAbacateSignature).mockReturnValueOnce(true);

    const payload = {
      id: "evt_unknown_99",
      event: "custom.unknown.event",
      data: {},
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
    expect(json.ok).toBe(true);
    expect(json.recebido).toBe(true);
  });

  it("should skip already processed events via idempotency", async () => {
    vi.mocked(verifyAbacateSignature).mockReturnValueOnce(true);
    vi.mocked(verificarEventoProcessado).mockResolvedValueOnce(true);

    const payload = {
      id: "evt_duplicate_999",
      event: "checkout.completed",
      data: {},
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
    expect(json.duplicado).toBe(true);
  });
});
