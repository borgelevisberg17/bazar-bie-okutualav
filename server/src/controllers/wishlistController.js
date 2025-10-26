const wishlistRepository = require('../repositories/wishlistRepository');

async function getWishlist(req, res) {
  try {
    const wishlist = await wishlistRepository.getByUserId(req.user.id);
    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the wishlist.' });
  }
}

async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;
    const wishlistItem = await wishlistRepository.add(req.user.id, productId);
    res.status(201).json(wishlistItem);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while adding to the wishlist.' });
  }
}

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
