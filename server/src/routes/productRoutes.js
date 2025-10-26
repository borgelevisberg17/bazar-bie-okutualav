import { Router } from "express";
import { createProduct } from "../controllers/productController.js";
import upload from "../middleware/upload.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management routes
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: The created product.
 */
router.post("/", upload.single("image"), createProduct);

export default router;
