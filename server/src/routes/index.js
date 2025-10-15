const { Router } = require('express');
const router = Router();
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/products', require('./products'));
router.use('/categories', require('./categories'));
router.use('/carts', require('./carts'));
router.use('/orders', require('./orders'));
router.use('/transactions', require('./transactions'));
router.use('/reviews', require('./reviews'));
router.use('/messages', require('./messages'));
router.use('/stores', require('./stores'));
router.use('/payments', require('./payments'));
router.use('/uploads', require('./uploads'));
router.use('/seller-applications', require('./sellerApplications'));

module.exports = router;
