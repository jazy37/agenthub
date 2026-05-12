/**
 * Redis-backed Sliding Window Rate Limiter
 *
 * Replaces the in-memory Token Bucket with a distributed Redis implementation.
 * Works correctly across multiple Node.js instances (horizontal scaling).
 *
 * Algorithm:
 *   Stores a Sorted Set per socketId in Redis.
 *   Each message is stored as a timestamp score.
 *   On each consume(), we:
 *     1. Remove entries older than the window (1 minute ago)
 *     2. Count remaining entries
 *     3. If count < maxTokens → add new entry, allow
 *     4. If count >= maxTokens → reject (rate limited)
 *   Key TTL is set automatically so idle keys are cleaned up by Redis.
 */

const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const MAX_TOKENS = 10;      // Max messages per window
const WINDOW_MS = 60_000;   // 1 minute sliding window
const KEY_PREFIX = 'ratelimit:socket:';

const rateLimiter = {
  /**
   * Try to consume a token for a given socketId.
   * @param {string} socketId - Unique socket session identifier
   * @returns {Promise<boolean>} true if allowed, false if rate-limited
   */
  async consume(socketId) {
    const key = `${KEY_PREFIX}${socketId}`;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    const pipeline = redis.pipeline();

    // 1. Remove timestamps older than the window
    pipeline.zremrangebyscore(key, '-inf', windowStart);

    // 2. Count how many messages in current window
    pipeline.zcard(key);

    // 3. Add current timestamp (as both score and member for uniqueness)
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // 4. Expire key after 2 minutes of inactivity
    pipeline.pexpire(key, WINDOW_MS * 2);

    const results = await pipeline.exec();
    const count = results[1][1]; // zcard result before adding

    if (count >= MAX_TOKENS) {
      // Remove the entry we just added since we're rejecting this request
      await redis.zremrangebyscore(key, now, now);
      return false;
    }

    return true;
  },

  /**
   * Get remaining tokens for a socketId.
   * @param {string} socketId
   * @returns {Promise<number>}
   */
  async getRemainingTokens(socketId) {
    const key = `${KEY_PREFIX}${socketId}`;
    const windowStart = Date.now() - WINDOW_MS;

    await redis.zremrangebyscore(key, '-inf', windowStart);
    const count = await redis.zcard(key);
    return Math.max(0, MAX_TOKENS - count);
  }
};

module.exports = rateLimiter;

// ── HTTP Rate Limiter (for login endpoint) ────────────────────────────────────
const LOGIN_MAX = 5;          // Max attempts
const LOGIN_WINDOW_MS = 15 * 60_000; // 15 minute window

const loginRateLimiter = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `ratelimit:login:${ip}`;
  const now = Date.now();
  const windowStart = now - LOGIN_WINDOW_MS;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, '-inf', windowStart);
  pipeline.zcard(key);
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  pipeline.pexpire(key, LOGIN_WINDOW_MS * 2);

  const results = await pipeline.exec();
  const count = results[1][1];

  if (count >= LOGIN_MAX) {
    return res.status(429).json({
      error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
    });
  }

  next();
};

module.exports.loginRateLimiter = loginRateLimiter;
