local key = KEYS[1]
local capacity = (ARGV[1])
local refillRate = (ARGV[2])
local now = (ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

if tokens == nil then
    tokens = capacity
    lastRefill = now
end

local elapsedSeconds = (now - lastRefill) / 1000
local refillAmount = elapsedSeconds * refillRate
tokens = math.min(capacity, tokens + refillAmount)

local allowed = 0
if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
redis.call('PEXPIRE', key, math.ceil((capacity / refillRate) * 1000) * 2)

return {allowed, math.floor(tokens)}