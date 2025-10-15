const admin = require('../config/firebaseAdmin');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/tokenUtils');
const bcrypt = require('bcryptjs');
const { db, mode } = require('../config/db');

// Função auxiliar para buscar usuário por campo
const findUser = async (field, value) => {
  if (mode === 'pg') {
    return db.oneOrNone(`SELECT * FROM users WHERE ${field}=$1`, [value]);
  } else {
    const { data, error } = await db.select('users').eq(field, value);
    if (error) throw error;
    return data[0] || null;
  }
};

// Função auxiliar para criar usuário
const createUser = async ({ firebase_uid, name, email, password_hash, role = 'user' }) => {
  if (mode === 'pg') {
    return db.one(
      'INSERT INTO users (firebase_uid, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [firebase_uid, name, email, password_hash, role]
    );
  } else {
    const { data, error } = await db.insert('users', [
      { firebase_uid, name, email, password_hash, role },
    ]);
    if (error) throw error;
    return data[0];
  }
};

// Troca idToken do Firebase por tokens internos
exports.exchangeToken = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    const decoded = await admin.auth().verifyIdToken(idToken);

    let user = await findUser('firebase_uid', decoded.uid);

    if (!user) {
      user = await createUser({
        firebase_uid: decoded.uid,
        name: decoded.name || decoded.email?.split('@')[0],
        email: decoded.email,
      });
    }

    const payload = { uid: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({ accessToken, refreshToken, uid: user.id, name: user.name });
  } catch (err) {
    next(err);
  }
};

// Registro tradicional com email/senha
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await createUser({ name, email, password_hash });

    const payload = { uid: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(201).json({ accessToken, refreshToken, uid: user.id, name: user.name });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'User with this email already exists.' });
    next(error);
  }
};

// Login com email/senha
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await findUser('email', email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { uid: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({ accessToken, refreshToken, uid: user.id, name: user.name });
  } catch (error) {
    next(error);
  }
};

// Refresh token
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