/**
 * Backup do banco do PostgreSQL, sem depender do pg_dump.
 *
 *   node scripts/backup.mjs [--out DIR] [--keep N]
 *
 * Gera dois arquivos por execução:
 *   areareversa-<timestamp>.json.gz  → canônico, usado pelo restore.mjs
 *   areareversa-<timestamp>.sql.gz   → legível, restaurável com psql
 *
 * Restaure com:
 *   node scripts/restore.mjs backups/areareversa-<timestamp>.json.gz [--dry-run]
 */
import { Client } from "pg";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const gzipAsync = promisify(gzip);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const OUT_DIR = path.resolve(arg("out", "backups"));
const KEEP = Number(arg("keep", "30"));
const URL = process.env.DATABASE_URL;

if (!URL) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

/**
 * Conexão com fuso fixo em UTC.
 *
 * O pooler do Neon distribui conexões entre computes que podem ter TimeZone
 * diferente (UTC vs America/Sao_Paulo). Como as colunas DateTime do Prisma são
 * "timestamp without time zone", ler e escrever em sessões diferentes desloca
 * o valor em horas e corrompe o backup. Fixar UTC elimina o problema.
 */
function connect() {
  const client = new Client({
    connectionString: URL,
    ssl: { rejectUnauthorized: false },
    options: "-c timezone=UTC",
  });
  return client.connect().then(async () => {
    await client.query("SET TIME ZONE 'UTC'");
    return client;
  });
}

/** ---------- serialização para o dump SQL (só para leitura humana) ---------- */

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (Array.isArray(value)) {
    if (value.length === 0) return "'{}'";
    return `ARRAY[${value.map((v) => sqlLiteral(v)).join(",")}]`;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Buffer.isBuffer(value)) return `'\\x${value.toString("hex")}'`;

  // Aspas simples duplicadas; com standard_conforming_strings ligado o
  // backslash é literal e \r\n dentro do arquivo é preservado.
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** ---------- dump ---------- */

async function dump() {
  const client = await connect();

  const { rows: tableRows } = await client.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name`
  );

  const data = {};
  const summary = [];
  let totalRows = 0;

  for (const { table_name: table } of tableRows) {
    const { rows: cols } = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position`,
      [table]
    );
    if (cols.length === 0) continue;

    const names = cols.map((c) => c.column_name);

    /**
     * Timestamps saem como TEXTO, nunca como Date.
     *
     * As colunas DateTime do Prisma são "timestamp without time zone". O
     * node-postgres converte esse tipo usando o fuso local do processo Node
     * (aqui -03), não o da sessão do Postgres — então ler como Date já
     * desloca o valor em 3 horas antes de qualquer outra etapa. "::text"
     * devolve o valor gravado, sem interpretação, e o round-trip fica exato.
     */
    const tsCols = new Set(
      cols.filter((c) => c.data_type.startsWith("timestamp")).map((c) => c.column_name)
    );
    const selectList = names
      .map((n) => (tsCols.has(n) ? `"${n}"::text AS "${n}"` : `"${n}"`))
      .join(", ");

    let rows;
    try {
      ({ rows } = await client.query(`SELECT ${selectList} FROM "${table}"`));
    } catch (err) {
      console.error(`  ! ${table}: ${err.message}`);
      continue;
    }

    data[table] = { columns: names, rows };
    totalRows += rows.length;
    summary.push({ table, rows: rows.length });
  }

  await client.end();
  return { data, summary, totalRows };
}

function toSql(data) {
  const parts = [
    "-- backup da área reversa",
    `-- gerado em ${new Date().toISOString()}`,
    "--",
    "-- restaurar: psql \"$DATABASE_URL\" -f <arquivo.sql>",
    "-- (o formato canônico para o restore.mjs é o .json.gz ao lado)",
    "",
  ];

  for (const [table, { columns, rows }] of Object.entries(data)) {
    parts.push(`-- ${table} (${rows.length} registros)`);
    if (rows.length === 0) {
      parts.push("");
      continue;
    }
    const colList = columns.map((n) => `"${n}"`).join(", ");
    const BATCH = 200;
    for (let i = 0; i < rows.length; i += BATCH) {
      const values = rows
        .slice(i, i + BATCH)
        .map((r) => `(${columns.map((n) => sqlLiteral(r[n])).join(", ")})`)
        .join(",\n  ");
      parts.push(`INSERT INTO "${table}" (${colList}) VALUES\n  ${values};`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

/** ---------- limpeza ---------- */

async function prune() {
  const files = (await readdir(OUT_DIR)).filter(
    (f) => /^areareversa-.*\.sql\.gz$/.test(f) || /^areareversa-.*\.json\.gz$/.test(f)
  );
  if (files.length <= KEEP * 2) return [];

  // agrupa por timestamp (mesmo nome sem extensão) e mantém os mais novos
  const stems = new Map();
  for (const f of files) {
    const stem = f.replace(/\.(sql|json)\.gz$/, "");
    if (!stems.has(stem)) stems.set(stem, []);
    stems.get(stem).push(f);
  }

  const stamped = await Promise.all(
    [...stems.entries()].map(async ([stem, group]) => ({
      group,
      t: (await stat(path.join(OUT_DIR, group[0]))).mtimeMs,
    }))
  );
  stamped.sort((a, b) => b.t - a.t);

  const removed = [];
  for (const { group } of stamped.slice(KEEP)) {
    for (const f of group) {
      await unlink(path.join(OUT_DIR, f));
      removed.push(f);
    }
  }
  return removed;
}

/** ---------- main ---------- */

const started = Date.now();
await mkdir(OUT_DIR, { recursive: true });

console.log("→ conectando…");
const { data, summary, totalRows } = await dump();

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const base = path.join(OUT_DIR, `areareversa-${stamp}`);
const jsonFile = `${base}.json.gz`;
const sqlFile = `${base}.sql.gz`;

const payload = JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), tables: data });
await writeFile(jsonFile, await gzipAsync(payload));
await writeFile(sqlFile, await gzipAsync(toSql(data)));

console.log("→ tabelas:");
for (const { table, rows } of summary) {
  console.log(`   ${table.padEnd(24)} ${String(rows).padStart(7)} linhas`);
}
console.log(`→ total: ${totalRows} linhas`);
console.log(
  `✓ ${jsonFile} (${((await stat(jsonFile)).size / 1024).toFixed(1)} KB) + .sql.gz (${(
    (await stat(sqlFile)).size / 1024
  ).toFixed(1)} KB) em ${((Date.now() - started) / 1000).toFixed(1)}s`
);

const removed = await prune();
if (removed.length) console.log(`→ ${removed.length} arquivo(s) antigo(s) removido(s)`);