import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mocks
vi.mock("@/lib/db/client", () => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
  transaction: vi.fn((cb) => cb({ query: vi.fn().mockResolvedValue({ rows: [{ id: "prop-1" }] }) })),
}));

vi.mock("@/lib/db/users", () => ({
  obterUserPorId: vi.fn(),
  obterUserPorEmail: vi.fn(),
  criarUser: vi.fn(),
  atualizarUserAsaasCustomerId: vi.fn(),
  garantirColunaVerificacaoAssinatura: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/propostas", () => ({
  obterPropostaPorId: vi.fn(),
  registrarVisualizacaoProposta: vi.fn(),
  garantirColunasDualSignature: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/asaas/client", () => ({
  criarOuBuscarClienteAsaas: vi.fn(),
  criarAssinaturaAsaas: vi.fn(),
  obterPagamentosAssinaturaAsaas: vi.fn(),
  obterPixQrCodeAsaas: vi.fn(),
  getAsaasBaseUrl: vi.fn().mockReturnValue("https://api-sandbox.asaas.com/v3"),
}));

import { POST as signupRoute } from "@/app/api/auth/signup/route";
import { POST as checkoutRoute } from "@/app/api/checkout/route";
import { GET as publicProposalRoute } from "@/app/api/public/propostas/[id]/route";
import { criarUser, obterUserPorEmail, obterUserPorId } from "@/lib/db/users";
import { obterPropostaPorId, registrarVisualizacaoProposta } from "@/lib/db/propostas";
import {
  criarOuBuscarClienteAsaas,
  criarAssinaturaAsaas,
  obterPagamentosAssinaturaAsaas,
  obterPixQrCodeAsaas,
} from "@/lib/asaas/client";
import { gerarToken } from "@/lib/auth/jwt";

describe("Growth, UTMs, Annual Checkout & Proposal Views Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. UTM Persistence on Signup (/api/auth/signup)", () => {
    it("should capture and forward UTM parameters to criarUser", async () => {
      vi.mocked(obterUserPorEmail).mockResolvedValue(null);
      vi.mocked(criarUser).mockResolvedValue({
        id: "usr_utm_1",
        email: "growth@agency.com",
        nome: "Growth Manager",
        plano: "free",
        role: "cliente",
        utm_source: "meta_ads",
        utm_campaign: "black_friday",
        criado_em: new Date(),
        atualizado_em: new Date(),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          nome: "Growth Manager",
          email: "growth@agency.com",
          password: "password123",
          utmSource: "meta_ads",
          utmMedium: "cpc",
          utmCampaign: "black_friday",
          utmTerm: "gerador_propostas",
          utmContent: "video_ad_1",
        }),
      });

      const res = await signupRoute(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.sucesso).toBe(true);
      expect(criarUser).toHaveBeenCalledWith({
        nome: "Growth Manager",
        email: "growth@agency.com",
        password: "password123",
        empresaNome: undefined,
        empresaCnpj: undefined,
        utmSource: "meta_ads",
        utmMedium: "cpc",
        utmCampaign: "black_friday",
        utmTerm: "gerador_propostas",
        utmContent: "video_ad_1",
      });
    });
  });

  describe("2. Annual Checkout with 28% Discount (/api/checkout)", () => {
    const token = gerarToken({
      userId: "usr_annual_1",
      email: "pro@user.com",
      nome: "Pro User",
      plano: "free",
    });

    it("should generate annual subscription of R$ 397 with cycle YEARLY when requested", async () => {
      vi.mocked(obterUserPorId).mockResolvedValue({
        id: "usr_annual_1",
        email: "pro@user.com",
        nome: "Pro User",
        plano: "free",
      } as any);

      vi.mocked(criarOuBuscarClienteAsaas).mockResolvedValue({
        id: "cus_annual_123",
      } as any);

      vi.mocked(criarAssinaturaAsaas).mockResolvedValue({
        id: "sub_annual_123",
      } as any);

      vi.mocked(obterPagamentosAssinaturaAsaas).mockResolvedValue([
        { id: "pay_annual_123", invoiceUrl: "https://asaas.com/invoice/pay_annual" } as any,
      ]);

      vi.mocked(obterPixQrCodeAsaas).mockResolvedValue({
        encodedImage: "iVBORw0KGgoAAAANSUhEUg==",
        payload: "00020126580014br.gov.bcb.pix...",
        expirationDate: "2027-12-31",
      });

      const req = new NextRequest("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ciclo: "anual",
        }),
      });

      const res = await checkoutRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.sucesso).toBe(true);
      expect(data.ciclo).toBe("anual");
      expect(data.amount).toBe(397.0);
      expect(data.amountCents).toBe(39700);

      expect(criarAssinaturaAsaas).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: "cus_annual_123",
          cycle: "YEARLY",
          value: 397.0,
          description: expect.stringContaining("Anual"),
        })
      );
    });
  });

  describe("3. Proposal View Tracking (/api/public/propostas/[id])", () => {
    it("should register real-time view and return updated view count when client opens proposal", async () => {
      const mockProposta = {
        id: "prop_view_123",
        usuario_id: "usr_pro_owner",
        numero: "PROP-2026-001",
        cliente_nome: "Cliente Exemplo",
        conteudo_html: "<div>Proposta HTML</div>",
        status: "rascunho",
        visualizacoes_count: 0,
        criado_em: new Date(),
        atualizado_em: new Date(),
      };

      vi.mocked(obterPropostaPorId).mockResolvedValue(mockProposta as any);

      vi.mocked(obterUserPorId).mockResolvedValue({
        id: "usr_pro_owner",
        nome: "Prestador Pro",
        plano: "pro",
        email: "owner@test.com",
      } as any);

      vi.mocked(registrarVisualizacaoProposta).mockResolvedValue({
        ...mockProposta,
        status: "enviada",
        visualizacoes_count: 1,
        visualizada_em: new Date(),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/public/propostas/prop_view_123");
      const res = await publicProposalRoute(req, {
        params: Promise.resolve({ id: "prop_view_123" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.sucesso).toBe(true);
      expect(registrarVisualizacaoProposta).toHaveBeenCalledWith("prop_view_123");
      expect(data.proposta.visualizacoes_count).toBe(1);
      expect(data.proposta.status).toBe("enviada");
    });
  });
});
