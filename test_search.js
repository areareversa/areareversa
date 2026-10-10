const { Client } = require('pg');
const client = new Client({ connectionString: "postgresql://neondb_owner:npg_Z4aT9nyDNtiV@ep-royal-river-b6ki9wmf-pooler.c-2.sa-east-1.aws.neon.tech/areareversadb?sslmode=require&channel_binding=require" });

client.connect().then(() => client.query('SELECT slug, title, "searchVector" FROM posts WHERE published = true LIMIT 5')).then(r => { 
  r.rows.forEach(row => console.log(row.slug + ' | ' + row.title + ' | searchVector: ' + (row.searchVector ? 'YES (' + row.searchVector.length + ' chars)' : 'NULL')));
  client.end(); 
});