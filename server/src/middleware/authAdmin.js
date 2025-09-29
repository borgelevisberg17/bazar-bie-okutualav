const { db, mode } = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    let user;
    if (mode === 'pg') {
      user = await db.oneOrNone('SELECT role FROM users WHERE id=$1', [userId]);
    } else {
      // Supabase-js v2 alternate for local dev
      const { data, error } = await db
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows
        throw error;
      }
      user = data;
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
    }

    next();
  } catch (err) {
    console.error('[Admin Auth Middleware Error]', err.message);
    res.status(500).json({ error: 'Erro interno do servidor ao verificar permissões.' });
  }
};