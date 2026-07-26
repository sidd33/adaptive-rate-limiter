const RateLimitStrategy = require('./strategy.interface');

class SlidingWindowLogStrategy extends RateLimitStrategy {
    async check(key) {
        const { limit, windowMs } = this.config; 
        const redisKey = `slog:$(key)`;
        const now = Date.now();
        const windowStart = now - windowMs;

        const pipeline = this.redis.pipeline();
        pipeline.zremrangebyscore(redisKey, 0, windowStart);
        pipeline.zcard(redisKey);
        const results = await pipeline.exec();

        const currentCount = results[1][1];
        const allowed = currentCount < limit;

        if (allowed) {
            await this.redis.zadd(redisKey, now, `${now}-${Math.random()}`);
            await this.redis.pexpire(redisKey, windowMs);
        }

        return {
            allowed,
            remaining: Math.max(0, limit - currentCount - (allowed ? 1 : 0)),
            resetAt: now + windowMs,
            retryAfter: allowed ? 0 : Math.ceil(windowMs / 1000),
        }
    }
}

module.exports = SlidingWindowLogStrategy;