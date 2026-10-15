#!/usr/bin/env node
/**
 * Verificador automático de artigo do Área Reversa.
 *
 *   node scripts/verificar-artigo.mjs <arquivo.md>
 *
 * O QUE ELE FAZ
 *   - lixo de digitação (caracteres CJK/cirílicos, restos de outra língua)
 *   - frases categóricas que já produziram erro factual
 *   - elementos obrigatórios ausentes (data de corte, três camadas, fontes)
 *   - contagem de links de fonte primária
 *
 * O QUE ELE NÃO FAZ — e é o mais importante
 *   Não verifica afirmação jurídica. Ele não abre o Código Civil, nem lê
 *   o art. 14-A, nem confere se o DAS é o do ano certo. Um texto pode passar
 *   100% aqui e continuar errado no essencial.
 *
 *   A verificação que pega erro de conteúdo é HUMANA e com a fonte aberta.
 *   Este script é a rede embaixo, não a rede.
 */

import { readFileSync } from "node:fs";

const ARQ = process.argv[2];
if (!ARQ) {
  console.error("uso: node verificar-artigo.mjs <arquivo.md>");
  process.exit(2);
}

let t;
try {
  t = readFileSync(ARQ, "utf8").replace(/\r\n/g, "\n");
} catch {
  console.error("ERRO: nao consegui ler " + ARQ);
  process.exit(2);
}

const falhas = [];
const avisos = [];

// ---------------------------------------------------------------- 1. lixo
const lixo = t.match(/[\u0400-\u04FF\u3000-\u9FFF\uFF00-\uFFEF]/g);
if (lixo) {
  const unicos = [...new Set(lixo)];
  falhas.push("LIXO DE DIGITACAO: " + unicos.length + " caractere(s) estranho(s)");
  for (const c of unicos.slice(0, 6)) {
    const i = t.indexOf(c);
    falhas.push("    U+" + c.codePointAt(0).toString(16).toUpperCase() + " :: ..." + t.slice(Math.max(0, i - 50), i + 50).replace(/\n/g, " ") + "...");
  }
}

// palavras de outra lingua que escaparam nas reescritas
const estrangeiras = [
  "childcare", "default", "agencies", "negotiation", "payroll", "placeholder",
  "the", "and", "with", "from", "should", "would",
];
const encontradas = estrangeiras.filter((p) => new RegExp("\\b" + p + "\\b", "i").test(t));
if (encontradas.length) avisos.push("palavras em ingles: " + encontradas.join(", "));

// ------------------------------------------------------- 2. frases perigo
//
// CUIDADO COM FALSO-POSITIVO. Um linter que apita em texto correto e pior que
// nenhum: ensina a ignorar. Cada regra so vale quando a frase NAO esta negada
// nem transformada em pergunta — que e o caso do artigo do MEI, que diz
// "este nao trata de divida publica".
//
// O grupo de captura (quando existe) marca a palavra-gatilho. E ela quem fica
// FORA da checagem de negacao, porque "nao" logo antes dela e negacao.
const NEGACAO = /\b(n[aã]o|nunca|jamais|sem|nem|evita|evitar|excepto|excepcional|contr[aá]rio|precisa|pergunta|perguntar|falta|lacuna|indispon[ií]vel|sup[õo]e)\b/i;

const perigo = [
  ["separacao patrimonial do MEI",
    /bens do (?:empres[aá]rio|empresario)[^.]{0,50}n[aã]o respondem/i,
    null,
    "afirma separacao patrimonial: incorrecto para MEI (empresario individual, responsabilidade ilimitada)"],

  // a palavra-gatilho pode vir antes ou depois da referencia ao artigo
  ["art 14-A como divida",
    /art\.?\s*14-?A[^.]{0,90}(d[ií]vida p[uú]blica|cr[eé]dito|endividamento)/i,
    null,
    "art. 14-A da LRF trata de disciplina de beneficio tributario, NAO de divida publica"],
  ["art 14-A como divida (invertido)",
    /(d[ií]vida p[uú]blica|cr[eé]dito|endividamento)[^.]{0,70}art\.?\s*14-?A/i,
    null,
    "art. 14-A da LRF trata de disciplina de beneficio tributario, NAO de divida publica"],

  ["dnao toca no seu CPF",
    /n[aã]o toca no seu CPF/i,
    null,
    "MEI responde com o patrimonio pessoal; a divida e da propria pessoa"],

  ["tres travas de orcamento",
    /tr[eê]s oportunidades distintas de o projeto travar/i,
    null,
    "a LOA e votada pelo Congresso; nao prever travamento e ler como lacuna"],

  ["juros sem fonte",
    /incidem multa e juros/i,
    null,
    "nao afirmar juros sem demonstrar; o risco real e a mudanca de aliquota"],

  ["desenquadramento por hora extra",
    /hora extra[^.]{0,70}(provoca|desenquadra|enquadra|perde o enquadramento)/i,
    null,
    "hora extra e obrigacao CLT; a condicao de enquadramento e outra coisa. Formule como pergunta"],

  ["anistia ja em vigor",
    /(o perd[aã]o|a anistia) (j[aá] )?(vale|esta em vigor|est[aá] em vigor)/i,
    null,
    "nada vale antes de Senado + sancao"],
];



