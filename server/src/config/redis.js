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
});

redisClient.on("connect", () => log.info("Connecting to Redis..."));
redisClient.on("ready", () => log.success("Client connected to Redis and ready to use."));
redisClient.on("error", (err) => log.error(`Redis Client Error: ${err.message}`));
redisClient.on("end", () => log.info("Client disconnected from Redis."));

// Connect the client
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        log.error(`Failed to connect to Redis: ${err.message}`);
    }
})();

module.exports = redisClient;
