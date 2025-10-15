/**
 * Token Bucket Rate Limiter
 * Limits to 10 messages per minute per session
 */
class RateLimiter {
  constructor(maxTokens = 10, refillRate = 10, refillInterval = 60000) {
    this.maxTokens = maxTokens; // Max messages allowed
    this.refillRate = refillRate; // Tokens added per interval
    this.refillInterval = refillInterval; // Interval in ms (1 minute)
    this.buckets = new Map(); // Map<sessionId, {tokens, lastRefill}>
  }

  /**
   * Check if request is allowed and consume a token
   * @param {string} sessionId - Session ID
   * @returns {boolean} - True if allowed, false if rate limited
   */
  consume(sessionId) {
    const now = Date.now();

    // Get or create bucket for this session
    if (!this.buckets.has(sessionId)) {
      this.buckets.set(sessionId, {
        tokens: this.maxTokens,
        lastRefill: now,
      });
    }

    const bucket = this.buckets.get(sessionId);

    // Calculate how many tokens to refill based on time passed
    const timePassed = now - bucket.lastRefill;
    const intervalsPasssed = Math.floor(timePassed / this.refillInterval);

    if (intervalsPasssed > 0) {
      bucket.tokens = Math.min(
        this.maxTokens,
        bucket.tokens + (intervalsPasssed * this.refillRate)
      );
      bucket.lastRefill = now;
    }

    // Check if we have tokens available
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens for session
   * @param {string} sessionId - Session ID
   * @returns {number} - Number of tokens remaining
   */
  getRemainingTokens(sessionId) {
    if (!this.buckets.has(sessionId)) {
      return this.maxTokens;
    }

    const bucket = this.buckets.get(sessionId);
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const intervalsPasssed = Math.floor(timePassed / this.refillInterval);

    if (intervalsPasssed > 0) {
      return Math.min(
        this.maxTokens,
        bucket.tokens + (intervalsPasssed * this.refillRate)
      );
    }

    return bucket.tokens;
  }

  /**
   * Clean up old buckets (call periodically)
   */
  cleanup() {
    const now = Date.now();
    const maxAge = this.refillInterval * 10; // 10 minutes

    for (const [sessionId, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(sessionId);
      }
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter(10, 10, 60000); // 10 msg/min

// Cleanup every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

module.exports = rateLimiter;
