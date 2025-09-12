const { Router } = require('express');
const { exchangeToken, refreshToken } = require('../controllers/AuthController');
const router = Router();

router.get('/', (req, res) => res.json({ ok: true, route: '/auth' }));
router.post('/exchange', exchangeToken);
router.post('/refresh', refreshToken);

module.exports = router;