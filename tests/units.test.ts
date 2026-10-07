import { isVisible, publishedFilter } from "../src/lib/posts";
import { readingTimeMinutes } from "../src/lib/readingTime";

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

process.exit(failed ? 1 : 0);
