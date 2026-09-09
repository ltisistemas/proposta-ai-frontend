import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import axios from "axios";
import {
  criarCobrancaPixTransparente,
  obterCobrancaPix,
  simularPagamentoDev,
  verifyAbacateSignature,
  validarAssinaturaWebhook,
  getAbacateClient,
  ABACATEPAY_PUBLIC_KEY,
} from "@/lib/abacate/client";

describe("lib/abacate/client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should create an instance of abacate axios client with defaults", () => {
    const client = getAbacateClient();
    expect(client).toBeDefined();
    expect(client.defaults.baseURL).toContain("api.abacatepay.com/v2");
    expect(client.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("should generate a fallback dev PIX charge when direct API key is not connected or in sandbox", async () => {
    const payload = {
      amount: 4590,
      description: "Plano Pro",
      customer: {
        name: "Test User",
        email: "test@user.com",
      },
      metadata: { userId: "u123" },
    };

    const res = await criarCobrancaPixTransparente(payload);
    expect(res).toBeDefined();
    expect(res.id).toContain("pix_char_");
    expect(res.amount).toBe(4590);
    expect(res.status).toBe("PENDING");
    expect(res.devMode).toBe(true);
    expect(res.brCode).toContain("BR.GOV.BCB.PIX");
    expect(res.brCodeBase64).toContain("data:image/svg+xml;base64,");
    expect(res.expiresAt).toBeDefined();
    expect(res.metadata?.userId).toBe("u123");
  });

  it("should query status for created charge and support simulation in dev sandbox", async () => {
    const payload = {
      amount: 4590,
      customer: { name: "Test", email: "test@test.com" },
    };

    const charge = await criarCobrancaPixTransparente(payload);
    const initialStatus = await obterCobrancaPix(charge.id);
    expect(initialStatus.status).toBe("PENDING");

    const simulated = simularPagamentoDev(charge.id);
    expect(simulated).toBe(true);

    const updatedStatus = await obterCobrancaPix(charge.id);
    expect(updatedStatus.status).toBe("PAID");
  });

  it("should verify webhook signature using ABACATEPAY_PUBLIC_KEY", () => {
    const rawBody = JSON.stringify({ event: "transparent.completed", data: { id: "pix_1" } });
    const validSignature = crypto
      .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
      .update(Buffer.from(rawBody, "utf8"))
      .digest("base64");

    const isValid = verifyAbacateSignature(rawBody, validSignature);
    expect(isValid).toBe(true);
  });

  it("should verify webhook signature using custom ABACATE_WEBHOOK_SECRET in Base64 and Hex", () => {
    process.env.ABACATE_WEBHOOK_SECRET = "custom_super_secret_key";
    const rawBody = JSON.stringify({ event: "billing.paid", data: { id: "pix_2" } });

    // Base64 format
    const sigB64 = crypto
      .createHmac("sha256", "custom_super_secret_key")
      .update(Buffer.from(rawBody, "utf8"))
      .digest("base64");
    expect(verifyAbacateSignature(rawBody, sigB64)).toBe(true);

    // Hex format
    const sigHex = crypto
      .createHmac("sha256", "custom_super_secret_key")
      .update(Buffer.from(rawBody, "utf8"))
      .digest("hex");
    expect(verifyAbacateSignature(rawBody, sigHex)).toBe(true);

    // Alias compatibility
    expect(validarAssinaturaWebhook(rawBody, sigB64)).toBe(true);
  });

  it("should reject tampered payload or invalid signature", () => {
    const rawBody = JSON.stringify({ event: "checkout.completed" });
    expect(verifyAbacateSignature(rawBody, "invalid-sig-here")).toBe(false);
    expect(verifyAbacateSignature(rawBody, "")).toBe(false);
  });

  it("should handle direct API call via axios when API key is set", async () => {
    process.env.ABACATE_SECRET_KEY = "live_prod_api_key_123";
    const mockClientInstance = {
      post: vi.fn().mockResolvedValue({
        data: {
          data: {
            id: "pix_live_999",
            amount: 4590,
            status: "PENDING",
            devMode: false,
            brCode: "BR.GOV.BCB.PIX...",
            brCodeBase64: "data:image/svg+xml;base64,123",
            expiresAt: "2026-09-09T23:00:00Z",
          },
        },
      }),
      get: vi.fn().mockResolvedValue({
        data: {
          data: {
            id: "pix_live_999",
            status: "PAID",
            devMode: false,
          },
        },
      }),
      defaults: {
        baseURL: "https://api.abacatepay.com/v2",
        headers: { "Content-Type": "application/json" },
      },
    };
    const createSpy = vi.spyOn(axios, "create").mockReturnValue(mockClientInstance as any);

    const created = await criarCobrancaPixTransparente({
      amount: 4590,
      customer: { name: "Live Customer", email: "live@cust.com" },
    });
    expect(created.id).toBe("pix_live_999");

    const status = await obterCobrancaPix("pix_live_999");
    expect(status.status).toBe("PAID");

    createSpy.mockRestore();
    delete process.env.ABACATE_SECRET_KEY;
  });

  it("should safely handle errors during direct API call and fallback to dev store", async () => {
    process.env.ABACATE_SECRET_KEY = "live_prod_api_key_123";
    const mockFailingClient = {
      post: vi.fn().mockRejectedValue(new Error("Network Timeout")),
      get: vi.fn().mockRejectedValue(new Error("Timeout")),
      defaults: {
        baseURL: "https://api.abacatepay.com/v2",
        headers: { "Content-Type": "application/json" },
      },
    };
    const createSpy = vi.spyOn(axios, "create").mockReturnValue(mockFailingClient as any);

    const fallbackCharge = await criarCobrancaPixTransparente({
      amount: 4590,
      customer: { name: "Fallback", email: "fb@cust.com" },
    });
    expect(fallbackCharge.devMode).toBe(true);

    const fallbackStatus = await obterCobrancaPix(fallbackCharge.id);
    expect(fallbackStatus.status).toBe("PENDING");

    createSpy.mockRestore();
    delete process.env.ABACATE_SECRET_KEY;
  });
});
