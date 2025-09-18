// scripts/seed_db.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = process.env.NODE_ENV || 'development';

(async () => {
  try {
    if (env === 'development' && process.env.DATABASE_URL_LOCAL) {
      // 💻 Modo LOCAL (pg-promise)
      const pgp = require('pg-promise')({});
      const db = pgp(process.env.DATABASE_URL_LOCAL);

      await db.none(
        "INSERT INTO categories(name,slug) VALUES('Geral','geral') ON CONFLICT DO NOTHING;"
      );

      console.log('💻 Seed feito no banco LOCAL');
    } 
    else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // ☁️ Modo SUPABASE (free tier via supabase-js)
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error } = await supabase
        .from('categories')
        .insert([{ name: 'Geral', slug: 'geral' }], { upsert: true });

      if (error) throw error;
      console.log('☁️ Seed feito no SUPABASE');
    } 
    else {
      throw new Error('Nenhuma configuração válida encontrada no .env');
    }

    process.exit(0);
  } catch (err) {
    console.error('Erro no seed:', err);
    process.exit(1);
  }
})();