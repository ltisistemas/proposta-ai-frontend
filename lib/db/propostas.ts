import { query, transaction } from "./client";

export interface ItemPropostaInput {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface PropostaRow {
  id: string;
  usuario_id: string;
  numero: string;
  cliente_nome: string;
  cliente_empresa?: string | null;
  cliente_email?: string | null;
  cliente_telefone?: string | null;
  descricao: string;
  conteudo_html: string;
  template_id: string;
  subtotal: number;
  desconto_valor: number;
  total: number;
  prazo_pagamento?: string | null;
  validade_dias: number;
  observacoes?: string | null;
  status: "rascunho" | "enviada" | "aceita" | "recusada";
  data_envio?: Date | null;
  assinante_nome?: string | null;
  assinante_documento?: string | null;
  assinado_em?: Date | null;
  assinatura_ip?: string | null;
  assinatura_hash?: string | null;
  criado_em: Date;
  atualizado_em: Date;
  itens?: any[];
}

export async function salvarProposta(dados: {
  usuarioId: string;
  numero: string;
  clienteNome: string;
  clienteEmpresa?: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  descricao: string;
  conteudoHtml: string;
  templateId?: string;
  subtotal: number;
  descontoValor?: number;
  total: number;
  prazoPagamento?: string;
  validadeDias?: number;
  observacoes?: string;
  status?: "rascunho" | "enviada" | "aceita" | "recusada";
  itens: ItemPropostaInput[];
}): Promise<PropostaRow> {
  return transaction(async (client) => {
    const propResult = await client.query(
      `INSERT INTO propostas (
        usuario_id, numero, cliente_nome, cliente_empresa, cliente_email, 
        cliente_telefone, descricao, conteudo_html, template_id, subtotal, 
        desconto_valor, total, prazo_pagamento, validade_dias, observacoes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        dados.usuarioId,
        dados.numero,
        dados.clienteNome,
        dados.clienteEmpresa || null,
        dados.clienteEmail || null,
        dados.clienteTelefone || null,
        dados.descricao,
        dados.conteudoHtml,
        dados.templateId || "template-1",
        dados.subtotal,
        dados.descontoValor || 0,
        dados.total,
        dados.prazoPagamento || "À Vista",
        dados.validadeDias || 30,
        dados.observacoes || null,
        dados.status || "rascunho",
      ]
    );

    const proposta = propResult.rows[0];

    // Insert items
    if (dados.itens && dados.itens.length > 0) {
      for (let i = 0; i < dados.itens.length; i++) {
        const item = dados.itens[i];
        const itemSubtotal = item.quantidade * item.valorUnitario;
        await client.query(
          `INSERT INTO itens_proposta (
            proposta_id, descricao, quantidade, valor_unitario, subtotal, ordem
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            proposta.id,
            item.descricao,
            item.quantidade,
            item.valorUnitario,
            itemSubtotal,
            i,
          ]
        );
      }
    }

    return proposta;
  });
}

export async function obterPropostasPorUsuario(
  usuarioId: string,
  filtros?: { status?: string; busca?: string }
): Promise<PropostaRow[]> {
  let sql = `
    SELECT p.*, 
      (SELECT json_agg(i.* ORDER BY i.ordem ASC) FROM itens_proposta i WHERE i.proposta_id = p.id) as itens
    FROM propostas p
    WHERE p.usuario_id = $1 AND p.deletado_em IS NULL
  `;
  const params: any[] = [usuarioId];
  let paramIndex = 2;

  if (filtros?.status && filtros.status !== "todos") {
    sql += ` AND p.status = $${paramIndex}`;
    params.push(filtros.status);
    paramIndex++;
  }

  if (filtros?.busca) {
    sql += ` AND (p.cliente_nome ILIKE $${paramIndex} OR p.numero ILIKE $${paramIndex} OR p.cliente_empresa ILIKE $${paramIndex})`;
    params.push(`%${filtros.busca}%`);
    paramIndex++;
  }

  sql += " ORDER BY p.criado_em DESC";

  const result = await query(sql, params);
  return result.rows;
}

