const admin = require('../config/firebaseAdmin');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/tokenUtils');

// Troca idToken do Firebase por tokens internos
exports.exchangeToken = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    const decoded = await admin.auth().verifyIdToken(idToken);

    const payload = { uid: decoded.uid, email: decoded.email || null };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({ accessToken, refreshToken, uid: decoded.uid });
  } catch (err) {
    next(err);
  }
};

// Gera novo access token a partir do refresh
exports.refreshToken = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });

    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!decoded) return res.status(401).json({ error: 'Invalid refresh token' });

    const newAccessToken = generateAccessToken({ uid: decoded.uid, email: decoded.email });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};