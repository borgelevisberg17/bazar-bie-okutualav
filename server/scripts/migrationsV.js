/**
 * Migration runner com controle de histórico (pg-promise)
 */
const fs = require('fs');
const path = require('path');
const pgp = require('pg-promise')({});
require('dotenv').config();

const db = pgp(process.env.DATABASE_URL || 'postgres://borge:senha@localhost:5432/bazar');

(async () => {
  // 1. Cria tabela de controle se não existir
  await db.none(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      run_on TIMESTAMP DEFAULT now()
    )
  `);

  // 2. Lê migrations da pasta
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).sort();

  for (const f of files) {
    // 3. Verifica se já foi executada
    const exists = await db.oneOrNone(
      'SELECT 1 FROM migrations WHERE name = $1',
      [f]
    );

    if (exists) {
      console.log(`Ignorando (já aplicada): ${f}`);
      continue;
    }

    // 4. Executa migration
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log(`Rodando migration: ${f}`);
    await db.none(sql);

    // 5. Registra no histórico
    await db.none('INSERT INTO migrations(name) VALUES($1)', [f]);
  }

  console.log('✅ Todas as migrations aplicadas com sucesso');
  process.exit(0);
})().catch(err => {
  console.error('❌ Erro ao aplicar migrations:', err);
  process.exit(1);
});