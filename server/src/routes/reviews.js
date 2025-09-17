const { Router } = require('express');
const reviewsController = require('../controllers/reviewsController');

const router = Router();

router.get('/product/:productId', reviewsController.getProductReviews);

module.exports = router;
