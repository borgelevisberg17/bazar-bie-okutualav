const db = require('../src/config/db');

async function clearDatabase() {
    console.log('Clearing database...');
    try {
        await db.none('TRUNCATE TABLE products, categories, users, stores RESTART IDENTITY CASCADE');
        console.log('Database cleared.');
    } catch (error) {
        console.error('Error clearing database:', error);
        throw error;
    }
}

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    await clearDatabase();
    // Seed Categories
    console.log('Seeding categories...');
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

    // Seed Users and Stores
    console.log('Seeding users and stores...');
    const seller = await db.one("INSERT INTO users (name, email, role) VALUES ('Vendedor Padrão', 'vendedor@bazar.com', 'seller') RETURNING id");
    const store = await db.one("INSERT INTO stores (owner_id, name, slug, description) VALUES ($1, 'Loja do Vendedor', 'loja-do-vendedor', 'A melhor loja do Bié') RETURNING id", [seller.id]);

    // Seed Products
    console.log('Seeding products...');
    await db.tx(t => {
        const queries = [
            t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1, $2, $3, 'Camiseta Estampada', 'Camiseta de algodão com estampa exclusiva.', 5000, 10, '[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap.moda]),
            t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1, $2, $3, 'Tênis de Corrida', 'Tênis leve e confortável para suas corridas.', 15000, 5, '[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap.calcados]),
            t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1, $2, $3, 'Vaso de Cerâmica', 'Vaso de cerâmica feito à mão.', 3500, 20, '[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap.artesanato]),
            t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1, $2, $3, 'Almofada Decorativa', 'Almofada com estampa geométrica.', 2500, 15, '[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap['casa-lar']]),
            t.none("INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images) VALUES ($1, $2, $3, 'Fone de Ouvido Bluetooth', 'Fone de ouvido com cancelamento de ruído.', 25000, 8, '[{\"url\": \"assets/images/placeholders/product.png\"}]')", [store.id, seller.id, categoryIdMap.eletronicos]),
        ];
        return t.batch(queries);
    });

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    db.$pool.end();
  }
}

seedDatabase();
