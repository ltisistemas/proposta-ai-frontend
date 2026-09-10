export interface DadosWhatsApp {
  numero: string;
  clienteNome: string;
  clienteEmpresa?: string | null;
  empresaNome?: string | null;
  empresaTelefone?: string | null;
  descricao?: string;
  total: number;
  prazoPagamento?: string | null;
  validadeDias?: number;
  itens?: Array<{
    descricao: string;
    quantidade: number;
    valor_unitario?: number;
    valorUnitario?: number;
    subtotal?: number;
  }>;
  publicUrl?: string;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function gerarTextoWhatsApp(dados: DadosWhatsApp): string {
  const dataHoje = new Date().toLocaleDateString("pt-BR");
  const empresa = dados.empresaNome || "Nossa Empresa";
  const cliente = dados.clienteNome;
  const validade = dados.validadeDias || 30;
  const prazo = dados.prazoPagamento || "À Vista";

  let itensTexto = "";
  if (dados.itens && dados.itens.length > 0) {
    itensTexto = dados.itens
      .map((item) => {
        const unit = item.valorUnitario ?? item.valor_unitario ?? 0;
        const sub = item.subtotal ?? item.quantidade * unit;
        return `• *${item.descricao}* (${item.quantidade}x ${formatarMoeda(unit)}) = ${formatarMoeda(sub)}`;
      })
      .join("\n");
  }

  const linkSecao = dados.publicUrl
    ? `\n\n✍️ *Acesse o documento completo & assine eletronicamente:*\n🔗 ${dados.publicUrl}`
    : "";

  const escopoResumo = dados.descricao
    ? dados.descricao.length > 280
      ? dados.descricao.substring(0, 277) + "..."
      : dados.descricao
    : "";

  return `📄 *PROPOSTA COMERCIAL* — *${empresa}*
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Cliente:* ${cliente}${dados.clienteEmpresa ? ` (${dados.clienteEmpresa})` : ""}
🔢 *Nº da Proposta:* ${dados.numero}
📅 *Data:* ${dataHoje} | *Validade:* ${validade} dias corridos

📋 *ESCOPO RESUMIDO:*
${escopoResumo || "Conforme alinhamento comercial e escopo detalhado."}

💼 *INVESTIMENTO & ENTREGÁVEIS:*
${itensTexto || `• Total do Projeto: ${formatarMoeda(dados.total)}`}

💰 *INVESTIMENTO TOTAL:* *${formatarMoeda(dados.total)}*
💳 *Condição de Pagamento:* ${prazo}${linkSecao}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Documento confidencial gerado via ViraPropo AI! Pro_`.trim();
}

export function abrirWhatsAppWeb(texto: string, telefone?: string | null) {
  const telefoneLimpo = telefone ? telefone.replace(/\D/g, "") : "";
  const textoCodificado = encodeURIComponent(texto);
  
  let url = `https://api.whatsapp.com/send?text=${textoCodificado}`;
  if (telefoneLimpo && (telefoneLimpo.length === 10 || telefoneLimpo.length === 11)) {
    const ddi = telefoneLimpo.startsWith("55") ? "" : "55";
    url = `https://api.whatsapp.com/send?phone=${ddi}${telefoneLimpo}&text=${textoCodificado}`;
  }

  window.open(url, "_blank");
}
