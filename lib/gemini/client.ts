import { GoogleGenerativeAI } from "@google/generative-ai";

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

export function gerarTemplateFallback(dados: DadosGeracaoProposta): string {
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
        <td style="padding: 12px 16px; color: #1e293b; font-size: 14px;">${
          item.descricao
        }</td>
        <td style="padding: 12px 16px; text-align: center; color: #475569; font-size: 14px;">${
          item.quantidade
        }</td>
        <td style="padding: 12px 16px; text-align: right; color: #475569; font-size: 14px;">${formatarMoeda(
          item.valorUnitario
        )}</td>
        <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px;">${formatarMoeda(
          item.quantidade * item.valorUnitario
        )}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Comercial - ${dados.clienteNome}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #0f172a;">
  <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
    
    <!-- Top Header Bar -->
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 36px 40px; color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
        <div>
          <span style="display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
            Proposta Comercial
          </span>
          <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">
            ${dados.empresaNome || "Proposta de Serviços"}
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">
            ${dados.empresaCNPJ ? `CNPJ: ${dados.empresaCNPJ}` : ""} 
            ${dados.empresaEmail ? `• ${dados.empresaEmail}` : ""}
            ${dados.empresaTelefone ? `• ${dados.empresaTelefone}` : ""}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 13px; opacity: 0.8;">Número da Proposta</div>
          <div style="font-size: 18px; font-weight: 700; letter-spacing: 0.05em;">${numeroProposta}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Data: ${dataHoje}</div>
        </div>
      </div>
    </div>

    <div style="padding: 40px;">
      <!-- Client & Overview Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Preparado Para:</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${
            dados.clienteNome
          }</div>
          ${
            dados.clienteEmpresa
              ? `<div style="font-size: 14px; color: #475569; margin-top: 2px;">${dados.clienteEmpresa}</div>`
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
          <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Validade & Prazos:</div>
          <div style="font-size: 14px; color: #334155;"><strong>Validade da Proposta:</strong> ${
            dados.validade || 30
          } dias</div>
          <div style="font-size: 14px; color: #334155; margin-top: 4px;"><strong>Condições de Pagamento:</strong> ${
            dados.prazoPagamento === "0" ? "À Vista" : dados.prazoPagamento || "À Vista"
          }</div>
        </div>
      </div>

      <!-- Scope Section -->
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; border-left: 4px solid #4f46e5; padding-left: 10px;">
          1. Escopo e Objetivos do Projeto
        </h3>
        <div style="font-size: 14px; line-height: 1.65; color: #334155; background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-line;">
          ${dados.descricao}
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; border-left: 4px solid #4f46e5; padding-left: 10px;">
          2. Investimento e Entregáveis
        </h3>
        <div style="border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Descrição</th>
                <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: center; width: 80px;">Qtd</th>
                <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: right; width: 140px;">Valor Unit.</th>
                <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: right; width: 140px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Total Box -->
        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <div style="width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 14px; color: #64748b; margin-bottom: 6px;">
              <span>Subtotal:</span>
              <span>${formatarMoeda(subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #4f46e5; border-top: 2px solid #e2e8f0; padding-top: 8px;">
              <span>Total Geral:</span>
              <span>${formatarMoeda(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Observations -->
      ${
        dados.observacoes
          ? `
      <div style="margin-bottom: 32px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px;">
        <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #92400e;">Observações Importantes:</h4>
        <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">${dados.observacoes}</p>
      </div>`
          : ""
      }

      <!-- Signatures -->
      <div style="margin-top: 48px; padding-top: 32px; border-top: 2px dashed #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div style="text-align: center;">
          <div style="height: 50px; border-bottom: 1px solid #94a3b8; margin-bottom: 8px;"></div>
          <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${
            dados.empresaNome || "Contratada"
          }</div>
          <div style="font-size: 12px; color: #64748b;">Assinatura do Responsável</div>
        </div>
        <div style="text-align: center;">
          <div style="height: 50px; border-bottom: 1px solid #94a3b8; margin-bottom: 8px;"></div>
          <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${
            dados.clienteNome
          }</div>
          <div style="font-size: 12px; color: #64748b;">De Acordo / Aceite</div>
        </div>
      </div>

      <!-- Footer Note -->
      <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        Proposta gerada via Proposta Ai! • Documento confidencial destinado exclusivamente ao cliente especificado.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
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

  const prompt = `Você é um especialista sênior em copywriting comercial e fechamento de vendas de alto valor. Gere uma proposta comercial completa em formato HTML profissional, moderna, altamente persuasiva, bem formatada com CSS inline elegante e pronta para o cliente assinar.

DADOS DA EMPRESA EMISSORA:
- Nome: ${dados.empresaNome || "Empresa Especializada"}
- CNPJ: ${dados.empresaCNPJ || "Não informado"}
- Email: ${dados.empresaEmail || "Não informado"}
- Telefone: ${dados.empresaTelefone || "Não informado"}

DADOS DO CLIENTE:
- Nome: ${dados.clienteNome}
- Empresa: ${dados.clienteEmpresa || "Cliente"}
- Email: ${dados.clienteEmail || ""}
- Telefone: ${dados.clienteTelefone || ""}

DESCRIÇÃO E ESCOPO DO PROJETO:
${dados.descricao}

ITENS E INVESTIMENTO:
${itensFormatados}

VALOR TOTAL: R$ ${total.toFixed(2)}

CONDIÇÕES E PRAZOS:
- Prazo de Pagamento: ${dados.prazoPagamento || "À Vista"}
- Validade: ${dados.validade || 30} dias
- Observações: ${dados.observacoes || "Nenhuma"}

REQUISITOS ESTRUTURAIS DO HTML:
1. Comece diretamente com <!DOCTYPE html> e termine com </html>.
2. NUNCA inclua marcações de markdown, crases triplas (\`\`\`html) ou comentários fora do código HTML.
3. Use CSS inline refinado, paleta profissional (Indigo #4F46E5, Slate #0F172A, Cinza neutro #64748B, fundo suave #F8FAFC).
4. Tipografia limpa baseada em fontes do sistema ('Inter', -apple-system, system-ui, sans-serif).
5. Inclua seções claras: Cabeçalho da Empresa, Dados do Cliente, Contexto & Diagnóstico da Solução, Metodologia & Escopo de Entregas, Tabela Estruturada de Preços/Itens, Cronograma & Prazos, Termos Comerciais e Espaço Formal de Assinaturas.`;

  const modelsToTry = [
    process.env.GEMINI_MODEL,
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
  ].filter(Boolean) as string[];

  const genAI = getGenAIClient();

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const htmlContent = text
        .replace(/```html\n?/gi, "")
        .replace(/```\n?/g, "")
        .trim();

      if (htmlContent.includes("<html") && htmlContent.includes("</html>")) {
        return htmlContent;
      }
      if (htmlContent.length > 500) {
        return htmlContent;
      }
    } catch (err: any) {
      console.warn(`Tentativa com modelo ${modelName} falhou:`, err?.message || err);
    }
  }

  // Fallback to high-fidelity template
  console.log("Utilizando template estruturado de alta fidelidade...");
  return gerarTemplateFallback(dados);
}
