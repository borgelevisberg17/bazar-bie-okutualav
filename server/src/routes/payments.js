// server/src/routes/paymentRouter.js
const { Router } = require('express');
const paymentsController = require('../controllers/paymentController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

// =======================
// Usuário cria pagamento
// =======================
router.post('/', authFirebase, paymentsController.createPayment);

// =======================
// Usuário/cliente lista seus pagamentos (opcional)
// =======================
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

// =======================
// Admin: Listar todos pagamentos
// =======================
router.get('/all', authFirebase, paymentsController.listPayments);

// =======================
// Admin: Listar pagamentos pendentes
// =======================
router.get('/pending', authFirebase, paymentsController.listPendingPayments);

// =======================
// Admin: Aprovar pagamento
// =======================
router.post('/approve', authFirebase, paymentsController.approvePayment);

// =======================
// Admin: Rejeitar pagamento
// =======================
router.post('/reject', authFirebase, paymentsController.rejectPayment);

// =======================
// Atualizar status de pagamento (usuário ou admin)
// =======================
router.post('/update-status', authFirebase, paymentsController.updatePaymentStatus);

module.exports = router;