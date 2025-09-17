module.exports = (schema, source = 'body') => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (e) {
    res.status(400).json({ error: 'Validation error', details: e.errors });
  }
};
