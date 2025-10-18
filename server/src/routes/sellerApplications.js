const { Router } = require('express');
const router = Router();
const authAdmin = require('../middleware/authAdmin');
const authFirebase = require('../middleware/authFirebase');
const sellerApplicationsController = require('../controllers/sellerApplicationsController');

router.post('/', authFirebase, sellerApplicationsController.createSellerApplication);
router.get('/', authFirebase, authAdmin, sellerApplicationsController.getSellerApplications);
router.put('/:id', authFirebase, authAdmin, sellerApplicationsController.updateSellerApplication);

module.exports = router;
