const StrategyRouter = require('../router/strategyRouter');
const { setRateLimitHeaders } = require('../utils/headers');

function createRateLimiter(config, keyFn) {
    const router = new StrategyRouter(config);

    const getKey = keyFn || ((req) => req.ip);

    return async function rateLimitMiddleware(req, res, next) {
        try {
            const route = req.path;
            const key = getKey(req);

            const result = await router.check(route, key);

            setRateLimitHeaders(res, result);

            if(!result.allowed) {
                return res.status(429).json({
                    error: 'Too Many Requests',
                    retryAfter: result.retryAfter,
                });
            }

            next();
        } catch (err) {
            console.error('[RateLimiter] Error during check:', err.message);
            next();
        }
    };
}

module.exports = createRateLimiter;