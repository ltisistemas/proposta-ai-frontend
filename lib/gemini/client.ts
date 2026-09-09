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

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Comercial Consultiva - ${dados.clienteNome}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 36px 16px; color: #0f172a;">
  <div style="max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e2e8f0;">
    
    <!-- Top Header Bar -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e3a8a 100%); padding: 40px; color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
        <div>
          <span style="display: inline-block; background: rgba(37, 99, 235, 0.3); border: 1px solid rgba(96, 165, 250, 0.4); padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; color: #93c5fd;">
            Proposta Comercial & Plano Estratégico
          </span>
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">
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

    <div style="padding: 40px;">
      <!-- Client & Overview Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; background: #f8fafc; padding: 22px; border-radius: 12px; border: 1px solid #e2e8f0;">
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
        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; border-left: 4px solid #2563eb; padding-left: 12px; text-transform: uppercase; letter-spacing: 0.03em;">
          1. Diagnóstico, Escopo & Metodologia de Entrega
        </h3>
        <div style="font-size: 14px; line-height: 1.7; color: #334155; background: #ffffff; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; white-space: pre-line;">
          ${dados.descricao}
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; border-left: 4px solid #2563eb; padding-left: 12px; text-transform: uppercase; letter-spacing: 0.03em;">
          2. Investimento & Entregáveis
        </h3>
        <div style="border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 12px 18px; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em;">Descrição do Entregável</th>
                <th style="padding: 12px 18px; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; width: 80px;">Qtd</th>
                <th style="padding: 12px 18px; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; width: 140px;">Valor Unit.</th>
                <th style="padding: 12px 18px; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; width: 140px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Total Box -->
        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <div style="width: 300px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
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
        dados.observacoes
          ? `
      <div style="margin-bottom: 32px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px;">
        <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.04em;">Garantias & Alinhamentos Comerciais:</h4>
        <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.6;">${dados.observacoes}</p>
      </div>`
          : ""
      }

      <!-- Signatures -->
      <div style="margin-top: 48px; padding-top: 32px; border-top: 2px dashed #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
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

  const prompt = `VOCÊ É O DIRETOR COMERCIAL & ESTRATEGISTA SÊNIOR DE VENDAS (VP of Sales & Closing Strategist) com mais de 25 anos de carreira fechando contratos de alto valor no mercado brasileiro. Você domina vendas consultivas, metodologia SPIN Selling, precificação de valor e fechamento com quebra antecipada de objeções.

SUA MISSÃO:
Transformar os dados brutos recebidos em uma PROPOSTA COMERCIAL CONSULTIVA COMPLETA, PERSUASIVA, ELEGANTE E COM ALTA TAXA DE CONVERSÃO em formato HTML profissional, pronta para o cliente assinar e aprovar.

DIRETRIZES DE COPYWRITING COMERCIAL:
1. DIAGNÓSTICO & ENTENDIMENTO: Comece demonstrando que entendeu com profundidade a dor e o objetivo estratégico do cliente. Enquadre o projeto como uma solução de alto retorno (ROI), não apenas como tarefas técnicas.
2. METODOLOGIA E SEGURANÇA: Apresente o escopo em fases lógicas e entregáveis concretos que eliminem qualquer sensação de risco do comprador.
3. VALOR & TRANSPARÊNCIA: A tabela financeira deve ser cristalina, formatada no padrão contábil brasileiro em Real (R$).
4. CLÁUSULAS & REVERSÃO DE RISCO: Reforce prazos, garantias de entrega, termos de pagamento e o valor da agilidade na contratação.
5. FORMALIDADE & FECHAMENTO: Conclua com espaço claro de aceite formal e assinaturas bilaterais.

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

DESCRIÇÃO E ESCOPO DO PROJETO INFORMADO:
${dados.descricao}

ITENS E INVESTIMENTO:
${itensFormatados}

VALOR TOTAL: R$ ${total.toFixed(2)}

CONDIÇÕES E PRAZOS:
- Prazo de Pagamento: ${dados.prazoPagamento || "À Vista"}
- Validade: ${dados.validade || 30} dias
- Observações / Alinhamentos: ${dados.observacoes || "Nenhuma"}

REQUISITOS ESTRUTURAIS DO CÓDIGO HTML:
1. Comece diretamente com <!DOCTYPE html> e termine com </html>.
2. NUNCA inclua marcações de markdown, crases triplas (\`\`\`html) ou comentários fora do código HTML.
3. Use CSS inline refinado, paleta profissional de autoridade executiva (Azul Royal #2563EB, Slate #0F172A, Cinza neutro #64748B, fundo suave #F8FAFC, bordas #E2E8F0).
4. Tipografia limpa baseada em fontes do sistema ('Inter', -apple-system, system-ui, sans-serif).
5. Inclua as seções numeradas e bem destacadas:
   - Cabeçalho da Empresa Emissora & Dados do Cliente
   - 1. Diagnóstico do Cenário & Objetivos Estratégicos
   - 2. Metodologia & Escopo de Entregas
   - 3. Tabela Estruturada de Investimento & Itens (com soma total em destaque)
   - 4. Cronograma & Condições Comerciais
   - 5. Garantias, Validade & Termo Formal de Aceite / Assinaturas.`;

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
