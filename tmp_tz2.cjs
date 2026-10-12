const { Client } = require("pg");
require("dotenv").config({ path: ".env" });
function urlFor(db) {
  const u = new URL(process.env.DATABASE_URL);
  u.pathname = "/" + (db || "areareversadb");
  return u.toString();
}
(async () => {
  const out = [];
  for (const [nome, db] of [["PROD", ""], ["TESTE", "areareversa_restore_test"]]) {
    const c = new Client({ connectionString: urlFor(db), ssl: { rejectUnauthorized: false } });
    await c.connect();
    const r = await c.query(`SELECT "updatedAt"::text AS bruto, current_setting('TimeZone') AS tz, current_setting('TimeZone')::interval AS off FROM "settings" WHERE key='email_from'`);
    out.push(nome + ": bruto=" + r.rows[0].bruto + " tz=" + r.rows[0].tz + " off=" + r.rows[0].off);
    await c.end();
  }
  console.log(out.join("\n"));
})().catch(e => console.log("ERRO " + e.message));
