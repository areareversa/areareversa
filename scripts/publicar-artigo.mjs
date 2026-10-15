#!/usr/bin/env node
/**
 * publica-artigo.mjs — leva um rascunho de rascunhos/ para o Postgres.
 *
 *   node scripts/publicar-artigo.mjs rascunhos/meu-artigo.md            # simula
 *   node scripts/publicar-artigo.mjs rascunhos/meu-artigo.md --publicar  # grava
 *
 * O QUE ELE FAZ, E POR QUE
 *   1. roda o verificador ANTES de qualquer escrita. Se reprovar, não grava.
 *      É aqui que a folha de verificação vira código, em vez de depender
 *      de alguém lembrar.
 *   2. mostra o diff contra o que está no banco. Você vê o que muda
 *      antes de mudar.
 *   3. grava só com --publicar. Sem a flag, nada é escrito.
 *
 * O QUE ELE NÃO FAZ
 *   Não confere afirmação jurídica. Ele pega erro mecânico: lixo de
 *   digitação, frase categórica sem lastro, bloco obrigatório faltando,
 *   número que não bate. A conferência do conteúdo é humana e continua
 *   obrigatória — o script não a substitui, ele cobra que ela aconteceu.
 *
 * FRONT MATTER (só para artigo novo)
 *
 *   ---
 *   title: Título do artigo
 *   slug: slug-do-artigo
 *   excerpt: Resumo de uma linha, aparece na home e no sitemap.
 *   category: Congresso Nacional
 *   tags: [MEI, teto de faturamento]
 *   coverImage: https://...   (opcional; sem isso o card gerado é usado)
 *   ---
 *
 *   # Primeiro parágrafo do markdown...
 *
 * O H1 do markdown é dispensável: a página mostra o título num <h1> e o
 * Markdown rebaixa "# " para <h2>. Deixar o "# " duplica o título na tela.
 */

// o node-postgres avisa sobre sslmode=prefer em toda conexao e polui a saida.
// O aviso e sobre a URL de exemplo do plano; a conexao abaixo ja e explicita.
process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (/SSL modes/.test(w.message)) return;
  console.warn(w.name + ": " + w.message);
});

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

const ARGS = process.argv.slice(2);
const PUBLICAR = ARGS.includes("--publicar");
const arquivo = ARGS.find((a) => !a.startsWith("--"));
const SLUG_FLAG = (ARGS.find((a) => a.startsWith("--slug=")) || "").split("=")[1];

// ---------------------------------------------------------------- utilidades
const TTY = process.stdout.isTTY;
const c = {
  ok: (s) => (TTY ? `\x1b[32m${s}\x1b[0m` : s),
  aviso: (s) => (TTY ? `\x1b[33m${s}\x1b[0m` : s),
  erro: (s) => (TTY ? `\x1b[31m${s}\x1b[0m` : s),
  negrito: (s) => (TTY ? `\x1b[1m${s}\x1b[0m` : s),
};

function frontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, corpo: raw };
  const meta = {};
  for (const linha of m[1].split("\n")) {
    const kv = linha.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^["']|["']$/g, "");
    if (v.startsWith("[")) {
      try {
        v = JSON.parse(v.replace(/'/g, '"'));
      } catch {
        v = v.replace(/[[\]]/g, "").split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      }
    }
    meta[kv[1]] = v;
  }
  return { meta, corpo: raw.slice(m[0].length) };
}

function diffSimples(a, b) {
  const A = a.split("\n"), B = b.split("\n");
  let add = 0, rem = 0;
  const setA = new Set(A), setB = new Set(B);
  for (const l of A) if (l.trim() && !setB.has(l)) rem++;
  for (const l of B) if (l.trim() && !setA.has(l)) add++;
  return { add, rem, total: A.length + B.length };
}

// ------------------------------------------------------------------ execução
if (!arquivo) {
  console.error(c.erro("uso: node scripts/publicar-artigo.mjs <rascunho.md> [--publicar] [--slug=...]"));
  process.exit(2);
}

let bruto;
try {
  bruto = readFileSync(arquivo, "utf8");
} catch {
  console.error(c.erro("nao consegui ler " + arquivo));
  process.exit(2);
}

const { meta, corpo } = frontMatter(bruto.replace(/\r\n/g, "\n"));

if (!corpo.trim() || corpo.trim().length < 200) {
  console.error(c.erro("rascunho vazio ou curto demais (menos de 200 chars de conteudo)"));
  process.exit(2);
}

console.log();
console.log(c.negrito("  rascunho: ") + arquivo);
console.log(c.negrito("  conteudo: ") + corpo.length + " chars");

// --------------------------------------------------------- 1. verificador
console.log();
console.log(c.negrito("  1. verificador automatico"));

let veredito;
try {
  veredito = execFileSync("node", ["scripts/verificar-artigo.mjs", arquivo], { encoding: "utf8" });
  console.log(veredito.trimEnd());
  if (/REPROVADO/.test(veredito)) {
    console.log();
    console.log(c.erro("  nao publicado: o verificador reprovou. Corrija e rode de novo."));
    process.exit(1);
  }
} catch (e) {
  const s = String(e.stdout || "");
  console.log(s.trimEnd());
  console.log();
  console.log(c.erro("  nao publicado: o verificador reprovou. Corrija e rode de novo."));
  process.exit(1);
}

// -------------------------------------------------------- 2. conexao/estado
console.log();
console.log(c.negrito("  2. estado no banco"));

const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();

const slug = SLUG_FLAG || meta.slug || arquivo.replace(/^.*[\\/]/, "").replace(/\.md$/i, "");
const existe = await db.query(`SELECT slug, length(content) AS len, "readingMinutes" AS rm, "coverImage" AS capa FROM posts WHERE slug = $1`, [slug]);

if (!existe.rowCount) {
  if (!PUBLICAR) {
    await db.end();
    console.log(c.aviso("  artigo NOVO — slug: " + slug));
    const falta = [];
    if (!meta.title) falta.push("title");
    if (!meta.excerpt) falta.push("excerpt");
    if (!meta.category) falta.push("category");
    if (falta.length) {
      console.log(c.erro("  faltou no front matter: " + falta.join(", ")));
      console.log("  (a secao do topo deste arquivo explica o formato)");
      process.exit(1);
    }
    console.log("  Novo post: " + JSON.stringify({ titulo: meta.title, categoria: meta.category, tags: meta.tags || [] }));
    console.log();
    console.log(c.aviso("  SIMULACAO. Para criar mesmo, rode com --publicar."));
    process.exit(0);
  }
} else {
  const atual = existe.rows[0];
  console.log("  ja existe: " + atual.len + " chars | " + atual.rm + " min | capa: " + (atual.capa ? "sim" : "nao"));
  const d = diffSimples(atual.len ? (await db.query(`SELECT content FROM posts WHERE slug=$1`, [slug])).rows[0].content : "", corpo);
  console.log(c.negrito("  diff: ") + d.rem + " linha(s) removida(s), " + d.add + " adicionada(s)");
}

// ------------------------------------------------------------ 3. gravacao
if (!PUBLICAR) {
  await db.end();
  console.log();
  console.log(c.aviso("  SIMULACAO — nada foi gravado."));
  console.log("  Para publicar de verdade: acrescente --publicar");
  console.log();
  process.exit(0);
}

console.log();
console.log(c.negrito("  3. gravando"));

if (!existe.rowCount) {
  const id = "post_" + require("crypto").randomBytes(12).toString("hex");
  await db.query(
    `INSERT INTO posts (id, slug, title, excerpt, content, "coverImage", category, author, tags, published, "publishAt", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,NOW(),NOW(),NOW())`,
    [id, slug, meta.title, meta.excerpt, corpo, meta.coverImage || null, meta.category || "Geral",
     meta.author || "área reversa", Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : [])]
  );
  console.log("  criado: " + slug);
} else {
  if (meta.title || meta.excerpt || meta.category) {
    await db.query(
      `UPDATE posts SET content=$1,
         title   = COALESCE($2, title),
         excerpt = COALESCE($3, excerpt),
         category= COALESCE($4, category),
         "coverImage" = COALESCE($5, "coverImage"),
         "updatedAt" = NOW()
       WHERE slug=$6`,
      [corpo, meta.title || null, meta.excerpt || null, meta.category || null, meta.coverImage || null, slug]
    );
    console.log("  atualizado: " + slug);
  } else {
    await db.query(`UPDATE posts SET content=$1, "updatedAt"=NOW() WHERE slug=$2`, [corpo, slug]);
    console.log("  conteudo atualizado: " + slug);
  }
}

await new Promise((r) => setTimeout(r, 1500));
const fim = await db.query(`SELECT length(content) AS len, "readingMinutes" AS rm, "searchVector" IS NOT NULL AS idx FROM posts WHERE slug=$1`, [slug]);
console.log("  " + fim.rows[0].len + " chars | " + fim.rows[0].rm + " min de leitura | indiceado: " + (fim.rows[0].idx ? "sim" : "nao"));
await db.end();

console.log();
console.log(c.ok("  publicado."));
console.log();
console.log("  O site atualiza sozinho em ~60s (ISR). Para conferir:");
console.log("    node scripts/verificar-artigo.mjs " + arquivo);
console.log("    e abra https://www.areareversa.com.br/blog/" + slug);
console.log();