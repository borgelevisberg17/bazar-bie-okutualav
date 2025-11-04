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

      // Seed Category
      const category = await db.one(
        "INSERT INTO categories(name,slug) VALUES('Eletrônicos','eletronicos') ON CONFLICT(slug) DO UPDATE SET name = 'Eletrônicos' RETURNING id;"
      );

      // Seed User (Seller)
      const user = await db.one(
        `INSERT INTO users(name, email, firebase_uid, role)
         VALUES('Vendedor Fantasma', 'seller@test.com', 'test-seller-uid', 'seller')
         ON CONFLICT(email) DO UPDATE SET name = 'Vendedor Fantasma' RETURNING id;`
      );

      // Seed Product
      await db.none(
        `INSERT INTO products(seller_id, name, description, price, category_id, stock)
         VALUES($1, 'Produto de Teste', 'Esta é uma descrição detalhada do produto de teste.', 99.99, $2, 10)
         ON CONFLICT (name) DO NOTHING;`,
        [user.id, category.id]
      );

      console.log('💻 Seed feito no banco LOCAL com usuário e produto.');
    } 
    else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // ☁️ Modo SUPABASE (free tier via supabase-js)
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: category } = await supabase
        .from('categories')
        .upsert({ name: 'Eletrônicos', slug: 'eletronicos' })
        .select()
        .single();

      const { data: user } = await supabase
        .from('users')
        .upsert({ name: 'Vendedor Fantasma', email: 'seller@test.com', firebase_uid: 'test-seller-uid', role: 'seller' })
        .select()
        .single();

      await supabase
        .from('products')
        .upsert({ seller_id: user.id, name: 'Produto de Teste', description: 'Esta é uma descrição detalhada do produto de teste.', price: 99.99, category_id: category.id, stock: 10 });

      console.log('☁️ Seed feito no SUPABASE com usuário e produto.');
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
