const categoriesService = require('../services/categoriesService');

/**
 * Lists all categories.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
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
