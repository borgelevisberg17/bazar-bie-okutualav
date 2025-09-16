const fs = require('fs/promises');
const path = require('path');
const db = require('../src/config/db'); // Assuming db.js exports a pg-promise instance

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // 1. Read the JSON data file
    const jsonPath = '/app/data/data.json';
    console.log(`Attempting to read data from: ${jsonPath}`);
    try {
        const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
    } catch (e) {
        console.error(`Error reading file at ${jsonPath}`, e);
        throw e;
    }

    const { categories, products, sellers, reviews } = jsonData;

    // 2. Seed Users and Stores from Sellers
    // In our JSON, a "seller" is both a user and owns a store.
    console.log('Seeding users and stores...');
    const sellerIdMap = new Map(); // Maps old seller ID to new user and store UUIDs
    for (const seller of sellers) {
      // Create a user for the seller
      const userResult = await db.one(
        `INSERT INTO users (name, email, role) VALUES ($1, $2, 'seller') RETURNING id`,
        [seller.name, `${seller.name.toLowerCase().replace(/\s/g, '_')}@bazar.com`]
      );
      const userId = userResult.id;

      // Create a store for the seller
      const storeResult = await db.one(
        `INSERT INTO stores (owner_id, name, slug, description) VALUES ($1, $2, $3, $4) RETURNING id`,
        [userId, `${seller.name}'s Store`, seller.name.toLowerCase().replace(/\s/g, '-'), seller.specialty]
      );
      const storeId = storeResult.id;

      sellerIdMap.set(seller.id, { userId, storeId });
    }
     // Create a generic user for reviews
     const genericUserResult = await db.one(
        `INSERT INTO users (name, email, role) VALUES ('Generic User', 'generic@bazar.com', 'customer') RETURNING id`
      );
      const genericUserId = genericUserResult.id;


    // 3. Seed Categories
    console.log('Seeding categories...');
    const categoryIdMap = new Map(); // Maps old category slug to new UUID
    for (const category of categories) {
        if (category.slug === 'all') continue; // Skip the 'all' category
      const categoryResult = await db.one(
        `INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id`,
        [category.name, category.slug]
      );
      categoryIdMap.set(category.slug, categoryResult.id);
    }

    // 4. Seed Products
    console.log('Seeding products...');
    const productIdMap = new Map(); // Maps old product ID to new UUID
    for (const product of products) {
      const sellerInfo = sellerIdMap.get(product.sellerId);
      if (!sellerInfo) {
        console.warn(`Could not find seller for product ID ${product.id}. Skipping.`);
        continue;
      }

      const categoryId = categoryIdMap.get(product.category);
      if (!categoryId) {
        console.warn(`Could not find category for product "${product.name}". Skipping.`);
        continue;
      }

      const productResult = await db.one(
        `INSERT INTO products (store_id, seller_id, category_id, name, description, price, stock, images, rating, reviews_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          sellerInfo.storeId,
          sellerInfo.userId,
          categoryId,
          product.name,
          product.description,
          product.price,
          100, // Assuming a default stock
          JSON.stringify(product.images.map(url => ({ url }))),
          product.rating,
          product.reviews
        ]
      );
      productIdMap.set(product.id, productResult.id);
    }

    // 5. Seed Reviews
    console.log('Seeding reviews...');
    for (const review of reviews) {
        const productId = productIdMap.get(review.productId);
        if (!productId) {
          console.warn(`Could not find product for review on product ID ${review.productId}. Skipping.`);
          continue;
        }

        await db.none(
          `INSERT INTO reviews (product_id, user_id, rating, body) VALUES ($1, $2, $3, $4)`,
          [productId, genericUserId, review.rating, review.comment]
        );
      }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    db.$pool.end();
  }
}

seedDatabase();
