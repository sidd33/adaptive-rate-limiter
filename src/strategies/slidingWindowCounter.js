const RateLimitingStrategy = require('./strategy.interface');

class SlidingWindowCounter extends RateLimitingStrategy{
    async check(key){
        const { limit, windowMs } = this.config;
        const now = Date.now();
        const currentWindowId = Math.floor(now / windowMs);
        const previousWindowId = currentWindowId - 1;

        const currentKey = `swc:${key}:${currentWindowId}`;
        const previousKey = `swc:${key}:${previousWindowId}`;

        const pipeline = this.redis.pipeline();
        pipeline.get(previousKey);
        pipeline.incr(currentKey);
        const results = await pipeline.exec();

        const previousCount = parseInt(results[0][1] || '0', 10);
        const currentCount = parseInt(results[1][1], 10);

        if(currentCount === 1){
            await this.redis.pexpire(currentKey, windowMs * 2);
        }

        const elapsedInCurrent = now % windowMs;
        const weight = (windowMs - elapsedInCurrent) / windowMs;

        const estimatedCount = previousCount * weight + currentCount;
        const allowed = estimatedCount <= limit;

        return{
            allowed,
            remaining: Math.max(0, Math.floor(limit - estimatedCount)),
            resetAt: (currentWindowId + 1) * windowMs,
            retryAfter: allowed ? 0 : Math.ceil(elapsedInCurrent /1000),
        };
    }
}

module.exports = SlidingWindowCounter;