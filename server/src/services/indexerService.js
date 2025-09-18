import meiliClient from './meiliClient.js'; // seu arquivo acima

/**
 * Index a single product
 * @param {object} product
 * @param {string} indexName
 */
export async function indexProduct(product, indexName = 'products') {
  try {
    const index = meiliClient.index(indexName);
    await index.addDocuments([product]);
    console.log(`✅ Product indexed in '${indexName}':`, product.id);
  } catch (err) {
    console.error(`❌ Failed to index product '${product.id}':`, err);
  }
}

/**
 * Index multiple products
 * @param {Array} products
 * @param {string} indexName
 */
export async function indexProductsBulk(products, indexName = 'products') {
  if (!Array.isArray(products) || products.length === 0) return;
  try {
    const index = meiliClient.index(indexName);
    await index.addDocuments(products);
    console.log(`✅ Bulk indexed ${products.length} products in '${indexName}'`);
  } catch (err) {
    console.error(`❌ Failed bulk indexing:`, err);
  }
}