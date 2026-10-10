const { Client } = require('pg');
const client = new Client({ connectionString: "postgresql://neondb_owner:npg_Z4aT9nyDNtiV@ep-royal-river-b6ki9wmf-pooler.c-2.sa-east-1.aws.neon.tech/areareversadb?sslmode=require&channel_binding=require" });

async function testSearch(query) {
  await client.connect();
  const result = await client.query(`
    SELECT 
      p.slug, 
      p.title, 
      p.excerpt, 
      p.category,
      ts_rank_cd(p."searchVector"::tsvector, websearch_to_tsquery('portuguese', $1)) AS rank
    FROM posts p
    WHERE p.published = true 
      AND (p."publishAt" IS NULL OR p."publishAt" <= NOW())
      AND p."searchVector"::tsvector @@ websearch_to_tsquery('portuguese', $1)
    ORDER BY rank DESC, p."createdAt" DESC
    LIMIT 8
  `, [query]);
  
  console.log(`Query: "${query}"`);
  console.log(`Results: ${result.rows.length}`);
  result.rows.forEach((row, i) => {
    console.log(`  ${i+1}. ${row.title} (rank: ${row.rank})`);
  });
}

async function main() {
  await testSearch('urna');
  await testSearch('orçamento');
  await testSearch('brasileira');
  await testSearch('urna eletronica');
  await testSearch('urna OR eletronica');
  await testSearch('urna -eletronica');
  await testSearch('"urna eletronica"');
  await client.end();
}

main().catch(console.error);