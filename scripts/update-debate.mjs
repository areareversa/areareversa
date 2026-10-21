// update-debate.mjs - Atualiza apenas o content pt-BR do post do debate
import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const slug = 'o-debate-da-band-a-engenharia-reversa-do-espetaculo-lula-x-flavio';

const content = fs.readFileSync('rascunhos/debate-band-proposta.md', 'utf8');

// Remove frontmatter se houver
let cleanContent = content;
if (cleanContent.startsWith('---')) {
  const parts = cleanContent.split('---');
  if (parts.length >= 3) {
    cleanContent = parts[2].trimStart();
  }
}

console.log('Content length:', cleanContent.length);
console.log('First 200 chars:', cleanContent.slice(0, 200));

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
UPDATE posts
   SET content = $1,
       "updatedAt" = now()
 WHERE slug = $2;
`;

async function run() {
  await client.connect();
  console.log('Connected to DB');
  
  const res = await client.query(sql, [cleanContent, slug]);
  console.log('Rows updated:', res.rowCount);
  
  await client.end();
}

run().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});