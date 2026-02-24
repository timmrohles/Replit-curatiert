/**
 * TAGS API
 * ==========
 * CRUD operations for tags and ONIX tags
 */

import { API_BASE_URL, getAdminAuthHeaders, type ApiResponse } from './config';
// TYPES
// ============================================

// ✅ TYPE SAFETY: Tag type is now inferred from Zod schema
export type { Tag } from '../apiSchemas';

// NEW: ONIX-compatible Tag System
export type ONIXTagType = 
  | 'Gattung' 
  | 'Genre (THEMA)' 
  | 'Motiv (MVB)' 
  | 'Auszeichnung' 
  | 'Medienecho'
  | 'Stil-Veredelung'
  | 'Herkunft' 
  | 'Ausstattung' 
  | 'Schauplatz' 
  | 'Zeitgeist' 
  | 'Zielgruppe'
  | 'Serie'        // NEW: Collection/TitleText - Link-Tag wie "Harry Potter"
  | 'Band'         // NEW: Collection/PartNumber - Badge wie "Band 1"
  | 'Feeling'      // NEW: Lesemotiv - Prominent wie "Adrenalin & Puls"
  | 'Status';      // NEW: Prize-Block - Status wie "Gewinner Buchpreis"

export type ONIXTagVisibilityLevel = 
  | 'prominent'  // Immer sichtbar am Buch (z.B. Auszeichnungen, Lesemotive, Feeling, Status)
  | 'filter'     // In Filtern/Seitenleiste (z.B. Genre, Zielgruppe)
  | 'details'    // In Detailansicht (z.B. Sprache/Herkunft)
  | 'internal'   // Nur Backend/SEO (z.B. Warengruppen, ISBN)
  | 'link'       // Serien-Link-Tag (z.B. "Harry Potter" → /serie/harry-potter)
  | 'badge';     // Band-Badge (z.B. "Band 1")

// ✅ TYPE SAFETY: ONIXTag type is now inferred from Zod schema
export type { ONIXTag } from '../apiSchemas';

// ============================================
// BASIC TAGS CRUD
// ============================================

export async function getAllTags(): Promise<import('../apiSchemas').Tag[]> {
  try {
    // ✅ MIGRATED: Use canonical /api/tags endpoint
    const response = await fetch(`${API_BASE_URL}/tags`, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`❌ getAllTags failed: HTTP ${response.status}`);
      const text = await response.text();
      console.warn('Response body:', text.substring(0, 200));
      return [];
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('⚠️ getAllTags: Non-JSON response, Content-Type:', contentType);
      const text = await response.text();
      console.warn('Response body:', text.substring(0, 200));
      return [];
    }
    
    const result: ApiResponse<import('../apiSchemas').Tag[]> = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('❌ getAllTags error:', error);
    return [];
  }
}

export async function saveTag(tag: import('../apiSchemas').Tag): Promise<import('../apiSchemas').Tag | null> {
  try {
    // ✅ MIGRATED: Use canonical /api/tags endpoint
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      credentials: 'include',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(tag),
    });
    
    if (!response.ok) {
      console.error(`❌ saveTag failed: HTTP ${response.status}`);
      const text = await response.text();
      console.error('Response:', text.substring(0, 300));
      return null;
    }
    
    const result: ApiResponse<import('../apiSchemas').Tag> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('❌ saveTag error:', error);
    return null;
  }
}

// ============================================
// ONIX TAGS - With caching & deduplication
// ============================================

// ⚡ PERFORMANCE: Global ONIX Tags cache with request deduplication
let onixTagsCache: import('../apiSchemas').ONIXTag[] | null = null;
let onixTagsPromise: Promise<import('../apiSchemas').ONIXTag[]> | null = null;

