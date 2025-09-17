const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const productController = require("../controllers/productsController");
const authFirebase = require("../middleware/authFirebase");

// Rotas
router.get("/", productController.list);
router.get("/:id", productController.get);
router.post(
  "/",
  authFirebase,
  upload.array("images", 5), // Aceitar até 5 imagens
  productController.create
);

module.exports = router;