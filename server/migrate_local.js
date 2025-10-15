const fs = require('fs');
const path = require('path');
const pgp = require('pg-promise')({});
const connectionString = process.argv[2];

if (!connectionString) {
  console.error('Please provide a database connection string as an argument.');
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
      await db.tx(async t => {
        await t.none(sql);
        await t.none('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      });
    }

    console.log('Migrations complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