export async function obterPropostaPorId(
  id: string,
  usuarioId?: string
): Promise<PropostaRow | null> {
  let sql = `
    SELECT p.*, 
      (SELECT json_agg(i.* ORDER BY i.ordem ASC) FROM itens_proposta i WHERE i.proposta_id = p.id) as itens
    FROM propostas p
    WHERE p.id = $1 AND p.deletado_em IS NULL
  `;
  const params: any[] = [id];

  if (usuarioId) {
    sql += " AND p.usuario_id = $2";
    params.push(usuarioId);
  }

  const result = await query(sql, params);
  return result.rows[0] || null;
}

export async function atualizarStatusProposta(
  id: string,
  usuarioId: string,
  status: "rascunho" | "enviada" | "aceita" | "recusada"
): Promise<PropostaRow | null> {
  const result = await query(
    `UPDATE propostas 
     SET status = $1::varchar, 
         data_envio = CASE WHEN $1::varchar = 'enviada' AND data_envio IS NULL THEN CURRENT_TIMESTAMP ELSE data_envio END,
         atualizado_em = CURRENT_TIMESTAMP
     WHERE id = $2 AND usuario_id = $3 AND deletado_em IS NULL
     RETURNING *`,
    [status, id, usuarioId]
  );
  return result.rows[0] || null;
}

export async function deletarProposta(
  id: string,
  usuarioId: string
): Promise<boolean> {
  const result = await query(
    `UPDATE propostas 
     SET deletado_em = CURRENT_TIMESTAMP 
     WHERE id = $1 AND usuario_id = $2 AND deletado_em IS NULL`,
    [id, usuarioId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function obterMetricasDashboard(usuarioId: string) {
  const result = await query(
    `SELECT 
      COUNT(*) as total_propostas,
      COUNT(CASE WHEN status = 'aceita' THEN 1 END) as propostas_aceitas,
      COUNT(CASE WHEN status = 'enviada' THEN 1 END) as propostas_enviadas,
      COUNT(CASE WHEN status = 'rascunho' THEN 1 END) as propostas_rascunho,
      COUNT(CASE WHEN status = 'recusada' THEN 1 END) as propostas_recusadas,
      COALESCE(SUM(total), 0) as valor_total_pipeline,
      COALESCE(SUM(CASE WHEN status = 'aceita' THEN total ELSE 0 END), 0) as valor_total_fechado
    FROM propostas 
    WHERE usuario_id = $1 AND deletado_em IS NULL`,
    [usuarioId]
  );

  const stats = result.rows[0];
  const total = parseInt(stats.total_propostas, 10) || 0;
  const aceitas = parseInt(stats.propostas_aceitas, 10) || 0;
  const taxaConversao = total > 0 ? ((aceitas / total) * 100).toFixed(1) : "0";

  return {
    totalPropostas: total,
    propostasAceitas: aceitas,
    propostasEnviadas: parseInt(stats.propostas_enviadas, 10) || 0,
    propostasRascunho: parseInt(stats.propostas_rascunho, 10) || 0,
    propostasRecusadas: parseInt(stats.propostas_recusadas, 10) || 0,
    valorTotalPipeline: parseFloat(stats.valor_total_pipeline) || 0,
    valorTotalFechado: parseFloat(stats.valor_total_fechado) || 0,
    taxaConversao: `${taxaConversao}%`,
  };
}

export async function assinarProposta(dados: {
  propostaId: string;
  assinanteNome: string;
  assinanteDocumento: string;
  assinaturaIp?: string;
  assinaturaHash: string;
}): Promise<PropostaRow | null> {
  const result = await query(
    `UPDATE propostas 
     SET status = 'aceita',
         assinante_nome = $1,
         assinante_documento = $2,
         assinado_em = CURRENT_TIMESTAMP,
         assinatura_ip = $3,
         assinatura_hash = $4,
         atualizado_em = CURRENT_TIMESTAMP
     WHERE id = $5 AND deletado_em IS NULL
     RETURNING *`,
    [
      dados.assinanteNome,
      dados.assinanteDocumento,
      dados.assinaturaIp || null,
      dados.assinaturaHash,
      dados.propostaId,
    ]
  );
  return result.rows[0] || null;
}

