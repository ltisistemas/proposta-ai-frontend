import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @google/generative-ai with class constructor
const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: mockGenerateContent,
        };
      }
    },
  };
});

import {
  gerarTemplateFree,
  gerarPropostacComIA,
  gerarTemplateFallback,
  getGenAIClient,
  DadosGeracaoProposta,
} from "@/lib/gemini/client";

describe("lib/gemini/client", () => {
  const sampleData: DadosGeracaoProposta = {
    empresaNome: "Empresa Teste",
    empresaCNPJ: "12.345.678/0001-90",
    empresaEmail: "contato@empresa.com",
    empresaTelefone: "(11) 99999-9999",
    clienteNome: "Cliente VIP",
    clienteEmpresa: "Empresa Cliente",
    clienteEmail: "cliente@vip.com",
    descricao: "Consultoria e desenvolvimento de software",
    itens: [
      { descricao: "Desenvolvimento Front-end", quantidade: 1, valorUnitario: 3500 },
      { descricao: "Infraestrutura Cloud", quantidade: 2, valorUnitario: 750 },
    ],
    prazoPagamento: "50% entrada + 50% entrega",
    validade: 15,
    plano: "free",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize GoogleGenerativeAI client when key exists", () => {
    process.env.GEMINI_API_KEY = "test_key_gemini";
    const client = getGenAIClient();
    expect(client).toBeDefined();
  });

  it("should throw error if GEMINI_API_KEY is missing", () => {
    const original = process.env.GEMINI_API_KEY;
    const originalPublic = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    expect(() => getGenAIClient()).toThrow("GEMINI_API_KEY não está configurada");

    process.env.GEMINI_API_KEY = original;
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = originalPublic;
  });

  it("should generate clean monochrome HTML template for Free tier", () => {
    const html = gerarTemplateFree(sampleData);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Empresa Teste");
    expect(html).toContain("Cliente VIP");
    expect(html).toContain("Desenvolvimento Front-end");
    expect(html).toContain("R$");
    expect(html).toContain("5.000,00"); // 3500 + 1500
    expect(html).toContain("notepad-container");
  });

  it("should generate fallback template for pro and free", () => {
    const freeHtml = gerarTemplateFallback(sampleData);
    expect(freeHtml).toContain("notepad-container");

    const proHtml = gerarTemplateFallback({ ...sampleData, plano: "pro" });
    expect(proHtml).toContain("Proposta Comercial");
  });

  it("should generate proposal with Gemini AI for Pro tier", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          "```html\n<!DOCTYPE html><html><body><h1>Proposta Profissional</h1></body></html>\n```",
      },
    });

    const proData: DadosGeracaoProposta = {
      ...sampleData,
      plano: "pro",
      empresaLogoUrl: "data:image/png;base64,samplelogo",
    };

    const result = await gerarPropostacComIA(proData);
    expect(result).toBeDefined();
    expect(result).toContain("<h1>Proposta Profissional</h1>");
  });

  it("should fallback gracefully if Gemini API throws an error", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Gemini Quota Exceeded"));

    const proData: DadosGeracaoProposta = {
      ...sampleData,
      plano: "pro",
    };

    const result = await gerarPropostacComIA(proData);
    expect(result).toBeDefined();
    expect(result).toContain("Empresa Teste");
  });
});
