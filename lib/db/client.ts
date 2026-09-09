import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import * as dotenv from "dotenv";

// Ensure .env.local is loaded if running outside Next.js (e.g. standalone scripts)
dotenv.config({ path: ".env.local" });

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
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

    pool = new Pool({
      connectionString: cleanConnectionString,
      max: process.env.DATABASE_POOL_SIZE
        ? parseInt(process.env.DATABASE_POOL_SIZE, 10)
        : 10,
      ssl: isRemoteDb
        ? {
            rejectUnauthorized: false,
          }
        : false,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool();
  const start = Date.now();
  try {
    const result = await p.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log("Executed query", {
        text: text.substring(0, 80).replace(/\n/g, " "),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }
    return result;
  } catch (error) {
    console.error("Database error executing query:", { text, error });
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default getPool;
