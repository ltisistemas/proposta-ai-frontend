import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(process.cwd(), ".env.local");

dotenv.config({ path: envPath });

const rawConnectionString =
  process.env.DATABASE_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/proposta_ia";

const isRemoteDb =
  rawConnectionString.includes("supabase.co") ||
  rawConnectionString.includes("supabase.com") ||
  rawConnectionString.includes("railway.app") ||
  rawConnectionString.includes("aws-0");

const cleanConnectionString = rawConnectionString.split("?")[0];

const pool = new pg.Pool({
  connectionString: cleanConnectionString,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
});

async function main() {
  const userId = "adf4cf5a-eca4-44b7-92f4-d69a376af7b8";
  const userEmail = "luizltisistemas@gmail.com";

  console.log(`Conectando ao banco de dados...`);
  
  // 1. Garantir colunas
  await pool.query(`
    DO $$ 
    BEGIN
      BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'cliente'; EXCEPTION WHEN OTHERS THEN NULL; END;
      BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS suspenso BOOLEAN DEFAULT FALSE; EXCEPTION WHEN OTHERS THEN NULL; END;
      BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_tipo_concessao VARCHAR(50); EXCEPTION WHEN OTHERS THEN NULL; END;
    END $$;
  `);

  // 2. Consulta usuário
  const checkRes = await pool.query(
    `SELECT id, email, nome, role, plano, suspenso FROM users WHERE id = $1 OR LOWER(email) = LOWER($2)`,
    [userId, userEmail]
  );

  console.log("Usuário encontrado no banco:", checkRes.rows);

  if (checkRes.rows.length === 0) {
    console.error("❌ Usuário não encontrado.");
    process.exit(1);
  }

  // 3. Atualiza role para admin
  const updateRes = await pool.query(
    `UPDATE users 
     SET role = 'admin', 
         suspenso = FALSE, 
         atualizado_em = CURRENT_TIMESTAMP 
     WHERE id = $1 OR LOWER(email) = LOWER($2)
     RETURNING id, email, nome, role, plano, suspenso`,
    [userId, userEmail]
  );

  console.log("✅ Usuário promovido para ADMIN com sucesso:", updateRes.rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error("Erro ao atualizar usuário:", err);
  process.exit(1);
});
