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

const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const user = await db.one(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
            [name, email, password_hash]
        );

        const payload = { uid: user.id, email: user.email };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.status(201).json({ accessToken, refreshToken, uid: user.id, name: user.name });
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'User with this email already exists.' });
        }
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const payload = { uid: user.id, email: user.email };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.json({ accessToken, refreshToken, uid: user.id, name: user.name });
    } catch (error) {
        next(error);
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