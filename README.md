# Adaptive Rate Limiter

A rate-limiting system that dynamically switches between five different algorithms
based on route configuration — built to demonstrate distributed systems design,
not just a single rate-limiting technique.

## Why this exists

Most rate limiter tutorials implement one algorithm. Production systems rarely need
just one: a login endpoint needs strict, simple protection against brute force; a
file upload endpoint benefits from allowing bursts; a payments endpoint needs smooth,
predictable throughput. This project implements all five major algorithms behind a
single interface, with a config-driven router that picks the right one per route.

## Architecture

Client Request
      |
      v
+---------------------+
|  Express Middleware   |
+----------+-----------+
           |
           v
+---------------------+
|  Strategy Router       |  <- reads rateLimitConfig.json,
+----------+-----------+     picks algorithm per-route
           |
           v
+-----------------------------------------------+
|  Strategy Interface (check(key) -> result)        |
+------------+------------+------------+-----------+
| FixedWindow| TokenBucket| LeakyBucket| SlidingWin  |
+------------+------------+------------+-----------+
           |
           v
   Redis (shared state, Lua scripts for atomicity)  

## Algorithms implemented

| Algorithm | Atomicity method | Best for |
|---|---|---|
| Fixed Window | Redis INCR + PEXPIRE | Cheap, simple protection (login, signup) |
| Sliding Window Log | Redis pipeline (ZREMRANGEBYSCORE + ZCARD) | High-precision limits (billing) |
| Sliding Window Counter | Redis pipeline + weighted estimate | Balanced accuracy/cost |
| Token Bucket | Lua script (atomic) | Allows controlled bursts (uploads, batch APIs) |
| Leaky Bucket | Lua script (atomic) | Smooths bursts into steady throughput (payments) |

## Setup

```bash
git clone https://github.com/sidd33/adaptive-rate-limiter.git
cd adaptive-rate-limiter
npm install
docker-compose up -d      
node examples/express-app-demo/app.js
```

Server runs on `http://localhost:3000`.

## Configuration

Routes are mapped to strategies in `src/config/rateLimitConfig.json`:

```json
{
  "/api/login":    { "strategy": "fixedWindow",           "limit": 5,   "windowMs": 60000 },
  "/api/upload":   { "strategy": "tokenBucket",            "capacity": 20, "refillRate": 2 },
  "/api/payments": { "strategy": "leakyBucket",             "capacity": 10, "leakRate": 1 },
  "/api/billing":  { "strategy": "slidingWindowLog",       "limit": 50,  "windowMs": 60000 },
  "default":       { "strategy": "slidingWindowCounter",   "limit": 100, "windowMs": 60000 }
}
```

Add a new route by adding an entry — no code changes needed.

## Load testing results

Tested with [k6](https://k6.io/). All tests run against a local Docker Redis instance.

### Multi-endpoint test (all 4 strategies, mixed traffic)
20 virtual users, 20 seconds, requests randomly distributed across all endpoints.

| Metric | Value |
|---|---|
| Total requests | 3,891 |
| Throughput | ~194 req/s |
| Checks passed | 97.96% |
| p95 latency | 4.34ms |

### Spike test (sudden burst, token bucket)
Ramped 0 → 100 concurrent users in 5s, held for 10s, ramped down.

| Metric | Value |
|---|---|
| Total requests | 59,094 |
| Peak throughput | ~2,954 req/s |
| Checks passed | 100% |
| p95 latency | 40.18ms |

### Soak test (sustained load, sliding window log)
15 virtual users, sustained for 2 minutes.

| Metric | Value |
|---|---|
| Total requests | 8,865 |
| Throughput | ~74 req/s |
| Checks passed | 98.82% |
| p95 latency | 4.66ms |

## Known limitation: race condition under concurrent load (Sliding Window Log)

Under sustained concurrency, Sliding Window Log occasionally allows one extra request
past its configured limit (observed failure rate: ~1-2% in soak/mixed-traffic tests,
0% in tests that didn't hit this strategy).

**Root cause:** unlike Token Bucket and Leaky Bucket — which use a single atomic Lua
script to read, compute, and write state in one indivisible step — Sliding Window Log
uses a Redis pipeline of two separate commands (prune expired entries, then count).
Under high concurrency, two near-simultaneous requests can both read the count before
either writes its own entry, letting both proceed as if each were the Nth request.

**Why it wasn't fixed:** this is a deliberate scope/tradeoff call, not an oversight.
Converting Sliding Window Log to a Lua script (like the bucket algorithms) would close
this gap, at the cost of losing the flexibility of Redis's native sorted-set operations
for timestamp pruning. This is a common real-world tradeoff between full consistency
and implementation simplicity — many production rate limiters accept small windows of
imprecision in exchange for simpler, more auditable logic.

## Tech stack

- Node.js + Express
- Redis (via ioredis)
- Lua scripting for atomic operations
- k6 for load testing
- Docker Compose for local Redis

## Project structure

src/
  strategies/       (one file per algorithm, all implementing check())
    strategy.interface.js
    fixedWindow.js
    tokenBucket.js
    leakyBucket.js
    slidingWindowLog.js
    slidingWindowCounter.js
  router/
    strategyRouter.js   (picks strategy based on route config)
  middleware/
    rateLimitMiddleware.js   (Express integration)
  store/
    redisClient.js
    scripts/
      tokenBucket.lua
      leakyBucket.lua
  config/
    rateLimitConfig.json   (route -> strategy mapping)
  utils/
    headers.js
    logger.js

load-test/
  multi-endpoint.js
  spike-test.js
  soak-test.js

examples/
  express-app-demo/
    app.js

test/
  strategies/
  integration/

docker-compose.yml
package.json
README.md