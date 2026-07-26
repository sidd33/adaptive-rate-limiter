const fs = require('fs');
const path = require('path');
const RateLimitStrategy = require('./strategy.interface');

const luaScript = fs.readFileSync(
  path.join(__dirname, '../store/scripts/tokenBucket.lua'),
  'utf8'
);


class TokenBucketStrategy extends RateLimitStrategy {
  constructor(redisClient, config) {
    super(redisClient, config);
    this.redis.defineCommand('tokenBucket', {
      numberOfKeys: 1,
      lua: luaScript,
    });
  }

  async check(key) {
    const { capacity, refillRate } = this.config;
    const redisKey = `tb:${key}`;
    const now = Date.now();

    const [allowedRaw, remainingRaw] = await this.redis.tokenBucket(
      redisKey,
      capacity,
      refillRate,
      now
    );

    const allowed = allowedRaw === 1;
    const remaining = parseInt(remainingRaw, 10);

    return {
      allowed,
      remaining,
      resetAt: now + Math.ceil((capacity - remaining) / refillRate) * 1000,
      retryAfter: allowed ? 0 : Math.ceil(1 / refillRate),
    };
  }
}

module.exports = TokenBucketStrategy;