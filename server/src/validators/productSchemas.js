// server/src/schemas/productSchemas.js
const { z } = require('zod');
const sanitizeHtml = require('sanitize-html');

/**
 * Sanitizes a string by removing all HTML tags.
 * @param {string} str - The string to sanitize.
 * @returns {string} The sanitized string.
 */
const sanitize = (str) => sanitizeHtml(str, {
  allowedTags: [],
  allowedAttributes: {}
});

/**
 * Zod schema for creating a product.
 * @type {import('zod').ZodObject}
 */
const createProductSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).transform(sanitize),
  description: z.string().optional().transform(val => val ? sanitize(val) : val),
  price: z.number().positive({ message: "O preço deve ser positivo." }),
  currency: z.string().default('AOA'),
  image_url: z.string().url({ message: "A imagem deve ser uma URL válida." }).optional(),
  stock: z.number().int().nonnegative({ message: "O estoque não pode ser negativo." }).default(0),
  tag: z.string().optional().transform(val => val ? sanitize(val) : val)
});

/**
 * Zod schema for listing products (validating query parameters).
 * @type {import('zod').ZodObject}
 */
const listProductsSchema = z.object({
  page: z.string()
         .optional()
         .transform(val => val ? parseInt(val, 10) : 1)
         .refine(val => val > 0, { message: "A página deve ser um número positivo." }),
  limit: z.string()
          .optional()
          .transform(val => val ? parseInt(val, 10) : 24)
          .refine(val => val > 0, { message: "O limite deve ser um número positivo." })
  // q: z.string().optional().transform(val => val ? sanitize(val) : val)
});

/**
 * Zod schema for getting a product by ID (validating route parameters).
 * @type {import('zod').ZodObject}
 */
const getProductSchema = z.object({
  id: z.string().uuid({ message: "ID inválido." })
});

/**
 * Middleware to validate request data against a Zod schema.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @param {'body' | 'query' | 'params'} [property='body'] - The property of the request object to validate.
 * @returns {Function} An Express middleware function.
 */
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
