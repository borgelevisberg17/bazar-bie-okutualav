/**
 * Global error handling middleware.
 * @param {Error} err - The error object.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {void}
 */
module.exports = (err, req, res, next) => {
  console.error('[Error Handler]', err.stack);

  // Status padrão
  const statusCode = err.status || err.statusCode || 500;

  // Mensagem do cliente
  const message =
    err.message ||
    (statusCode === 404
      ? `Rota ${req.originalUrl} não encontrada`
      : 'Erro interno no servidor');

  // Resposta consistente em JSON
  if (!res.headersSent) {
    res.status(statusCode).json({
      status: 'error',
      code: statusCode,
      message: process.env.NODE_ENV === 'development' ? message : undefined,
      // opcional: só para dev
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
};
