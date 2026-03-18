/**
 * Simple in-memory cache with TTL support
 * Used for expensive SLA calculations to avoid recomputing on every request
 */
class MemoryCache {
  constructor() {
    this._cache = new Map();
  }

  /**
   * Get a cached value
   * @param {string} key
   * @returns {*} cached value or undefined if expired/missing
   */
  get(key) {
    const entry = this._cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Set a cached value with TTL
   * @param {string} key
   * @param {*} value
   * @param {number} ttlSeconds - Time to live in seconds (default: 120)
   */
  set(key, value, ttlSeconds = 120) {
    this._cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  /**
   * Invalidate a specific key
   * @param {string} key
   */
  invalidate(key) {
    this._cache.delete(key);
  }

  /**
   * Clear all cached entries
   */
  clear() {
    this._cache.clear();
  }

  /**
   * Get cache stats
   * @returns {{ size: number }}
   */
  stats() {
    return { size: this._cache.size };
  }
}

// Singleton instance
module.exports = new MemoryCache();
