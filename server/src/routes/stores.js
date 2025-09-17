const { Router } = require('express');
const storesController = require('../controllers/storesController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

router.post('/', authFirebase, storesController.createStore);
router.get('/me', authFirebase, storesController.getMyStore);
router.get('/:slug', storesController.getStoreBySlug);
router.get('/:slug/products', storesController.getStoreProducts);

module.exports = router;
