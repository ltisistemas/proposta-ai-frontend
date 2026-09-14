import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.production" });
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString =
  process.env.DATABASE_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/proposta_ia";

const isRemoteDb =
  connectionString.includes("supabase.co") ||
  connectionString.includes("supabase.com") ||
  connectionString.includes("railway.app") ||
  connectionString.includes("aws-0");

const cleanConnectionString = connectionString.split("?")[0];

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
});

async function main() {
  console.log("🔍 Conectando ao banco de dados...");

  // 1. Consultar usuário admin alvo
  const targetId = "adf4cf5a-eca4-44b7-92f4-d69a376af7b8";
  const targetEmail = "luizltisistemas@gmail.com";

  const userRes = await pool.query(
    `SELECT id, email, nome, role, plano, pro_tipo_concessao, data_proxima_cobranca, criado_em 
     FROM users 
     WHERE id = $1 OR LOWER(email) = LOWER($2)`,
    [targetId, targetEmail]
  );

  console.log("\n👤 Usuário Encontrado:", userRes.rows);

  if (userRes.rows.length === 0) {
    console.error("❌ Usuário alvo não encontrado!");
    const allUsers = await pool.query("SELECT id, email, nome, role FROM users LIMIT 10");
    console.log("Todos os usuários disponíveis:", allUsers.rows);
    await pool.end();
    return;
  }

  const userId = userRes.rows[0].id;

  // 2. Consultar propostas deste usuário
  const propRes = await pool.query(
    "SELECT id, numero, cliente_nome, status, criado_em FROM propostas WHERE usuario_id = $1 ORDER BY criado_em ASC",
    [userId]
  );
  console.log(`\n📄 Propostas do usuário (${propRes.rows.length}):`, propRes.rows);

  // 3. Contagem antes da limpeza
  const countUsers = await pool.query("SELECT COUNT(*) FROM users");
  const countProps = await pool.query("SELECT COUNT(*) FROM propostas");
  const countItens = await pool.query("SELECT COUNT(*) FROM itens_proposta");
  const countPags = await pool.query("SELECT COUNT(*) FROM pagamentos");
  const countWebhooks = await pool.query("SELECT COUNT(*) FROM webhook_eventos");
  const countEmails = await pool.query("SELECT COUNT(*) FROM emails_log");

  console.log("\n📊 Estado Atual da Base:");
  console.log(`- Usuários: ${countUsers.rows[0].count}`);
  console.log(`- Propostas: ${countProps.rows[0].count}`);
  console.log(`- Itens de Proposta: ${countItens.rows[0].count}`);
  console.log(`- Pagamentos: ${countPags.rows[0].count}`);
  console.log(`- Webhook Eventos: ${countWebhooks.rows[0].count}`);
  console.log(`- Emails Log: ${countEmails.rows[0].count}`);

  console.log("\n🧹 Iniciando Limpeza Geral do Banco de Produção...");

  // Identificar a proposta de exemplo a manter (a primeira criada pelo admin)
  let keptProposalId: string | null = null;
  if (propRes.rows.length > 0) {
    keptProposalId = propRes.rows[0].id;
    console.log(`📌 Mantendo a proposta de exemplo ID: ${keptProposalId} (${propRes.rows[0].numero})`);
  }

  // Iniciar transação de limpeza
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // a) Limpar pagamentos
    const delPags = await client.query("DELETE FROM pagamentos");
    console.log(`✓ Pagamentos removidos: ${delPags.rowCount}`);

    // b) Limpar webhook_eventos
    const delWebhooks = await client.query("DELETE FROM webhook_eventos");
    console.log(`✓ Logs de webhook removidos: ${delWebhooks.rowCount}`);

    // c) Limpar emails_log
    const delEmails = await client.query("DELETE FROM emails_log");
    console.log(`✓ Logs de email removidos: ${delEmails.rowCount}`);

    // d) Limpar propostas (excluindo todas exceto a proposta de exemplo do admin)
    let delProps;
    if (keptProposalId) {
      delProps = await client.query(
        "DELETE FROM propostas WHERE id != $1",
        [keptProposalId]
      );
      // Limpar itens que não pertencem à proposta mantida
      const delItens = await client.query(
        "DELETE FROM itens_proposta WHERE proposta_id != $1",
        [keptProposalId]
      );
      console.log(`✓ Itens órfãos removidos: ${delItens.rowCount}`);
    } else {
      delProps = await client.query("DELETE FROM propostas WHERE usuario_id != $1", [userId]);
    }
    console.log(`✓ Propostas de outros usuários/testes removidas: ${delProps.rowCount}`);

    // e) Remover todos os outros usuários
    const delUsers = await client.query(
      "DELETE FROM users WHERE id != $1 AND LOWER(email) != LOWER($2)",
      [userId, targetEmail]
    );
    console.log(`✓ Outros usuários removidos: ${delUsers.rowCount}`);

    // f) Atualizar o usuário Admin (sem assinatura recorrente ativa, role admin, vitalício)
    await client.query(
      `UPDATE users 
       SET role = 'admin',
           plano = 'pro',
           pro_tipo_concessao = 'manual_vitalicio',
           suspenso = FALSE,
           cancelamento_agendado = FALSE,
           data_assinatura = NULL,
           data_proxima_cobranca = NULL,
           data_ultima_verificacao_pagamento = NULL,
           asaas_customer_id = NULL,
           asaas_subscription_id = NULL,
           abacate_customer_id = NULL,
           abacate_subscription_id = NULL,
           propostas_mes_atual = 0,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );
    console.log("✓ Usuário Admin reconfigurado (isento de cobrança/mensalidade e com status limpo).");

    await client.query("COMMIT");
    console.log("\n🎉 Transação concluída com sucesso!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Erro durante a limpeza, transação revertida:", err);
    throw err;
  } finally {
    client.release();
  }

  // 4. Contagem pós-limpeza
  const countUsersAfter = await pool.query("SELECT COUNT(*) FROM users");
  const countPropsAfter = await pool.query("SELECT COUNT(*) FROM propostas");
  const countItensAfter = await pool.query("SELECT COUNT(*) FROM itens_proposta");
  const countPagsAfter = await pool.query("SELECT COUNT(*) FROM pagamentos");
  const countWebhooksAfter = await pool.query("SELECT COUNT(*) FROM webhook_eventos");

  console.log("\n📊 Estado Final da Base:");
  console.log(`- Usuários: ${countUsersAfter.rows[0].count}`);
  console.log(`- Propostas: ${countPropsAfter.rows[0].count}`);
  console.log(`- Itens de Proposta: ${countItensAfter.rows[0].count}`);
  console.log(`- Pagamentos: ${countPagsAfter.rows[0].count}`);
  console.log(`- Webhook Eventos: ${countWebhooksAfter.rows[0].count}`);

  const finalUser = await pool.query("SELECT id, email, nome, role, plano, pro_tipo_concessao FROM users");
  console.log("\n👤 Usuário remanescente:", finalUser.rows);

  const finalProps = await pool.query("SELECT id, numero, cliente_nome, total FROM propostas");
  console.log("📄 Propostas remanescentes:", finalProps.rows);

  await pool.end();
}

main().catch(console.error);
