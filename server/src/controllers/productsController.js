// server/src/controllers/productController.js
const productService = require("../services/productService");
const { ok, fail } = require("../utils/responses");
const {
    createProductSchema,
    listProductsSchema,
    getProductSchema
} = require("../validators/productSchemas");
const validate = require("../middleware/validate");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

/**
 * Lists all products with optional pagination and status filtering.
 * @param {Object} req - The Express request object.
 * @param {Object} req.query - The query parameters.
 * @param {number} [req.query.page=1] - The page number.
 * @param {number} [req.query.limit=10] - The number of items per page.
 * @param {string} [req.query.status] - The product status to filter by.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.list = [
    validate(listProductsSchema, "query"),
    async (req, res, next) => {
        try {
            const { page, limit, status, sellerId } = req.query;
            const data = await productService.list({ page, limit, status, sellerId });
            res.json(ok(data));
        } catch (err) {
            next(err);
        }
    }
];

/**
 * Adds a comment to a product.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the product to comment on.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.comment - The comment text.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The user's ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.addComment = [
    validate(getProductSchema, "params"),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { uid } = req.user;
            const { comment } = req.body;
            const result = await productService.addComment(id, uid, comment);
            res.status(201).json(ok(result, "Comentário adicionado com sucesso!"));
        } catch (err) {
            next(err);
        }
    }
];

/**
 * Likes a product.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the product to like.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The user's ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.like = [
    validate(getProductSchema, "params"),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { uid } = req.user;
            const result = await productService.like(id, uid);
            res.json(ok(result, "Produto gostado com sucesso!"));
        } catch (err) {
            next(err);
        }
    }
];

/**
 * Unlikes a product.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the product to unlike.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The user's ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.unlike = [
    validate(getProductSchema, "params"),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { uid } = req.user;
            const result = await productService.unlike(id, uid);
            res.json(ok(result, "Gosto removido com sucesso!"));
        } catch (err) {
            next(err);
        }
    }
];

/**
 * Retrieves detailed information for a single product by its ID.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the product to retrieve.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getDetails = [
    validate(getProductSchema, "params"),
    async (req, res, next) => {
        try {
            const product = await productService.getDetails(req.params.id);
            if (!product)
                return res.status(404).json(fail("Produto não encontrado"));
            res.json(ok(product));
        } catch (err) {
            next(err);
        }
    }
];

/**
 * Retrieves a single product by its ID.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the product to retrieve.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.get = [
    validate(getProductSchema, "params"),
    async (req, res, next) => {
        try {
            const product = await productService.get(req.params.id);
            if (!product)
                return res.status(404).json(fail("Produto não encontrado"));
            res.json(ok(product));
        } catch (err) {
            next(err);
        }
    }
];

/**
 * Creates a new product.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body.
 * @param {Array<Object>} [req.files] - An array of uploaded image files.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.role - The user's role.
 * @param {string} req.user.uid - The user's ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.create = [
    upload.array("images", 10),
    validate(createProductSchema),
    async (req, res, next) => {
        try {
            if (req.user.role !== "seller") {
                return res
                    .status(403)
                    .json(fail("Apenas vendedores podem criar produtos."));
            }
            const sellerUid = req.user.uid;
            const images = req.files?.map(file => ({ url: file.path })) || [];
            const productData = {
                ...req.body,
                images: JSON.stringify(images),
                status: "pending_approval"
            };

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

/**
 * Updates an existing product.
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the product to update.
 * @param {Object} req.body - The updated product data.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
exports.update = [
    validate(getProductSchema, "params"),
    async (req, res, next) => {
        try {
            const updatedProduct = await productService.update(
                req.params.id,
                req.body
            );
            res.json(ok(updatedProduct, "Produto atualizado com sucesso!"));
        } catch (err) {
            next(err);
        }
    }
];

/**
 * Removes a product.
 * @param {Object} req - The Express request object.
_@param {Object} req.params - The route parameters.
 * @param {string} req.params.id - The ID of the product to remove.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
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
