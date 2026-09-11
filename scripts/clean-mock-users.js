const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const rawConnectionString =
  process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL;
const cleanConnectionString = rawConnectionString.split("?")[0];
const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const before = await pool.query(
    "SELECT id, nome, email, asaas_customer_id, asaas_subscription_id, plano FROM users"
  );
  console.log("Users before cleanup:", before.rows);

  const cleanResult = await pool.query(
    "UPDATE users SET asaas_customer_id = NULL WHERE asaas_customer_id IS NOT NULL AND asaas_customer_id NOT LIKE 'cus_0000%'"
  );
  console.log("Rows cleaned:", cleanResult.rowCount);

  const after = await pool.query(
    "SELECT id, nome, email, asaas_customer_id, asaas_subscription_id, plano FROM users"
  );
  console.log("Users after cleanup:", after.rows);

  await pool.end();
}

main().catch(console.error);
