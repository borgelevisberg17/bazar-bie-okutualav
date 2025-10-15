const express = require("express");
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

// GET /categories → lista todas as categorias
router.get('/', categoriesController.list);

module.exports = router;