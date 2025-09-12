import { Router } from "express";
import { createProduct } from "../controllers/productController.js";
import upload from "../middleware/upload.js";

const router = Router();

router.post("/", upload.single("image"), createProduct);

export default router;