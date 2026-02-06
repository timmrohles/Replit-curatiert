/**
 * ==================================================================
 * NAVIGATION NORMALIZER - Defensive Data Processing
 * ==================================================================
 * 
 * Stellt sicher dass Navigation Items IMMER valide Arrays haben:
 * - children: [] (nie undefined)
 * - mega_columns: [] (nie undefined)
 * - Recursive normalization
 * - Default values für alle kritischen Felder
 * 
 * **WARUM?**
 * Verhindert `.map()` crashes im Frontend!
 * 
 * Usage:
 * ```tsx
 * const safeNav = normalizeNavigationV2(apiResponse);
 * safeNav.items.map(item => {
 *   item.children.map(...) // ✅ SAFE - immer ein Array
 * });
 * ```
 * ==================================================================
 */

// ==================================================================
// TYPES
// ==================================================================

export interface MegaMenuColumn {
  id: number;
  title: string | null;
  column_key: string | null;
  kind: 'links' | 'featured' | 'cards';
  display_order: number;
  width_class: string;
  items: NavigationItem[];
  cards: CategoryCard[];
}

export interface NavigationItem {
  id: number;
  name: string;
  slug: string;
  path: string | null;
  icon: string | null;
  kind: 'link' | 'group' | 'heading' | 'divider' | 'promo';
  location: 'header' | 'footer' | 'mobile' | 'sidebar';
  scope: 'public' | 'admin' | 'logged_in' | 'creator';
  panel_layout: 'mega' | 'dropdown' | 'none' | null;
  clickable: boolean;
  level: number;
  display_order: number;
  column_id: number | null;
  children: NavigationItem[]; // ✅ Always array
  mega_columns: MegaMenuColumn[]; // ✅ Always array
}

export interface CategoryCard {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  display_order: number;
}

export interface NavigationDataV2 {
  schema_version: string;
  content_version: number;
  items: NavigationItem[];
  meta: {
    generated_at?: string;
    etag?: string;
    needs_setup?: boolean;
    error?: string;
  };
}

// ==================================================================
// NORMALIZER FUNCTIONS
// ==================================================================

/**
 * ✅ Normalize complete Navigation V2 response
 */
export function normalizeNavigationV2(data: any): NavigationDataV2 {
  // 🛡️ DEFENSIVE: Null/undefined check
  if (!data || typeof data !== 'object') {
    console.warn('⚠️ Navigation data is null/undefined, returning empty structure');
    return createEmptyNavigationV2();
  }

  // 🛡️ DEFENSIVE: Validate schema version
  if (data.schema_version !== 'nav-v2') {
    console.warn(`⚠️ Unexpected schema_version: ${data.schema_version}, expected 'nav-v2'`);
  }

  // 🛡️ DEFENSIVE: Ensure items is array
  const rawItems = Array.isArray(data.items) ? data.items : [];

  return {
    schema_version: data.schema_version || 'nav-v2',
    content_version: typeof data.content_version === 'number' ? data.content_version : 0,
    items: rawItems.map(item => normalizeNavigationItem(item)),
    meta: {
      generated_at: data.meta?.generated_at || new Date().toISOString(),
      etag: data.meta?.etag || '',
      needs_setup: data.meta?.needs_setup || false,
      error: data.meta?.error,
    },
  };
}

/**
 * ✅ Normalize single Navigation Item (recursive)
 */
export function normalizeNavigationItem(item: any): NavigationItem {
  // 🛡️ DEFENSIVE: Null check
  if (!item || typeof item !== 'object') {
    console.warn('⚠️ Invalid navigation item:', item);
    return createPlaceholderItem();
  }

  // 🛡️ DEFENSIVE: Ensure children array
  const rawChildren = Array.isArray(item.children) ? item.children : [];
  
  // 🛡️ DEFENSIVE: Ensure mega_columns array
  const rawMegaColumns = Array.isArray(item.mega_columns) ? item.mega_columns : [];

  return {
    id: typeof item.id === 'number' ? item.id : 0,
    name: item.name || item.label || 'Untitled',
    slug: item.slug || '',
    path: item.path || item.href || null,
    icon: item.icon || null,
    
    // ✅ Default values for P0 fields
    // Support both 'kind' and 'menu_type' (Neon uses menu_type)
    kind: item.kind || item.menu_type || 'link',
    location: item.location || 'header',
    scope: item.scope || 'public',
    panel_layout: item.panel_layout || (item.mega_menu_enabled ? 'mega' : null),
    clickable: typeof item.clickable === 'boolean' ? item.clickable : true,
    
    level: typeof item.level === 'number' ? item.level : 0,
    display_order: typeof item.display_order === 'number' ? item.display_order : (item.position || 0),
    column_id: item.column_id || null,
    
    // ✅ RECURSIVE: Normalize children (CRITICAL!)
    children: rawChildren.map(child => normalizeNavigationItem(child)),
    
    // ✅ Normalize mega columns
    mega_columns: rawMegaColumns.map(col => normalizeMegaMenuColumn(col)),
  };
}

