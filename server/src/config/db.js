const pgp = require('pg-promise')({});
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}
const db = pgp(process.env.DATABASE_URL);
module.exports = db;
