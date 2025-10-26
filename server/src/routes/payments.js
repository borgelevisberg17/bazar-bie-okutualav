// server/src/routes/paymentRouter.js
const { Router } = require('express');
const paymentsController = require('../controllers/paymentsController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management routes
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a new payment.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               userEmail:
 *                 type: string
 *               method:
 *                 type: string
 *               receiptFileBase64:
 *                 type: string
 *               receiptFileType:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created payment.
 */
router.post('/', authFirebase, paymentsController.createPayment);

/**
 * @swagger
 * /payments/me:
 *   get:
 *     summary: Get all payments for the authenticated user.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the user's payments.
 */
router.get('/me', authFirebase, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    let payments;
    if (paymentsController.mode === 'pg') {
      payments = await paymentsController.db.any(
        'SELECT * FROM payments WHERE user_id=$1 ORDER BY created_at DESC',
        [userId]
      );
    } else {
      const { data, error } = await paymentsController.db.select('payments').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      payments = data;
    }
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /payments/all:
 *   get:
 *     summary: Get all payments (admin only).
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all payments.
 */
router.get('/all', authFirebase, paymentsController.listPayments);

/**
 * @swagger
 * /payments/pending:
 *   get:
 *     summary: Get all pending payments (admin only).
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all pending payments.
 */
router.get('/pending', authFirebase, paymentsController.listPendingPayments);

/**
 * @swagger
 * /payments/approve:
 *   post:
 *     summary: Approve a payment (admin only).
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The payment was approved.
 */
router.post('/approve', authFirebase, paymentsController.approvePayment);

/**
 * @swagger
 * /payments/reject:
 *   post:
 *     summary: Reject a payment (admin only).
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: The payment was rejected.
 */
router.post('/reject', authFirebase, paymentsController.rejectPayment);

/**
 * @swagger
 * /payments/update-status:
 *   post:
 *     summary: Update the status of a payment.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: The payment status was updated.
 */
router.post('/update-status', authFirebase, paymentsController.updatePaymentStatus);

module.exports = router;
