const { Router } = require('express');
const router = Router();
const authAdmin = require('../middleware/authAdmin');
const authFirebase = require('../middleware/authFirebase');
const sellerApplicationsController = require('../controllers/sellerApplicationsController');

/**
 * @swagger
 * tags:
 *   name: Seller Applications
 *   description: Seller application management routes
 */

/**
 * @swagger
 * /seller-applications:
 *   post:
 *     summary: Create a new seller application.
 *     tags: [Seller Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: The created seller application.
 */
router.post('/', authFirebase, sellerApplicationsController.createSellerApplication);

/**
 * @swagger
 * /seller-applications:
 *   get:
 *     summary: Get all pending seller applications (admin only).
 *     tags: [Seller Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of pending seller applications.
 */
router.get('/', authFirebase, authAdmin, sellerApplicationsController.getSellerApplications);

/**
 * @swagger
 * /seller-applications/{id}:
 *   put:
 *     summary: Update a seller application (admin only).
 *     tags: [Seller Applications]
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
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated seller application.
 */
router.put('/:id', authFirebase, authAdmin, sellerApplicationsController.updateSellerApplication);

module.exports = router;
