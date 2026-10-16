// Extrator de texto de PDF com fontes subsetadas.
// A Camera gera PDF com /Type0 + /Identity-H + /ToUnicode: o texto esta no
// arquivo, mas cada caractere e um CID de 2 bytes mapeado por um CMap.
// Sem aplicar o CMap, sai lixo. Aqui aplicamos.
import fs from "node:fs";
import zlib from "node:zlib";

export function extrairPdf(buf) {
  const s = buf.toString("latin1");

  // ---- 1. quebra o arquivo em objetos N 0 obj ... endobj ----
  //      Cuidado: casar "12 0 obj" dentro de dados binarios de stream cria
  //      objetos fantasma e come o conteudo real. Depois de achar um objeto,
  //      o cursor salta para depois do seu endobj.
  const objs = new Map();
  const reObj = /(\d+)\s+0\s+obj\b/g;
  let m;
  while ((m = reObj.exec(s)) !== null) {
    const num = Number(m[1]);
    const ini = m.index + m[0].length;
    let fim = s.indexOf("endobj", ini);
    if (fim === -1) fim = s.length;
    const k = s.indexOf("stream", ini);
    if (k !== -1 && k < fim) {
      const fe = s.indexOf("endstream", k);
      if (fe !== -1) {
        fim = s.indexOf("endobj", fe);
        if (fim === -1) fim = s.length;
      }
    }
    if (objs.has(num)) continue;
    objs.set(num, { ini, fim, corpo: s.slice(ini, fim) });
    reObj.lastIndex = fim;
  }

  // ---- 2. infla o stream de um objeto, se houver ----
  function streamDe(o) {
    if (!o) return null;
    const k = o.corpo.indexOf("stream");
    if (k === -1) return null;
    let ini = o.corpo.indexOf("\n", k) + 1;
    if (ini === 0) ini = k + 6;
    const fim = o.corpo.indexOf("endstream", ini);
    if (fim === -1) return null;
    const bruto = Buffer.from(o.corpo.slice(ini, fim), "latin1");
    try { return zlib.inflateSync(bruto).toString("latin1"); }
    catch { try { return zlib.inflateRawSync(bruto).toString("latin1"); } catch { return bruto.toString("latin1"); } }
  }

  // ---- 3. le um CMap ToUnicode: bfchar e bfrange ----
  function leCMap(txt) {
    const mapa = new Map();
    for (const bloco of txt.match(/beginbfchar([\s\S]*?)endbfchar/g) || []) {
      for (const par of bloco.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || []) {
        const mm = par.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
        mapa.set(parseInt(mm[1], 16), utf16(mm[2]));
      }
    }
    for (const bloco of txt.match(/beginbfrange([\s\S]*?)endbfrange/g) || []) {
      // <lo> <hi> <dst>
      for (const par of bloco.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || []) {
        const a = par.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
        const lo = parseInt(a[1], 16), hi = parseInt(a[2], 16), base = parseInt(a[3], 16);
        for (let c = lo; c <= hi && c - lo < 4096; c++) mapa.set(c, String.fromCharCode(base + (c - lo)));
      }
      // <lo> <hi> [ <d1> <d2> ... ]
      for (const par of bloco.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g) || []) {
        const a = par.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/);
        const lo = parseInt(a[1], 16);
        const dsts = [...a[3].matchAll(/<([0-9A-Fa-f]+)>/g)].map((d) => utf16(d[1]));
        dsts.forEach((d, i) => mapa.set(lo + i, d));
      }
    }
    return mapa;
  }
  function utf16(hex) {
    const n = parseInt(hex, 16);
    return String.fromCharCode(n);
  }

  // ---- 4. fontes: objeto -> {cmap, w} ----
  // A largura do codigo NAO e uniforme no PDF. Fonte /TrueType e /Type1 tem
  // codigo de 1 byte; so /Type0 com /Identity-H usa CID de 2 bytes. Ler tudo
  // em 2 bytes quebra o texto e produz "a" repetido.
  const fonteInfo = new Map();         // objNum -> { cmap, w }
  for (const [num, o] of objs) {
    const sub = (o.corpo.match(/\/Subtype\s*\/(\w+)/) || [])[1];
    const tu = o.corpo.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
    if (!sub && !tu) continue;
    let cmap = null;
    if (tu) {
      const t = streamDe(objs.get(Number(tu[1])));
      if (t && /begincmap/.test(t)) cmap = leCMap(t);
    }
    if (!cmap) continue;
    const w = sub === "Type0" ? 2 : 1;
    fonteInfo.set(num, { cmap, w });
  }
  // Nome de recurso -> objeto de fonte. Em vez de caçar o dicionario /Font
  // (que pode ser indireto e ter chaves aninhadas), varre todos os pares
  // /Nome N 0 R do arquivo e so aceita os que apontam para um objeto que e
  // mesmo uma fonte. Barato, e nao depende da estrutura do PDF.
  const nomeParaFonte = new Map();
  for (const [, o] of objs) {
    for (const p of o.corpo.matchAll(/\/([A-Za-z][A-Za-z0-9]{0,7})\s+(\d+)\s+0\s+R/g)) {
      const num = Number(p[2]);
      if (fonteInfo.has(num)) nomeParaFonte.set(p[1], num);
    }
  }

  // ---- 5. decodifica uma string de conteudo usando um CMap ----
  function decodifica(bruto, cmap, doisBytes) {
    let out = "";
    const passo = doisBytes ? 2 : 1;
    for (let i = 0; i < bruto.length; i += passo) {
      const chave = passo === 2 ? (bruto.charCodeAt(i) << 8) | bruto.charCodeAt(i + 1) : bruto.charCodeAt(i);
      out += cmap.get(chave) ?? "";
    }
    return out;
  }

  // ---- 6. percorre os streams de conteudo na ordem das paginas ----
  //      a ordem dos objetos no arquivo costuma seguir a ordem de leitura
  const fluxos = [];
  for (const [num, o] of objs) {
    if (!/\/Length\s/.test(o.corpo)) continue;
    const t = streamDe(o);
    if (t && /\bBT\b/.test(t) && /(\bTj\b|\bTJ\b)/.test(t)) fluxos.push({ num, txt: t });
  }

  if (process.env.PDF_DEBUG) {
    console.error("[pdf] objetos=" + objs.size +
      "  fontes=" + [...fonteInfo].map(([n, i]) => n + "(w=" + i.w + ")").join(","));
    console.error("[pdf] recursos=" + [...nomeParaFonte].map(([k, v]) => k + "->" + v).join(" "));
    console.error("[pdf] streams=" + fluxos.map((f) => f.num).join(","));
  }

  const RE_TOKENS = /\/([A-Za-z0-9]+)\s+[\d.]+\s+Tf|\((?:\\.|[^\\()])*\)\s*Tj|<([0-9A-Fa-f\s]+)>\s*Tj|\[((?:[^\[\]\\]|\\.)*)\]\s*TJ|T\*|ET/g;

  function pushHex(arr, hex) {
    const l = hex.replace(/\s/g, "");
    if (l.length % 2 !== 0) return;
    for (let i = 0; i < l.length; i += 2) arr.push(parseInt(l.slice(i, i + 2), 16));
  }

  // Acumula BYTES (nao string) e so decodifica no fim de cada show, porque
  // o texto vem em pedacos: <...>Tj direto e [<...>-141<...>]TJ dentro de array.
  // Os numeros soltos do array sao kerning e nao entram.
  function decodificaFluxo(t, fonteFixa) {
    let fonteAtual = fonteFixa || null;
    let bytes = [];
    let saida = "";
    const descar = () => {
      if (!fonteAtual || bytes.length < fonteAtual.w) { bytes = []; return; }
      const w = fonteAtual.w;
      let s = "";
      for (let i = 0; i + w - 1 < bytes.length; i += w) {
        const chave = w === 2 ? (bytes[i] << 8) | bytes[i + 1] : bytes[i];
        s += fonteAtual.cmap.get(chave) ?? "";
      }
      saida += s;
      bytes = [];
    };
    const deLiteral = (s) => {
      const c = s.replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8))).replace(/\\(.)/g, "$1");
      for (const ch of c) bytes.push(ch.charCodeAt(0) & 0xff);
    };

    for (const tk of t.match(RE_TOKENS) || []) {
      const sel = tk.match(/^\/([A-Za-z0-9]+)\s+[\d.]+\s+Tf$/);
      if (sel) {
        descar();
        if (!fonteFixa) fonteAtual = fonteInfo.get(nomeParaFonte.get(sel[1])) || fonteAtual;
        continue;
      }
      if (tk === "ET" || tk === "T*") { descar(); saida += "\n"; continue; }

      if (tk.startsWith("(")) { deLiteral(tk.slice(tk.indexOf("(") + 1, tk.lastIndexOf(")"))); descar(); continue; }

      const hx = tk.match(/^<([0-9A-Fa-f\s]+)>/);
      if (hx) { pushHex(bytes, hx[1]); descar(); continue; }

      const arr = tk.match(/^\[([\s\S]*)\]\s*TJ$/);
      if (arr) {
        for (const el of arr[1].match(/<[0-9A-Fa-f\s]+>|\((?:\\.|[^\\()])*\)/g) || []) {
          if (el.startsWith("<")) pushHex(bytes, el.slice(1, -1));
          else deLiteral(el.slice(1, -1));
        }
        descar();
      }
    }
    descar();
    return saida;
  }

  // nota: quanto mais palavra portuguesa legivel, melhor a decodificacao
  function nota(s) {
    const letras = (s.match(/[A-Za-zÀ-ÿ]/g) || []).length;
    const palavras = (s.match(/[a-zà-ú]{3,}/gi) || []).length;
    const controle = (s.match(/[\x00-\x08\x0E-\x1F]/g) || []).length;
    return palavras * 3 + letras * 0.05 - controle * 2;
  }

  const paginas = fluxos.map((f) => {
    const direta = decodificaFluxo(f.txt, null);
    if (nota(direta) > 20) return direta;
    // fallback: tenta cada fonte do documento como se fosse a unica
    let melhor = direta, melhorNota = nota(direta);
    for (const [, info] of fonteInfo) {
      const alt = decodificaFluxo(f.txt, info);
      const n = nota(alt);
      if (n > melhorNota) { melhor = alt; melhorNota = n; }
    }
    // Se nada decodificou com qualidade, o stream e irrelevante (assinatura,
    // marca d'agua, camada de imagem). Devolve vazio em vez de lixo: texto
    // falso e pior que texto faltando, porque nao se sabe o que e lenda.
    return melhorNota > 20 ? melhor : "";
  });

  return paginas.join("\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

if (process.argv[1] && process.argv[1].endsWith("extrair-pdf.mjs")) {
  for (const arq of process.argv.slice(2)) {
    const t = extrairPdf(fs.readFileSync(arq));
    const bons = (t.match(/[a-zà-ú]{3,}/gi) || []).length;
    console.log("\n===== " + arq + " =====");
    console.log("  " + t.length + " chars, " + bons + " trechos de palavra");
    console.log("---");
    console.log(t.slice(0, 1400));
  }
}