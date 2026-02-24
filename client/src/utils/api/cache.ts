/**
 * ⚡ API Cache Utility
 * 
 * Simple in-memory cache for API responses to reduce redundant server calls.
 * Perfect for static or semi-static data like menu items, pages, ONIX tags, etc.
 * 
 * Features:
 * - TTL (Time To Live) support
 * - Automatic cache invalidation
 * - Memory-efficient
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data or null if expired/not found
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Set data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  /**
   * Invalidate specific cache entry
   * @param key Cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const apiCache = new APICache();

/**
 * Higher-order function to wrap API calls with caching
 * @param key Cache key
 * @param fetcher Async function that fetches data
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 * @returns Cached or freshly fetched data
 */
export async function withCache<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  // Try to get from cache first
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  apiCache.set(key, data, ttl);
  
  return data;
}
