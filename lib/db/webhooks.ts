import { query } from "./client";

let isTableInitialized = false;

export function _resetTableInitialized(): void {
  isTableInitialized = false;
}

/**
 * Garante a criação da tabela de idempotência e observabilidade para webhooks
 */
export async function garantirTabelaWebhookEventos(): Promise<void> {
  if (isTableInitialized) return;

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS webhook_eventos (
        id VARCHAR(255) PRIMARY KEY,
        evento VARCHAR(100) NOT NULL,
        gateway VARCHAR(50) DEFAULT 'asaas',
        status VARCHAR(50) DEFAULT 'sucesso',
        acao VARCHAR(100),
        usuario_id UUID,
        duracao_ms INT,
        erro_mensagem TEXT,
        payload JSONB,
        processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      DO $$ 
      BEGIN
        BEGIN ALTER TABLE webhook_eventos ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT 'asaas'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE webhook_eventos ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'sucesso'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE webhook_eventos ADD COLUMN IF NOT EXISTS acao VARCHAR(100); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE webhook_eventos ADD COLUMN IF NOT EXISTS usuario_id UUID; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE webhook_eventos ADD COLUMN IF NOT EXISTS duracao_ms INT; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE webhook_eventos ADD COLUMN IF NOT EXISTS erro_mensagem TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_webhook_eventos_processado_em ON webhook_eventos(processado_em DESC);
      CREATE INDEX IF NOT EXISTS idx_webhook_eventos_gateway ON webhook_eventos(gateway);
      CREATE INDEX IF NOT EXISTS idx_webhook_eventos_status ON webhook_eventos(status);
    `);
    isTableInitialized = true;
  } catch (err) {
    console.warn("Aviso ao inicializar tabela webhook_eventos:", err);
  }
}

/**
 * Verifica se um evento já foi processado anteriormente (Idempotência)
 */
export async function verificarEventoProcessado(eventId: string): Promise<boolean> {
  if (!eventId) return false;

  await garantirTabelaWebhookEventos();

  try {
    const res = await query(
      `SELECT id FROM webhook_eventos WHERE id = $1`,
      [eventId]
    );
    return res.rows.length > 0;
  } catch (err) {
    console.warn("Aviso ao verificar idempotência de webhook:", err);
    return false;
  }
}

/**
 * Registra o evento processado (compatibilidade retroativa)
 */
export async function registrarEventoProcessado(
  eventId: string,
  evento: string,
  payload: any
): Promise<void> {
  if (!eventId) return;

  await garantirTabelaWebhookEventos();

  try {
    await query(
      `INSERT INTO webhook_eventos (id, evento, payload, gateway, status, acao)
       VALUES ($1, $2, $3, 'asaas', 'sucesso', 'PROCESSADO')
       ON CONFLICT (id) DO NOTHING`,
      [eventId, evento, JSON.stringify(payload || {})]
    );
  } catch (err) {
    console.warn("Aviso ao salvar registro de webhook processado:", err);
  }
}

export interface RegistroWebhookAuditoria {
  id: string;
  evento: string;
  gateway?: "asaas" | "abacate" | string;
  status?: "sucesso" | "erro" | "aviso" | "duplicado" | string;
  acao?: string; // 'DOWNGRADE_TO_FREE' | 'PLAN_ACTIVATED' | 'DUPLICATE_SKIPPED' | 'UNMATCHED_USER' | 'PAYMENT_UPDATED' | 'ERROR'
  usuarioId?: string | null;
  duracaoMs?: number;
  erroMensagem?: string | null;
  payload: any;
}

/**
 * Registra auditoria estruturada e detalhada do processamento de webhook
 */
export async function registrarEventoAuditoria(
  dados: RegistroWebhookAuditoria
): Promise<void> {
  if (!dados.id) return;

  await garantirTabelaWebhookEventos();

  try {
    await query(
      `INSERT INTO webhook_eventos (id, evento, gateway, status, acao, usuario_id, duracao_ms, erro_mensagem, payload, processado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE 
       SET status = EXCLUDED.status,
           acao = EXCLUDED.acao,
           usuario_id = COALESCE(EXCLUDED.usuario_id, webhook_eventos.usuario_id),
           duracao_ms = EXCLUDED.duracao_ms,
           erro_mensagem = EXCLUDED.erro_mensagem,
           processado_em = CURRENT_TIMESTAMP`,
      [
        dados.id,
        dados.evento,
        dados.gateway || "asaas",
        dados.status || "sucesso",
        dados.acao || null,
        dados.usuarioId || null,
        dados.duracaoMs || 0,
        dados.erroMensagem || null,
        JSON.stringify(dados.payload || {}),
      ]
    );
  } catch (err) {
    console.warn("Aviso ao salvar registro de auditoria de webhook:", err);
  }
}

export interface WebhookEventoRow {
  id: string;
  evento: string;
  gateway: string;
  status: string;
  acao: string | null;
  usuario_id: string | null;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  duracao_ms: number | null;
  erro_mensagem: string | null;
  payload: any;
  processado_em: Date;
}

export interface FiltrosListagemWebhooksAdmin {
  gateway?: string;
  status?: string;
  evento?: string;
  pagina?: number;
  limite?: number;
}

/**
 * Lista eventos de webhook para observabilidade e auditoria no painel admin
 */
export async function listarEventosWebhookAdmin(
  filtros: FiltrosListagemWebhooksAdmin = {}
) {
  await garantirTabelaWebhookEventos();

  const pagina = Math.max(1, filtros.pagina || 1);
  const limite = Math.max(1, Math.min(100, filtros.limite || 20));
  const offset = (pagina - 1) * limite;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filtros.gateway) {
    conditions.push(`w.gateway = $${paramIndex}`);
    values.push(filtros.gateway);
    paramIndex++;
  }

  if (filtros.status) {
    conditions.push(`w.status = $${paramIndex}`);
    values.push(filtros.status);
    paramIndex++;
  }

  if (filtros.evento && filtros.evento.trim()) {
    conditions.push(`LOWER(w.evento) LIKE $${paramIndex}`);
    values.push(`%${filtros.evento.trim().toLowerCase()}%`);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count total
  const countRes = await query(
    `SELECT COUNT(*) as total FROM webhook_eventos w ${whereClause}`,
    values
  );
  const total = parseInt(countRes.rows[0]?.total || "0", 10);

  // Metrics summary
  const metricsRes = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'sucesso') as sucesso,
      COUNT(*) FILTER (WHERE acao = 'DOWNGRADE_TO_FREE') as downgrades,
      COUNT(*) FILTER (WHERE acao = 'PLAN_ACTIVATED') as ativacoes,
      COUNT(*) FILTER (WHERE status = 'erro') as erros
    FROM webhook_eventos
  `);

  const metricas = {
    total: parseInt(metricsRes.rows[0]?.total || "0", 10),
    sucesso: parseInt(metricsRes.rows[0]?.sucesso || "0", 10),
    downgrades: parseInt(metricsRes.rows[0]?.downgrades || "0", 10),
    ativacoes: parseInt(metricsRes.rows[0]?.ativacoes || "0", 10),
    erros: parseInt(metricsRes.rows[0]?.erros || "0", 10),
  };

  values.push(limite);
  const limitIndex = paramIndex++;
  values.push(offset);
  const offsetIndex = paramIndex++;

  const res = await query<WebhookEventoRow>(
    `SELECT 
       w.id, 
       w.evento, 
       w.gateway, 
       w.status, 
       w.acao, 
       w.usuario_id, 
       u.nome as usuario_nome, 
       u.email as usuario_email, 
       w.duracao_ms, 
       w.erro_mensagem, 
       w.payload, 
       w.processado_em
     FROM webhook_eventos w
     LEFT JOIN users u ON w.usuario_id = u.id
     ${whereClause}
     ORDER BY w.processado_em DESC
     LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    values
  );

  return {
    eventos: res.rows,
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite) || 1,
    metricas,
  };
}
