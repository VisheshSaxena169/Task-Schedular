const redis = require('../config/redis');

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

async function getOrSet(key, ttlSeconds, fetchFn) {
  const cached = await redis.get(key);
  if (cached !== null) {
    return JSON.parse(cached);
  }

  const fresh = await fetchFn();
  await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds || DEFAULT_TTL_SECONDS);
  return fresh;
}

async function invalidate(key) {
  await redis.del(key);
  console.log(`🗑️ [REDIS] Cache invalidated for key: ${key}`);
}

module.exports = { getOrSet, invalidate };