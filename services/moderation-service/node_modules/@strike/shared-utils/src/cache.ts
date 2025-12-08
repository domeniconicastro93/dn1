export class InMemoryCache {
    private cache: Map<string, { value: any; expiresAt: number }> = new Map();

    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value as T;
    }

    set(key: string, value: any, ttlMs: number): void {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

export const cache = new InMemoryCache();
