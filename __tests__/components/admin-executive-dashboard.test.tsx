import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AdminExecutiveDashboard } from "@/components/Dashboard/AdminExecutiveDashboard";
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

describe("AdminExecutiveDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      token: "fake_admin_token",
      user: {
        id: "admin_1",
        nome: "Admin Master",
        email: "admin@virapropo.com",
        role: "admin",
      },
    });
  });

  it("should render executive dashboard cards with financial and user metrics", async () => {
    const mockMetricas = {
      financeiro: {
        totalHoje: 137.70,
        totalMes: 4590.00,
        totalHistorico: 12000.00,
        mrrEstimado: 4590.00,
        transacoesHojeCount: 3,
        transacoesMesCount: 100,
        ticketMedio: 45.90,
      },
      usuarios: {
        total: 250,
        ativos: 245,
        suspensos: 5,
        pro: 100,
        proAsaas: 90,
        proCortesia: 10,
        free: 150,
        admins: 2,
        novosHoje: 8,
        novosMes: 60,
        taxaConversaoPro: 40.0,
      },
      plataforma: {
        totalPropostas: 850,
        propostasAceitas: 340,
        volumeTotalPipeline: 500000.00,
        volumeTotalFechado: 220000.00,
        taxaConversaoGlobal: 40.0,
      },
      ultimosPagamentos: [
        {
          id: "pay_1",
          usuarioId: "usr_1",
          usuarioNome: "João Silva",
          usuarioEmail: "joao@email.com",
          usuarioPlano: "pro",
          valor: 45.90,
          status: "pago",
          invoiceUrl: "https://asaas.com/i/123",
          pagoEm: new Date().toISOString(),
          criadoEm: new Date().toISOString(),
        },
      ],
      ultimosUsuarios: [
        {
          id: "usr_2",
          nome: "Maria Oliveira",
          email: "maria@empresa.com",
          empresaNome: "Oliveira Tech",
          plano: "free",
          role: "cliente",
          suspenso: false,
          criadoEm: new Date().toISOString(),
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sucesso: true,
        metricas: mockMetricas,
      }),
    } as Response);

    render(<AdminExecutiveDashboard />);

    // Check header
    expect(screen.getByText(/Visão Geral Gerencial/i)).toBeInTheDocument();
    expect(screen.getByText(/Painel Executivo/i)).toBeInTheDocument();

    // Check financial section
    await waitFor(() => {
      expect(screen.getByText(/Faturamento Hoje/i)).toBeInTheDocument();
      expect(screen.getByText(/Faturamento no Mês/i)).toBeInTheDocument();
      expect(screen.getByText(/MRR Estimado/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Histórico/i)).toBeInTheDocument();
    });

    // Check user health section
    expect(screen.getByText(/Usuários Ativos/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Assinantes PRO/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Usuários Free/i)).toBeInTheDocument();
    expect(screen.getByText(/Contas Suspensas/i)).toBeInTheDocument();
    expect(screen.getByText(/Novos Cadastros/i)).toBeInTheDocument();

    // Check platform volume
    expect(screen.getByText(/Propostas Geradas no Sistema/i)).toBeInTheDocument();
    expect(screen.getByText(/Pipeline Global dos Usuários/i)).toBeInTheDocument();
    expect(screen.getByText(/Volume Fechado & Assinado/i)).toBeInTheDocument();

    // Check transactions table
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("joao@email.com")).toBeInTheDocument();

    // Switch tab to Novos Usuários
    const tabUsuarios = screen.getByRole("button", { name: /Novos Usuários/i });
    fireEvent.click(tabUsuarios);

    await waitFor(() => {
      expect(screen.getByText("Maria Oliveira")).toBeInTheDocument();
      expect(screen.getByText("Oliveira Tech")).toBeInTheDocument();
    });
  });
});
