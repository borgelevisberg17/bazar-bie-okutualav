const admin = require('../config/firebaseAdmin');
const jwt = require('jsonwebtoken');
exports.exchangeToken = async (req,res) => {
  const { idToken } = req.body;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const token = jwt.sign({ uid: decoded.uid }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, uid: decoded.uid });
  } catch (err) {
    res.status(401).json({ error: 'Invalid idToken' });
  }
};
