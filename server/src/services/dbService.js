const db = require('../config/db');

/**
 * Database service for product-related operations.
 * @module services/dbService
 */
module.exports = {
  /**
   * Retrieves a list of products with pagination.
   * @param {number} [limit=24] - The maximum number of products to return.
   * @param {number} [offset=0] - The number of products to skip.
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of product objects.
   */
  async getProducts(limit=24, offset=0) {
    return db.any('SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
  },

  /**
   * Retrieves a single product by its ID.
   * @param {string} id - The ID of the product to retrieve.
   * @returns {Promise<Object|null>} A promise that resolves to the product object, or null if not found.
   */
  async getProductById(id) {
    return db.oneOrNone('SELECT * FROM products WHERE id = $1', [id]);
  }
};
