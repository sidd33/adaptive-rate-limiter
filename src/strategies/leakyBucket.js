const fs = require('fs');
const path = require('path')
const RateLimitStrategy = require("./strategy.interface")

const luaScript = fs.readFileSync(
    path.join(__dirname, '../store/scripts/leakyBucket.lua'),
    'utf8'
);


class LeakyBucketStrategy extends RateLimitStrategy{
    constructor(redisClient, config) {
        super(redisClient, config);
        this.redis.defineCommand('leakyBucket', {
            numberOfKeys: 1,
            lua: luaScript,
        });
    }


    async check(key){
        const { capacity, leakRate } = this.config;
        const redisKey = `lb:${key}`;
        const now = Date.now();

        const [allowedRaw, volumeRaw] = await this.redis.leakyBucket(
            redisKey,
            capacity,
            leakRate,
            now
        );

        const allowed = allowedRaw === 1;
        const volume = parseInt(volumeRaw, 10);

        return {
            allowed,
            remaining: Math.max(0, capacity - volume),
            resetAt : now + Math.ceil(volume / leakRate) * 1000,
            retryAfter: allowed ? 0 : Math.ceil(1 / leakRate),
        };
    }
}

module.exports = LeakyBucketStrategy;