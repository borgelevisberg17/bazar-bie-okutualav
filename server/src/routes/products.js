const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const productController = require("../controllers/productsController");
const authFirebase = require("../middleware/authFirebase");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management routes
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get a list of all products.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of products.
 */
router.get("/", productController.list);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested product.
 */
router.get("/:id", productController.get);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: The created product.
 */
router.post(
  "/",
  authFirebase,
  upload.array("images", 5), // Aceitar até 5 imagens
  productController.create
);

/**
 * @swagger
 * /products/{id}/details:
 *   get:
 *     summary: Get detailed product information for quick view.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed product information.
 */
router.get("/:id/details", productController.getDetails);

/**
 * @swagger
 * /products/{id}/like:
 *   post:
 *     summary: Like a product.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product liked successfully.
 */
router.post("/:id/like", authFirebase, productController.like);

/**
 * @swagger
 * /products/{id}/unlike:
 *   post:
 *     summary: Unlike a product.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product unliked successfully.
 */
router.post("/:id/unlike", authFirebase, productController.unlike);

module.exports = router;
