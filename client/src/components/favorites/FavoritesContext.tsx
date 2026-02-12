import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from "react";
import { logger } from '../../utils/logger';

// ============================================================================
// ENTITY TYPE MAPPING & NORMALISIERUNG
// ============================================================================

/**
 * Frontend Entity Types (UI-facing)
 * Diese Types werden in der UI verwendet
 */
export type FrontendEntityType = 
  | "book" 
  | "creator"      // UI: "Kurator:in"
  | "publisher" 
  | "author"       // UI: "Autor:in"
  | "category" 
  | "tag" 
  | "series" 
  | "genre"        // UI: "Genre" (wird als tag gespeichert)
  | "storefront"
  | "topic";

/**
 * Backend Entity Types (Database-facing)
 * Erlaubte Types für followables: book | person | publisher | category | tag | award | series | user
 */
export type BackendEntityType = 
  | "book"
  | "user"         // Backend: creator → user
  | "publisher"
  | "person"       // Backend: author → person
  | "category"
  | "tag"
  | "award"
  | "series";
  // ❌ KEIN "genre" - genre wird als tag gespeichert

/**
 * Mapping: Frontend → Backend
 */
const ENTITY_TYPE_MAP: Record<FrontendEntityType, BackendEntityType> = {
  book: "book",
  creator: "user",      // ✅ Normalisierung
  publisher: "publisher",
  author: "person",     // ✅ Normalisierung
  category: "category",
  tag: "tag",
  series: "series",
  genre: "tag",         // ✅ Genre ist ein Tag (z.B. "Genre: Fantasy")
  storefront: "user",   // ✅ Storefront = User/Creator
  topic: "tag",         // ✅ Topic = Tag
};

/**
 * Reverse Mapping: Backend → Frontend
 * ⚠️ Problem: "tag" kann sowohl "tag" als auch "genre" sein
 * Lösung: Defaulten auf "tag", Genre-Detection später via Tag-Name
 */
const REVERSE_ENTITY_TYPE_MAP: Record<BackendEntityType, FrontendEntityType> = {
  book: "book",
  user: "creator",
  publisher: "publisher",
  person: "author",
  category: "category",
  tag: "tag",          // Default: tag (genre detection später)
  award: "tag",        // Awards werden auch als tags behandelt
  series: "series",
};

/**
 * Normalisiert Frontend-Type zu Backend-Type
 */
export function normalizeEntityType(frontendType: FrontendEntityType): BackendEntityType {
  return ENTITY_TYPE_MAP[frontendType];
}

/**
 * Konvertiert Backend-Type zu Frontend-Type
 */
export function denormalizeEntityType(backendType: BackendEntityType, title?: string): FrontendEntityType {
  // Spezial-Fall: Wenn tag und Title beginnt mit "Genre:", dann ist es ein Genre
  if (backendType === "tag" && title?.startsWith("Genre:")) {
    return "genre";
  }
  return REVERSE_ENTITY_TYPE_MAP[backendType];
}

// ============================================================================
// ID VALIDATION & CONVERSION
// ============================================================================

/**
 * Validiert und konvertiert Entity-IDs
 * - book/person/tag/award/publisher/category/series: entity_id (bigint)
 * - user: entity_uuid (uuid)
 * - Synthetische IDs wie "category-xyz" werden abgelehnt
 */
export function validateEntityId(
  type: BackendEntityType, 
  id: string
): { valid: boolean; entity_id?: number; entity_uuid?: string; error?: string } {
  
  if (type === "user") {
    // UUID validation (simple pattern check)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      return { valid: false, error: `Invalid UUID for user: ${id}` };
    }
    return { valid: true, entity_uuid: id };
  }
  
  // Für alle anderen: bigint (numerisch)
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return { valid: false, error: `Invalid entity_id for ${type}: ${id} (must be positive integer)` };
  }
  
  return { valid: true, entity_id: numericId };
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface FavoriteItem {
  id: string;                    // Frontend: string (kann UUID oder "123" sein)
  type: FrontendEntityType;
  title: string;
  subtitle?: string;
  image?: string;
  color?: string;
}

/**
 * Backend-kompatibles Format für API-Calls
 */
export interface BackendFavoriteItem {
  entity_type: BackendEntityType;
  entity_id?: number;            // bigint für book/person/tag/etc.
  entity_uuid?: string;          // uuid für user
  title?: string;                // Optional für Hydration
  subtitle?: string;
  image_url?: string;
  created_at?: string;
}

