const { z } = require('zod');
const sanitizeHtml = require('sanitize-html');

const sanitize = (str) => sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {}
});

exports.createProductSchema = z.object({
  name: z.string().min(2).transform(sanitize),
  description: z.string().optional().transform(val => val ? sanitize(val) : val),
  price: z.number().positive(),
  currency: z.string().default('AOA'),
  image_url: z.string().url().optional(),
  stock: z.number().int().nonnegative().default(0),
  tag: z.string().optional().transform(val => val ? sanitize(val) : val)
});

exports.listProductsSchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1).refine(val => val > 0, { message: "Page must be a positive number" }),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 24).refine(val => val > 0, { message: "Limit must be a positive number" }),
    q: z.string().optional().transform(val => val ? sanitize(val) : val)
});

exports.getProductSchema = z.object({
    id: z.string().uuid({ message: "Invalid UUID" })
});
