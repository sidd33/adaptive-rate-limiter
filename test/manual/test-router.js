const StrategyRouter = require('./src/router/strategyRouter');
const config = require('./src/config/rateLimitConfig.json');

async function run() {
  const router = new StrategyRouter(config);

  // simulate hitting two different endpoints with different algorithms
  console.log('Login attempt:', await router.check('/api/login', 'user123'));
  console.log('Upload attempt:', await router.check('/api/upload', 'user123'));
  console.log('Unknown route (uses default):', await router.check('/api/random', 'user123'));

  process.exit(0);
}

run();