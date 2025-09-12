module.exports = (err, req, res, next) => {
  console.error('[Error Handler]', err.message);

  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};