const { Router } = require('express');
const reviewsController = require('../controllers/reviewsController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review management routes
 */

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Get all reviews for a product.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of reviews for the specified product.
 */
router.get('/product/:productId', reviewsController.getProductReviews);

/**
 * @swagger
 * /reviews/product/{productId}/average:
 *   get:
 *     summary: Get the average rating for a product.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The average rating for the specified product.
 */
router.get('/product/:productId/average', reviewsController.getAverageRating);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review.
 *     tags: [Reviews]
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
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created review.
 */
router.post('/', authFirebase, reviewsController.createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update a review.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated review.
 */
router.put('/:id', authFirebase, reviewsController.updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: The review was deleted.
 */
router.delete('/:id', authFirebase, reviewsController.deleteReview);

module.exports = router;
