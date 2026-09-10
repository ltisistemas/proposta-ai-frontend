const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const conn = (process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL || '').split('?')[0];
const pool = new Pool({
  connectionString: conn,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT id, numero, conteudo_html FROM propostas WHERE id = '02f5ed5b-d7cb-42d9-8230-36f87ab6657d'");
    if (res.rows.length === 0) {
      console.log('Proposta não encontrada pelo id exato.');
      const all = await pool.query("SELECT id, numero FROM propostas LIMIT 10");
      console.log('Todas propostas:', all.rows);
    } else {
      console.log('Proposta encontrada:', res.rows[0].numero, res.rows[0].plano);
      const fs = require('fs');
      fs.writeFileSync('./temp_prop_02f5ed5b.html', res.rows[0].conteudo_html);
      console.log('Arquivo salvo em ./temp_prop_02f5ed5b.html');
    }
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await pool.end();
  }
}

main();
