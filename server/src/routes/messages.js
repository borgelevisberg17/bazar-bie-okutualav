const { Router } = require('express');
const router = Router();
const messagesController = require('../controllers/messagesController');

router.get('/', messagesController.getMessages);
router.post('/', messagesController.createMessage);

module.exports = router;