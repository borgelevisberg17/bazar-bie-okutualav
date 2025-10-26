const express = require("express");
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management routes
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get a list of all categories.
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: A list of categories.
 */
router.get('/', categoriesController.list);

module.exports = router;
