// server/src/controllers/productController.js

const db = require("../config/db");
const productService = require("../services/productService");
const { ok } = require("../utils/responses");

// 📜 Listar produtos (com paginação e busca)
exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 24, q } = req.query;
    const data = await productService.list({ page: +page, limit: +limit, q });
    res.json(ok(data));
  } catch (e) {
    next(e);
  }
};

// 📜 Buscar produto por ID
exports.get = async (req, res, next) => {
  try {
    res.json(ok(await productService.get(req.params.id)));
  } catch (e) {
    next(e);
  }
};

const { createProductSchema } = require("../validators/productSchemas");
const validate = require("../middleware/validate");

// ➕ Criar produto (com upload + indexação no Meili)
exports.create = [
  validate(createProductSchema),
  async (req, res, next) => {
    try {
      const sellerUid = req.user.uid; // Assuming req.user is populated by auth middleware
      const product = await productService.create(sellerUid, req.body);
      res.status(201).json(ok(product, "Produto criado com sucesso!"));
    } catch (err) {
      console.error("Erro ao criar produto:", err);
      next(err);
    }
  },
];