const db = require('../config/db');
module.exports = {
  async getProducts(limit=24, offset=0) {
    return db.any('SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
  },
  async getProductById(id) {
    return db.oneOrNone('SELECT * FROM products WHERE id = $1', [id]);
  }
};
