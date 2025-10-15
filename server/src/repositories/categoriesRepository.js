const { db, mode } = require("../config/db");

/**
 * Fetch categories from DB
 */
exports.list = async () => {
  try {
    if (mode === "pg") {
      const query = `SELECT * FROM categories`;
      return await db.any(query);
    } else if (mode === "sqlite") {
      // Exemplo usando knex ou similar
      return await db("categories").select("*");
    } else {
      throw new Error(`Unsupported DB mode: ${mode}`);
    }
  } catch (err) {
    console.error("❌ Error in categoriesRepository.list:", err.message);
    throw err;
  }
};