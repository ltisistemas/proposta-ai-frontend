import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  getAsaasApiKey,
  getAsaasBaseUrl,
  getAsaasClient,
  criarOuBuscarClienteAsaas,
  criarAssinaturaAsaas,
  obterPagamentosAssinaturaAsaas,
  obterPixQrCodeAsaas,
  obterStatusCobrancaAsaas,
  simularPagamentoDevAsaas,
  validarWebhookTokenAsaas,
  gerarCpfValidoFallback,
} from "@/lib/asaas/client";

describe("lib/asaas/client", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.ASAAS_API_KEY;
    delete process.env.ASAAS_API_KEY_SANDBOX;
    delete process.env.ASAAS_SECRET_KEY;
  });

  it("should parse API key and correctly identify sandbox vs production URL", () => {
    process.env.ASAAS_API_KEY = '"$aact_hmlg_000123"';
    expect(getAsaasApiKey()).toBe("$aact_hmlg_000123");
    expect(getAsaasBaseUrl()).toBe("https://api-sandbox.asaas.com/v3");

    process.env.ASAAS_API_KEY = "live_prod_key";
    (process.env as any).NODE_ENV = "production";
    delete process.env.ASAAS_BASE_URL;
    expect(getAsaasBaseUrl()).toBe("https://api.asaas.com/v3");
  });

  it("should create an instance of asaas axios client with proper headers", () => {
    process.env.ASAAS_API_KEY = "test_key_123";
    const client = getAsaasClient();
    expect(client).toBeDefined();
    expect(client.defaults.headers["access_token"]).toBe("test_key_123");
    expect(client.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("should generate a valid fallback CPF", () => {
    const cpf = gerarCpfValidoFallback();
    expect(cpf).toHaveLength(11);
    expect(/^\d{11}$/.test(cpf)).toBe(true);
  });

  it("should create or find customer with fallback when in dev/mock", async () => {
    process.env.ASAAS_API_KEY = "mock_test_key";
    const customer = await criarOuBuscarClienteAsaas({
      name: "João Silva",
      email: "joao@exemplo.com",
    });

    expect(customer).toBeDefined();
    expect(customer.id).toMatch(/^cus_/);
    expect(customer.name).toBe("João Silva");
    expect(customer.cpfCnpj).toBeDefined();
  });

  it("should create recurring monthly subscription with fallback", async () => {
    process.env.ASAAS_API_KEY = "mock_test_key";
    const sub = await criarAssinaturaAsaas({
      customer: "cus_123",
      billingType: "PIX",
      cycle: "MONTHLY",
      value: 45.9,
      nextDueDate: "2026-09-11",
      description: "Plano PRO do ViraPropo-AI",
    });

    expect(sub).toBeDefined();
    expect(sub.id).toMatch(/^sub_/);
    expect(sub.billingType).toBe("PIX");
    expect(sub.cycle).toBe("MONTHLY");
    expect(sub.value).toBe(45.9);
  });

  it("should fetch pix qr code with fallback", async () => {
    process.env.ASAAS_API_KEY = "mock_test_key";
    const qr = await obterPixQrCodeAsaas("pay_123");
    expect(qr).toBeDefined();
    expect(qr.payload).toContain("BR.GOV.BCB.PIX");
    expect(qr.encodedImage).toBeDefined();
  });

  it("should query status and support simulation in dev mode", async () => {
    const payId = "pay_test_simulation";
    const initialStatus = await obterStatusCobrancaAsaas(payId);
    expect(initialStatus.status).toBe("PENDING");

    const sim = simularPagamentoDevAsaas(payId);
    expect(sim).toBe(true);

    const updated = await obterStatusCobrancaAsaas(payId);
    expect(updated.status).toBe("CONFIRMED");
  });

  it("should validate webhook token correctly", () => {
    process.env.ASAAS_WEBHOOK_SECRET = "whsec_super_secret_2026";
    expect(validarWebhookTokenAsaas("whsec_super_secret_2026")).toBe(true);
    expect(validarWebhookTokenAsaas("wrong_token")).toBe(false);
    expect(validarWebhookTokenAsaas("")).toBe(false);
  });

  it("should handle direct API calls using mocked axios client", async () => {
    process.env.ASAAS_API_KEY = "live_test_api_key";
    const mockAxiosInstance = {
      get: vi.fn().mockImplementation((url: string) => {
        if (url === "/customers") {
          return Promise.resolve({
            data: {
              data: [
                {
                  id: "cus_live_999",
                  name: "Cliente Real",
                  email: "real@cliente.com",
                  cpfCnpj: "12345678901",
                },
              ],
            },
          });
        }
        if (url === "/payments/pay_live_123/pixQrCode") {
          return Promise.resolve({
            data: {
              encodedImage: "base64image==",
              payload: "000201...",
              expirationDate: "2026-09-12",
            },
          });
        }
        if (url === "/payments/pay_live_123") {
          return Promise.resolve({
            data: {
              id: "pay_live_123",
              status: "RECEIVED",
              invoiceUrl: "https://asaas.com/i/123",
            },
          });
        }
        return Promise.resolve({ data: {} });
      }),
      post: vi.fn().mockImplementation((url: string, body: any) => {
        if (url === "/subscriptions") {
          return Promise.resolve({
            data: {
              id: "sub_live_999",
              customer: body.customer,
              value: body.value,
              status: "ACTIVE",
            },
          });
        }
        return Promise.resolve({ data: {} });
      }),
      defaults: {
        baseURL: "https://api.asaas.com/v3",
        headers: {},
      },
    };

    const createSpy = vi.spyOn(axios, "create").mockReturnValue(mockAxiosInstance as any);

    const existingCustomer = await criarOuBuscarClienteAsaas({
      name: "Cliente Real",
      email: "real@cliente.com",
    });
    expect(existingCustomer.id).toBe("cus_live_999");

    const createdSub = await criarAssinaturaAsaas({
      customer: "cus_live_999",
      billingType: "PIX",
      cycle: "MONTHLY",
      value: 45.9,
      nextDueDate: "2026-09-11",
    });
    expect(createdSub.id).toBe("sub_live_999");

    const pixQr = await obterPixQrCodeAsaas("pay_live_123");
    expect(pixQr.encodedImage).toBe("data:image/png;base64,base64image==");

    const status = await obterStatusCobrancaAsaas("pay_live_123");
    expect(status.status).toBe("RECEIVED");
    expect(status.invoiceUrl).toBe("https://asaas.com/i/123");

    createSpy.mockRestore();
  });
});
