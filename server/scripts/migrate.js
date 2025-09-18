const fs = require('fs');
const path = require('path');
const pgp = require('pg-promise')({});

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = process.env.NODE_ENV || 'development';

// Escolhe a URL de conexão
const databaseUrl = env === 'development' && process.env.DATABASE_URL_LOCAL
  ? process.env.DATABASE_URL_LOCAL
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL (ou DATABASE_URL_LOCAL) não está definido no .env');
}

const db = pgp(databaseUrl);

(async () => {
  try {
    console.log(`🌍 Rodando migrations no ambiente: ${env}`);
    const dir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(dir).sort();

    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      console.log('Running', f);
      await db.none(sql);
    }

    console.log('✅ Migrations concluídas com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro nas migrations:', err);
    process.exit(1);
  }
})();