const pgp = require('pg-promise')({});
require('dotenv').config();
const db = pgp(process.env.DATABASE_URL);
(async () => {
  await db.none("INSERT INTO categories(name,slug) VALUES('Geral','geral') ON CONFLICT DO NOTHING;");
  console.log('Seed done');
  process.exit(0);
})();
