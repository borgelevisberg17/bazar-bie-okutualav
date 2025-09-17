const fs = require('fs');
const path = require('path');
const pgp = require('pg-promise')({});
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const db = pgp(process.env.DATABASE_URL);

(async () => {
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log('Running', f);
    await db.none(sql);
  }
  console.log('Migrations complete');
  process.exit(0);
})();
