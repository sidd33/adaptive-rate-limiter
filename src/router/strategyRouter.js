const redisClient = require('../store/redisClient');

const FixedWindowStrategy = require('../strategies/fixedWindow');
const SlidingWindowLogStrategy = require('../strategies/slidingWindowLog');
const SlidingWindowCounterStrategy = require('../strategies/slidingWindowCounter');
const TokenBucketStrategy = require('../strategies/tokenBucket');
const LeakyBucketStrategy = require('../strategies/leakyBucket');

const STRATEGY_MAP = {
  fixedWindow: FixedWindowStrategy,
  slidingWindowLog: SlidingWindowLogStrategy,
  slidingWindowCounter: SlidingWindowCounterStrategy,
  tokenBucket: TokenBucketStrategy,
  leakyBucket: LeakyBucketStrategy,
};

class StrategyRouter {
    constructor(config) {
        this.config = config;
        this.instances = new Map();
    }

    getStrategyForRoute(route) {
        const routeConfig = this.config[route] || this.config['default'];
        const cacheKey = route in this.config ? route : 'default';

        if (this.instances.has(cacheKey)) {
            return this.instances.get(cacheKey);
        }

        const StrategyClass = STRATEGY_MAP[routeConfig.strategy];
        if(!StrategyClass) {
            throw new Error(`Unknown strategy "${routeConfig.strategy}" for route "${route}"`);
        }

        const instance = new StrategyClass(redisClient, routeConfig);
        this.instances.set(cacheKey, instance);
        return instance;
    }

    async check(route, key){
        const strategy = this.getStrategyForRoute(route);
        return strategy.check(key);
    }
}

module.exports = StrategyRouter;

