// server/src/schemas/productSchemas.js
const { z } = require('zod');
const sanitizeHtml = require('sanitize-html');

const sanitize = (str) => sanitizeHtml(str, {
  allowedTags: [],
  allowedAttributes: {}
});

// Schema para criar produto
const createProductSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).transform(sanitize),
  description: z.string().optional().transform(val => val ? sanitize(val) : val),
  price: z.number().positive({ message: "O preço deve ser positivo." }),
  currency: z.string().default('AOA'),
  image_url: z.string().url({ message: "A imagem deve ser uma URL válida." }).optional(),
  stock: z.number().int().nonnegative({ message: "O estoque não pode ser negativo." }).default(0),
  tag: z.string().optional().transform(val => val ? sanitize(val) : val)
});

// Schema para listar produtos (query params)
const listProductsSchema = z.object({
  page: z.string()
         .optional()
         .transform(val => val ? parseInt(val, 10) : 1)
         .refine(val => val > 0, { message: "A página deve ser um número positivo." }),
  limit: z.string()
          .optional()
          .transform(val => val ? parseInt(val, 10) : 24)
          .refine(val => val > 0, { message: "O limite deve ser um número positivo." }),
  q: z.string().optional().transform(val => val ? sanitize(val) : val)
});

// Schema para pegar produto por ID
const getProductSchema = z.object({
  id: z.string().uuid({ message: "ID inválido." })
});

// Middleware para validação de schemas
const validateSchema = (schema, property = 'body') => (req, res, next) => {
  try {
    const validated = schema.parse(req[property]);
    req[property] = validated;
    next();
  } catch (err) {
    return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
  }
};

module.exports = {
  createProductSchema,
  listProductsSchema,
  getProductSchema,
  validateSchema
};