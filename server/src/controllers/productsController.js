// server/src/controllers/productController.js
const productService = require("../services/productService");
const { ok, fail } = require("../utils/responses");
const { createProductSchema, listProductsSchema, getProductSchema } = require("../validators/productSchemas");
const validate = require("../middleware/validate");

// 📜 Listar produtos
exports.list = [
  validate(listProductsSchema, "query"),
  async (req, res, next) => {
    try {
      const { page, limit, q, status } = req.query;
      const data = await productService.list({ page, limit, q, status });
      res.json(ok(data));
    } catch (err) {
      next(err);
    }
  }
];

// 📜 Buscar produto por ID
exports.get = [
  validate(getProductSchema, "params"),
  async (req, res, next) => {
    try {
      const product = await productService.get(req.params.id);
      if (!product) return res.status(404).json(fail("Produto não encontrado"));
      res.json(ok(product));
    } catch (err) {
      next(err);
    }
  }
];

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// ➕ Criar produto (upload + indexação Meili)
exports.create = [
  upload.array('images', 10),
  validate(createProductSchema),
  async (req, res, next) => {
    try {
      if (req.user.role !== 'seller') {
        return res.status(403).json(fail('Apenas vendedores podem criar produtos.'));
      }
      const sellerUid = req.user.uid;
      const images = req.files?.map(file => ({ url: file.path })) || [];
      const productData = { ...req.body, images: JSON.stringify(images), status: 'pending_approval' };

      const product = await productService.create(sellerUid, productData);

      // TODO: indexar no Meili (chamar serviço de indexação)
      // await indexService.indexProduct(product);

      res.status(201).json(ok(product, "Produto criado com sucesso!"));
    } catch (err) {
      console.error("Erro ao criar produto:", err);
      next(err);
    }
  }
];

// ✏️ Atualizar produto
exports.update = [
  validate(getProductSchema, "params"),
  async (req, res, next) => {
    try {
      const updatedProduct = await productService.update(req.params.id, req.body);
      res.json(ok(updatedProduct, "Produto atualizado com sucesso!"));
    } catch (err) {
      next(err);
    }
  }
];

// ❌ Remover produto
exports.remove = [
  validate(getProductSchema, "params"),
  async (req, res, next) => {
    try {
      await productService.remove(req.params.id);
      res.json(ok(null, "Produto removido com sucesso!"));
    } catch (err) {
      next(err);
    }
  }
];