// verbo modal: a frase ja está_marker como hipótese, não como afirmação
const HEDGE = /\b(pode|podem|poder[aá]|podia|poderiam|talvez|provavelmente|em princ[ií]pio|hip[oó]tese)\b/i;

for (const [nome, re, , msg] of perigo) {
  const m = re.exec(t);
  if (!m) continue;

  const ini = m.index;
  const fim = ini + m[0].length;

  // delimita a sentença
  let a = ini;
  while (a > 0 && !/[.!?\n]/.test(t[a - 1])) a--;
  let b = fim;
  while (b < t.length && !/[.!?\n]/.test(t[b])) b++;

  // e uma PERGUNTA? (titulo de FAQ, por exemplo) -> nao e afirmacao
  if (/^\s*\?/.test(t.slice(fim, fim + 2))) continue;

  const antes = t.slice(a, ini);
  const depois = t.slice(fim, b);
  const sentenca = t.slice(a, b);

  // a frase esta marcada como hipotese? -> nao e afirmacao categorica
  if (HEDGE.test(sentenca)) continue;

  // o miolo da frase, sem a palavra-gatilho do fim. So faz sentido em
  // casamento longo; em frase curta remover 16 chars come a frase inteira.
  if (m[0].length > 34 && NEGACAO.test(m[0].slice(0, m[0].length - 16))) continue;

  if (NEGACAO.test(antes.slice(-80))) continue;
  if (NEGACAO.test(depois.slice(0, 50))) continue;

  falhas.push("FRASE PERIGOSA (" + nome + "): " + msg);
  falhas.push("    ..." + sentenca.replace(/\n/g, " ").slice(0, 150) + "...");
}

// ------------------------------------------------------- 3. obrigatorios
const exigidos = [
  ["data de corte", /> \*\*Data de corte\.\*\*/],
  ["bloco tres camadas", /> \*\*Como ler este texto\.\*\*/],
  ["nota de escopo OU bloco do que nao afirma", /> \*\*(Nota de escopo|O que este texto não afirma)\.\*\*/],
];
for (const [nome, re] of exigidos) {
  if (!re.test(t)) falhas.push("AUSENTE: " + nome);
}

// ---------------------------------------------------------- 4. estrutura
const h2 = (t.match(/^## /gm) || []).length;
const h3 = (t.match(/^### /gm) || []).length;
if (h2 < 6) avisos.push("poucas secoes de nivel 2: " + h2);
if (!/## O Veredito/.test(t)) falhas.push("AUSENTE: secao 'O Veredito da Área Reversa'");
if (!/## Caixa de ferramentas/.test(t)) falhas.push("AUSENTE: secao 'Caixa de ferramentas'");
if (!/## Fontes/.test(t)) falhas.push("AUSENTE: secao 'Fontes'");
if (h3 < 3 && /## FAQ/.test(t)) avisos.push("FAQ com poucas perguntas");

// -------------------------------------------------------------- 5. fontes
const links = [...t.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
const primarias = links.filter((u) =>
  /planalto\.gov\.br|camara\.leg\.br|senado\.leg\.br|dadosabertos\.camara|gov\.br|receita\.fazenda|in\.gov\.br|normas\.leg\.br/i.test(u)
);
console.log("LINKS: " + links.length + " | fontes primarias: " + primarias.length);
if (primarias.length === 0) avisos.push("nenhum link de fonte primaria");

// -------------------------------------------------------------- 6. numeros
const numeros = (t.match(/R\$\s*[\d.]+/g) || []).length;
console.log("VALORES MONETARIOS citados: " + numeros);

// ------------------------------------------------------------------ saida
console.log("\nTamanho: " + t.length + " chars | H2: " + h2 + " | H3: " + h3);

if (avisos.length) {
  console.log("\n--- AVISOS (" + avisos.length + ") ---");
  avisos.forEach((a) => console.log("  ! " + a));
}

if (falhas.length) {
  console.log("\n--- FALHAS (" + falhas.length + ") ---");
  falhas.forEach((f) => console.log("  X " + f));
  console.log("\nREPROVADO. Corrija antes de publicar.");
  process.exit(1);
}

console.log("\nMECANICA OK. " + t.length + " chars, " + links.length + " links.");
console.log("");
console.log("  LEMBRE: isto NAO verifica a afirmação juridica de nada.");
console.log("  A folha de verificação da skill e a fonte aberta continuam obrigatorias.");