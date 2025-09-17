// controllers/userController.js
const pool = require('../config/db');

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
    const { role } = req.query;

    let query = 'SELECT id, email, name, role, status, avatar_url, created_at FROM users';
    const queryParams = [];

    if (role) {
      query += ' WHERE role = $1';
      queryParams.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, queryParams);

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
};