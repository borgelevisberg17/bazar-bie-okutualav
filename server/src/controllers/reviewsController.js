const db = require('../config/db');

exports.getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const reviews = await db.any('SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC', [productId]);
        res.json(reviews);
    } catch (error) {
        next(error);
    }
};
