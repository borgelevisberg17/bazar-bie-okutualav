const { Router } = require('express');
const { exchangeToken, refreshToken, register, login, setup2FA, verify2FA, disable2FA } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const router = Router();

router.get('/', (req, res) => res.json({ ok: true, route: '/auth' }));
router.post('/setup-2fa', authMiddleware, setup2FA);
router.post('/verify-2fa', authMiddleware, verify2FA);
router.post('/disable-2fa', authMiddleware, disable2FA);
router.post('/exchange', exchangeToken);
router.post('/refresh', refreshToken);
router.post('/register', register);
router.post('/login', login);

module.exports = router;