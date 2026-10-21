import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const slug = 'o-debate-da-band-a-engenharia-reversa-do-espetaculo-lula-x-flavio';

const ptContent = fs.readFileSync('rascunhos/debate-band-proposta.md', 'utf8');
let cleanPt = ptContent;
if (cleanPt.startsWith('---')) cleanPt = cleanPt.split('---', 3)[2].trimStart();

const esContent = fs.readFileSync('rascunhos/debate-band-es.md', 'utf8');
const enContent = fs.readFileSync('rascunhos/debate-band-en.md', 'utf8');

console.log('PT:', cleanPt.length, 'chars');
console.log('ES:', esContent.length, 'chars');
console.log('EN:', enContent.length, 'chars');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected');
  
  const res = await client.query(
    `UPDATE posts 
     SET content = $1, content_en = $2, content_es = $3, "updatedAt" = now()
     WHERE slug = $4`,
    [cleanPt, enContent, esContent, slug]
  );
  console.log('Rows updated:', res.rowCount);
  
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });