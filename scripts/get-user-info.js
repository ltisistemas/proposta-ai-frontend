const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const conn = (process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL).split("?")[0];
const pool = new Pool({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const userId = "adf4cf5a-eca4-44b7-92f4-d69a376af7b8";
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
  const user = res.rows[0];
  console.log("User Data:");
  console.log(JSON.stringify({
    id: user.id,
    nome: user.nome,
    email: user.email,
    plano: user.plano,
    empresa_nome: user.empresa_nome,
    empresa_cnpj: user.empresa_cnpj,
    empresa_telefone: user.empresa_telefone,
    empresa_email: user.empresa_email,
    empresa_logo_url: user.empresa_logo_url,
    propostas_mes_atual: user.propostas_mes_atual
  }, null, 2));
  await pool.end();
}

main().catch(console.error);
