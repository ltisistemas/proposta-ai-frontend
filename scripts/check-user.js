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
  const res = await pool.query("SELECT id, nome, email, plano, cancelamento_agendado FROM users WHERE id = $1", [userId]);
  console.log("Current user in DB:", res.rows[0]);
  await pool.end();
}

main().catch(console.error);
