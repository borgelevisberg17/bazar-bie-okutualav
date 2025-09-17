const { Router } = require('express');
const paymentsController = require('../controllers/paymentsController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

router.post('/', authFirebase, paymentsController.createPayment);

module.exports = router;
