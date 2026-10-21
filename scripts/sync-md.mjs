/**
 * Sincroniza os posts publicados (banco) com os arquivos .md de `rascunhos/`.
 *
 *   node scripts/sync-md.mjs [--dry-run] [--create]
 *
 * Regras:
 *   - NUNCA apaga nada. Só escreve e copia.
 *   - O post publicado é a fonte da verdade.
 *   - Só atualiza .md que JÁ EXISTE e cujo frontmatter declara o mesmo `slug`.
 *     Com --create, cria `<slug>.md` para posts que ainda não têm arquivo.
 *   - Quando dois .md declaram o mesmo slug, prefere o que já está idêntico ao
 *     banco; se nenhum estiver, prefere `<slug>.md` e depois o mais recente.
 *     Os demais NÃO são tocados.
 *   - Antes de sobrescrever, copia a versão anterior para `rascunhos/bkp/<timestamp>/`.
 *   - Toda execução grava um retrato completo (pt, en, es) em `rascunhos/bkp/<timestamp>/`.
 *
 * Rodar depois de qualquer alteração feita na publicação.
 */
import { Client } from "pg";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const DRY = process.argv.includes("--dry-run");
const CREATE = process.argv.includes("--create");
const ROOT = process.cwd();
const DIR = path.join(ROOT, "rascunhos");
const BKP_ROOT = path.join(DIR, "bkp");
const URL = process.env.DATABASE_URL;

if (!URL) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

async function connect() {
  const client = new Client({
    connectionString: URL,
    ssl: { rejectUnauthorized: false },
    options: "-c timezone=UTC",
  });
  await client.connect();
  await client.query("SET TIME ZONE 'UTC'");
  return client;
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const BKP_DIR = path.join(BKP_ROOT, stamp);

function frontmatter(post) {
  const tags = Array.isArray(post.tags) ? post.tags : [];
  return [
    "---",
    `title: ${JSON.stringify(post.title)}`,
    `slug: ${post.slug}`,
    `excerpt: ${JSON.stringify(post.excerpt ?? "")}`,
    `category: ${JSON.stringify(post.category ?? "Geral")}`,
    `tags: [${tags.map((t) => JSON.stringify(t)).join(", ")}]`,
    "---",
    "",
  ].join("\n");
}

function body(content) {
  return String(content ?? "").replace(/\r\n/g, "\n").trim() + "\n";
}

function splitFile(text) {
  if (!text.startsWith("---")) return { head: "", body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { head: "", body: text };
  const nl = text.indexOf("\n", end + 1);
  return { head: text.slice(0, nl + 1), body: text.slice(nl + 1) };
}

async function inspect(file) {
  const full = path.join(DIR, file);
  const text = await readFile(full, "utf8");
  const { head, body: b } = splitFile(text);
  const m = head.match(/^slug:\s*(.+)$/m);
  const slug = m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  const { mtimeMs } = await stat(full);
  return { file, full, text, slug, body: b.trim(), mtimeMs };
}

const client = await connect();
const { rows: posts } = await client.query(
  `SELECT slug, title, excerpt, category, tags, content,
          "content_en" AS content_en, "content_es" AS content_es
     FROM posts
    WHERE published = TRUE AND length(coalesce(content, '')) > 0
    ORDER BY "publishAt" ASC NULLS LAST, "createdAt" ASC`,
);
await client.end();

if (posts.length === 0) {
  console.log("nenhum post publicado encontrado");
  process.exit(0);
}

const files = [];
for (const f of await readdir(DIR)) {
  if (!f.endsWith(".md")) continue;
  try {
    files.push(await inspect(f));
  } catch {
    /* ilegível: ignora */
  }
}

const bySlug = new Map();
for (const f of files) {
  if (!f.slug) continue;
  if (!bySlug.has(f.slug)) bySlug.set(f.slug, []);
  bySlug.get(f.slug).push(f);
}

if (!DRY) await mkdir(BKP_DIR, { recursive: true });

let written = 0;
let unchanged = 0;
let backedUp = 0;
let skipped = 0;

for (const post of posts) {
  const nextBody = body(post.content);
  const next = frontmatter(post) + nextBody;
  const candidates = bySlug.get(post.slug) ?? [];

  // escolhe UM arquivo para manter sincronizado — os outros ficam intocados
  let chosen = candidates.find((c) => c.body === nextBody.trim());
  if (!chosen && candidates.length) {
    chosen =
      candidates.find((c) => c.file === `${post.slug}.md`) ??
      candidates.slice().sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  }

  const fileName = chosen?.file ?? `${post.slug}.md`;

  // retrato completo, sempre (não altera nada fora de bkp/)
  if (!DRY) {
    await writeFile(path.join(BKP_DIR, fileName), next, "utf8");
    if (post.content_en) {
      await writeFile(path.join(BKP_DIR, `${post.slug}.en.md`), body(post.content_en), "utf8");
    }
    if (post.content_es) {
      await writeFile(path.join(BKP_DIR, `${post.slug}.es.md`), body(post.content_es), "utf8");
    }
  }

  if (!chosen) {
    if (!CREATE) {
      skipped++;
      console.log(`- ${fileName} (sem .md correspondente; use --create)`);
      continue;
    }
    if (!DRY) await writeFile(path.join(DIR, fileName), next, "utf8");
    written++;
    console.log(`+ ${fileName}`);
    continue;
  }

  if (chosen.body === nextBody.trim()) {
    unchanged++;
    console.log(`= ${fileName}`);
    continue;
  }

  if (!DRY) {
    await writeFile(path.join(BKP_DIR, `antes-${fileName}`), chosen.text, "utf8");
    await writeFile(chosen.full, next, "utf8");
  }
  backedUp++;
  written++;
  console.log(`~ ${fileName} (versão anterior guardada em bkp/)`);
}

console.log(
  `\n${DRY ? "[dry-run] " : ""}${written} gravado(s), ${unchanged} sem mudança, ${backedUp} versão(ões) anterior(es) guardada(s), ${skipped} sem .md`,
);
if (!DRY) console.log(`retrato completo em ${path.relative(ROOT, BKP_DIR)}`);
