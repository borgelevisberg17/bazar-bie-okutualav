import meiliClient from './meiliClient.js'; // seu arquivo acima

/**
 * Indexes a single product in MeiliSearch.
 * @param {object} product - The product object to index.
 * @param {string} [indexName='products'] - The name of the MeiliSearch index.
 * @returns {Promise<void>}
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
 * Indexes multiple products in MeiliSearch in bulk.
 * @param {Array<object>} products - An array of product objects to index.
 * @param {string} [indexName='products'] - The name of the MeiliSearch index.
 * @returns {Promise<void>}
 */
export async function indexProductsBulk(products, indexName = 'products') {
  if (!Array.isArray(products) || products.length === 0) return;
  try {
    const index = meiliClient.index(indexName);
    await index.addDocuments(products);
    console.log(`✅ Bulk indexed ${products.length} products in '${indexName}'`);
  } catch (err)
 {
    console.error(`❌ Failed bulk indexing:`, err);
  }
}
