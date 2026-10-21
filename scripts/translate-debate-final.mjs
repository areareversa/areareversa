import fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not set');
  process.exit(1);
}

const content = fs.readFileSync('rascunhos/debate-band-proposta.md', 'utf8');
let cleanContent = content;
if (cleanContent.startsWith('---')) {
  const parts = cleanContent.split('---');
  if (parts.length >= 3) cleanContent = parts[2].trimStart();
}

const title = 'O debate da Band: a engenharia reversa do espetáculo Lula x Flávio';
const excerpt = 'Engenharia reversa do debate Band 2026: regulamento, checagem fala a fala, dívida pública, ICMS/estados, caso Ana Clara, Dark Horse/Vorcaro, licença-maternidade, numeração de munições, penas irreversíveis e erro judicial.';

// Split by top-level sections, then split large sections further
const rawSections = cleanContent.split(/^(##\s+.+)$/m);
const sections = [];
let current = rawSections[0];
for (let i = 1; i < rawSections.length; i += 2) {
  const header = rawSections[i];
  const body = rawSections[i + 1] || '';
  const full = header + '\n' + body;
  // Split if too large (>15000 chars)
  if (full.length > 15000) {
    const parts = body.split(/\n\n+/);
    let chunk = header + '\n';
    for (const p of parts) {
      if ((chunk + p).length > 15000) {
        sections.push(chunk.trim());
        chunk = header + '\n' + p + '\n\n';
      } else {
        chunk += p + '\n\n';
      }
    }
    if (chunk.trim().length > header.length + 10) sections.push(chunk.trim());
  } else {
    sections.push(full.trim());
  }
}
if (current.trim()) sections.unshift(current.trim());

console.log(`Split into ${sections.length} sections`);
sections.forEach((s, i) => console.log(`  ${i+1}: ${s.length} chars - ${s.slice(0, 80)}`));

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response: ' + JSON.stringify(data).slice(0, 300));
  const limpo = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const inicio = limpo.indexOf('{');
  const fim = limpo.lastIndexOf('}');
  if (inicio === -1 || fim === -1) throw new Error('No JSON found: ' + text.slice(0, 300));
  return JSON.parse(limpo.slice(inicio, fim + 1));
}

async function translateSection(section, targetLang, idx, total) {
  const idioma = targetLang === 'en' ? 'English' : 'Spanish';
  
  const prompt = `Translate this section of the "Área Reversa" blog (reverse-engineering of ideas, speeches and public policy; critical, direct tone) from Portuguese to ${idioma}.

Rules:
- Natural ${idioma} as a native journalist would write. No literal translation.
- Preserve ALL Markdown: headings (#, ##), lists, links, images, tables, code blocks, blockquotes. Do not remove or reorder.
- Keep proper nouns, Brazilian acronyms and titles as-is (TCU, Centrão, PEC, STF, IBGE, BCB, Cimi, Alerj, TSE, STJ, MP-RJ, PF, PGR, AGU, CNJ). Add parenthetical explanation on first mention if helpful.
- Keep numbers, values and dates identical.
- No comments, warnings or text outside JSON.
- This is section ${idx + 1} of ${total}.

Return ONLY valid JSON:
{"content": "translated Markdown content"}

Portuguese content (section ${idx + 1}/${total}):
${section}`;

  return callGemini(prompt);
}

async function translateMeta(targetLang) {
  const idioma = targetLang === 'en' ? 'English' : 'Spanish';
  const prompt = `Translate to natural ${idioma} for a journalism blog. Return ONLY JSON: {"title": "...", "excerpt": "..."}

Title: ${title}
Excerpt: ${excerpt}`;
  return callGemini(prompt);
}

async function main() {
  for (const targetLang of ['en', 'es']) {
    console.log(`\n=== Translating to ${targetLang.toUpperCase()} ===`);
    
    const meta = await translateMeta(targetLang);
    console.log('Title:', meta.title);
    
    let fullContent = '';
    for (let i = 0; i < sections.length; i++) {
      console.log(`  Section ${i+1}/${sections.length} (${sections[i].length} chars)...`);
      try {
        const result = await translateSection(sections[i], targetLang, i, sections.length);
        fullContent += result.content + '\n\n';
      } catch (e) {
        console.error(`  ERROR on section ${i+1}:`, e.message);
        // Keep original on error
        fullContent += sections[i] + '\n\n';
      }
      await new Promise(r => setTimeout(r, 800));
    }
    
    const filename = `rascunhos/debate-band-${targetLang}.md`;
    fs.writeFileSync(filename, fullContent.trim());
    console.log(`Saved ${filename}: ${fullContent.length} chars`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });