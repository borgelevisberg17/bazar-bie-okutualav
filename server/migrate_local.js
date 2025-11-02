require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pgp = require('pg-promise')({});
const connectionString = process.env.DATABASE_URL_LOCAL;

if (!connectionString) {
  console.error('DATABASE_URL_LOCAL not found in .env file.');
  process.exit(1);
}

const db = pgp(connectionString);

(async () => {
  try {
    await db.none(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY
      );
    `);

    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir).sort();

    for (const f of files) {
      const version = f;
      const result = await db.oneOrNone(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );

      if (result) {
        console.log(`Skipping ${f} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      console.log(`Running ${f}`);
      try {
        await db.tx(async t => {
          await t.none(sql);
          await t.none('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
        });
      } catch (err) {
        // If the error is that the column already exists, we can assume the migration was applied
        // but not recorded in the schema_migrations table.
        if (err.message.includes('already exists')) {
          console.log(`Skipping ${f} (already applied, but not recorded)`);
          await db.none('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
        } else {
          throw err;
        }
      }
    }

    console.log('Migrations complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
