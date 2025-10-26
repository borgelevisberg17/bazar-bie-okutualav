// server/src/controllers/storeController.js
const { db, mode } = require('../config/db');

/**
 * Creates a new store.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.name - The name of the store.
 * @param {string} [req.body.description] - The description of the store.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The user's ID, who will be the store owner.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.createStore = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const owner_id = req.user.uid;
    if (!name) return res.status(400).json({ error: 'O nome da loja é obrigatório.' });

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    if (mode === 'pg') {
      const store = await db.one(
        'INSERT INTO stores(owner_id, name, slug, description) VALUES($1, $2, $3, $4) RETURNING *',
        [owner_id, name, slug, description]
      );
      return res.status(201).json(store);
    } else {
      // Supabase
      const { data, error } = await db.insert('stores', [{ owner_id, name, slug, description }]);
      if (error) throw error;
      return res.status(201).json(data[0]);
    }
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Uma loja com este nome ou slug já existe.' });
    }
    next(error);
  }
};

/**
 * Retrieves the store owned by the authenticated user.
 * @param {Object} req - The Express request object.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The user's ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getMyStore = async (req, res, next) => {
  try {
    const owner_id = req.user.uid;
    let store;

    if (mode === 'pg') {
      store = await db.oneOrNone('SELECT * FROM stores WHERE owner_id=$1', [owner_id]);
    } else {
      const { data, error } = await db.select('stores');
      if (error) throw error;
      store = data.find(s => s.owner_id === owner_id);
    }

    if (!store) return res.status(404).json({ error: 'Loja não encontrada.' });
    return res.json(store);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a store by its slug.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.slug - The slug of the store to retrieve.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getStoreBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let store;

    if (mode === 'pg') {
      store = await db.oneOrNone('SELECT * FROM stores WHERE slug=$1', [slug]);
    } else {
      const { data, error } = await db.select('stores');
      if (error) throw error;
      store = data.find(s => s.slug === slug);
    }

    if (!store) return res.status(404).json({ error: 'Loja não encontrada.' });
    return res.json(store);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves all products belonging to a store.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.slug - The slug of the store.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getStoreProducts = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let products;

    if (mode === 'pg') {
      products = await db.any(
        'SELECT p.* FROM products p JOIN stores s ON p.store_id = s.id WHERE s.slug=$1',
        [slug]
      );
    } else {
      const { data: stores, error: storeErr } = await db.select('stores');
      if (storeErr) throw storeErr;
      const store = stores.find(s => s.slug === slug);
      if (!store) return res.status(404).json({ error: 'Loja não encontrada.' });

      const { data: productsData, error: prodErr } = await db.select('products');
      if (prodErr) throw prodErr;
      products = productsData.filter(p => p.store_id === store.id);
    }

    return res.json(products);
  } catch (error) {
    next(error);
  }
};
