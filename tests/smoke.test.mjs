const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const cases = [
  { path: "/", expect: 200, name: "landing page" },
  { path: "/blog", expect: 200, name: "blog index" },
  { path: "/podcast", expect: 200, name: "podcast" },
  { path: "/admin/login", expect: 200, name: "admin login" },
  { path: "/admin", expect: [307, 308], name: "admin redireciona p/ login", redirect: "manual" },
  { path: "/blog/post-que-nao-existe", expect: 404, name: "post inexistente 404" },
];

let failed = 0;
for (const c of cases) {
  try {
    const res = await fetch(BASE + c.path, { redirect: c.redirect ?? "follow" });
    const ok = Array.isArray(c.expect) ? c.expect.includes(res.status) : res.status === c.expect;
    console.log(`${ok ? "✅" : "❌"} ${c.name}: ${res.status} (esperado ${c.expect})`);
    if (!ok) failed++;
  } catch (e) {
    console.log(`❌ ${c.name}: erro ${e.message}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
