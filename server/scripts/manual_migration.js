const pgp = require('pg-promise')({});
const connectionString = process.argv[2];
const version = process.argv[3] || '001_initial_schema.sql';

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
    await db.none("INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING", [version]);
    console.log(`Manually marked ${version} as complete`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
