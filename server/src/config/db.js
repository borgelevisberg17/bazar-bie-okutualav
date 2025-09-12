const pgp = require('pg-promise')({});
const db = pgp(process.env.DATABASE_URL || 'postgres://bazar:bazarpass@localhost:5432/bazar');
module.exports = db;
