const { db } = require('../config/db');

async function getByUserId(userId) {
  const { rows } = await db.query('SELECT * FROM wishlist WHERE user_id = $1', [userId]);
  return rows;
}

async function add(userId, productId) {
  const { rows } = await db.query(
    'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *',
    [userId, productId]
  );
  return rows[0];
}

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
