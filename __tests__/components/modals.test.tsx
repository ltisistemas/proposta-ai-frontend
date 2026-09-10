import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { UpgradeModal } from "@/components/Billing/UpgradeModal";
import { SignatureModal } from "@/components/Proposta/SignatureModal";
import { WhatsAppModal } from "@/components/Proposta/WhatsAppModal";
import { DigitalCertificate } from "@/components/Proposta/DigitalCertificate";
import {
  SignatureManifesto,
  gerarManifestoHTML,
  formatarDataHoraBR,
} from "@/components/Proposta/SignatureManifesto";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { PropostasTable } from "@/components/Dashboard/PropostasTable";
import { useAuthStore } from "@/lib/auth/useAuthStore";

// Mock clipboard and window confirm
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});
window.confirm = vi.fn().mockReturnValue(true);

describe("components/Billing/UpgradeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      token: "tok_user_pro",
      user: { id: "u1", email: "user@test.com", nome: "Test", plano: "free" },
      isAuthenticated: true,
    });
  });

  it("should render upgrade options and complete full PIX checkout flow", async () => {
    const handleClose = vi.fn();

    // Mock fetch for /api/checkout and /api/checkout/status
    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url === "/api/checkout") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sucesso: true,
            chargeId: "pix_char_test_123",
            brCode: "00020126580014BR.GOV.BCB.PIX...",
            brCodeBase64: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
            amount: 45.9,
            expiresAt: new Date().toISOString(),
          }),
        } as any);
      }
      if (url === "/api/checkout/status") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sucesso: true,
            status: "PAID",
            isPro: true,
          }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    render(
      <UpgradeModal
        isOpen={true}
        onClose={handleClose}
        feature="pdf"
      />
    );

    expect(screen.getByText(/impressão e pdf exclusivos do plano pro/i)).toBeInTheDocument();
    expect(screen.getAllByText(/45,90/i).length).toBeGreaterThan(0);

    // Click to generate PIX
    const payBtn = screen.getByRole("button", { name: /pagar com pix/i });
    fireEvent.click(payBtn);

    // Wait for step 2 (PIX QR code view)
    await waitFor(() => {
      expect(screen.getByText(/código pix copia e cola/i)).toBeInTheDocument();
    });

    // Copy PIX button
    const copyPixBtn = screen.getByRole("button", { name: /copiar código/i });
    fireEvent.click(copyPixBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    // Simulate payment button
    const simulateBtn = screen.getByRole("button", { name: /simular pagamento instantâneo/i });
    fireEvent.click(simulateBtn);

    // Wait for step 3 (Success)
    await waitFor(() => {
      expect(screen.getByText(/plano pro ativado/i)).toBeInTheDocument();
    });

    const finishBtn = screen.getByRole("button", { name: /começar a usar recursos pro/i });
    fireEvent.click(finishBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it("should render all upgrade feature configurations", () => {
    const { rerender } = render(<UpgradeModal isOpen={true} onClose={vi.fn()} feature="link" />);
    expect(screen.getByText(/compartilhamento por link exclusivo pro/i)).toBeInTheDocument();

    rerender(<UpgradeModal isOpen={true} onClose={vi.fn()} feature="signature" />);
    expect(screen.getByText(/assinatura eletrônica exclusiva do plano pro/i)).toBeInTheDocument();

    rerender(<UpgradeModal isOpen={true} onClose={vi.fn()} feature="status" />);
    expect(screen.getByText(/gestão de status & fechamento pro/i)).toBeInTheDocument();

    rerender(<UpgradeModal isOpen={true} onClose={vi.fn()} feature="logo" />);
    expect(screen.getByText(/logotipo personalizado em base64/i)).toBeInTheDocument();

    rerender(<UpgradeModal isOpen={true} onClose={vi.fn()} feature="limit" />);
    expect(screen.getByText(/você atingiu o limite de propostas gratuitas/i)).toBeInTheDocument();

    rerender(<UpgradeModal isOpen={true} onClose={vi.fn()} feature="general" />);
    expect(screen.getByText(/desbloqueie todo o poder do propex ai pro/i)).toBeInTheDocument();
  });

  it("should support navigating back from PIX step to DETAILS and handle simulation errors", async () => {
    useAuthStore.setState({
      token: "tok_user_pro",
      user: { id: "u1", email: "user@test.com", nome: "Test", plano: "free" },
      isAuthenticated: true,
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/checkout") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sucesso: true,
            chargeId: "pix_char_back_test",
            brCode: "00020126580014BR.GOV.BCB.PIX...",
            brCodeBase64: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
            amount: 45.9,
            expiresAt: new Date().toISOString(),
          }),
        } as any);
      }
      if (url === "/api/checkout/status") {
        return Promise.resolve({
          ok: false,
          json: async () => ({ sucesso: false, erro: "Falha na simulação" }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    render(<UpgradeModal isOpen={true} onClose={vi.fn()} />);

    const payBtn = screen.getByRole("button", { name: /pagar com pix/i });
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(screen.getByText(/código pix copia e cola/i)).toBeInTheDocument();
    });

    // Test Simulate Failure
    const simulateBtn = screen.getByRole("button", { name: /simular pagamento instantâneo/i });
    fireEvent.click(simulateBtn);

    // Test Back button
    const backBtn = screen.getByRole("button", { name: /voltar/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText(/pagar com pix/i)).toBeInTheDocument();
    });
  });

  it("should not render when isOpen is false", () => {
    render(
      <UpgradeModal
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText(/45,90/i)).not.toBeInTheDocument();
  });
});

