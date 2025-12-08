export declare class InMemoryCache {
    private cache;
    get<T>(key: string): T | null;
    set(key: string, value: any, ttlMs: number): void;
    delete(key: string): void;
    clear(): void;
}
export declare const cache: InMemoryCache;
