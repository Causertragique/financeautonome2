// Système de cache avec TTL (Time To Live)
// Export de CacheManager pour utilisation dans Dashboard
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // en millisecondes
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Récupère une valeur du cache si elle existe et n'est pas expirée
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocke une valeur dans le cache avec un TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Supprime toutes les entrées du cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Supprime toutes les entrées expirées
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vérifie si une clé existe et n'est pas expirée
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Génère une clé de cache basée sur des paramètres
   */
  static generateKey(prefix: string, ...params: (string | number)[]): string {
    return `${prefix}:${params.join(":")}`;
  }
}

// Instance singleton
export const cacheManager = new CacheManager();

// Nettoyage automatique des entrées expirées toutes les minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    cacheManager.clearExpired();
  }, 60 * 1000); // Toutes les minutes
}

// Fonction helper pour wrapper les appels async avec cache
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Vérifier le cache d'abord
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Si pas en cache, faire l'appel
  const data = await fetcher();
  
  // Mettre en cache
  cacheManager.set(key, data, ttl);
  
  return data;
}

