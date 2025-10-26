const meili = require("../config/meilisearch");

/**
 * Returns the MeiliSearch 'products' index.
 * @returns {import('meilisearch').Index} The MeiliSearch index object.
 */
const index = () => meili.index("products");

/**
 * Indexes a product in MeiliSearch.
 * @param {Object} product - The product object to index.
 * @returns {Promise<Object>} A promise that resolves to the MeiliSearch task object.
 * @throws {Error} If an error occurs while indexing the product.
 */
exports.indexProduct = async (product) => {
  try {
    return await index().addDocuments([product]);
  } catch (err) {
    console.error("Erro ao indexar produto no Meili:", err.message);
    throw err;
  }
};

/**
 * Removes a product from the MeiliSearch index.
 * @param {string} id - The ID of the product to remove.
 * @returns {Promise<Object>} A promise that resolves to the MeiliSearch task object.
 * @throws {Error} If an error occurs while removing the product.
 */
exports.removeProduct = async (id) => {
  try {
    return await index().deleteDocument(id);
  } catch (err) {
    console.error("Erro ao remover produto do Meili:", err.message);
    throw err;
  }
};

/**
 * Searches for products in the MeiliSearch index.
 * @param {string} q - The search query.
 * @param {Object} options - The search options.
 * @param {number} [options.page=1] - The page number.
 * @param {number} [options.limit=24] - The number of results per page.
 * @returns {Promise<Object>} A promise that resolves to the MeiliSearch search results object.
 * @throws {Error} If an error occurs while searching for products.
 */
exports.searchProducts = async (q, { page = 1, limit = 24 }) => {
  try {
    return await index().search(q, {
      limit,
      offset: (page - 1) * limit,
    });
  } catch (err) {
    console.error("Erro ao buscar produtos no Meili:", err.message);
    throw err;
  }
};
