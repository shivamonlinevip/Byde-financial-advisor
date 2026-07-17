const config = require('../config');

/**
 * Minimal in-memory cache with TTL. Sufficient for a hackathon-scale
 * backend; swap for Redis in production by keeping the same interface.
 */
class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds = config.cache.ttlSeconds) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = new MemoryCache();
