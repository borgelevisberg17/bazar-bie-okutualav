const { z } = require('zod');
exports.createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().default('AOA'),
  image_url: z.string().url().optional(),
  stock: z.number().int().nonnegative().default(0),
  tag: z.string().optional()
});
