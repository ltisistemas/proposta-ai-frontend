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
  renderizarMarkupLogo,
  injetarOuAtualizarLogoHtml,
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

  it("should generate executive Pro HTML template with logo and full details, omitting the strategic tarja when logo is present", () => {
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
    // Badge/tarja should NOT be displayed when logo is present
    expect(proFull).not.toContain("data-badge-estrategica");
    expect(proFull).not.toContain("Proposta Comercial & Plano Estratégico");

    const proWithoutLogo = gerarTemplatePro({
      empresaNome: "Empresa Min",
      clienteNome: "Cliente Min",
      descricao: "Desc Min",
      itens: [{ descricao: "Item A", quantidade: 1, valorUnitario: 100 }],
    });
    expect(proWithoutLogo).toContain("Cliente Min");
    // Badge/tarja SHOULD be displayed when logo is NOT present
    expect(proWithoutLogo).toContain("data-badge-estrategica");
    expect(proWithoutLogo).toContain("Proposta Comercial & Plano Estratégico");
  });

  it("should generate fallback template for pro and free with consultative methodology structure", () => {
    const freeHtml = gerarTemplateFallback(sampleData);
    expect(freeHtml).toContain("notepad-container");

    const proHtml = gerarTemplateFallback({ ...sampleData, plano: "pro" });
    expect(proHtml).toContain("Proposta Comercial");
    expect(proHtml).toContain("Diagnóstico do Cenário Atual & Oportunidade");
    expect(proHtml).toContain("Metodologia Executiva de Entrega");
    expect(proHtml).toContain("Fase 01: Planejamento, Diagnóstico & Alinhamento");
  });

  it("should generate proposal with Gemini AI for Pro tier using structured JSON synthesis", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            diagnosticoHtml: "<p>Diagnóstico de Alto Impacto para Cliente VIP</p>",
            fases: [
              { titulo: "Fase 01: Diagnóstico Especializado", descricao: "Mapeamento completo de requisitos" },
              { titulo: "Fase 02: Construção Técnica", descricao: "Desenvolvimento robusto" },
              { titulo: "Fase 03: Validação & Entrega", descricao: "Homologação assistida" },
            ],
            garantiasHtml: "<p>Garantia de 90 dias com suporte prioritário.</p>",
          }),
      },
    });

    const proData: DadosGeracaoProposta = {
      ...sampleData,
      plano: "pro",
      empresaLogoUrl: "data:image/png;base64,samplelogo",
    };

    const result = await gerarPropostacComIA(proData);
    expect(result).toBeDefined();
    expect(result).toContain("Diagnóstico de Alto Impacto para Cliente VIP");
    expect(result).toContain("Fase 01: Diagnóstico Especializado");
    expect(result).toContain("Fase 02: Construção Técnica");
  });

  it("should generate proposal with Gemini AI for Pro tier with legacy HTML response", async () => {
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

  describe("injetarOuAtualizarLogoHtml & renderizarMarkupLogo", () => {
    const sampleLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const newLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9Qz8DAwMTAwAAACkQBAJq5aZwAAAAASUVORK5CYII=";

    it("should return unchanged when input HTML is empty", () => {
      expect(injetarOuAtualizarLogoHtml("", sampleLogo)).toBe("");
    });

    it("should remove logo when logoUrl is empty or null", () => {
      const htmlWithLogo = `<div><div data-empresa-logo="true"><img src="${sampleLogo}" /></div><h1>Title</h1></div>`;
      const cleaned = injetarOuAtualizarLogoHtml(htmlWithLogo, null);
      expect(cleaned).not.toContain("data-empresa-logo");
      expect(cleaned).toContain("<h1>Title</h1>");
    });

    it("should replace existing data-empresa-logo container with new logo", () => {
      const htmlWithLogo = `<div class="header-content"><div data-empresa-logo="true"><img src="${sampleLogo}" /></div><h1>Empresa</h1></div>`;
      const updated = injetarOuAtualizarLogoHtml(htmlWithLogo, newLogo, "Nova Marca");
      expect(updated).toContain(newLogo);
      expect(updated).not.toContain(sampleLogo);
      expect(updated).toContain('alt="Nova Marca"');
    });

    it("should replace legacy img logo container", () => {
      const legacyHtml = `<div><div style="margin-bottom: 14px;"><img src="${sampleLogo}" alt="Old"></div><h1>Empresa</h1></div>`;
      const updated = injetarOuAtualizarLogoHtml(legacyHtml, newLogo, "Atualizada");
      expect(updated).toContain(newLogo);
      expect(updated).toContain('data-empresa-logo="true"');
    });

    it("should insert logo inside header-content / flex-responsive wrapper", () => {
      const htmlWithoutLogo = `<html><body><div class="header-content"><div class="flex-responsive"><div><h1>Empresa Pro</h1></div></div></div></body></html>`;
      const result = injetarOuAtualizarLogoHtml(htmlWithoutLogo, sampleLogo, "Empresa Pro");
      expect(result).toContain('data-empresa-logo="true"');
      expect(result.indexOf('data-empresa-logo="true"')).toBeLessThan(result.indexOf("<h1>Empresa Pro</h1>"));
    });

    it("should insert logo before <h1> when no header-content class is present", () => {
      const simpleHtml = `<html><body><h1>Empresa Comercial</h1><p>Proposta</p></body></html>`;
      const result = injetarOuAtualizarLogoHtml(simpleHtml, sampleLogo);
      expect(result).toContain('data-empresa-logo="true"');
      expect(result.indexOf('data-empresa-logo="true"')).toBeLessThan(result.indexOf("<h1>Empresa Comercial</h1>"));
    });

    it("should insert logo after <body> when no <h1> is present", () => {
      const noH1Html = `<html><body><div><p>Documento sem H1</p></div></body></html>`;
      const result = injetarOuAtualizarLogoHtml(noH1Html, sampleLogo);
      expect(result).toContain('data-empresa-logo="true"');
      expect(result.indexOf('data-empresa-logo="true"')).toBeGreaterThan(result.indexOf("<body>"));
    });

    it("should fallback to prepending when no body or h1 tags are found", () => {
      const snippet = `<section><p>Snippet apenas</p></section>`;
      const result = injetarOuAtualizarLogoHtml(snippet, sampleLogo);
      expect(result.startsWith('<div data-empresa-logo="true"')).toBe(true);
    });

    it("should strip strategic proposal badge when injecting logo into html containing the badge", () => {
      const htmlWithBadge = `<html><body><div class="header-content"><div class="flex-responsive"><div><span data-badge-estrategica="true" style="background: rgba(37, 99, 235, 0.3);">Proposta Comercial & Plano Estratégico</span><h1>Empresa Pro</h1></div></div></div></body></html>`;
      const result = injetarOuAtualizarLogoHtml(htmlWithBadge, sampleLogo, "Empresa Pro");
      expect(result).toContain('data-empresa-logo="true"');
      expect(result).not.toContain("data-badge-estrategica");
      expect(result).not.toContain("Proposta Comercial & Plano Estratégico");
    });

    it("should generate valid markup in renderizarMarkupLogo", () => {
      const markup = renderizarMarkupLogo(sampleLogo, "Minha Empresa");
      expect(markup).toContain('data-empresa-logo="true"');
      expect(markup).toContain(sampleLogo);
      expect(markup).toContain('alt="Minha Empresa"');
    });
  });
});
