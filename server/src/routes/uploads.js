// server/src/routes/uploadsRouter.js
const { Router } = require('express');
const uploadsController = require('../controllers/uploadsController');
const authFirebase = require('../middleware/authFirebase');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File upload routes
 */

/**
 * @swagger
 * /uploads:
 *   post:
 *     summary: Upload a file.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [avatar, product, storeDoc]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: The uploaded file URL.
 */
router.post('/', authFirebase, async (req, res, next) => {
  try {
    const { type } = req.body;

    switch (type) {
      case 'avatar':
        return uploadsController.uploadAvatar[1](req, res, next); // multer middleware já aplicado
      case 'product':
        return uploadsController.uploadProductImage[1](req, res, next);
      case 'storeDoc':
        return uploadsController.uploadStoreDocument[1](req, res, next);
      default:
        return res.status(400).json({ error: 'Tipo de upload inválido. Use avatar, product ou storeDoc.' });
    }
  } catch (err) {
    next(err);
  }
});

// Aplicar o middleware multer correto antes do controller
router.use(authFirebase, (req, res, next) => {
  const { type } = req.body;

  switch (type) {
    case 'avatar':
      return uploadsController.uploadAvatar[0](req, res, next);
    case 'product':
      return uploadsController.uploadProductImage[0](req, res, next);
    case 'storeDoc':
      return uploadsController.uploadStoreDocument[0](req, res, next);
    default:
      return next();
  }
});

module.exports = router;
