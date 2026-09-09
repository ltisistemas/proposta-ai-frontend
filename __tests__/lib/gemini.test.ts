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
  gerarTemplatePro,
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
    observacoes: "Garantia de 90 dias",
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

  it("should generate clean monochrome HTML template for Free tier with and without observations", () => {
    const htmlWithObs = gerarTemplateFree(sampleData);
    expect(htmlWithObs).toContain("Garantia de 90 dias");

    const htmlMinimal = gerarTemplateFree({
      empresaNome: "",
      clienteNome: "Cliente Simples",
      descricao: "Serviço",
      itens: [{ descricao: "Item 1", quantidade: 1, valorUnitario: 100 }],
    });
    expect(htmlMinimal).toContain("Cliente Simples");
  });

  it("should generate executive Pro HTML template with logo and full details and minimal options", () => {
    const proFull = gerarTemplatePro({
      ...sampleData,
      empresaLogoUrl: "data:image/svg+xml;base64,123",
      itens: [
        { descricao: "Item 1", quantidade: 1, valorUnitario: 500 },
        { descricao: "Item 2", quantidade: 2, valorUnitario: 250 },
        { descricao: "Item 3", quantidade: 1, valorUnitario: 100 },
      ],
    });
    expect(proFull).toContain("Proposta Comercial Consultiva");
    expect(proFull).toContain("data:image/svg+xml;base64,123");

    const proMinimal = gerarTemplatePro({
      empresaNome: "Empresa Min",
      clienteNome: "Cliente Min",
      descricao: "Desc Min",
      itens: [{ descricao: "Item A", quantidade: 1, valorUnitario: 100 }],
    });
    expect(proMinimal).toContain("Cliente Min");
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

  it("should generate proposal with Gemini AI for Free tier with custom model env", async () => {
    process.env.GEMINI_MODEL = "gemini-custom-flash";
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          "<!DOCTYPE html><html><body><div class='notepad-container'>Proposta Free</div></body></html>",
      },
    });

    const result = await gerarPropostacComIA(sampleData);
    expect(result).toContain("Proposta Free");
    delete process.env.GEMINI_MODEL;
  });

  it("should accept partial htmlContent when length > 500 without full html tags", async () => {
    const longHtml = "<div>" + "A".repeat(600) + "</div>";
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => longHtml,
      },
    });

    const result = await gerarPropostacComIA(sampleData);
    expect(result.length).toBeGreaterThan(500);
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