/**
 * Konvertiert Frontend-Item zu Backend-Format
 */
export function toBackendFormat(item: FavoriteItem): BackendFavoriteItem | null {
  const backendType = normalizeEntityType(item.type);
  const validation = validateEntityId(backendType, item.id);
  
  if (!validation.valid) {
    logger.warn(`Cannot persist item: ${validation.error}`);
    return null;  // Nicht persistierbar (synthetische ID)
  }
  
  return {
    entity_type: backendType,
    entity_id: validation.entity_id,
    entity_uuid: validation.entity_uuid,
    title: item.title,
    subtitle: item.subtitle,
    image_url: item.image,
  };
}

/**
 * Konvertiert Backend-Item zu Frontend-Format
 */
export function fromBackendFormat(backendItem: BackendFavoriteItem): FavoriteItem {
  const frontendType = denormalizeEntityType(backendItem.entity_type, backendItem.title);
  const id = backendItem.entity_uuid || String(backendItem.entity_id);
  
  return {
    id,
    type: frontendType,
    title: backendItem.title || `${backendItem.entity_type} ${id}`,
    subtitle: backendItem.subtitle,
    image: backendItem.image_url,
  };
}

// ============================================================================
// CONTEXT
// ============================================================================

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
  getFavoriteCount: () => number;
  favoriteCount: number;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const API_BASE = '/api';

// ============================================================================
// HYDRATION - Enrich favorites with metadata (images, colors) from APIs
// ============================================================================

async function hydrateFavorites(items: FavoriteItem[]): Promise<FavoriteItem[]> {
  const needsCurators = items.some((f) => (f.type === 'creator' || f.type === 'author') && !f.image);
  const needsTags = items.some((f) => f.type === 'tag' && (!f.image || !f.color));

  if (!needsCurators && !needsTags) return items;

  const [curatorsData, tagsData] = await Promise.all([
    needsCurators
      ? fetch(`${API_BASE}/curators`).then((r) => r.ok ? r.json() : null).catch(() => null)
      : null,
    needsTags
      ? fetch(`${API_BASE}/onix-tags`).then((r) => r.ok ? r.json() : null).catch(() => null)
      : null,
  ]);

  const curatorMap = new Map<string, { avatar?: string }>();
  if (curatorsData) {
    const list = curatorsData.data || curatorsData;
    if (Array.isArray(list)) {
      list.forEach((c: { id?: string | number; name?: string; avatar?: string; slug?: string }) => {
        const entry = { avatar: c.avatar };
        if (c.id) curatorMap.set(String(c.id), entry);
        if (c.slug) curatorMap.set(c.slug, entry);
        if (c.name) {
          curatorMap.set(c.name.toLowerCase().replace(/\s+/g, '-').replace(/[äöüß]/g, (ch: string) => {
            const map: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
            return map[ch] || ch;
          }), entry);
          curatorMap.set(`storefront-${c.id}`, entry);
        }
      });
    }
  }

  const tagMap = new Map<string, { color?: string; imageUrl?: string }>();
  if (tagsData) {
    const list = tagsData.data || tagsData;
    if (Array.isArray(list)) {
      list.forEach((t: { id?: number; displayName?: string; color?: string; imageUrl?: string }) => {
        const entry = { color: t.color, imageUrl: t.imageUrl };
        if (t.id) {
          tagMap.set(String(t.id), entry);
          tagMap.set(`onix-tag-${t.id}`, entry);
        }
        if (t.displayName) {
          tagMap.set(`tag-${t.displayName.toLowerCase()}`, entry);
        }
      });
    }
  }

  return items.map((item) => {
    if ((item.type === 'creator' || item.type === 'author' || item.type === 'storefront') && !item.image) {
      const match = curatorMap.get(item.id);
      if (match?.avatar) {
        return { ...item, image: match.avatar };
      }
    }
    if (item.type === 'tag' && (!item.image || !item.color)) {
      const match = tagMap.get(item.id);
      if (match) {
        return {
          ...item,
          image: item.image || match.imageUrl || undefined,
          color: item.color || match.color || undefined,
        };
      }
    }
    return item;
  });
}

