/**
 * Middleware to validate request data against a Zod schema.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @param {'body' | 'query' | 'params'} [source='body'] - The source of the data to validate in the request object.
 * @returns {Function} An Express middleware function.
 */
module.exports = (schema, source = 'body') => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (e) {
    res.status(400).json({ error: 'Validation error', details: e.errors });
  }
};
