const db = require('../config/db');

// Criar uma nova loja
exports.createStore = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const owner_id = req.user.uid; // Assumindo que o ID do usuário está no req.user

        if (!name) {
            return res.status(400).json({ error: 'O nome da loja é obrigatório.' });
        }

        // Criar um slug a partir do nome da loja
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const newStore = await db.one(
            'INSERT INTO stores(owner_id, name, slug, description) VALUES($1, $2, $3, $4) RETURNING *',
            [owner_id, name, slug, description]
        );
        res.status(201).json(newStore);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Uma loja com este nome ou slug já existe.' });
        }
        next(error);
    }
};

// Obter a loja do usuário autenticado
exports.getMyStore = async (req, res, next) => {
    try {
        const owner_id = req.user.uid;
        const store = await db.oneOrNone('SELECT * FROM stores WHERE owner_id = $1', [owner_id]);
        if (store) {
            res.json(store);
        } else {
            res.status(404).json({ error: 'Loja não encontrada.' });
        }
    } catch (error) {
        next(error);
    }
};

// Obter detalhes de uma loja pelo slug
exports.getStoreBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const store = await db.oneOrNone('SELECT * FROM stores WHERE slug = $1', [slug]);
        if (store) {
            res.json(store);
        } else {
            res.status(404).json({ error: 'Loja não encontrada.' });
        }
    } catch (error) {
        next(error);
    }
};

// Obter produtos de uma loja
exports.getStoreProducts = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const products = await db.any(
            'SELECT p.* FROM products p JOIN stores s ON p.store_id = s.id WHERE s.slug = $1',
            [slug]
        );
        res.json(products);
    } catch (error) {
        next(error);
    }
};
