const { Router } = require('express');
const { exchangeToken, refreshToken, register, login } = require('../controllers/authController');
const router = Router();

router.get('/', (req, res) => res.json({ ok: true, route: '/auth' }));
router.post('/exchange', exchangeToken);
router.post('/refresh', refreshToken);
router.post('/register', register);
router.post('/login', login);

module.exports = router;