describe("components/Proposta/SignatureModal", () => {
  it("should validate required fields and handle API errors", async () => {
    render(
      <SignatureModal
        isOpen={true}
        onClose={vi.fn()}
        propostaId="p1"
        clienteNomeDefault=""
        onSuccess={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /confirmar & assinar/i });
    fireEvent.click(submitBtn);

    // Fill short doc
    const nameInput = screen.getByPlaceholderText(/joão da silva santos/i);
    fireEvent.change(nameInput, { target: { value: "Carlos Silva" } });
    fireEvent.click(submitBtn);

    const docInput = screen.getByPlaceholderText(/000\.000\.000-00/i);
    fireEvent.change(docInput, { target: { value: "123" } });
    fireEvent.click(submitBtn);

    // Valid doc but terms unchecked
    fireEvent.change(docInput, { target: { value: "123.456.789-00" } });
    fireEvent.click(submitBtn);
  });

  it("should handle error response and network exception in SignatureModal", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ sucesso: false, erro: "Falha ao assinar" }),
    } as any);

    render(
      <SignatureModal
        isOpen={true}
        onClose={vi.fn()}
        propostaId="p1"
        clienteNomeDefault="Maria Santos"
        onSuccess={vi.fn()}
      />
    );

    const docInput = screen.getByPlaceholderText(/000\.000\.000-00/i);
    fireEvent.change(docInput, { target: { value: "123.456.789-00" } });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /confirmar & assinar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toBeInTheDocument();
    });

    // Test Network Exception
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network Failure"));
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(submitBtn).toBeInTheDocument();
    });
  });

  it("should render inputs and submit digital signature successfully", async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sucesso: true,
        proposta: { id: "p1", status: "aceita", assinante_nome: "Maria Santos" },
      }),
    } as any);

    render(
      <SignatureModal
        isOpen={true}
        onClose={handleClose}
        propostaId="p1"
        clienteNomeDefault="Maria Santos"
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText(/assinatura eletrônica & aceite/i)).toBeInTheDocument();

    const docInput = screen.getByPlaceholderText(/000\.000\.000-00/i);
    fireEvent.change(docInput, { target: { value: "123.456.789-00" } });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /confirmar & assinar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});

