const { Router } = require('express');
const { exchangeToken, refreshToken, register, login, setup2FA, verify2FA, disable2FA } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: Check the status of the auth route.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: The auth route is working.
 */
router.get('/', (req, res) => res.json({ ok: true, route: '/auth' }));

/**
 * @swagger
 * /auth/setup-2fa:
 *   post:
 *     summary: Set up Two-Factor Authentication.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup successful.
 */
router.post('/setup-2fa', authMiddleware, setup2FA);

/**
 * @swagger
 * /auth/verify-2fa:
 *   post:
 *     summary: Verify a 2FA token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA verification successful.
 */
router.post('/verify-2fa', authMiddleware, verify2FA);

/**
 * @swagger
 * /auth/disable-2fa:
 *   post:
 *     summary: Disable Two-Factor Authentication.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA disabled successfully.
 */
router.post('/disable-2fa', authMiddleware, disable2FA);

/**
 * @swagger
 * /auth/exchange:
 *   post:
 *     summary: Exchange a Firebase ID token for internal tokens.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token exchange successful.
 */
router.post('/exchange', exchangeToken);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh an access token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refresh successful.
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully.
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful.
 */
router.post('/login', login);

module.exports = router;
