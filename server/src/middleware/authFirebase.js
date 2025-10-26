const admin = require('../config/firebaseAdmin');

/**
 * Middleware to authenticate requests using a Firebase ID token.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // payload do Firebase
    next();
  } catch (e) {
    console.error('[Firebase Auth Error]', e.message);
    res.status(401).json({ error: 'Invalid Firebase token' });
  }
};
