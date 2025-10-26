const repo = require('../repositories/categoriesRepository');

/**
 * Retrieves a list of all categories.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of category objects.
 * @throws {Error} If an error occurs while fetching the categories.
 */
exports.list = async () => {
  try {
    return await repo.list();
  } catch (err) {
    console.error("❌ Error in categoriesService.list:", err.message);
    throw err;
  }
};
