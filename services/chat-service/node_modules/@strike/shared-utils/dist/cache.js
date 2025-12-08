"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.InMemoryCache = void 0;
class InMemoryCache {
    cache = new Map();
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    set(key, value, ttlMs) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
}
exports.InMemoryCache = InMemoryCache;
exports.cache = new InMemoryCache();
