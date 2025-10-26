const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist management routes
 */

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get the user's wishlist.
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's wishlist.
 */
router.get('/', auth, wishlistController.getWishlist);

/**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Add a product to the user's wishlist.
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created wishlist item.
 */
router.post('/', auth, wishlistController.addToWishlist);

/**
 * @swagger
 * /wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from the user's wishlist.
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: The wishlist item was deleted.
 */
router.delete('/:productId', auth, wishlistController.removeFromWishlist);

module.exports = router;
