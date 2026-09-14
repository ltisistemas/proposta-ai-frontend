import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import { useAuthStore } from "@/lib/auth/useAuthStore";

// Mock auth store
vi.mock("@/lib/auth/useAuthStore", () => ({
  useAuthStore: vi.fn(),
}));

// Mock toast
vi.mock("@/components/Common/Toast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe("DashboardPage Role Switcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render AdminExecutiveDashboard when user role is admin", async () => {
    (useAuthStore as any).mockReturnValue({
      token: "admin_token_123",
      user: {
        id: "admin_1",
        nome: "Admin Master",
        role: "admin",
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sucesso: true,
        metricas: {
          financeiro: { totalHoje: 0, totalMes: 0, totalHistorico: 0, mrrEstimado: 0 },
          usuarios: { total: 10, ativos: 10, suspensos: 0, pro: 5, free: 5, admins: 1, novosHoje: 0, novosMes: 0 },
          plataforma: { totalPropostas: 0, propostasAceitas: 0, volumeTotalPipeline: 0, volumeTotalFechado: 0, taxaConversaoGlobal: 0 },
          ultimosPagamentos: [],
          ultimosUsuarios: [],
        },
      }),
    } as Response);

    render(<DashboardPage />);

    expect(screen.getByText(/Cockpit Gerencial/i)).toBeInTheDocument();
    expect(screen.getByText(/Ao Vivo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Minhas Propostas/i)).not.toBeInTheDocument();
  });

  it("should render proposal dashboard when user role is cliente", async () => {
    (useAuthStore as any).mockReturnValue({
      token: "cliente_token_123",
      user: {
        id: "cliente_1",
        nome: "Empreendedor Silva",
        role: "cliente",
      },
    });

    global.fetch = vi.fn().mockImplementation(async (url) => {
      if (String(url).includes("/api/dashboard/stats")) {
        return {
          ok: true,
          json: async () => ({
            sucesso: true,
            metricas: {
              totalPropostas: 3,
              propostasAceitas: 1,
              propostasEnviadas: 1,
              propostasRascunho: 1,
              propostasRecusadas: 0,
              valorTotalPipeline: 15000,
              valorTotalFechado: 5000,
              taxaConversao: "33.3%",
            },
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          sucesso: true,
          propostas: [],
        }),
      };
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Olá, Empreendedor 👋/i)).toBeInTheDocument();
      expect(screen.getByText(/Propostas Recentes/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Criar Proposta com IA/i })).toBeInTheDocument();
      expect(screen.queryByText(/Painel Executivo/i)).not.toBeInTheDocument();
    });
  });
});
