const { db } = require('../config/db');
const { processPayment } = require('../utils/paymentGateway');

/**
 * Creates a new seller application.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body.
 * @param {Object} req.body.paymentInfo - Payment information for the application fee.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The user's ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.createSellerApplication = async (req, res, next) => {
  try {
    const { paymentInfo } = req.body;
    const userId = req.user.uid;

    const paymentResult = await processPayment(paymentInfo);

    if (paymentResult.success) {
      const application = await db.one(
        'INSERT INTO seller_applications (user_id, payment_info, status) VALUES ($1, $2, $3) RETURNING id',
        [userId, { ...paymentInfo, transactionId: paymentResult.transactionId }, 'pending']
      );

      res.status(201).json({
        message: 'Seller application submitted successfully.',
        applicationId: application.id
      });
    } else {
      res.status(400).json({ message: 'Payment failed.', details: paymentResult.message });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves all pending seller applications.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getSellerApplications = async (req, res, next) => {
  try {
    const applications = await db.any(
      `SELECT sa.id, sa.user_id, u.email as user_email, sa.created_at
       FROM seller_applications sa
       JOIN users u ON sa.user_id = u.id
       WHERE sa.status = 'pending'`
    );
    res.json({ data: applications });
  } catch (err) {
    next(err);
  }
};

/**
 * Updates the status of a seller application.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the application to update.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.status - The new status for the application ('approved' or 'rejected').
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.updateSellerApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.tx(async t => {
      const application = await t.one('SELECT user_id FROM seller_applications WHERE id = $1', [id]);

      await t.none('UPDATE seller_applications SET status = $1 WHERE id = $2', [status, id]);

      if (status === 'approved') {
        await t.none("UPDATE users SET role = 'seller' WHERE id = $1", [application.user_id]);
      }
    });

    res.json({ message: 'Application status updated successfully.' });
  } catch (err) {
    next(err);
  }
};
