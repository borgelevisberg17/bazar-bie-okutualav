// routes/userRoutes.js
const { Router } = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware JWT/Firebase
const authAdmin = require('../middleware/authAdmin');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management routes
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the profile of the authenticated user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's profile.
 */
router.get('/me', authMiddleware, userController.getProfile);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update the profile of the authenticated user.
 *     tags: [Users]
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
 *               phone:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: The updated user profile.
 */
router.put('/me', authMiddleware, userController.updateProfile);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get a list of all users (admin only).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users.
 */
router.get('/', authMiddleware, authAdmin, userController.listUsers);

/**
 * @swagger
 * /users/sellers:
 *   get:
 *     summary: Get a list of all sellers.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of sellers.
 */
router.get('/sellers', userController.listUsers);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user (admin only).
 *     tags: [Users]
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
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated user.
 */
router.put('/:id', authMiddleware, authAdmin, userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user (admin only).
 *     tags: [Users]
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
 *         description: The user was deleted.
 */
router.delete('/:id', authMiddleware, authAdmin, userController.deleteUser);


module.exports = router;
