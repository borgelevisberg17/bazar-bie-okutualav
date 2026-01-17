// server/src/config/redis.js
const { createClient } = require("redis");
const chalk = require("chalk");

const log = {
    info: (msg) => console.log(chalk.cyanBright(`[REDIS] ${msg}`)),
    success: (msg) => console.log(chalk.greenBright(`[REDIS] ${msg}`)),
    error: (msg) => console.log(chalk.redBright(`[REDIS] ${msg}`)),
};

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                log.error("Redis reconnection failed after 5 attempts. Continuing without Redis.");
                return false; // Para de tentar
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

redisClient.on("error", (err) => {
    // Apenas loga o erro sem derrubar o processo
    if (process.env.NODE_ENV !== 'test') {
        log.error(`Redis Error: ${err.message}`);
    }
});

(async () => {
    try {
        if (process.env.NODE_ENV !== 'test') {
            await redisClient.connect();
        }
    } catch (err) {
        log.error(`Could not establish connection to Redis: ${err.message}`);
    }
})();

module.exports = redisClient;
