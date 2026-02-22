// ─────────────────────────────────────────────────────────────────────────────
// services/cache.ts
//
// Cache em memória simples com TTL para evitar leituras excessivas no Firestore.
// O Chaves na Mão consulta o XML 1x por dia — mesmo assim um cache de 5 minutos
// protege contra picos de acesso.
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
  }
  
  class MemoryCache<T> {
    private store = new Map<string, CacheEntry<T>>();
  
    constructor(private ttlMs: number) {}
  
    get(key: string): T | null {
      const entry = this.store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        return null;
      }
      return entry.data;
    }
  
    set(key: string, data: T): void {
      this.store.set(key, { data, expiresAt: Date.now() + this.ttlMs });
    }
  
    invalidate(key: string): void {
      this.store.delete(key);
    }
  
    invalidateAll(): void {
      this.store.clear();
    }
  
    size(): number {
      return this.store.size;
    }
  }
  
  // Cache de XML por userId — TTL de 5 minutos
  export const xmlCache = new MemoryCache<string>(5 * 60 * 1000);
  
  // Cache de warnings/diagnóstico por userId — TTL de 5 minutos
  export const warningsCache = new MemoryCache<string[]>(5 * 60 * 1000);