import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mocks
vi.mock("@/lib/db/client", () => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
}));

vi.mock("@/lib/db/users", () => ({
  obterUserPorId: vi.fn(),
  garantirColunaVerificacaoAssinatura: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/webhooks", () => ({
  verificarEventoProcessado: vi.fn().mockResolvedValue(false),
  registrarEventoAuditoria: vi.fn().mockResolvedValue(undefined),
  registrarEventoProcessado: vi.fn().mockResolvedValue(undefined),
}));

import { POST as webhookRoute } from "@/app/api/webhooks/asaas/route";
import { obterUserPorId } from "@/lib/db/users";
import {
  verificarEventoProcessado,
  registrarEventoAuditoria,
} from "@/lib/db/webhooks";
import { query } from "@/lib/db/client";

describe("API /api/webhooks/asaas Observability & Downgrades", () => {
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

  it("should process PAYMENT_RECEIVED event and upgrade user to pro with PLAN_ACTIVATED audit", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "usr_456",
      email: "cliente@teste.com",
    } as any);

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
    expect(json.acao).toBe("PLAN_ACTIVATED");
    expect(query).toHaveBeenCalled();
    expect(registrarEventoAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "evt_asaas_001",
        evento: "PAYMENT_RECEIVED",
        status: "sucesso",
        acao: "PLAN_ACTIVATED",
        usuarioId: "usr_456",
      })
    );
  });

  it("should fallback to resolving user by subscriptionId when externalReference is absent", async () => {
    // externalReference is missing; query returns user for asaas_subscription_id
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ id: "usr_by_sub_789" }],
      rowCount: 1,
    } as any);

    const payload = {
      id: "evt_asaas_sub_002",
      event: "SUBSCRIPTION_CANCELED",
      subscription: {
        id: "sub_asaas_999",
        customer: "cus_asaas_888",
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
    expect(json.acao).toBe("DOWNGRADE_TO_FREE");
    expect(registrarEventoAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: "DOWNGRADE_TO_FREE",
        usuarioId: "usr_by_sub_789",
      })
    );
  });

  it("should fallback to resolving user by customerId when externalReference and subscriptionId are absent", async () => {
    // customer fallback
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ id: "usr_by_cus_321" }],
      rowCount: 1,
    } as any);

    const payload = {
      id: "evt_asaas_cus_003",
      event: "PAYMENT_REFUNDED",
      payment: {
        id: "pay_refund_111",
        customer: "cus_asaas_555",
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
    expect(json.acao).toBe("DOWNGRADE_TO_FREE");
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
    expect(registrarEventoAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: "DUPLICATE_SKIPPED",
        status: "duplicado",
      })
    );
  });

  it("should handle SUBSCRIPTION_DELETED and execute immediate downgrade to free", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce({
      id: "usr_456",
      email: "cliente@teste.com",
    } as any);

    const payload = {
      id: "evt_cancel_del_004",
      event: "SUBSCRIPTION_DELETED",
      subscription: {
        id: "sub_del_123",
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
    expect(json.acao).toBe("DOWNGRADE_TO_FREE");
    expect(query).toHaveBeenCalled();
  });

  it("should handle UNMATCHED_USER when user cannot be located and record warning audit", async () => {
    vi.mocked(obterUserPorId).mockResolvedValueOnce(null);
    vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 } as any);

    const payload = {
      id: "evt_unmatched_005",
      event: "SUBSCRIPTION_CANCELED",
      subscription: {
        id: "sub_unknown",
        customer: "cus_unknown",
        externalReference: "usr_ghost",
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
    expect(json.acao).toBe("UNMATCHED_USER");
    expect(registrarEventoAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: "UNMATCHED_USER",
        status: "aviso",
      })
    );
  });
});
