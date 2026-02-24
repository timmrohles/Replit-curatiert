/**
 * ==================================================================
 * NAVIGATION V2 HOOK - Crashproof + Graceful Degradation
 * ==================================================================
 * 
 * POST-CRASH DESIGN PRINCIPLES:
 * 1. Stable Contract - Versionierter Response (schema_version)
 * 2. Graceful Degradation - Arrays never undefined, fallback always available
 * 3. Defensive Rendering - .map() nur auf garantierte Arrays
 * 4. Cache Busting - ETag support
 * 5. Error Resilience - API errors don't crash the app
 * 
 * UPDATED: Now uses centralized API config and normalizer
 * ==================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, API_BASE_URL, parseJsonSafely, getPublicHeaders } from '../../config/apiClient';
import { normalizeNavigationV2, type NavigationDataV2 } from '../../lib/normalizeNavigation';
export type { NavigationItem, NavigationDataV2, MegaMenuColumn, CategoryCard } from '../../lib/normalizeNavigation';

// ==================================================================
// FALLBACK DATA - Minimal working navigation
// ==================================================================

export const FALLBACK_NAVIGATION_V2: NavigationDataV2 = {
  schema_version: 'nav-v2',
  content_version: 0,
  items: [
    {
      id: 1,
      name: 'Belletristik',
      slug: 'belletristik',
      path: '/belletristik',
      icon: 'Book',
      kind: 'group',
      location: 'header',
      scope: 'public',
      panel_layout: 'mega',
      clickable: true,
      level: 0,
      display_order: 1,
      column_id: null,
      children: [],
      mega_columns: []
    },
    {
      id: 2,
      name: 'Sachbuch',
      slug: 'sachbuch',
      path: '/sachbuch',
      icon: 'BookOpen',
      kind: 'group',
      location: 'header',
      scope: 'public',
      panel_layout: 'mega',
      clickable: true,
      level: 0,
      display_order: 2,
      column_id: null,
      children: [],
      mega_columns: []
    },
    {
      id: 3,
      name: 'Neuheiten',
      slug: 'neuheiten',
      path: '/neuheiten',
      icon: 'Sparkles',
      kind: 'link',
      location: 'header',
      scope: 'public',
      panel_layout: null,
      clickable: true,
      level: 0,
      display_order: 3,
      column_id: null,
      children: [],
      mega_columns: []
    },
    {
      id: 4,
      name: 'Bestseller',
      slug: 'bestseller',
      path: '/bestseller',
      icon: 'TrendingUp',
      kind: 'link',
      location: 'header',
      scope: 'public',
      panel_layout: null,
      clickable: true,
      level: 0,
      display_order: 4,
      column_id: null,
      children: [],
      mega_columns: []
    }
  ],
  meta: {
    generated_at: new Date().toISOString(),
    etag: 'fallback',
    needs_setup: true
  }
};

// ==================================================================
// FETCH FUNCTION
// ==================================================================

async function fetchNavigationV2(): Promise<NavigationDataV2> {
  try {
    const fullUrl = `${API_BASE_URL}${API_ENDPOINTS.navigation.public}`;
    
    // ✅ ADD TIMEOUT: Prevent browser hanging if server doesn't respond
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ Navigation fetch failed: HTTP ${response.status}`);
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}`);
    }

    // ✅ IMPORTANT: Backend returns NavigationDataV2 DIRECTLY (not wrapped in {success, data})
    // Format: { schema_version: "nav-v2", content_version: 1, items: [...], meta: {...} }
    const rawData = await response.json();

    // 🛡️ DEFENSIVE: Check if we got valid V2 format
    if (!rawData || typeof rawData !== 'object') {
      console.error('❌ Navigation response is not an object:', rawData);
      throw new Error('Invalid response format');
    }

    if (rawData.schema_version !== 'nav-v2') {
      console.warn(`⚠️ Unexpected schema_version: ${rawData.schema_version}`);
    }

    // ✅ Normalize to ensure all arrays are arrays and children are never undefined
    const normalized = normalizeNavigationV2(rawData);

    // Warn if backend had error but still returned data
    if (normalized.meta?.error) {
      console.warn('⚠️ Navigation loaded with backend error:', normalized.meta.error);
    }

    return normalized;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏱️ Navigation V2: Request timeout after 8s');
    } else {
      console.error('❌ Navigation fetch error:', error);
    }
    // ⚠️ GRACEFUL DEGRADATION - Return fallback instead of crashing
    return FALLBACK_NAVIGATION_V2;
  }
}

// ==================================================================
// HOOK
// ==================================================================

export function useNavigationV2() {
  return useQuery<NavigationDataV2>({
    queryKey: ['navigation-v2', 'cache-bust-v3'], // ✅ Cache invalidation
    queryFn: fetchNavigationV2,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (renamed from cacheTime)
    retry: 1, // Only retry once
    retryDelay: 1000,
    // ⚠️ NEVER throw errors to UI
    throwOnError: false,
    // ✅ Fallback on error
    placeholderData: FALLBACK_NAVIGATION_V2,
  });
}
