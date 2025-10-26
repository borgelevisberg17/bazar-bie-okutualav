const redis = require('../config/redis');

/**
 * Retrieves a value from the cache.
 * @param {string} k - The cache key.
 * @returns {Promise<any|null>} A promise that resolves to the cached value, or null if not found.
 */
exports.get = async (k) => {
  const v = await redis.get(k);
  return v ? JSON.parse(v) : null;
};

/**
 * Sets a value in the cache.
 * @param {string} k - The cache key.
 * @param {*} v - The value to cache.
 * @param {number} [ttl=60] - The time-to-live for the cache entry in seconds.
 * @returns {Promise<void>}
 */
exports.set = (k,v,ttl=60) => redis.set(k, JSON.stringify(v), 'EX', ttl);