export async function getAllONIXTags(): Promise<import('../apiSchemas').ONIXTag[]> {
  // Return cached data if available
  if (onixTagsCache !== null) {
    return onixTagsCache;
  }
  
  // Return existing promise if request is in flight (deduplication)
  if (onixTagsPromise !== null) {
    return onixTagsPromise;
  }
  
  // Create new request
  onixTagsPromise = (async () => {
    try {
      // ✅ ADD TIMEOUT: Prevent browser hanging if server doesn't respond
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // ✅ MIGRATED: Use canonical /api/onix-tags endpoint
      const response = await fetch(`${API_BASE_URL}/onix-tags`, {
            credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // ✅ DEFENSIVE: Check status BEFORE parsing JSON
      if (!response.ok) {
        console.warn(`❌ getAllONIXTags failed: HTTP ${response.status}`);
        const text = await response.text();
        console.warn('Response body:', text.substring(0, 200));
        onixTagsCache = [];
        onixTagsPromise = null;
        return [];
      }
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('⚠️ ONIX Tags: Non-JSON response, Content-Type:', contentType);
        const text = await response.text();
        console.warn('Response body:', text.substring(0, 200));
        onixTagsCache = [];
        onixTagsPromise = null;
        return [];
      }
      
      const result: ApiResponse<import('../apiSchemas').ONIXTag[]> = await response.json();
      const tags = result.data || [];
      
      // If no tags from backend, return empty array
      if (tags.length === 0) {
        onixTagsCache = [];
        onixTagsPromise = null;
        return [];
      }
      
      // Cache the result
      onixTagsCache = tags;
      onixTagsPromise = null;
      
      return tags;
    } catch (error) {
      // Handle timeout/abort
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⏱️ ONIX Tags: Request timeout after 10s');
      } else {
        console.info('ℹ️ ONIX Tags: API error, returning empty array');
      }
      // Silent fallback - this is expected when server is not running
      onixTagsPromise = null;
      onixTagsCache = [];
      return [];
    }
  })();
  
  return onixTagsPromise;
}

// Clear ONIX tags cache (useful after updates)
export function clearONIXTagsCache(): void {
  onixTagsCache = null;
  onixTagsPromise = null;
}

// ============================================
// ONIX TAGS CRUD
// ============================================

export async function getONIXTag(id: string): Promise<import('../apiSchemas').ONIXTag | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/onix-tags/${id}`, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`❌ getONIXTag(${id}) failed: HTTP ${response.status}`);
      return null;
    }
    
    const result: ApiResponse<import('../apiSchemas').ONIXTag> = await response.json();
    return result.data || null;
  } catch (error) {
    console.warn(`❌ getONIXTag(${id}) error:`, error);
    return null;
  }
}

export async function saveONIXTag(tag: Partial<import('../apiSchemas').ONIXTag>): Promise<import('../apiSchemas').ONIXTag | null> {
  try {
    // ✅ MIGRATED: Use canonical /api/onix-tags endpoint
    const response = await fetch(`${API_BASE_URL}/onix-tags`, {
      method: 'POST',
      credentials: 'include',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(tag),
    });
    
    if (!response.ok) {
      console.error(`❌ saveONIXTag failed: HTTP ${response.status}`);
      const text = await response.text();
      console.error('Response:', text.substring(0, 300));
      return null;
    }
    
    const result: ApiResponse<import('../apiSchemas').ONIXTag> = await response.json();
    
    // ⚡ Clear cache after save
    clearONIXTagsCache();
    
    return result.data || null;
  } catch (error) {
    console.error('❌ saveONIXTag error:', error);
    return null;
  }
}

export async function deleteONIXTag(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/onix-tags/${id}`, {
          credentials: 'include',
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.error(`❌ deleteONIXTag(${id}) failed: HTTP ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    
    // ⚡ Clear cache after delete
    if (result.success) {
      clearONIXTagsCache();
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ deleteONIXTag error:', error);
    return false;
  }
}

// ============================================
// ONIX TAG ASSIGNMENT
// ============================================

// Assign ONIX tag to book/author/publisher
export async function assignONIXTag(
  tagId: string, 
  targetType: 'book' | 'author' | 'publisher', 
  targetId: string,
  source?: string,
  confidence?: number
): Promise<boolean> {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/onix-tags/${tagId}/assign`, {
          credentials: 'include',
      method: 'POST',
      headers: {'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_type: targetType,
        target_id: targetId,
        source: source || 'manual',
        confidence: confidence
      }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error assigning ONIX tag:', error);
    return false;
  }
}

// Unassign ONIX tag from book/author/publisher
export async function unassignONIXTag(
  tagId: string, 
  targetType: 'book' | 'author' | 'publisher', 
  targetId: string
): Promise<boolean> {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/onix-tags/${tagId}/unassign`, {
          credentials: 'include',
      method: 'DELETE',
      headers: {'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_type: targetType,
        target_id: targetId
      }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error unassigning ONIX tag:', error);
    return false;
  }
}

// ============================================
// ONIX TAG SEARCH
// ============================================

// Search ONIX tags
export async function searchONIXTags(query: string, field?: string, limit?: number): Promise<import('../apiSchemas').ONIXTag[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      ...(field && { field }),
      ...(limit && { limit: limit.toString() })
    });
    
    const response = await fetch(`${API_BASE_URL}/onix-tags/search?${params}`, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const result: ApiResponse<import('../apiSchemas').ONIXTag[]> = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error searching ONIX tags:', error);
    return [];
  }
}