const wishlistRepository = require('../repositories/wishlistRepository');

/**
 * Retrieves the wishlist of the authenticated user.
 * @param {Object} req - The Express request object.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.id - The user's ID.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>}
 */
async function getWishlist(req, res) {
  try {
    const wishlist = await wishlistRepository.getByUserId(req.user.id);
    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the wishlist.' });
  }
}

/**
 * Adds a product to the authenticated user's wishlist.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.productId - The ID of the product to add.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.id - The user's ID.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>}
 */
async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;
    const wishlistItem = await wishlistRepository.add(req.user.id, productId);
    res.status(201).json(wishlistItem);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while adding to the wishlist.' });
  }
}

/**
 * Removes a product from the authenticated user's wishlist.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.productId - The ID of the product to remove.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.id - The user's ID.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>}
 */
async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;
    await wishlistRepository.remove(req.user.id, productId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while removing from the wishlist.' });
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
