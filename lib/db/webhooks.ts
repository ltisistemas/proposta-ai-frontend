import { query } from "./client";

let isTableInitialized = false;

/**
 * Garante a criação da tabela de idempotência para webhooks
 */
export async function garantirTabelaWebhookEventos(): Promise<void> {
  if (isTableInitialized) return;

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS webhook_eventos (
        id VARCHAR(255) PRIMARY KEY,
        evento VARCHAR(100) NOT NULL,
        processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payload JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_webhook_eventos_processado_em ON webhook_eventos(processado_em);
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
 * Registra o evento processado para evitar reprocessamentos futuros
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
      `INSERT INTO webhook_eventos (id, evento, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [eventId, evento, JSON.stringify(payload || {})]
    );
  } catch (err) {
    console.warn("Aviso ao salvar registro de webhook processado:", err);
  }
}
