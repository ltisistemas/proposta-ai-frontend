import { GoogleGenerativeAI } from "@google/generative-ai";
import { ajustarHtmlResponsivoProposta } from "../utils/proposal-html";

export interface DadosGeracaoProposta {
  empresaNome: string;
  empresaCNPJ?: string;
  empresaEmail?: string;
  empresaTelefone?: string;
  empresaLogoUrl?: string;
  clienteNome: string;
  clienteEmpresa?: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  descricao: string;
  itens: Array<{
    descricao: string;
    quantidade: number;
    valorUnitario: number;
  }>;
  prazoPagamento?: string;
  validade?: string | number;
  observacoes?: string;
  template?: string;
  plano?: "free" | "pro";
}

export function getGenAIClient() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    "";
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não está configurada");
  }

  return new GoogleGenerativeAI(apiKey);
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function renderizarMarkupLogo(logoUrl: string, empresaNome?: string): string {
  return `<div data-empresa-logo="true" style="display: inline-flex; align-items: center; justify-content: center; background: #ffffff; padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(226, 232, 240, 0.9); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05); margin-bottom: 16px; max-width: 220px; box-sizing: border-box;"><img src="${logoUrl}" alt="${empresaNome || "Logo"}" style="max-height: 52px; max-width: 190px; width: auto; height: auto; object-fit: contain; display: block;" /></div>`;
}

