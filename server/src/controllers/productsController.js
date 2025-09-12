// server/src/controllers/productController.js

const db = require("../db/index");
const { v2: cloudinary } = require("cloudinary");
const meiliClient = require("../services/meiliClient");
const productService = require("../services/productService");
const { ok } = require("../utils/responses");

// ⚙️ Config Cloudinary via .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// ➕ Criar produto (com upload + indexação no Meili)
exports.create = async (req, res, next) => {
  try {
    const { name, description, price, category, sellerId } = req.body;

    // Upload da imagem (via Multer)
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Imagem obrigatória" });
    }

    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "bazar/products",
    });

    // Salvar no banco
    const product = await db.one(
      `INSERT INTO products 
        (name, description, price, category, seller_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, price, category, seller_id, image_url`,
      [name, description, price, category, sellerId, uploadResult.secure_url]
    );

    // Indexar no Meilisearch
    await meiliClient.index(process.env.MEILI_INDEX).addDocuments([
      {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        image_url: product.image_url,
        seller_id: product.seller_id,
      },
    ]);

    res.status(201).json(ok(product, "Produto criado com sucesso!"));
  } catch (err) {
    console.error("Erro ao criar produto:", err);
    next(err);
  }
};