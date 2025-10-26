const { db } = require('../config/db');

/**
 * Retrieves the wishlist for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of wishlist items.
 */
async function getByUserId(userId) {
  const { rows } = await db.query('SELECT * FROM wishlist WHERE user_id = $1', [userId]);
  return rows;
}

/**
 * Adds a product to a user's wishlist.
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The ID of the product to add.
 * @returns {Promise<Object>} A promise that resolves to the newly created wishlist item.
 */
async function add(userId, productId) {
  const { rows } = await db.query(
    'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *',
    [userId, productId]
  );
  return rows[0];
}

/**
 * Removes a product from a user's wishlist.
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The ID of the product to remove.
 * @returns {Promise<void>}
 */
async function remove(userId, productId) {
  await db.query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [
    userId,
    productId,
  ]);
}

module.exports = {
  getByUserId,
  add,
  remove,
};