export function injetarOuAtualizarLogoHtml(
  conteudoHtml: string,
  logoUrl?: string | null,
  empresaNome?: string
): string {
  if (!conteudoHtml) return conteudoHtml;

  // Regex to detect existing data-empresa-logo container
  const logoDivRegex = /<div\s+data-empresa-logo="true"[^>]*>[\s\S]*?<\/div>/i;

  // If logoUrl is empty, null, or undefined, remove any existing logo markup
  if (!logoUrl) {
    return conteudoHtml.replace(logoDivRegex, "");
  }

  // When logo is present, remove the strategic proposal tarja / badge if found
  const badgeRegex = /<span\s+(?:data-badge-estrategica="true"[^>]*|style="[^"]*(?:background:\s*rgba\(37,\s*99,\s*235|#93c5fd)[^"]*")[^>]*>[\s\S]*?<\/span>\s*/gi;
  const textBadgeRegex = /<span[^>]*>(?:\s*Proposta\s+Comercial\s+&\s+Plano\s+Estratégico\s*|\s*Proposta\s+Estratégica\s*|\s*Plano\s+Estratégico\s*)<\/span>\s*/gi;

  let cleanedHtml = conteudoHtml.replace(badgeRegex, "").replace(textBadgeRegex, "");

  const logoMarkup = renderizarMarkupLogo(logoUrl, empresaNome);

  // Case 1: Existing data-empresa-logo container found -> replace it
  if (logoDivRegex.test(cleanedHtml)) {
    return cleanedHtml.replace(logoDivRegex, logoMarkup);
  }

  // Case 2: Legacy <img> with alt or logo styles inside header without data attribute
  const legacyLogoRegex = /<div style="margin-bottom:\s*14px;"><img src="data:image\/[^"]+"[^>]*><\/div>/i;
  if (legacyLogoRegex.test(cleanedHtml)) {
    return cleanedHtml.replace(legacyLogoRegex, logoMarkup);
  }

  // Case 3: Insert before badge or header title inside header-content
  const headerContentMatch = /<div class="header-content"[^>]*>/i.exec(cleanedHtml);
  if (headerContentMatch) {
    const insertPos = headerContentMatch.index + headerContentMatch[0].length;
    // Check if there's an inner div inside flex-responsive
    const flexMatch = /<div class="flex-responsive"[^>]*>\s*<div>/i.exec(cleanedHtml);
    if (flexMatch && flexMatch.index >= insertPos) {
      const innerInsertPos = flexMatch.index + flexMatch[0].length;
      return (
        cleanedHtml.slice(0, innerInsertPos) +
        `\n          ${logoMarkup}` +
        cleanedHtml.slice(innerInsertPos)
      );
    }
    return (
      cleanedHtml.slice(0, insertPos) +
      `\n        ${logoMarkup}` +
      cleanedHtml.slice(insertPos)
    );
  }

  // Case 4: Insert before the first <h1>
  const h1Match = /<h1[^>]*>/i.exec(cleanedHtml);
  if (h1Match) {
    return (
      cleanedHtml.slice(0, h1Match.index) +
      `${logoMarkup}\n          ` +
      cleanedHtml.slice(h1Match.index)
    );
  }

  // Case 5: Insert after <body> tag
  const bodyMatch = /<body[^>]*>/i.exec(cleanedHtml);
  if (bodyMatch) {
    const insertPos = bodyMatch.index + bodyMatch[0].length;
    return (
      cleanedHtml.slice(0, insertPos) +
      `\n  ${logoMarkup}` +
      cleanedHtml.slice(insertPos)
    );
  }

  // Fallback: prepend
  return `${logoMarkup}\n${cleanedHtml}`;
}

export interface ConteudoConsultivoIA {
  diagnosticoHtml?: string;
  fases?: Array<{
    fase?: number | string;
    titulo: string;
    descricao: string;
  }>;
  garantiasHtml?: string;
}

export function gerarTemplateFree(
  dados: DadosGeracaoProposta,
  conteudoConsultivo?: ConteudoConsultivoIA | null
): string {
  const subtotal = dados.itens.reduce(
    (acc, item) => acc + item.quantidade * item.valorUnitario,
    0
  );
  const total = subtotal;
  const dataHoje = new Date().toLocaleDateString("pt-BR");
  const numeroProposta = `PROP-${new Date().getFullYear()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const rowsHtml = dados.itens
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #d1d5db;">
        <td style="padding: 8px 12px; color: #111827; font-size: 13px;">${item.descricao}</td>
        <td style="padding: 8px 12px; text-align: center; color: #374151; font-size: 13px;">${item.quantidade}</td>
        <td style="padding: 8px 12px; text-align: right; color: #374151; font-size: 13px;">${formatarMoeda(item.valorUnitario)}</td>
        <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #111827; font-size: 13px;">${formatarMoeda(item.quantidade * item.valorUnitario)}</td>
      </tr>
    `
    )
    .join("");

  const diagnosticoTexto = conteudoConsultivo?.diagnosticoHtml
    ? conteudoConsultivo.diagnosticoHtml.replace(/<[^>]+>/g, " ").trim()
    : dados.descricao;

  const defaultFasesFree = [
    "Fase 01: Planejamento, Diagnóstico & Alinhamento de Escopo",
    "Fase 02: Execução Técnica & Desenvolvimento Especializado",
    "Fase 03: Homologação, Validação & Entrega Definitiva",
  ];

  const fasesFree =
    conteudoConsultivo?.fases && conteudoConsultivo.fases.length > 0
      ? conteudoConsultivo.fases.map(
          (f) => `• ${f.titulo}: ${f.descricao}`
        ).join("\n")
      : defaultFasesFree.map((f) => `• ${f}`).join("\n");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Comercial - ${dados.clienteNome}</title>
  <style>
    body { font-family: 'Courier New', Courier, monospace, system-ui, sans-serif; background-color: #ffffff; margin: 0; padding: 24px 12px; color: #111827; line-height: 1.5; }
    .notepad-container { max-width: 760px; margin: 0 auto; border: 1px solid #111827; padding: 24px; background: #ffffff; box-sizing: border-box; }
    @media (max-width: 640px) {
      body { padding: 8px !important; }
      .notepad-container { padding: 14px !important; }
      .header-flex { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
      .signatures-flex { flex-direction: column !important; gap: 20px !important; }
      .signatures-flex > div { width: 100% !important; }
      .table-responsive { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="notepad-container">
    
    <!-- Notepad Header (Monochrome) -->
    <div style="border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 20px;">
      <div class="header-flex" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: bold; margin-bottom: 4px;">[ DOCUMENTO COMERCIAL / PROPOSTA ]</div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #111827;">
            ${dados.empresaNome || "Emissor da Proposta"}
          </h1>
          <div style="font-size: 12px; color: #374151; margin-top: 4px;">
            ${dados.empresaCNPJ ? `CNPJ: ${dados.empresaCNPJ} ` : ""}
            ${dados.empresaEmail ? `| Email: ${dados.empresaEmail} ` : ""}
            ${dados.empresaTelefone ? `| Tel: ${dados.empresaTelefone}` : ""}
          </div>
        </div>
        <div style="text-align: right; font-size: 12px;">
          <div><strong>Nº:</strong> ${numeroProposta}</div>
          <div><strong>Data:</strong> ${dataHoje}</div>
          <div><strong>Validade:</strong> ${dados.validade || 30} dias</div>
        </div>
      </div>
    </div>

    <!-- Client Info -->
    <div style="border: 1px solid #9ca3af; padding: 14px; margin-bottom: 20px; font-size: 13px;">
      <div style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Destinatário:</div>
      <div><strong>Cliente:</strong> ${dados.clienteNome} ${dados.clienteEmpresa ? `(${dados.clienteEmpresa})` : ""}</div>
      ${dados.clienteEmail ? `<div><strong>Email:</strong> ${dados.clienteEmail}</div>` : ""}
      ${dados.clienteTelefone ? `<div><strong>Telefone:</strong> ${dados.clienteTelefone}</div>` : ""}
      <div><strong>Condição de Pagamento:</strong> ${dados.prazoPagamento || "À Vista"}</div>
    </div>

    <!-- Scope / Description -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #111827; padding-bottom: 4px; margin-bottom: 10px;">
        1. Diagnóstico do Cenário & Metodologia de Entrega
      </div>
      <div style="font-size: 13px; color: #1f2937; white-space: pre-line; line-height: 1.6; margin-bottom: 12px;">
        ${diagnosticoTexto}
      </div>
      <div style="font-size: 12.5px; color: #374151; white-space: pre-line; line-height: 1.5; background: #f9fafb; padding: 10px; border: 1px dashed #9ca3af;">
        <strong>Metodologia em Fases:</strong>
${fasesFree}
      </div>
    </div>

    <!-- Line Items Table -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #111827; padding-bottom: 4px; margin-bottom: 10px;">
        2. Itens e Valores
      </div>
      <div class="table-responsive">
        <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 480px;">
          <thead>
            <tr style="border-bottom: 2px solid #111827; background: #f3f4f6;">
              <th style="padding: 8px 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Item / Descrição</th>
              <th style="padding: 8px 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; text-align: center; width: 60px;">Qtd</th>
              <th style="padding: 8px 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; text-align: right; width: 120px;">Unitário</th>
              <th style="padding: 8px 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; text-align: right; width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Total -->
      <div style="margin-top: 14px; text-align: right; font-size: 15px; font-weight: bold; border-top: 1px solid #111827; padding-top: 8px;">
        Total do Investimento: ${formatarMoeda(total)}
      </div>
    </div>

    <!-- Observations -->
    ${
      dados.observacoes
        ? `
    <div style="margin-bottom: 24px; font-size: 12px; border: 1px solid #d1d5db; padding: 12px;">
      <div style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Observações & Prazos:</div>
      <div style="color: #374151;">${dados.observacoes}</div>
    </div>`
        : ""
    }

    <!-- Simple Signatures -->
    <div class="signatures-flex" style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #6b7280; display: flex; justify-content: space-between; gap: 24px;">
      <div style="width: 45%; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 6px; font-size: 12px;">
          <strong>${dados.empresaNome || "Emissor"}</strong><br/>
          Responsável Comercial
        </div>
      </div>
      <div style="width: 45%; text-align: center;">
        <div style="border-top: 1px solid #111827; padding-top: 6px; font-size: 12px;">
          <strong>${dados.clienteNome}</strong><br/>
          Aceite / Cliente
        </div>
      </div>
    </div>

    <!-- Free Tier Footer -->
    <div style="margin-top: 32px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px dotted #9ca3af; padding-top: 12px;">
      Proposta gerada no plano gratuito do ViraPropo AI! • Atualize para o Plano Pro para propostas executivas coloridas, logo personalizada, exportação PDF, versão mobile e assinatura eletrônica.
    </div>

  </div>
</body>
</html>
  `.trim();
}

export function gerarTemplatePro(
  dados: DadosGeracaoProposta,
  conteudoConsultivo?: ConteudoConsultivoIA | null
): string {
  const subtotal = dados.itens.reduce(
    (acc, item) => acc + item.quantidade * item.valorUnitario,
    0
  );
  const total = subtotal;
  const dataHoje = new Date().toLocaleDateString("pt-BR");
  const numeroProposta = `PROP-${new Date().getFullYear()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const rowsHtml = dados.itens
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${
        idx % 2 === 0 ? "#ffffff" : "#f8fafc"
      };">
        <td style="padding: 14px 18px; color: #0f172a; font-size: 14px; font-weight: 500;">${
          item.descricao
        }</td>
        <td style="padding: 14px 18px; text-align: center; color: #475569; font-size: 14px;">${
          item.quantidade
        }</td>
        <td style="padding: 14px 18px; text-align: right; color: #475569; font-size: 14px;">${formatarMoeda(
          item.valorUnitario
        )}</td>
        <td style="padding: 14px 18px; text-align: right; font-weight: 700; color: #1e293b; font-size: 14px;">${formatarMoeda(
          item.quantidade * item.valorUnitario
        )}</td>
      </tr>
    `
    )
    .join("");

  const logoHtml = dados.empresaLogoUrl
    ? renderizarMarkupLogo(dados.empresaLogoUrl, dados.empresaNome)
    : "";

  const badgeHtml = dados.empresaLogoUrl
    ? ""
    : `<span data-badge-estrategica="true" style="display: inline-block; background: rgba(37, 99, 235, 0.3); border: 1px solid rgba(96, 165, 250, 0.4); padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; color: #93c5fd;">
            Proposta Comercial & Plano Estratégico
          </span>`;

  const diagnosticoCardContent = conteudoConsultivo?.diagnosticoHtml
    ? conteudoConsultivo.diagnosticoHtml
    : dados.descricao;

  const defaultFases = [
    {
      titulo: "Fase 01: Planejamento, Diagnóstico & Alinhamento",
      descricao: "Mapeamento detalhado dos objetivos, definição de cronograma executivo e alinhamento inicial de entregáveis.",
    },
    {
      titulo: "Fase 02: Execução Técnica & Desenvolvimento Especializado",
      descricao: "Construção dos módulos e serviços contratados seguindo padrões rígidos de qualidade, segurança e eficiência.",
    },
    {
      titulo: "Fase 03: Homologação, Validação & Entrega Definitiva",
      descricao: "Testes integrados, validação assistida junto ao cliente e disponibilização para operação em produção.",
    },
  ];

  const fasesRenderizadas =
    conteudoConsultivo?.fases && conteudoConsultivo.fases.length > 0
      ? conteudoConsultivo.fases
      : defaultFases;

  const fasesHtml = fasesRenderizadas
    .map(
      (f, idx) => `
    <div style="display: flex; gap: 12px; align-items: flex-start;">
      <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; border-radius: 9999px; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700;">${
        idx + 1
      }</span>
      <div>
        <strong style="font-size: 13px; color: #0f172a;">${f.titulo}</strong>
        <p style="margin: 2px 0 0 0; font-size: 12.5px; color: #475569; line-height: 1.5;">${f.descricao}</p>
      </div>
    </div>
  `
    )
    .join("");

  const garantiasTexto = conteudoConsultivo?.garantiasHtml
    ? conteudoConsultivo.garantiasHtml
    : dados.observacoes
    ? `<p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.6;">${dados.observacoes}</p>`
    : "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Comercial Consultiva - ${dados.clienteNome}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 12px; color: #0f172a; line-height: 1.5; -webkit-text-size-adjust: 100%; }
    .pro-card-container { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e2e8f0; box-sizing: border-box; }
    
    [data-empresa-logo="true"] { display: inline-flex; align-items: center; justify-content: center; }
    .table-responsive-wrapper {
      display: block;
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }
    .table-responsive-wrapper::-webkit-scrollbar {
      height: 6px;
    }
    .table-responsive-wrapper::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    @media (max-width: 640px) {
      body { padding: 6px !important; }
      .pro-card-container { border-radius: 12px !important; width: 100% !important; }
      .header-content { padding: 22px 14px !important; }
      .body-content { padding: 18px 12px !important; }
      [data-empresa-logo="true"] { padding: 6px 10px !important; margin-bottom: 12px !important; }
      [data-empresa-logo="true"] img { max-height: 40px !important; max-width: 150px !important; }
      .grid-responsive { grid-template-columns: 1fr !important; gap: 14px !important; padding: 16px !important; }
      .flex-responsive { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
      .table-responsive-wrapper table { min-width: 440px !important; }
      .table-responsive-wrapper th,
      .table-responsive-wrapper td {
        padding: 10px 8px !important;
        font-size: 12.5px !important;
      }
      .table-responsive-wrapper td:nth-child(3),
      .table-responsive-wrapper td:nth-child(4) {
        white-space: nowrap !important;
        font-variant-numeric: tabular-nums !important;
      }
      .total-box-wrapper { width: 100% !important; padding: 14px !important; }
      .signatures-grid { grid-template-columns: 1fr !important; gap: 24px !important; margin-top: 32px !important; padding-top: 24px !important; }
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #ffffff; padding: 0; }
      .pro-card-container { box-shadow: none; border: none; }
      [data-empresa-logo="true"] { background: #ffffff !important; box-shadow: none !important; border: 1px solid #cbd5e1 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="pro-card-container">
    
    <!-- Top Header Bar -->
    <div class="header-content" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e3a8a 100%); padding: 40px; color: #ffffff;">
      <div class="flex-responsive" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
        <div>
          ${logoHtml}
          ${badgeHtml}
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">
            ${dados.empresaNome || "Proposta Comercial Especializada"}
          </h1>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #cbd5e1; line-height: 1.4;">
            ${dados.empresaCNPJ ? `CNPJ: ${dados.empresaCNPJ}` : ""} 
            ${dados.empresaEmail ? `• ${dados.empresaEmail}` : ""}
            ${dados.empresaTelefone ? `• ${dados.empresaTelefone}` : ""}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Código da Proposta</div>
          <div style="font-size: 18px; font-weight: 800; letter-spacing: 0.05em; color: #60a5fa; font-family: monospace;">${numeroProposta}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Emitida em: ${dataHoje}</div>
        </div>
      </div>
    </div>

    <div class="body-content" style="padding: 40px;">
      <!-- Client & Overview Grid -->
      <div class="grid-responsive" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; background: #f8fafc; padding: 22px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">Apresentado a:</div>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${
            dados.clienteNome
          }</div>
          ${
            dados.clienteEmpresa
              ? `<div style="font-size: 14px; font-weight: 600; color: #334155; margin-top: 2px;">${dados.clienteEmpresa}</div>`
              : ""
          }
          ${
            dados.clienteEmail
              ? `<div style="font-size: 13px; color: #64748b; margin-top: 4px;">${dados.clienteEmail}</div>`
              : ""
          }
          ${
            dados.clienteTelefone
              ? `<div style="font-size: 13px; color: #64748b;">${dados.clienteTelefone}</div>`
              : ""
          }
        </div>
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">Condições Comerciais:</div>
          <div style="font-size: 13px; color: #334155; margin-bottom: 4px;"><strong>Validade da Oferta:</strong> ${
            dados.validade || 30
          } dias corridos</div>
          <div style="font-size: 13px; color: #334155;"><strong>Condição de Pagamento:</strong> ${
            dados.prazoPagamento === "0" ? "À Vista com Prioridade" : dados.prazoPagamento || "À Vista"
          }</div>
        </div>
      </div>

      <!-- Scope Section -->
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.04em;">
          1. Diagnóstico do Cenário, Metodologia & Escopo Estratégico
        </h3>
        
        <div style="background: #ffffff; padding: 22px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            Diagnóstico do Cenário Atual & Oportunidade
          </div>
          <div style="font-size: 14px; line-height: 1.7; color: #334155; white-space: pre-line;">
            ${diagnosticoCardContent}
          </div>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            Metodologia Executiva de Entrega
          </div>
          <div style="display: grid; gap: 12px;">
            ${fasesHtml}
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.04em;">
          2. Investimento & Entregáveis
        </h3>
        <div class="table-responsive-wrapper">
          <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 440px;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em;">Descrição do Entregável</th>
                <th style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; width: 60px;">Qtd</th>
                <th style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; width: 130px;">Valor Unit.</th>
                <th style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; width: 130px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Total Box -->
        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <div class="total-box-wrapper" style="width: 300px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
              <span>Subtotal dos Serviços:</span>
              <span>${formatarMoeda(subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #1e3a8a; border-top: 2px solid #e2e8f0; padding-top: 10px;">
              <span>Investimento Total:</span>
              <span>${formatarMoeda(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Observations & Guarantees -->
      ${
        garantiasTexto
          ? `
      <div style="margin-bottom: 32px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px;">
        <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.04em;">Garantias & Alinhamentos Comerciais:</h4>
        ${garantiasTexto}
      </div>`
          : ""
      }

      <!-- Signatures -->
      <div class="signatures-grid" style="margin-top: 48px; padding-top: 32px; border-top: 2px dashed #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div style="text-align: center;">
          <div style="height: 48px; border-bottom: 1px solid #94a3b8; margin-bottom: 8px;"></div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${
            dados.empresaNome || "Contratada"
          }</div>
          <div style="font-size: 11px; color: #64748b;">Emissor / Responsável Comercial</div>
        </div>
        <div style="text-align: center;">
          <div style="height: 48px; border-bottom: 1px solid #94a3b8; margin-bottom: 8px;"></div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${
            dados.clienteNome
          }</div>
          <div style="font-size: 11px; color: #64748b;">De Acordo / Aceite da Proposta</div>
        </div>
      </div>

      <!-- Footer Note -->
      <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        Proposta gerada via ViraPropo AI! Pro • Documento confidencial destinado exclusivamente ao cliente especificado.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function gerarTemplateFallback(dados: DadosGeracaoProposta): string {
  if (dados.plano === "free") {
    return gerarTemplateFree(dados);
  }
  return gerarTemplatePro(dados);
}

export async function gerarPropostacComIA(
  dados: DadosGeracaoProposta
): Promise<string> {
  const itensFormatados = dados.itens
    .map(
      (item) =>
        `- ${item.descricao}: ${item.quantidade}x R$ ${item.valorUnitario.toFixed(
          2
        )} = R$ ${(item.quantidade * item.valorUnitario).toFixed(2)}`
    )
    .join("\n");

  const total = dados.itens.reduce(
    (acc, item) => acc + item.quantidade * item.valorUnitario,
    0
  );

  const isFree = dados.plano === "free";

  const prompt = `VOCÊ É O DIRETOR COMERCIAL & ESTRATEGISTA SÊNIOR DE VENDAS (VP of Sales & Closing Strategist) com mais de 25 anos de carreira fechando contratos de alto valor no mercado brasileiro. Você domina vendas consultivas, metodologia SPIN Selling, precificação de valor e fechamento com quebra antecipada de objeções.

SUA MISSÃO:
Transformar os dados brutos e escopo recebidos em uma NARRATIVA CONSULTIVA ESTRATÉGICA RICA (Diagnóstico SPIN Selling, Metodologia de Entrega em 3 Fases e Garantias).

DADOS DA PROPOSTA:
- Emissor / Prestador: ${dados.empresaNome || "Empresa Especializada"}
- Cliente / Contratante: ${dados.clienteNome} (${dados.clienteEmpresa || "Contratante"})
- Escopo Informado: ${dados.descricao}
- Itens: ${itensFormatados}
- Valor Total: R$ ${total.toFixed(2)}
- Condições de Pagamento: ${dados.prazoPagamento || "À Vista"}
- Validade: ${dados.validade || 30} dias corridos
- Observações: ${dados.observacoes || "Nenhuma"}

REQUISITO ESTRITO:
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags html externas ou markdown fora do JSON) com a estrutura:
{
  "diagnosticoHtml": "<p>Parágrafo 1 de diagnóstico profundo do problema/dor e gargalos atuais do cliente...</p><p>Parágrafo 2 explicando como a solução resolve o problema, gera valor tangível e destrava crescimento...</p>",
  "fases": [
    { "titulo": "Fase 01: [Nome da Fase de Diagnóstico/Planejamento]", "descricao": "[Descrição executiva dos entregáveis desta fase e benefícios]" },
    { "titulo": "Fase 02: [Nome da Fase de Execução Técnica/Desenvolvimento]", "descricao": "[Descrição executiva dos entregáveis desta fase e benefícios]" },
    { "titulo": "Fase 03: [Nome da Fase de Homologação/Lançamento/Validação]", "descricao": "[Descrição executiva dos entregáveis desta fase e benefícios]" }
  ],
  "garantiasHtml": "<p>[Texto consultivo de alinhamentos comerciais, garantias de suporte e reversão de risco]</p>"
}`;

  const configuredModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const modelsToTry = Array.from(new Set([configuredModel, "gemini-3.6-flash", "gemini-flash-latest"].filter(Boolean)));

  let genAI: any = null;
  try {
    genAI = getGenAIClient();
  } catch (err: any) {
    console.warn("[Gemini AI] Cliente não pôde ser inicializado:", err?.message || err);
  }

  if (genAI) {
    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini AI] Sintetizando consultoria com modelo ${modelName}...`);
        const startTime = Date.now();
        // 8.5s hard timeout to guarantee response within Vercel serverless window without 504
        const timeoutMs = 8500;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout de IA (${modelName} após ${timeoutMs}ms)`)), timeoutMs)
        );

        const generatePromise = (async () => {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        })();

        const rawText = await Promise.race([generatePromise, timeoutPromise]);
        const duration = Date.now() - startTime;

        const cleanedJson = rawText
          .replace(/```json\n?/gi, "")
          .replace(/```\n?/g, "")
          .trim();

        // Check if response is raw full HTML or JSON
        if (cleanedJson.includes("<html") && cleanedJson.includes("</html>")) {
          console.log(`[Gemini AI] Proposta HTML direta gerada com sucesso via ${modelName} em ${duration}ms!`);
          let finalHtml = cleanedJson;
          if (dados.plano === "pro" && dados.empresaLogoUrl) {
            finalHtml = injetarOuAtualizarLogoHtml(finalHtml, dados.empresaLogoUrl, dados.empresaNome);
          }
          return ajustarHtmlResponsivoProposta(finalHtml);
        }

        try {
          const parsed = JSON.parse(cleanedJson) as ConteudoConsultivoIA;
          if (parsed && (parsed.diagnosticoHtml || (parsed.fases && parsed.fases.length > 0))) {
            console.log(`[Gemini AI] Síntese consultiva gerada com sucesso via ${modelName} em ${duration}ms!`);
            let renderedHtml = isFree ? gerarTemplateFree(dados, parsed) : gerarTemplatePro(dados, parsed);
            if (dados.plano === "pro" && dados.empresaLogoUrl) {
              renderedHtml = injetarOuAtualizarLogoHtml(renderedHtml, dados.empresaLogoUrl, dados.empresaNome);
            }
            return ajustarHtmlResponsivoProposta(renderedHtml);
          }
        } catch (jsonErr) {
          console.warn(`[Gemini AI] Resposta do modelo ${modelName} não pôde ser parseada como JSON:`, jsonErr);
        }
      } catch (err: any) {
        console.warn(`[Gemini AI] Tentativa com modelo ${modelName} falhou (${err?.message || err}).`);
        break; // Stop immediately on timeout to prevent cascading delays
      }
    }
  }

  // Fallback seguro, estruturado e imediato (0ms)
  console.log("[Gemini AI] Utilizando template estruturado consultivo de fallback...");
  let fallbackHtml = isFree ? gerarTemplateFree(dados) : gerarTemplatePro(dados);
  if (dados.plano === "pro" && dados.empresaLogoUrl) {
    fallbackHtml = injetarOuAtualizarLogoHtml(fallbackHtml, dados.empresaLogoUrl, dados.empresaNome);
  }
  return ajustarHtmlResponsivoProposta(fallbackHtml);
}


