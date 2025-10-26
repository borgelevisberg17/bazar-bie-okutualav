const { verifyToken } = require('../utils/tokenUtils');

/**
 * Middleware to authenticate requests using a JWT.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {void}
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    req.user = decoded;
    next();
  } catch (e) {
    console.error('[JWT Auth Error]', e.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
