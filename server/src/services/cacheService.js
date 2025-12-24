// server/src/services/cacheService.js
const redisClient = require("../config/redis.js");
const chalk = require("chalk");

const log = {
    info: (msg) => console.log(chalk.yellowBright(`[CACHE] ${msg}`)),
};

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

async function get(key) {
    const value = await redisClient.get(key);
    if (value) {
        log.info(`HIT: ${key}`);
        return JSON.parse(value);
    }
    log.info(`MISS: ${key}`);
    return null;
}

async function set(key, value, expiration = DEFAULT_EXPIRATION) {
    log.info(`SET: ${key}`);
    await redisClient.setEx(key, expiration, JSON.stringify(value));
}

async function del(key) {
    log.info(`DEL: ${key}`);
    await redisClient.del(key);
}

async function getOrSet(key, cb, expiration = DEFAULT_EXPIRATION) {
    const cachedValue = await get(key);
    if (cachedValue) {
        return cachedValue;
    }

    const freshValue = await cb();
    if (freshValue) {
        await set(key, freshValue, expiration);
    }
    return freshValue;
}

module.exports = {
    get,
    set,
    del,
    getOrSet,
};
