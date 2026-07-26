const RateLimitStrategy = require('./strategy.interface');

class FixedWindowStrategy extends RateLimitStrategy{
    async check(key){
        const { limit, windowMs } = this.config;
        const windowId = Math.floor(Date.now() / windowMs);
        const redisKey = `fixed:${key}:${windowId}`;

        const count = await this.redis.incr(redisKey);
        if (count === 1){
            await this.redis.pexpire(redisKey, windowMs);
        }

        const resetAt = (windowId + 1) * windowMs;
        const allowed = count <= limit;

        return {
            allowed,
            remaining: Math.max(0, limit - count),
            resetAt,
            retryAfter: allowed ? 0 : Math.ceil((resetAt - Date.now()) / 1000),
        };
    }
}

module.exports = FixedWindowStrategy;