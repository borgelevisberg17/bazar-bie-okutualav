// server/src/routes/orderRouter.js
const { Router } = require('express');
const ordersController = require('../controllers/ordersController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

// Rotas do usuário
router.get('/me', authFirebase, ordersController.getUserOrders);
router.post('/', authFirebase, ordersController.createOrder);
router.get('/:id', authFirebase, ordersController.getOrderById);

// Rotas de admin (podemos criar middleware de admin se quiser)
router.get('/all', authFirebase, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode acessar.' });
    await ordersController.getAllOrders(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authFirebase, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode atualizar pedidos.' });
    await ordersController.updateOrder(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authFirebase, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode deletar pedidos.' });
    await ordersController.deleteOrder(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;