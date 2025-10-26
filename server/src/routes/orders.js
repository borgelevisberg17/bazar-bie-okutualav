// server/src/routes/orderRouter.js
const { Router } = require('express');
const ordersController = require('../controllers/ordersController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management routes
 */

/**
 * @swagger
 * /orders/me:
 *   get:
 *     summary: Get all orders for the authenticated user.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the user's orders.
 */
router.get('/me', authFirebase, ordersController.getUserOrders);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               total:
 *                 type: number
 *               shipping_address:
 *                 type: object
 *               payments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: The created order.
 */
router.post('/', authFirebase, ordersController.createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested order.
 */
router.get('/:id', authFirebase, ordersController.getOrderById);

/**
 * @swagger
 * /orders/all:
 *   get:
 *     summary: Get all orders (admin only).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all orders.
 */
router.get('/all', authFirebase, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode acessar.' });
    await ordersController.getAllOrders(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update an order (admin only).
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: The updated order.
 */
router.put('/:id', authFirebase, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode atualizar pedidos.' });
    await ordersController.updateOrder(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order (admin only).
 *     tags: [Orders]
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
 *         description: The order was deleted.
 */
router.delete('/:id', authFirebase, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode deletar pedidos.' });
    await ordersController.deleteOrder(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
