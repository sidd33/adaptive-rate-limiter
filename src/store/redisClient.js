const Redis = require('ioredis');

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,

    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

redisClient.on('error', (err) => {
    console.log('[Redis] Connection error:', err.message);
});

module.exports = redisClient;