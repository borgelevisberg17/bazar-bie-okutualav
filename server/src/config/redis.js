const Redis = require('ioredis');

/**
 * ioredis client instance.
 * @type {import('ioredis').Redis}
 */
const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

module.exports = client;
