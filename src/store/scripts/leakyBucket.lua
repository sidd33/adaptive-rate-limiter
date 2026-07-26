local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local leakRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'volume', 'lastLeak')
local volume = tonumber(bucket[1])
local lastLeak = tonumber(bucket[2])

if volume == nil then
  volume = 0
  lastLeak = now
end

local elapsedSeconds = (now - lastLeak) / 1000
local leaked = elapsedSeconds * leakRate
volume = math.max(0, volume - leaked)

local allowed = 0
if volume + 1 <= capacity then
  volume = volume + 1
  allowed = 1
end

redis.call('HMSET', key, 'volume', volume, 'lastLeak', now)
redis.call('PEXPIRE', key, math.ceil((capacity / leakRate) * 1000) * 2)

return {allowed, volume}