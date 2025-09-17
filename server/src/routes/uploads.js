const { Router } = require('express');
const uploadsController = require('../controllers/uploadsController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

router.post('/avatar', authFirebase, uploadsController.uploadAvatar);

module.exports = router;
