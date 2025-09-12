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
  upload.single("image"),
  productController.create
);

module.exports = router;