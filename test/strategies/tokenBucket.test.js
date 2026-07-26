const redisClient = require('../../src/store/redisClient');
const TokenBucketStrategy = require('../../src/strategies/tokenBucket');

async function run() {
  // instantiate the strategy with our chosen bucket settings
  const strategy = new TokenBucketStrategy(redisClient, {
    capacity: 5,
    refillRate: 1, // 1 token added per second
  });

  // fire 7 checks in a tight loop, simulating a burst of requests from the same user
  for (let i = 1; i <= 7; i++) {
    const result = await strategy.check('user123');
    console.log(`Request ${i}:`, result);
  }

  process.exit(0); // close the script cleanly (otherwise the Redis connection keeps it alive)
}

run();