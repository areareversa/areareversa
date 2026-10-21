import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(
    'SELECT slug, content_en, content_es FROM posts WHERE slug = $1',
    ['o-debate-da-band-a-engenharia-reversa-do-espetaculo-lula-x-flavio']
  );
  const row = res.rows[0];
  console.log('EN length:', row.content_en ? row.content_en.length : 0);
  console.log('ES length:', row.content_es ? row.content_es.length : 0);
  console.log('EN first 300:', row.content_en ? row.content_en.slice(0, 300) : 'NULL');
  console.log('ES first 300:', row.content_es ? row.content_es.slice(0, 300) : 'NULL');
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });