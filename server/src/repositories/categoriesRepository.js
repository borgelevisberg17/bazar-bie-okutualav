const { db, mode } = require("../config/db");

/**
 * Fetches all categories from the database.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of category objects.
 * @throws {Error} If an error occurs while fetching the categories, or if the database mode is unsupported.
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
