import { isVisible, publishedFilter } from "../src/lib/posts";
import { readingTimeMinutes } from "../src/lib/readingTime";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let failed = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed++;
}

const now = new Date();
check("post publicado sem data é visível", isVisible({ published: true, publishAt: null }, now));
check("post agendado no futuro não é visível", !isVisible({ published: true, publishAt: new Date(Date.now() + 86400000) }, now));
check("post agendado no passado é visível", isVisible({ published: true, publishAt: new Date(Date.now() - 86400000) }, now));
check("rascunho não é visível", !isVisible({ published: false, publishAt: null }, now));
check("publishedFilter tem published: true", publishedFilter(now).published === true);
check("readingTime mínimo 1 min", readingTimeMinutes("oi") === 1);
check("readingTime de texto longo", readingTimeMinutes("palavra ".repeat(800)) >= 3);

/**
 * Arquivo de tradução com JSON inválido derruba o layout `[locale]` inteiro
 * (e o site inteiro, junto). Foi exatamente o que aconteceu: um `\n` literal
 * no meio do pt-BR.json. Barra aqui antes de chegar em produção.
 */
const messageFiles = ["pt-BR.json", "en-US.json", "es-ES.json"];
const keysOf = (obj: Record<string, unknown>, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? keysOf(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );

const parsed: Record<string, Record<string, unknown>> = {};
for (const file of messageFiles) {
  try {
    parsed[file] = JSON.parse(readFileSync(join(process.cwd(), "messages", file), "utf8"));
    check(`messages/${file} é JSON válido`, true);
  } catch (e) {
    check(`messages/${file} é JSON válido (${(e as Error).message})`, false);
  }
}

const reference = parsed["pt-BR.json"] ? keysOf(parsed["pt-BR.json"]) : [];
for (const file of messageFiles) {
  if (!parsed[file]) continue;
  const keys = keysOf(parsed[file]);
  const missing = reference.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !reference.includes(k));
  check(`messages/${file} tem as mesmas chaves do pt-BR`, missing.length === 0 && extra.length === 0);
}

process.exit(failed ? 1 : 0);
