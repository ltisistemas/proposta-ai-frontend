const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

let connectionString =
  process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment");
  process.exit(1);
}

// Clean query params so pg doesn't force strict certificate verification
connectionString = connectionString.split("?")[0];

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  console.log("Connecting to PostgreSQL...");
  const sqlPath = path.join(__dirname, "init-db.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  try {
    const client = await pool.connect();
    console.log("Connected successfully. Running migration...");
    await client.query(sql);
    console.log("✅ Migration executed successfully! All tables created.");
    client.release();
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
