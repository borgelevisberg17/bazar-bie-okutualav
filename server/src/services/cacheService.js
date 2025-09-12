const redis = require('../config/redis');
exports.get = async (k) => {
  const v = await redis.get(k);
  return v ? JSON.parse(v) : null;
};
exports.set = (k,v,ttl=60) => redis.set(k, JSON.stringify(v), 'EX', ttl);
