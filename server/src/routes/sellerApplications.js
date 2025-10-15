const { Router } = require('express');
const router = Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const sellerApplicationsController = require('../controllers/sellerApplicationsController');

router.post('/', isAuthenticated, sellerApplicationsController.createSellerApplication);
router.get('/', isAuthenticated, isAdmin, sellerApplicationsController.getSellerApplications);
router.put('/:id', isAuthenticated, isAdmin, sellerApplicationsController.updateSellerApplication);

module.exports = router;
