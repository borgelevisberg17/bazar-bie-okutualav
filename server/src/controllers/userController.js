// controllers/userController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Registrar novo usuário local (caso queira permitir login sem Firebase)
exports.register = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, role, created_at`,
      [email, name, hashed, role || 'customer']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Email já registrado' });
    } else {
      next(err);
    }
  }
};

// Login local com email/senha
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await pool.query(
      'SELECT id, email, name, password_hash, role FROM users WHERE email=$1',
      [email]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

// Perfil do usuário autenticado (via middleware que define req.user)
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const result = await pool.query(
      'SELECT id, email, name, role, avatar_url, metadata FROM users WHERE id=$1',
      [userId]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Atualizar perfil
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { name, phone, avatar_url, metadata } = req.body;

    const result = await pool.query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        avatar_url = COALESCE($3, avatar_url),
        metadata = COALESCE($4, metadata),
        updated_at = now()
       WHERE id=$5 RETURNING id, email, name, phone, avatar_url, metadata`,
      [name, phone, avatar_url, metadata, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Listar todos os usuários (apenas admin)
exports.listUsers = async (req, res, next) => {
  try {
    if (req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const result = await pool.query(
      'SELECT id, email, name, role, status, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};