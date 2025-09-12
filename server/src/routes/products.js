const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // simples, pode ajustar pra memória/diskStorage

const productController = require("../controllers/productController");

// Rotas
router.get("/", productController.list);
router.get("/:id", productController.get);
router.post("/", upload.single("image"), productController.create);

module.exports = router;