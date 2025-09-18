/**
 * Convenience script to run migrations programmatically (node server/migrate_local.js)
 */
const fs = require('fs');
const path = require('path');
const pgp = require('pg-promise')({});
require('dotenv').config();
const db = pgp(process.env.DATABASE_URL || 'postgresql://postgres:[oku@borge@]@db.abttphyctsrhnbontaai.supabase.co:5432/postgres?sslmode=require');

(async () => {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log('Running', f);
    await db.none(sql);
  }
  console.log('Migrations complete');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
