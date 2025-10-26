const { Router } = require('express');
const storesController = require('../controllers/storesController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Stores
 *   description: Store management routes
 */

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Create a new store.
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created store.
 */
router.post('/', authFirebase, storesController.createStore);

/**
 * @swagger
 * /stores/me:
 *   get:
 *     summary: Get the store of the authenticated user.
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's store.
 */
router.get('/me', authFirebase, storesController.getMyStore);

/**
 * @swagger
 * /stores/{slug}:
 *   get:
 *     summary: Get a store by slug.
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested store.
 */
router.get('/:slug', storesController.getStoreBySlug);

/**
 * @swagger
 * /stores/{slug}/products:
 *   get:
 *     summary: Get all products in a store.
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of products in the specified store.
 */
router.get('/:slug/products', storesController.getStoreProducts);

module.exports = router;
