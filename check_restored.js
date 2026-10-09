const { Client } = require('pg');
const client = new Client({ connectionString: "postgresql://neondb_owner:npg_Z4aT9nyDNtiV@ep-raspy-waterfall-b6t4h55t-pooler.c-2.sa-east-1.aws.neon.tech/areareversadb?sslmode=require&channel_binding=require" });

client.connect().then(() => client.query('SELECT slug, title, "coverImage", "createdAt" FROM posts ORDER BY "createdAt" DESC')).then(r => {
  r.rows.forEach(p => console.log(p.slug + ' | ' + p.title + ' | ' + p.coverImage + ' | ' + p.createdAt));
  client.end();
});