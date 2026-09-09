import { describe, it, expect, vi } from "vitest";
import {
  gerarTextoWhatsApp,
  abrirWhatsAppWeb,
  DadosWhatsApp,
} from "@/lib/utils/whatsapp";

describe("lib/utils/whatsapp", () => {
  it("should generate structured executive WhatsApp message", () => {
    const dados: DadosWhatsApp = {
      numero: "PROP-2026-1001",
      clienteNome: "Dr. Roberto Silva",
      clienteEmpresa: "Hospital Central",
      empresaNome: "Proposta AI Tech",
      descricao: "Prestação de serviços de consultoria e IA",
      total: 8500,
      prazoPagamento: "30 dias",
      validadeDias: 15,
      itens: [
        { descricao: "Mapeamento de Processos", quantidade: 1, valorUnitario: 3500 },
        { descricao: "Implementação de Agentes", quantidade: 2, valorUnitario: 2500 },
      ],
      publicUrl: "https://proposta-ai.com/p/prop_123",
    };

    const texto = gerarTextoWhatsApp(dados);

    expect(texto).toContain("PROPOSTA COMERCIAL");
    expect(texto).toContain("Proposta AI Tech");
    expect(texto).toContain("Dr. Roberto Silva (Hospital Central)");
    expect(texto).toContain("PROP-2026-1001");
    expect(texto).toContain("Mapeamento de Processos");
    expect(texto).toContain("Implementação de Agentes");
    expect(texto).toContain("8.500,00");
    expect(texto).toContain("https://proposta-ai.com/p/prop_123");
  });

  it("should handle minimal data without optional fields", () => {
    const dados: DadosWhatsApp = {
      numero: "PROP-2026-1002",
      clienteNome: "Ana Paula",
      total: 1200,
    };

    const texto = gerarTextoWhatsApp(dados);
    expect(texto).toContain("Ana Paula");
    expect(texto).toContain("PROP-2026-1002");
    expect(texto).toContain("1.200,00");
  });

  it("should open WhatsApp Web with formatted url and phone number", () => {
    const originalOpen = window.open;
    window.open = vi.fn();

    abrirWhatsAppWeb("Olá mundo", "(11) 98765-4321");
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://api.whatsapp.com/send?phone=5511987654321&text=Ol"),
      "_blank"
    );

    abrirWhatsAppWeb("Olá mundo", "");
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://api.whatsapp.com/send?text=Ol"),
      "_blank"
    );

    window.open = originalOpen;
  });
});
