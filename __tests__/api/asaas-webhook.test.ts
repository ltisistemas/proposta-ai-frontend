import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mocks
vi.mock("@/lib/db/client", () => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
}));

vi.mock("@/lib/db/users", () => ({
  atualizarUserPlanoAsaas: vi.fn(),
  garantirColunaVerificacaoAssinatura: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/webhooks", () => ({
  verificarEventoProcessado: vi.fn().mockResolvedValue(false),
  registrarEventoProcessado: vi.fn().mockResolvedValue(undefined),
}));

import { POST as webhookRoute } from "@/app/api/webhooks/asaas/route";
import { atualizarUserPlanoAsaas } from "@/lib/db/users";
import {
  verificarEventoProcessado,
  registrarEventoProcessado,
} from "@/lib/db/webhooks";
import { query } from "@/lib/db/client";

describe("API /api/webhooks/asaas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ASAAS_WEBHOOK_SECRET = "whsec_test_secret_123";
    (process.env as any).NODE_ENV = "production";
  });

  it("should reject unauthenticated webhook requests with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
      method: "POST",
      headers: { "asaas-access-token": "wrong_token" },
      body: JSON.stringify({ event: "PAYMENT_RECEIVED" }),
    });

    const res = await webhookRoute(req);
    expect(res.status).toBe(401);
  });

  it("should process PAYMENT_RECEIVED event and upgrade user to pro", async () => {
    const payload = {
      id: "evt_asaas_001",
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_123",
        customer: "cus_123",
        subscription: "sub_123",
        value: 45.9,
        status: "RECEIVED",
        invoiceUrl: "https://sandbox.asaas.com/i/pay_123",
        externalReference: "usr_456",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
      method: "POST",
      headers: {
        "asaas-access-token": "whsec_test_secret_123",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const res = await webhookRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.evento).toBe("PAYMENT_RECEIVED");
    expect(query).toHaveBeenCalled();
    expect(registrarEventoProcessado).toHaveBeenCalledWith(
      "evt_asaas_001",
      "PAYMENT_RECEIVED",
      expect.any(Object)
    );
  });

  it("should skip processing if event was already processed (idempotency)", async () => {
    vi.mocked(verificarEventoProcessado).mockResolvedValueOnce(true);

    const payload = {
      id: "evt_duplicate_001",
      event: "PAYMENT_CONFIRMED",
      payment: { id: "pay_123" },
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
      method: "POST",
      headers: {
        "asaas-access-token": "whsec_test_secret_123",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const res = await webhookRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.duplicado).toBe(true);
    expect(query).not.toHaveBeenCalled();
  });

  it("should handle PAYMENT_REFUNDED and downgrade user", async () => {
    const payload = {
      id: "evt_refund_001",
      event: "PAYMENT_REFUNDED",
      payment: {
        id: "pay_123",
        customer: "cus_123",
        externalReference: "usr_456",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
      method: "POST",
      headers: {
        "asaas-access-token": "whsec_test_secret_123",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const res = await webhookRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(query).toHaveBeenCalled();
  });

  it("should handle SUBSCRIPTION_CANCELED by scheduling cancellation", async () => {
    const payload = {
      id: "evt_cancel_001",
      event: "SUBSCRIPTION_CANCELED",
      subscription: {
        id: "sub_123",
        customer: "cus_123",
        externalReference: "usr_456",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
      method: "POST",
      headers: {
        "asaas-access-token": "whsec_test_secret_123",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const res = await webhookRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(query).toHaveBeenCalled();
  });
});
