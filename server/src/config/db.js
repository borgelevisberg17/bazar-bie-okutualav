const pgp = require('pg-promise')({});
const db = pgp(process.env.DATABASE_URL || 'postgres://borge:senha@localhost:5432/bazar');
module.exports = db;
