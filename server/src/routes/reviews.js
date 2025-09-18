const { Router } = require('express');
const reviewsController = require('../controllers/reviewsController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

// Rotas públicas
router.get('/product/:productId', reviewsController.getProductReviews);
router.get('/product/:productId/average', reviewsController.getAverageRating);

// Rotas autenticadas
router.post('/', authFirebase, reviewsController.createReview);
router.put('/:id', authFirebase, reviewsController.updateReview);
router.delete('/:id', authFirebase, reviewsController.deleteReview);

module.exports = router;