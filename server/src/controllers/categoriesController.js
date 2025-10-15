const categoriesService = require('../services/categoriesService');

/**
 * List all categories
 */
exports.list = async (req, res, next) => {
  try {
    const categories = await categoriesService.list();
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    console.error("❌ Error in categoriesController.list:", err.message);
    next(err); // Passa para o middleware global de erros
  }
};