// ============================================================================
// PROVIDER
// ============================================================================

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // INITIAL LOAD - Load follows from backend
  // ============================================================================
  
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const loadFollows = async () => {
      // TODO: Später nur wenn User eingeloggt ist
      // if (!currentUser) return;
      
      // Aktuell: Test mit X-Debug-User-Id Header
      const debugUserId = localStorage.getItem('debug_user_id');
      if (!debugUserId) {
        // Silently skip - no debug user configured
        return;
      }
      
      try {
        setIsLoading(true);
        
        const response = await fetch(`${API_BASE}/me/follows`, {  // ✅ FIXED: /me/follows
          method: 'GET',
          headers: {
            // ✅ FIXED: Added apikey
            'X-Debug-User-Id': debugUserId,
          },
          signal: controller.signal, // Add abort signal
        });
        
        if (!response.ok || !isMounted) {
          // Silently fail - backend might not be ready yet or component unmounted
          return;
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          const loadedFavorites = data.data.map((item: BackendFavoriteItem) => 
            fromBackendFormat(item)
          );
          setFavorites(loadedFavorites);
          logger.debug(`Loaded ${loadedFavorites.length} follows from backend`);
          
          if (isMounted) {
            hydrateFavorites(loadedFavorites).then((hydrated) => {
              if (isMounted) setFavorites(hydrated);
            });
          }
        }
        
      } catch (error) {
        // Silently fail - user can still use local state
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFollows();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const addFavorite = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      if (prev.some((fav) => fav.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favorites.some((fav) => fav.id === id);
  }, [favorites]);

  /**
   * ✅ TOGGLE FAVORITE - Backend-Integrated
   * 
   * Workflow:
   * 1. Optimistic Update (sofort UI updaten)
   * 2. Backend-Call (nur wenn persistierbar)
   * 3. Bei Fehler: Rollback
   */
  const toggleFavorite = useCallback(async (item: FavoriteItem) => {
    const exists = favorites.some((fav) => fav.id === item.id);
    
    // ============================================================================
    // PHASE 1: OPTIMISTIC UPDATE (für schnelle UI)
    // ============================================================================
    
    if (exists) {
      // Unfollow (lokaler State)
      setFavorites((prev) => prev.filter((fav) => fav.id !== item.id));
    } else {
      // Follow (lokaler State)
      setFavorites((prev) => [...prev, item]);
    }

    // ============================================================================
    // PHASE 2: BACKEND-CALL
    // ============================================================================
    
    const backendItem = toBackendFormat(item);
    
    if (!backendItem) {
      logger.warn(`Item not persistable (synthetic ID): ${item.id}`);
      return;  // Keep optimistic update, aber kein Backend-Call
    }
    
    // Check if user exists
    const debugUserId = localStorage.getItem('debug_user_id');
    if (!debugUserId) {
      logger.warn('No user ID, skipping backend sync');
      return;  // Keep optimistic update, aber kein Backend-Call
    }
    
    try {
      if (exists) {
        // Unfollow: DELETE /me/follows  // ✅ FIXED: /me/follows
        const response = await fetch(`${API_BASE}/me/follows`, {
          method: 'DELETE',
          headers: {
            // ✅ FIXED: Added apikey
            'Content-Type': 'application/json',
            'X-Debug-User-Id': debugUserId,
          },
          body: JSON.stringify(backendItem),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to unfollow');
        }
        
        // ✅ Backend unfollow successful (removed production log)
        
      } else {
        // Follow: POST /me/follows  // ✅ FIXED: /me/follows
        const response = await fetch(`${API_BASE}/me/follows`, {
          method: 'POST',
          headers: {
            // ✅ FIXED: Added apikey
            'Content-Type': 'application/json',
            'X-Debug-User-Id': debugUserId,
          },
          body: JSON.stringify(backendItem),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to follow');
        }
        
        logger.debug('Backend follow successful');
      }
      
    } catch (error) {
      logger.warn('Backend sync failed (silent):', error);
      
      // ROLLBACK: Revert optimistic update
      if (exists) {
        // Add back
        setFavorites((prev) => [...prev, item]);
      } else {
        // Remove again
        setFavorites((prev) => prev.filter((fav) => fav.id !== item.id));
      }
      
      // Optional: Show error toast to user
      // toast.error('Failed to sync favorites');
    }
    
  }, [favorites]);

  const getFavoriteCount = useCallback(() => {
    return favorites.length;
  }, [favorites]);

  const value = useMemo(() => ({
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    getFavoriteCount,
    favoriteCount: favorites.length,
    isLoading,
  }), [favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite, getFavoriteCount, isLoading]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

const defaultFavoritesContext: FavoritesContextType = {
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
  toggleFavorite: async () => {},
  getFavoriteCount: () => 0,
  favoriteCount: 0,
  isLoading: false,
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    return defaultFavoritesContext;
  }
  return context;
}