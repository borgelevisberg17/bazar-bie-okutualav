const admin = require('../config/firebaseAdmin');
module.exports = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
};
