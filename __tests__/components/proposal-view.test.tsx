import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import VisualizarPropostaPage from "@/app/(dashboard)/propostas/[id]/page";
import { useAuthStore } from "@/lib/auth/useAuthStore";

// Mock useRouter and useParams
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("VisualizarPropostaPage AI Regeneration", () => {
  const mockProposta = {
    id: "prop-test-123",
    numero: "PROP-2026-001",
    usuario_id: "u1",
    cliente_nome: "Cliente Estratégico",
    cliente_empresa: "Empresa XPTO",
    status: "rascunho",
    criado_em: "2026-09-09T12:00:00Z",
    conteudo_html: "<html><body><h1>Proposta Original</h1></body></html>",
    regeneracoes_ia: 1,
    regeneracoes_restantes: 2,
    total: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      token: "valid-jwt-token",
      user: { id: "u1", email: "user@test.com", nome: "Consultor Top", plano: "pro" },
      isAuthenticated: true,
    });
  });

  it("should render proposal details and Regerar com IA button with remaining quota", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/propostas/prop-test-123")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sucesso: true,
            proposta: mockProposta,
          }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    render(<VisualizarPropostaPage params={{ id: "prop-test-123" } as any} />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Estratégico")).toBeInTheDocument();
    });

    // Check button exists with remaining counter
    const regerarBtn = screen.getByRole("button", { name: /regerar com ia/i });
    expect(regerarBtn).toBeInTheDocument();
    expect(regerarBtn).not.toBeDisabled();
    expect(screen.getByText(/2 restantes/i)).toBeInTheDocument();

    // Click button to open ConfirmModal
    fireEvent.click(regerarBtn);
    await waitFor(() => {
      expect(screen.getByText(/reescrever proposta com ia consultiva\?/i)).toBeInTheDocument();
      expect(screen.getByText(/restam 2 de 3 tentativas para esta proposta/i)).toBeInTheDocument();
    });
  });

  it("should disable Regerar com IA button when quota is exhausted (0 remaining)", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/propostas/prop-exhausted")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sucesso: true,
            proposta: {
              ...mockProposta,
              id: "prop-exhausted",
              regeneracoes_ia: 3,
              regeneracoes_restantes: 0,
            },
          }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    render(<VisualizarPropostaPage params={{ id: "prop-exhausted" } as any} />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Estratégico")).toBeInTheDocument();
    });

    const regerarBtn = screen.getByRole("button", { name: /regerar com ia/i });
    expect(regerarBtn).toBeDisabled();
    expect(screen.getByText(/0 restantes/i)).toBeInTheDocument();
  });

  it("should disable Regerar com IA button when proposal is accepted or signed", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/propostas/prop-accepted")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sucesso: true,
            proposta: {
              ...mockProposta,
              id: "prop-accepted",
              status: "aceita",
              regeneracoes_ia: 1,
              regeneracoes_restantes: 2,
            },
          }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    render(<VisualizarPropostaPage params={{ id: "prop-accepted" } as any} />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Estratégico")).toBeInTheDocument();
    });

    const regerarBtn = screen.getByRole("button", { name: /regerar com ia/i });
    expect(regerarBtn).toBeDisabled();
  });

  it("should execute AI regeneration on modal confirm and update proposal", async () => {
    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url.includes("regerar-ia")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              sucesso: true,
              proposta: {
                ...mockProposta,
                regeneracoes_ia: 2,
                regeneracoes_restantes: 1,
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            sucesso: true,
            proposta: mockProposta,
          }),
      });
    });

    render(<VisualizarPropostaPage params={{ id: "prop-test-123" } as any} />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Estratégico")).toBeInTheDocument();
    });

    const regerarBtn = screen.getByRole("button", { name: /regerar com ia/i });
    fireEvent.click(regerarBtn);

    await waitFor(() => {
      expect(screen.getByText(/reescrever proposta com ia consultiva\?/i)).toBeInTheDocument();
    });

    const confirmBtns = screen.getAllByRole("button", { name: /sim, regerar proposta/i });
    expect(confirmBtns.length).toBe(1);
    fireEvent.click(confirmBtns[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/propostas/prop-test-123/regerar-ia",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
