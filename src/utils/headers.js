function setRateLimitHeaders(res, result) {
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter);
    }
}

module.exports = { setRateLimitHeaders };