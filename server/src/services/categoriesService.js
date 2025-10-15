const repo = require('../repositories/categoriesRepository');

/**
 * Business logic for categories
 */
exports.list = async () => {
  try {
    return await repo.list();
  } catch (err) {
    console.error("❌ Error in categoriesService.list:", err.message);
    throw err;
  }
};