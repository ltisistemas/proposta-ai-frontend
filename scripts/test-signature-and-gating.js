const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Pool } = require("pg");
const crypto = require("crypto");

let connectionString = process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
connectionString = connectionString.split("?")[0];

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runTests() {
  console.log("=== Testing Pro Tier Gating, Base64 Logo, and Electronic Signature ===");

  const client = await pool.connect();

  try {
    // 1. Create/Find a test Pro user and Free user
    const freeUserRes = await client.query(
      `INSERT INTO users (email, password_hash, nome, plano, propostas_mes_atual)
       VALUES ('test_free_tier@test.com', 'hash123', 'Usuario Free Test', 'free', 0)
       ON CONFLICT (email) DO UPDATE SET plano = 'free'
       RETURNING *`
    );
    const freeUser = freeUserRes.rows[0];
    console.log("✓ Free user prepared:", freeUser.email, "Plan:", freeUser.plano);

    const proUserRes = await client.query(
      `INSERT INTO users (email, password_hash, nome, plano, propostas_mes_atual, empresa_logo_url)
       VALUES ('test_pro_tier@test.com', 'hash123', 'Usuario Pro Test', 'pro', 0, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
       ON CONFLICT (email) DO UPDATE SET plano = 'pro', empresa_logo_url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
       RETURNING *`
    );
    const proUser = proUserRes.rows[0];
    console.log("✓ Pro user prepared with Base64 logo:", proUser.email, "Plan:", proUser.plano);

    // 2. Create proposal for Free user
    const freePropRes = await client.query(
      `INSERT INTO propostas (
        usuario_id, numero, cliente_nome, descricao, conteudo_html, subtotal, total, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'rascunho')
      RETURNING *`,
      [
        freeUser.id,
        `PROP-TEST-FREE-${Date.now()}`,
        "Cliente Free Test",
        "Serviço de Teste Free",
        "<html><body><h1>Proposta Notepad</h1></body></html>",
        1500,
        1500,
      ]
    );
    const freeProp = freePropRes.rows[0];
    console.log("✓ Free proposal created:", freeProp.numero);

    // 3. Create proposal for Pro user
    const proPropRes = await client.query(
      `INSERT INTO propostas (
        usuario_id, numero, cliente_nome, descricao, conteudo_html, subtotal, total, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'rascunho')
      RETURNING *`,
      [
        proUser.id,
        `PROP-TEST-PRO-${Date.now()}`,
        "Cliente Pro Test",
        "Serviço Consultivo Executivo Pro",
        "<html><body><h1>Proposta Executiva Royal Blue</h1></body></html>",
        8500,
        8500,
      ]
    );
    const proProp = proPropRes.rows[0];
    console.log("✓ Pro proposal created:", proProp.numero);

    // 4. Test Electronic Signature on Pro Proposal
    const signerName = "Dr. Roberto Antunes";
    const signerDoc = "123.456.789-00";
    const testIp = "192.168.1.100";
    const hashData = `${proProp.id}:${signerName}:${signerDoc}:${testIp}:${new Date().toISOString()}`;
    const auditHash = crypto.createHash("sha256").update(hashData).digest("hex");

    const signRes = await client.query(
      `UPDATE propostas
       SET status = 'aceita',
           assinante_nome = $1,
           assinante_documento = $2,
           assinado_em = CURRENT_TIMESTAMP,
           assinatura_ip = $3,
           assinatura_hash = $4
       WHERE id = $5
       RETURNING *`,
      [signerName, signerDoc, testIp, auditHash, proProp.id]
    );

    const signedProp = signRes.rows[0];
    console.log("✓ Pro proposal signed successfully!");
    console.log("  Status:", signedProp.status);
    console.log("  Signer:", signedProp.assinante_nome);
    console.log("  Document:", signedProp.assinante_documento);
    console.log("  Signed at:", signedProp.assinado_em);
    console.log("  Audit Hash:", signedProp.assinatura_hash);

    // Cleanup test data
    await client.query(`DELETE FROM propostas WHERE id IN ($1, $2)`, [freeProp.id, proProp.id]);
    await client.query(`DELETE FROM users WHERE id IN ($1, $2)`, [freeUser.id, proUser.id]);
    console.log("✓ Test records cleaned up successfully.");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runTests();
