/**
 * Middleware to check if a user has a specific role.
 * @param {string} role - The required role.
 * @returns {Function} An Express middleware function.
 */
module.exports = (role) => (req, res, next) => {
  const roles = (req.user && req.user.roles) || [];
  if (!roles.includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
