const jwt = require('jsonwebtoken');

/**
 * Generates a JWT access token.
 * @param {Object} payload - The payload to sign.
 * @returns {string} The generated JWT.
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }); // curto prazo
};

/**
 * Generates a JWT refresh token.
 * @param {Object} payload - The payload to sign.
 * @returns {string} The generated JWT.
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }); // longo prazo
};

/**
 * Verifies a JWT.
 * @param {string} token - The JWT to verify.
 * @param {string} secret - The secret to use for verification.
 * @returns {Object|null} The decoded payload if the token is valid, otherwise null.
 */
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
