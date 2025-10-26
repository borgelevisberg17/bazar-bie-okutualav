const { db, mode } = require('../config/db');

/**
 * Retrieves all reviews for a specific product.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.productId - The ID of the product.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (mode === 'pg') {
      const reviews = await db.any(
        'SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC',
        [productId]
      );
      return res.json(reviews);
    } else {
      const { data, error } = await db.select('reviews');
      if (error) throw error;
      const filtered = data
        .filter(r => r.product_id === parseInt(productId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return res.json(filtered);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new review for a product.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.productId - The ID of the product to review.
 * @param {number} req.body.rating - The rating given to the product (1-5).
 * @param {string} [req.body.comment] - The review comment.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The user's ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.uid;

    if (!productId || rating == null) return res.status(400).json({ error: 'productId e rating são obrigatórios' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating deve estar entre 1 e 5' });

    let review;
    if (mode === 'pg') {
      review = await db.one(
        `INSERT INTO reviews (product_id, user_id, rating, comment, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
        [productId, userId, rating, comment || '']
      );
    } else {
      const { data, error } = await db.insert('reviews', [{
        product_id: productId,
        user_id: userId,
        rating,
        comment: comment || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
      if (error) throw error;
      review = data[0];
    }

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing review.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the review to update.
 * @param {Object} req.body - The request body.
 * @param {number} [req.body.rating] - The updated rating (1-5).
 * @param {string} [req.body.comment] - The updated comment.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The user's ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.uid;

    if (rating != null && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating deve estar entre 1 e 5' });
    }

    let review;
    if (mode === 'pg') {
      review = await db.oneOrNone('SELECT * FROM reviews WHERE id=$1', [id]);
      if (!review) return res.status(404).json({ error: 'Review não encontrada' });
      if (review.user_id !== userId) return res.status(403).json({ error: 'Não autorizado' });

      review = await db.one(
        'UPDATE reviews SET rating=COALESCE($2, rating), comment=COALESCE($3, comment), updated_at=NOW() WHERE id=$1 RETURNING *',
        [id, rating, comment]
      );
    } else {
      const { data, error } = await db.select('reviews').eq('id', parseInt(id)).single();
      if (error || !data) return res.status(404).json({ error: 'Review não encontrada' });
      if (data.user_id !== userId) return res.status(403).json({ error: 'Não autorizado' });

      const { data: updatedData, error: updateErr } = await db.update('reviews', {
        rating,
        comment,
        updated_at: new Date().toISOString()
      }, { id: parseInt(id) });
      if (updateErr) throw updateErr;
      review = updatedData[0];
    }

    res.json(review);
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a review.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the review to delete.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The user's ID.
 * @param {string} req.user.role - The user's role.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const userRole = req.user.role;

    let review;
    if (mode === 'pg') {
      review = await db.oneOrNone('SELECT * FROM reviews WHERE id=$1', [id]);
      if (!review) return res.status(404).json({ error: 'Review não encontrada' });
      if (review.user_id !== userId && userRole !== 'admin') return res.status(403).json({ error: 'Não autorizado' });

      await db.none('DELETE FROM reviews WHERE id=$1', [id]);
    } else {
      const { data, error } = await db.select('reviews').eq('id', parseInt(id)).single();
      if (error || !data) return res.status(404).json({ error: 'Review não encontrada' });
      if (data.user_id !== userId && userRole !== 'admin') return res.status(403).json({ error: 'Não autorizado' });

      const { error: deleteErr } = await db.delete('reviews', { id: parseInt(id) });
      if (deleteErr) throw deleteErr;
    }

    res.json({ message: 'Review removida com sucesso' });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculates the average rating for a product.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.productId - The ID of the product.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getAverageRating = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let average = 0;
    let count = 0;

    if (mode === 'pg') {
      const result = await db.one('SELECT AVG(rating)::numeric(10,2) AS avg, COUNT(*) AS count FROM reviews WHERE product_id=$1', [productId]);
      average = parseFloat(result.avg) || 0;
      count = parseInt(result.count);
    } else {
      const { data, error } = await db.select('reviews');
      if (error) throw error;
      const filtered = data.filter(r => r.product_id === parseInt(productId));
      count = filtered.length;
      average = count ? filtered.reduce((sum, r) => sum + r.rating, 0) / count : 0;
      average = parseFloat(average.toFixed(2));
    }

    res.json({ average, count });
  } catch (error) {
    next(error);
  }
};