/**
 * ✅ Normalize MegaMenuColumn
 */
export function normalizeMegaMenuColumn(column: any): MegaMenuColumn {
  // 🛡️ DEFENSIVE: Null check
  if (!column || typeof column !== 'object') {
    return createPlaceholderColumn();
  }

  // 🛡️ DEFENSIVE: Ensure items array
  const rawItems = Array.isArray(column.items) ? column.items : [];
  
  // 🛡️ DEFENSIVE: Ensure cards array
  const rawCards = Array.isArray(column.cards) ? column.cards : [];

  return {
    id: typeof column.id === 'number' ? column.id : 0,
    title: column.title || null,
    column_key: column.column_key || null,
    kind: column.kind || 'links',
    display_order: typeof column.display_order === 'number' ? column.display_order : 0,
    width_class: column.width_class || 'w-1/4',
    
    // ✅ RECURSIVE: Normalize items
    items: rawItems.map(item => normalizeNavigationItem(item)),
    
    // ✅ Normalize cards
    cards: rawCards.map(card => normalizeCategoryCard(card)),
  };
}

/**
 * ✅ Normalize CategoryCard
 */
export function normalizeCategoryCard(card: any): CategoryCard {
  if (!card || typeof card !== 'object') {
    return {
      id: 0,
      title: 'Untitled',
      description: null,
      image_url: null,
      link_url: '/',
      display_order: 0,
    };
  }

  return {
    id: typeof card.id === 'number' ? card.id : 0,
    title: card.title || 'Untitled',
    description: card.description || null,
    image_url: card.image_url || null,
    link_url: card.link_url || '/',
    display_order: typeof card.display_order === 'number' ? card.display_order : 0,
  };
}

// ==================================================================
// FACTORY FUNCTIONS - Create safe defaults
// ==================================================================

/**
 * Create empty navigation structure
 */
export function createEmptyNavigationV2(): NavigationDataV2 {
  return {
    schema_version: 'nav-v2',
    content_version: 0,
    items: [],
    meta: {
      generated_at: new Date().toISOString(),
      etag: '',
      needs_setup: true,
      error: 'No navigation data available',
    },
  };
}

/**
 * Create placeholder navigation item
 */
function createPlaceholderItem(): NavigationItem {
  return {
    id: 0,
    name: 'Placeholder',
    slug: 'placeholder',
    path: null,
    icon: null,
    kind: 'link',
    location: 'header',
    scope: 'public',
    panel_layout: null,
    clickable: false,
    level: 0,
    display_order: 0,
    column_id: null,
    children: [],
    mega_columns: [],
  };
}

/**
 * Create placeholder mega menu column
 */
function createPlaceholderColumn(): MegaMenuColumn {
  return {
    id: 0,
    title: null,
    column_key: null,
    kind: 'links',
    display_order: 0,
    width_class: 'w-1/4',
    items: [],
    cards: [],
  };
}

// ==================================================================
// SORTING & FILTERING - Defensive versions
// ==================================================================

/**
 * ✅ Sort items by display_order (defensive)
 */
export function sortByDisplayOrder<T extends { display_order?: number | null }>(items: T[]): T[] {
  // 🛡️ DEFENSIVE: Ensure array
  if (!Array.isArray(items)) return [];
  
  return [...items].sort((a, b) => {
    const orderA = typeof a.display_order === 'number' ? a.display_order : 999;
    const orderB = typeof b.display_order === 'number' ? b.display_order : 999;
    return orderA - orderB;
  });
}

/**
 * ✅ Filter visible items (defensive)
 */
export function filterVisibleItems(items: NavigationItem[]): NavigationItem[] {
  // 🛡️ DEFENSIVE: Ensure array
  if (!Array.isArray(items)) return [];
  
  return items.filter(item => {
    // Check various flags that might indicate hidden status
    const visible = (item as any).visible !== false;
    const isActive = (item as any).is_active !== false;
    const status = (item as any).status !== 'hidden';
    
    return visible && isActive && status;
  });
}

/**
 * ✅ Get items by location (defensive)
 */
export function getItemsByLocation(
  items: NavigationItem[], 
  location: 'header' | 'footer' | 'mobile' | 'sidebar'
): NavigationItem[] {
  // 🛡️ DEFENSIVE: Ensure array
  if (!Array.isArray(items)) return [];
  
  return items.filter(item => item.location === location);
}

/**
 * ✅ Get items by scope (defensive)
 */
export function getItemsByScope(
  items: NavigationItem[],
  scope: 'public' | 'admin' | 'logged_in' | 'creator'
): NavigationItem[] {
  // 🛡️ DEFENSIVE: Ensure array
  if (!Array.isArray(items)) return [];
  
  return items.filter(item => item.scope === scope);
}

// ==================================================================
// EXPORTS
// ==================================================================

export default normalizeNavigationV2;