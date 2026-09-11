const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const conn = (process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL).split("?")[0];
const pool = new Pool({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
});

async function setPlan(plano) {
  const userId = "adf4cf5a-eca4-44b7-92f4-d69a376af7b8";
  const res = await pool.query(
    "UPDATE users SET plano = $1, cancelamento_agendado = false WHERE id = $2 RETURNING id, nome, email, plano",
    [plano, userId]
  );
  console.log("Updated user plan:", res.rows[0]);
  await pool.end();
}

const targetPlan = process.argv[2] || "free";
setPlan(targetPlan).catch(console.error);
