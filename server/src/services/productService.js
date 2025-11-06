const repo = require("../repositories/productsRepo");
const search = require("./searchService");

/**
 * Lists products with pagination and optional search query.
 * @param {Object} options - The options for listing products.
 * @param {number} [options.page=1] - The page number.
 * @param {number} [options.limit=10] - The number of items per page.
 * @param {string} [options.status] - The product status to filter by.
 * @param {string} [options.sellerId] - The seller ID to filter by.
 * @returns {Promise<Object>} A promise that resolves to an object containing the product data and pagination info.
 */
exports.list = async ({ page, limit, status, sellerId }) => {
  // if (q) return search.searchProducts(q, { page, limit });
  return repo.list({ page, limit, status, sellerId });
};

/**
 * Retrieves a single product by its ID.
 * @param {string} id - The ID of the product to retrieve.
 * @returns {Promise<Object|null>} A promise that resolves to the product object, or null if not found.
 */
exports.get = (id) => repo.get(id);

/**
 * Retrieves detailed information for a single product by its ID.
 * @param {string} id - The ID of the product to retrieve.
 * @returns {Promise<Object|null>} A promise that resolves to the detailed product object, or null if not found.
 */
exports.getDetails = (id) => repo.getDetails(id);

/**
 * Creates a new product and indexes it in the search service.
 * @param {string} sellerUid - The ID of the seller creating the product.
 * @param {Object} payload - The product data.
 * @returns {Promise<Object>} A promise that resolves to the newly created product object.
 */
exports.create = async (sellerUid, payload) => {
  const product = await repo.create(sellerUid, payload);
  search.indexProduct(product).catch(() => {}); // async sem travar
  return product;
};

/**
 * Updates an existing product.
 * @param {string} id - The ID of the product to update.
 * @param {Object} payload - The updated product data.
 * @returns {Promise<Object>} A promise that resolves to the updated product object.
 */
exports.update = (id, payload) => repo.update(id, payload);

/**
 * Removes a product from the database and the search index.
 * @param {string} id - The ID of the product to remove.
 * @returns {Promise<void>}
 */
exports.remove = async (id) => {
  await repo.remove(id);
  await search.removeProduct(id).catch(() => {});
};

/**
 * Likes a product.
 * @param {string} productId - The ID of the product to like.
 * @param {string} userId - The ID of the user liking the product.
 * @returns {Promise<Object>} A promise that resolves to the updated like status and count.
 */
exports.like = async (productId, userId) => {
    return repo.like(productId, userId);
};

/**
 * Unlikes a product.
 * @param {string} productId - The ID of the product to unlike.
 * @param {string} userId - The ID of the user unliking the product.
 * @returns {Promise<Object>} A promise that resolves to the updated like status and count.
 */
exports.unlike = async (productId, userId) => {
    return repo.unlike(productId, userId);
};

/**
 * Adds a comment to a product.
 * @param {string} productId - The ID of the product to comment on.
 * @param {string} userId - The ID of the user adding the comment.
 * @param {string} comment - The comment text.
 * @returns {Promise<Object>} A promise that resolves to the newly created comment object.
 */
exports.addComment = async (productId, userId, comment) => {
    return repo.addComment(productId, userId, comment);
};