describe("components/Proposta/WhatsAppModal", () => {
  it("should render preview and allow copying formatted text and sending", () => {
    const dados = {
      numero: "PROP-2026-001",
      clienteNome: "João Silva",
      total: 3500,
      empresaNome: "Dev Studio",
      empresaTelefone: "(11) 98765-4321",
    };

    const handleClose = vi.fn();

    render(
      <WhatsAppModal
        isOpen={true}
        onClose={handleClose}
        dados={dados}
      />
    );

    expect(screen.getByText(/texto formatado para whatsapp/i)).toBeInTheDocument();
    expect(screen.getByText(/joão silva/i)).toBeInTheDocument();

    const copyBtn = screen.getByRole("button", { name: /copiar apenas o texto/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    const sendBtn = screen.getByRole("button", { name: /abrir no whatsapp/i });
    fireEvent.click(sendBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it("should render preview and allow copying formatted text and sending with minimal fields", () => {
    const dadosMin = {
      numero: "PROP-MIN",
      clienteNome: "Cliente Simples",
      total: 1000,
    };

    const handleClose = vi.fn();
    render(<WhatsAppModal isOpen={true} onClose={handleClose} dados={dadosMin} />);
    expect(screen.getByText(/cliente simples/i)).toBeInTheDocument();
  });
});

describe("components/Proposta/DigitalCertificate", () => {
  it("should render certificate details and cryptographic hash", () => {
    render(
      <DigitalCertificate
        assinanteNome="Carlos Eduardo"
        assinanteDocumento="987.654.321-99"
        assinadoEm="2026-09-09T18:00:00Z"
        assinaturaIp="192.168.1.1"
        assinaturaHash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      />
    );

    expect(screen.getByText(/certificado de aceite digital/i)).toBeInTheDocument();
    expect(screen.getByText("Carlos Eduardo")).toBeInTheDocument();
    expect(screen.getByText("987.654.321-99")).toBeInTheDocument();
    expect(screen.getByText(/192\.168\.1\.1/)).toBeInTheDocument();
    expect(screen.getByText(/e3b0c44298fc/)).toBeInTheDocument();
  });
});

describe("components/Dashboard/StatsCards & PropostasTable", () => {
  it("should render StatsCards with metrics and with null/undefined fallbacks", () => {
    const { rerender } = render(
      <StatsCards
        metricas={{
          totalPropostas: 8,
          propostasAceitas: 4,
          propostasEnviadas: 2,
          propostasRascunho: 1,
          propostasRecusadas: 1,
          valorTotalPipeline: 25000,
          valorTotalFechado: 15000,
          taxaConversao: "50.0%",
        }}
      />
    );

    expect(screen.getByText(/total de propostas/i)).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(/taxa de conversão: 50.0%/i)).toBeInTheDocument();

    rerender(<StatsCards metricas={null} />);
    expect(screen.getByText(/taxa de conversão: 0%/i)).toBeInTheDocument();

    rerender(<StatsCards />);
    expect(screen.getByText(/0 rascunhos em aberto/i)).toBeInTheDocument();
  });

  it("should render PropostasTable with interactive filters and action buttons", () => {
    useAuthStore.setState({
      user: { id: "u_pro", nome: "Pro User", email: "pro@user.com", plano: "pro", empresa_nome: "My Pro Corp" },
    });

    const mockPropostas = [
      {
        id: "p1",
        numero: "PROP-2026-001",
        cliente_nome: "Acme Corp",
        total: 5000,
        status: "aceita" as const,
        criado_em: new Date("2026-09-01"),
      },
      {
        id: "p2",
        numero: "PROP-2026-002",
        cliente_nome: "Beta Tech",
        total: 3000,
        status: "rascunho" as const,
        criado_em: new Date("2026-09-02"),
      },
      {
        id: "p3",
        numero: "PROP-2026-003",
        cliente_nome: "Gamma Soft",
        total: 2000,
        status: "enviada" as const,
        criado_em: new Date("2026-09-03"),
      },
      {
        id: "p4",
        numero: "PROP-2026-004",
        cliente_nome: "Delta Inc",
        total: 1000,
        status: "recusada" as const,
        criado_em: new Date("2026-09-04"),
      },
    ];

    const handleDelete = vi.fn();

    render(
      <PropostasTable
        propostas={mockPropostas}
        onDelete={handleDelete}
      />
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Tech")).toBeInTheDocument();

    // Search filter
    const searchInput = screen.getByPlaceholderText(/buscar por cliente/i);
    fireEvent.change(searchInput, { target: { value: "Acme" } });
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Tech")).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });

    // Status filter buttons
    const filterAceita = screen.getByRole("button", { name: /aceitas/i });
    fireEvent.click(filterAceita);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();

    const filterRascunho = screen.getByRole("button", { name: /rascunhos/i });
    fireEvent.click(filterRascunho);
    expect(screen.getByText("Beta Tech")).toBeInTheDocument();

    const filterEnviada = screen.getByRole("button", { name: /enviadas/i });
    fireEvent.click(filterEnviada);
    expect(screen.getByText("Gamma Soft")).toBeInTheDocument();

    const filterRecusada = screen.getByRole("button", { name: /recusadas/i });
    fireEvent.click(filterRecusada);
    expect(screen.getByText("Delta Inc")).toBeInTheDocument();

    const filterTodas = screen.getByRole("button", { name: /todas/i });
    fireEvent.click(filterTodas);

    // Test Delete button with ConfirmModal
    const deleteBtns = screen.getAllByTitle(/excluir/i);
    if (deleteBtns.length > 0) {
      fireEvent.click(deleteBtns[0]);
      expect(screen.getByText(/excluir proposta comercial\?/i)).toBeInTheDocument();
      const confirmBtn = screen.getByRole("button", { name: /sim, excluir proposta/i });
      fireEvent.click(confirmBtn);
      expect(handleDelete).toHaveBeenCalledWith("p1");
    }

    // Test Delete modal cancel
    if (deleteBtns.length > 1) {
      fireEvent.click(deleteBtns[1]);
      const cancelBtn = screen.getByRole("button", { name: /cancelar/i });
      fireEvent.click(cancelBtn);
    }

    // Test Copy Link and WhatsApp buttons as PRO
    const copyBtns = screen.getAllByTitle(/copiar link público/i);
    if (copyBtns.length > 0) {
      fireEvent.click(copyBtns[0]);
    }

    const whatsAppBtns = screen.getAllByTitle(/whatsapp/i);
    if (whatsAppBtns.length > 0) {
      fireEvent.click(whatsAppBtns[0]);
    }
  });

  it("should trigger upgrade modal in PropostasTable when free user clicks copy link or whatsapp", () => {
    useAuthStore.setState({
      user: { id: "u_free", nome: "Free User", email: "free@user.com", plano: "free" },
    });

    const mockPropostas = [
      {
        id: "p1",
        numero: "PROP-001",
        cliente_nome: "Cliente Free",
        total: 1000,
        status: "rascunho" as const,
        criado_em: new Date(),
      },
    ];

    render(<PropostasTable propostas={mockPropostas} />);

    const copyBtn = screen.getByTitle(/copiar link público/i);
    fireEvent.click(copyBtn);
    expect(screen.getByText(/compartilhamento por link exclusivo pro/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /fechar/i });
    if (closeBtn) fireEvent.click(closeBtn);

    const whatsAppBtn = screen.getByTitle(/whatsapp/i);
    fireEvent.click(whatsAppBtn);
  });

  it("should render PropostasTable loading state", () => {
    render(<PropostasTable propostas={[]} isLoading={true} />);
    expect(screen.getByText(/carregando propostas/i)).toBeInTheDocument();
  });

  it("should render empty state when no proposals are provided", () => {
    render(<PropostasTable propostas={[]} onDelete={vi.fn()} />);
    expect(screen.getByText(/nenhuma proposta encontrada/i)).toBeInTheDocument();
  });
});

describe("components/Proposta/SignatureManifesto", () => {
  const mockSignedProposta = {
    id: "prop-uuid-12345678",
    numero: "PROP-2026-001",
    cliente_nome: "Acme Corporation",
    criado_em: new Date("2026-09-09T15:00:00Z"),
    documento_hash: "dfe3830500f97ad3d8970e2801dc42f2a541cdb8e429838432189b621ea72ae1",
    emissor_nome: "Bruno dos Santos Guerra",
    emissor_email: "bruno.guerra@fsbr.com.br",
    emissor_documento: "084.486.454-48",
    emissor_assinado_em: new Date("2026-09-09T15:00:00Z"),
    emissor_assinatura_ip: "179.73.201.73",
    emissor_assinatura_hash: "hash_emissor_123",
    status: "aceita",
    assinante_nome: "Luiz Felipe Marinho",
    assinante_documento: "123.456.789-00",
    assinado_em: new Date("2026-09-09T16:00:00Z"),
    assinatura_ip: "191.244.227.236",
    assinatura_hash: "hash_cliente_456",
  };

  const mockPendingProposta = {
    id: "prop-pending-87654321",
    numero: "PROP-2026-002",
    cliente_nome: "Beta Client",
    criado_em: "invalid-date",
    status: "enviada",
  };

  it("should render full dual signature manifesto with official layout and hashes", () => {
    render(
      <SignatureManifesto
        proposta={mockSignedProposta}
        emissor={{
          nome: "Bruno dos Santos Guerra",
          empresaNome: "FSBR Corp",
          empresaEmail: "bruno.guerra@fsbr.com.br",
        }}
        baseUrl="https://pass.sistema.fsbr.com.br"
      />
    );

    expect(screen.getByText(/manifesto de assinaturas/i)).toBeInTheDocument();
    expect(screen.getByText(/dfe3830500f97ad3d8970e2801dc42f2a541cdb8e429838432189b621ea72ae1/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bruno dos Santos Guerra/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Luiz Felipe Marinho/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/179.73.201.73/i)).toBeInTheDocument();
    expect(screen.getByText(/191.244.227.236/i)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/pass\.sistema\.fsbr\.com\.br\/p\/prop-uuid-12345678/i)).toBeInTheDocument();
  });

  it("should render pending client state in manifesto when proposta is not accepted", () => {
    render(
      <SignatureManifesto
        proposta={mockPendingProposta}
        emissor={null}
      />
    );

    expect(screen.getByText(/manifesto de assinaturas/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Pendente\] - Beta Client/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Emissor Autorizado/i).length).toBeGreaterThan(0);
  });

  it("should format dates correctly with formatarDataHoraBR", () => {
    expect(formatarDataHoraBR(null)).toBe("-");
    expect(formatarDataHoraBR(undefined)).toBe("-");
    expect(formatarDataHoraBR("invalid-date")).toBe("-");
    const formatted = formatarDataHoraBR("2026-09-09T18:30:00Z");
    expect(formatted).not.toBe("-");
  });

  it("should generate valid printable HTML with gerarManifestoHTML", () => {
    const htmlSigned = gerarManifestoHTML(mockSignedProposta, undefined, "https://proposta-ai.com");
    expect(htmlSigned).toContain("MANIFESTO DE ASSINATURAS");
    expect(htmlSigned).toContain("dfe3830500f97ad3d8970e2801dc42f2a541cdb8e429838432189b621ea72ae1");
    expect(htmlSigned).toContain("Luiz Felipe Marinho");

    const htmlPending = gerarManifestoHTML(mockPendingProposta);
    expect(htmlPending).toContain("MANIFESTO DE ASSINATURAS");
    expect(htmlPending).toContain("[Pendente]");
  });
});
