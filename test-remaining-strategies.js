const redisClient = require('./src/store/redisClient');
const SlidingWindowLogStrategy = require('./src/strategies/slidingWindowLog');
const LeakyBucketStrategy = require('./src/strategies/leakyBucket');

async function run() {
  console.log('--- Sliding Window Log (limit: 3, windowMs: 5000) ---');
  const slog = new SlidingWindowLogStrategy(redisClient, {
    limit: 3,
    windowMs: 5000,
  });
  for (let i = 1; i <= 4; i++) {
    const result = await slog.check('billingUser1');
    console.log(`Request ${i}:`, result);
  }

  console.log('\n--- Leaky Bucket (capacity: 3, leakRate: 1) ---');
  const leaky = new LeakyBucketStrategy(redisClient, {
    capacity: 3,
    leakRate: 1, // drains 1 request per second
  });
  for (let i = 1; i <= 4; i++) {
    const result = await leaky.check('paymentsUser1');
    console.log(`Request ${i}:`, result);
  }

  process.exit(0);
}

run();