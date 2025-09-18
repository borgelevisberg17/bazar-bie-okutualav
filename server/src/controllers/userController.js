// controllers/userController.js
const { db, mode } = require('../config/db');

// Perfil do usuário autenticado
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    let user;
    if (mode === 'pg') {
      user = await db.oneOrNone(
        'SELECT id, email, name, role, avatar_url, metadata, phone FROM users WHERE id=$1',
        [userId]
      );
    } else {
      const { data, error } = await db.select('users', 'id, email, name, role, avatar_url, metadata, phone');
      if (error) throw error;
      user = data.find(u => u.id === userId);
    }

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Atualizar perfil
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { name, phone, avatar_url, metadata } = req.body;

    if (mode === 'pg') {
      const updated = await db.one(
        `UPDATE users SET 
          name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          avatar_url = COALESCE($3, avatar_url),
          metadata = COALESCE($4, metadata),
          updated_at = NOW()
         WHERE id=$5
         RETURNING id, email, name, phone, avatar_url, metadata`,
        [name, phone, avatar_url, metadata, userId]
      );
      res.json(updated);
    } else {
      const { data: users, error: selErr } = await db.select('users', 'id, name, phone, avatar_url, metadata');
      if (selErr) throw selErr;

      const user = users.find(u => u.id === userId);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

      const updatedData = {
        name: name ?? user.name,
        phone: phone ?? user.phone,
        avatar_url: avatar_url ?? user.avatar_url,
        metadata: metadata ?? user.metadata,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error: upErr } = await db.update('users', updatedData, { id: userId });
      if (upErr) throw upErr;
      res.json(updated[0]);
    }
  } catch (err) {
    next(err);
  }
};

// Listar todos os usuários (apenas admin)
exports.listUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    if (mode === 'pg') {
      let query = 'SELECT id, email, name, role, status, avatar_url, created_at FROM users';
      const params = [];
      if (role) {
        query += ' WHERE role=$1';
        params.push(role);
      }
      query += ' ORDER BY created_at DESC';
      const users = await db.any(query, params);
      return res.json({ data: users });
    } else {
      const { data: users, error } = await db.select('users', 'id, email, name, role, status, avatar_url, created_at');
      if (error) throw error;
      const filtered = role ? users.filter(u => u.role === role) : users;
      res.json({ data: filtered });
    }
  } catch (err) {
    next(err);
  }
};