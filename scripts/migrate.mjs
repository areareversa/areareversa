/**
 * Aplica um arquivo de migração no banco, de forma idempotente.
 *
 * O projeto não usa `prisma migrate deploy` no deploy (a Vercel sobe só o
 * `next build`), então as migrações são aplicadas na mão com este script. Os
 * `ADD COLUMN IF NOT EXISTS` de cada arquivo garantem que rodar duas vezes não
 * quebra nada.
 *
 * Uso: node scripts/migrate.mjs prisma/migrations/<pasta>/migration.sql
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/migrate.mjs <caminho-do-migration.sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query(sql);
  console.log(`✓ migração aplicada: ${file}`);
} catch (err) {
  console.error(`✗ falha ao aplicar ${file}:`, err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
