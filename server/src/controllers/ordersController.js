const db = require('../config/db');

exports.getUserOrders = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const orders = await db.any('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(orders);
    } catch (error) {
        next(error);
    }
};
