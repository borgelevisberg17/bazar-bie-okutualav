const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = process.env.NODE_ENV || 'development';

async function seedLocal() {
  const pgp = require('pg-promise')({});
  const db = pgp(process.env.DATABASE_URL_LOCAL);

  console.log('💻 Limpando banco local...');
  await db.none('TRUNCATE TABLE products, categories, users, stores RESTART IDENTITY CASCADE');

  console.log('💻 Inserindo categorias...');
  const categories = await db.tx(t => {
    const queries = [
      t.one("INSERT INTO categories (name, slug) VALUES ('Moda', 'moda') RETURNING id"),
      t.one("INSERT INTO categories (name, slug) VALUES ('Calçados', 'calcados') RETURNING id"),
      t.one("INSERT INTO categories (name, slug) VALUES ('Artesanato', 'artesanato') RETURNING id"),
      t.one("INSERT INTO categories (name, slug) VALUES ('Casa & Lar', 'casa-lar') RETURNING id"),
      t.one("INSERT INTO categories (name, slug) VALUES ('Eletrônicos', 'eletronicos') RETURNING id"),
    ];
    return t.batch(queries);
  });

  const categoryIdMap = {
    moda: categories[0].id,
    calcados: categories[1].id,
    artesanato: categories[2].id,
    'casa-lar': categories[3].id,
    eletronicos: categories[4].id,
  };

  console.log('💻 Inserindo usuário e loja...');
  const seller = await db.one(
    "INSERT INTO users (name, email, role) VALUES ('Vendedor Padrão', 'vendedor@bazar.com', 'seller') RETURNING id"
  );
  const store = await db.one(
    "INSERT INTO stores (owner_id, name, slug, description) VALUES ($1, 'Loja do Vendedor', 'loja-do-vendedor', 'A melhor loja do Bié') RETURNING id",
    [seller.id]
  );

  console.log('💻 Inserindo produtos...');
  await db.tx(t => {
    const queries = [
      t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1,$2,$3,'Camiseta Estampada','Camiseta de algodão com estampa exclusiva.',5000,10,'[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap.moda]),
      t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1,$2,$3,'Tênis de Corrida','Tênis leve e confortável para suas corridas.',15000,5,'[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap.calcados]),
      t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1,$2,$3,'Vaso de Cerâmica','Vaso de cerâmica feito à mão.',3500,20,'[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap.artesanato]),
      t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1,$2,$3,'Almofada Decorativa','Almofada com estampa geométrica.',2500,15,'[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap['casa-lar']]),
      t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1,$2,$3,'Fone de Ouvido Bluetooth','Fone de ouvido com cancelamento de ruído.',25000,8,'[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap.eletronicos]),
    ];
    return t.batch(queries);
  });

  console.log('✅ Seed local concluído!');
  db.$pool.end();
}

async function seedSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('☁️ Limpando tabelas Supabase...');
  await supabase.from('products').delete().neq('id', 0);
  await supabase.from('stores').delete().neq('id', 0);
  await supabase.from('users').delete().neq('id', 0);
  await supabase.from('categories').delete().neq('id', 0);

  console.log('☁️ Inserindo categorias...');
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .insert([
      { name: 'Moda', slug: 'moda' },
      { name: 'Calçados', slug: 'calcados' },
      { name: 'Artesanato', slug: 'artesanato' },
      { name: 'Casa & Lar', slug: 'casa-lar' },
      { name: 'Eletrônicos', slug: 'eletronicos' },
    ])
    .select();
  if (catErr) throw catErr;

  const categoryIdMap = {};
  categories.forEach(c => (categoryIdMap[c.slug] = c.id));

  console.log('☁️ Inserindo usuário e loja...');
  const { data: user } = await supabase
    .from('users')
    .insert([{ name: 'Vendedor Padrão', email: 'vendedor@bazar.com', role: 'seller' }])
    .select()
    .single();
  const { data: store } = await supabase
    .from('stores')
    .insert([{ owner_id: user.id, name: 'Loja do Vendedor', slug: 'loja-do-vendedor', description: 'A melhor loja do Bié' }])
    .select()
    .single();

  console.log('☁️ Inserindo produtos...');
  const { error: prodErr } = await supabase.from('products').insert([
    { store_id: store.id, seller_id: user.id, category_id: categoryIdMap['moda'], name: 'Camiseta Estampada', description: 'Camiseta de algodão com estampa exclusiva.', price: 5000, stock: 10, images: [{ url: 'assets/images/placeholders/product.png' }] },
    { store_id: store.id, seller_id: user.id, category_id: categoryIdMap['calcados'], name: 'Tênis de Corrida', description: 'Tênis leve e confortável para suas corridas.', price: 15000, stock: 5, images: [{ url: 'assets/images/placeholders/product.png' }] },
    { store_id: store.id, seller_id: user.id, category_id: categoryIdMap['artesanato'], name: 'Vaso de Cerâmica', description: 'Vaso de cerâmica feito à mão.', price: 3500, stock: 20, images: [{ url: 'assets/images/placeholders/product.png' }] },
    { store_id: store.id, seller_id: user.id, category_id: categoryIdMap['casa-lar'], name: 'Almofada Decorativa', description: 'Almofada com estampa geométrica.', price: 2500, stock: 15, images: [{ url: 'assets/images/placeholders/product.png' }] },
    { store_id: store.id, seller_id: user.id, category_id: categoryIdMap['eletronicos'], name: 'Fone de Ouvido Bluetooth', description: 'Fone de ouvido com cancelamento de ruído.', price: 25000, stock: 8, images: [{ url: 'assets/images/placeholders/product.png' }] },
  ]);
  if (prodErr) throw prodErr;

  console.log('✅ Seed no Supabase concluído!');
}

(async () => {
  try {
    if (env === 'development' && process.env.DATABASE_URL_LOCAL) {
      await seedLocal();
    } else {
      await seedSupabase();
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  }
})();