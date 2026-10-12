/**
 * Restaura um backup gerado por scripts/backup.mjs.
 *
 *   node scripts/restore.mjs backups/areareversa-<timestamp>.json.gz [--dry-run]
 *
 * IMPORTANTE: este script APAGA o conteúdo das tabelas antes de inserir.
 * Ele é destrutivo — rode com --dry-run primeiro.
 */
import { Client } from "pg";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";

const gunzipAsync = promisify(gunzip);
const DRY_RUN = process.argv.includes("--dry-run");
const file = process.argv[2];

if (!file || file.startsWith("--")) {
  console.error("uso: node scripts/restore.mjs <arquivo.json.gz> [--dry-run]");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

/**
 * Conexão com fuso fixo em UTC.
 *
 * O pooler do Neon pode entregar sessões com TimeZone diferentes entre si.
 * Como as colunas DateTime são "timestamp without time zone", ler e escrever em
 * sessões com fusos distintos desloca os valores em horas. Fixar UTC em todas
 * as pontas mantém o restore fiel ao original.
 */
function connect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    options: "-c timezone=UTC",
  });
  return client.connect().then(async () => {
    await client.query("SET TIME ZONE 'UTC'");
    return client;
  });
}

const client = await connect();

console.log(`→ lendo ${path.basename(file)}…`);
const raw = file.endsWith(".gz") ? await gunzipAsync(await readFile(file)) : await readFile(file);
const backup = JSON.parse(raw.toString("utf8"));

if (backup.version !== 1 || !backup.tables) {
  console.error("formato de backup não reconhecido");
  process.exit(1);
}

const { tables } = backup;
const names = Object.keys(tables);

// ignora tabelas que não existem no destino (ex.: _prisma_migrations em um banco novo)
const present = [];
const missing = [];
for (const t of names) {
  const { rows } = await client.query("SELECT to_regclass($1) AS t", [`public.${t}`]);
  if (rows[0].t) present.push(t);
  else missing.push(t);
}
if (missing.length) console.log(`→ ignorando (não existem no destino): ${missing.join(", ")}`);

/**
 * Ordena as tabelas para os pais virem antes dos filhos.
 * Sem isso, "comments" (que referencia "posts") é inserida primeiro e a
 * foreign key estoura.
 */
async function orderByDependency(list) {
  const set = new Set(list);
  const deps = new Map(list.map((n) => [n, []]));

  // pg_catalog e não information_schema: o join por constraint_name em
  // information_schema devolve a FK errada (comments -> comments em vez de
  // comments -> posts) quando há mais de uma tabela no mesmo esquema.
  const { rows } = await client.query(
    `SELECT cl.relname AS child, pr.relname AS parent
       FROM pg_constraint con
       JOIN pg_class cl ON cl.oid = con.conrelid
       JOIN pg_class pr ON pr.oid = con.confrelid
       JOIN pg_namespace n ON n.oid = cl.relnamespace
      WHERE con.contype = 'f' AND n.nspname = 'public'`
  );

  for (const { child, parent } of rows) {
    if (set.has(child) && set.has(parent) && child !== parent) {
      deps.get(child).push(parent);
    }
  }

  const out = [];
  const state = new Map();

  const visit = (n, stack = []) => {
    if (state.get(n) === 1) return;
    if (state.get(n) === 0) {
      console.warn(`! ciclo de dependência: ${[...stack, n].join(" → ")}`);
      return;
    }
    state.set(n, 0);
    for (const p of deps.get(n)) visit(p, [...stack, n]);
    state.set(n, 1);
    out.push(n);
  };

  for (const n of list) visit(n);
  return out;
}

const ordered = await orderByDependency(present);

if (DRY_RUN) {
  console.log("→ dry-run (nada foi alterado)");
  for (const t of ordered) {
    console.log(`   ${t.padEnd(24)} ${String(tables[t].rows.length).padStart(7)} linhas`);
  }
  console.log(`\n${ordered.length} tabela(s), nesta ordem: ${ordered.join(" → ")}`);
  console.log("\nRode sem --dry-run para aplicar.");
  await client.end();
  process.exit(0);
}

console.log(`→ ${ordered.length} tabela(s), nesta ordem: ${ordered.join(" → ")}`);
console.log("→ limpando conteúdo atual…");
await client.query("BEGIN");
try {
  for (const t of ordered) {
    await client.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
    console.log(`   ${t} limpa`);
  }
} catch (err) {
  await client.query("ROLLBACK");
  console.error(`! falha ao limpar: ${err.message}`);
  process.exit(1);
}
await client.query("COMMIT");

console.log("→ inserindo dados…");
let total = 0;
await client.query("BEGIN");
try {
  for (const table of ordered) {
    const { columns, rows } = tables[table];
    if (rows.length === 0) continue;

    const colList = columns.map((c) => `"${c}"`).join(", ");
    const BATCH = 200;

    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      /**
       * Queries parametrizadas — nada de concatenar SQL com dados do arquivo.
       *
       * Timestamps chegam como texto puro do backup (ver comentário em
       * backup.mjs) e são inseridos sem cast: o Postgres interpreta o texto
       * como a data/hora ingênua que já é, em qualquer fuso de sessão.
       */
      const values = [];
      const tuples = slice
        .map((row) => {
          const placeholders = columns
            .map((c) => {
              values.push(row[c] === undefined ? null : row[c]);
              return `$${values.length}`;
            })
            .join(", ");
          return `(${placeholders})`;
        })
        .join(", ");

      await client.query(`INSERT INTO "${table}" (${colList}) VALUES ${tuples}`, values);
      total += slice.length;
    }
  }
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  console.error(`! falha ao inserir: ${err.message}`);
  process.exit(1);
}

console.log(`✓ ${total} linha(s) inserida(s)`);

for (const t of ordered) {
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${t}"`);
  const esperado = tables[t].rows.length;
  const ok = rows[0].n === esperado;
  console.log(`   ${ok ? "✓" : "✗"} ${t.padEnd(24)} ${String(rows[0].n).padStart(7)} linhas`);
}

await client.end();