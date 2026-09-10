import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CookieConsentBanner } from "@/components/Common/CookieConsentBanner";
import TermosDeUsoPage from "@/app/termos/page";
import PoliticaDePrivacidadePage from "@/app/privacidade/page";
import SignupPage from "@/app/(auth)/signup/page";
import { Logo } from "@/components/Common/Logo";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/dashboard",
}));

describe("Legal Pages & Compliance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("Logo component", () => {
    it("should render Propex AI brand name and subtitle", () => {
      render(<Logo size="md" variant="light" showSubtitle={true} />);
      expect(screen.getByText("Propex")).toBeInTheDocument();
      expect(screen.getByText("AI")).toBeInTheDocument();
      expect(screen.getByText(/Sua IA geradora de propostas/i)).toBeInTheDocument();
    });
  });

  describe("Termos de Uso (/termos)", () => {
    it("should render Termos de Uso page with all key sections", () => {
      render(<TermosDeUsoPage />);
      expect(screen.getByText(/Termos de Uso do Propex AI/i)).toBeInTheDocument();
      expect(screen.getByText(/Objeto e Descrição dos Serviços/i)).toBeInTheDocument();
      expect(screen.getByText(/Assinaturas, Cobrança e Cancelamento/i)).toBeInTheDocument();
      expect(screen.getByText(/Uso de Inteligência Artificial e Responsabilidade/i)).toBeInTheDocument();
      expect(screen.getByText(/Assinatura Eletrônica e Validade Jurídica/i)).toBeInTheDocument();
    });
  });

  describe("Política de Privacidade (/privacidade)", () => {
    it("should render Política de Privacidade LGPD page with all compliance sections", () => {
      render(<PoliticaDePrivacidadePage />);
      expect(screen.getByText(/Política de Privacidade & Proteção de Dados/i)).toBeInTheDocument();
      expect(screen.getByText(/Conformidade LGPD/i)).toBeInTheDocument();
      expect(screen.getByText(/Controlador e Encarregado de Proteção de Dados/i)).toBeInTheDocument();
      expect(screen.getByText(/Seus Direitos como Titular de Dados/i)).toBeInTheDocument();
      expect(screen.getByText(/Garantia de Não-Treinamento/i)).toBeInTheDocument();
    });
  });

  describe("CookieConsentBanner", () => {
    it("should render banner after delay when no consent in localStorage", () => {
      vi.useFakeTimers();
      render(<CookieConsentBanner />);

      expect(screen.queryByText(/Privacidade & Cookies \(LGPD\)/i)).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/Privacidade & Cookies \(LGPD\)/i)).toBeInTheDocument();
      vi.useRealTimers();
    });

    it("should store full consent when clicking Aceitar Todos", () => {
      vi.useFakeTimers();
      render(<CookieConsentBanner />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const acceptBtn = screen.getByRole("button", { name: /aceitar todos/i });
      fireEvent.click(acceptBtn);

      const saved = JSON.parse(localStorage.getItem("propex_cookie_consent") || "{}");
      expect(saved.essential).toBe(true);
      expect(saved.analytics).toBe(true);
      expect(saved.marketing).toBe(true);
      expect(saved.consentedAt).toBeDefined();
      vi.useRealTimers();
    });

    it("should store essential only when clicking Apenas Essenciais", () => {
      vi.useFakeTimers();
      render(<CookieConsentBanner />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const rejectBtn = screen.getByRole("button", { name: /apenas essenciais/i });
      fireEvent.click(rejectBtn);

      const saved = JSON.parse(localStorage.getItem("propex_cookie_consent") || "{}");
      expect(saved.essential).toBe(true);
      expect(saved.analytics).toBe(false);
      expect(saved.marketing).toBe(false);
      vi.useRealTimers();
    });

    it("should allow customizing preferences and saving custom consent", () => {
      vi.useFakeTimers();
      render(<CookieConsentBanner />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const prefBtn = screen.getByRole("button", { name: /gerenciar preferências/i });
      fireEvent.click(prefBtn);

      expect(screen.getByText(/Cookies de Desempenho & Analytics/i)).toBeInTheDocument();

      const checkboxes = screen.getAllByRole("checkbox");
      // Uncheck analytics
      fireEvent.click(checkboxes[0]);

      const saveBtn = screen.getByRole("button", { name: /salvar preferências/i });
      fireEvent.click(saveBtn);

      const saved = JSON.parse(localStorage.getItem("propex_cookie_consent") || "{}");
      expect(saved.essential).toBe(true);
      expect(saved.analytics).toBe(false);
      vi.useRealTimers();
    });

    it("should not render banner if consent already exists in localStorage", () => {
      localStorage.setItem(
        "propex_cookie_consent",
        JSON.stringify({ essential: true, analytics: true, marketing: true, consentedAt: "2026-09-10" })
      );

      vi.useFakeTimers();
      render(<CookieConsentBanner />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByText(/Privacidade & Cookies \(LGPD\)/i)).not.toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe("SignupPage LGPD Agreement", () => {
    it("should block registration submission when LGPD agreement is unchecked", async () => {
      render(<SignupPage />);

      fireEvent.change(screen.getByPlaceholderText(/Ex: João da Silva/i), {
        target: { value: "Test User" },
      });
      fireEvent.change(screen.getByPlaceholderText(/seu.email@empresa.com/i), {
        target: { value: "test@propex.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/Mínimo 6 caracteres/i), {
        target: { value: "senha123" },
      });

      const submitBtn = screen.getByRole("button", { name: /criar conta e acessar/i });
      fireEvent.submit(submitBtn.closest("form")!);

      expect(
        await screen.findByText(/Você precisa aceitar os Termos de Uso e a Política de Privacidade/i)
      ).toBeInTheDocument();
    });
  });
});
