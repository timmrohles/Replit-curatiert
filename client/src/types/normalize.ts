/**
 * ==================================================================
 * DATA NORMALIZATION - SINGLE SOURCE OF TRUTH
 * ==================================================================
 * 
 * Problem: SQL liefert snake_case, Frontend erwartet camelCase
 * Solution: Eine zentrale Normalisierungsfunktion
 * 
 * SQL liefert:
 * - sort_order, section_type, above_fold, book_id (snake_case)
 * 
 * Components erwarten:
 * - sortOrder, type, aboveFold, bookId (camelCase)
 * 
 * ==================================================================
 */

import { PageSection, SectionItem } from './page-resolve';

// ==================================================================
// ZONE MAPPING (DB → UI)
// ==================================================================

const ZONE_DB_TO_UI: Record<string, PageSection['zone']> = {
  'header': 'header',
  'above_fold': 'above_fold',  // ✅ Keep snake_case to match PageSection['zone'] type
  'main': 'main',
  'footer': 'footer',
};

// ==================================================================
// TYPE NORMALIZATION
// ==================================================================

/**
 * Normalize section type to canonical format
 * 
 * Examples:
 * - "book_carousel" → "book_carousel"
 * - "book-carousel" → "book_carousel"
 * - "Book Carousel" → "book_carousel"
 * - "  BOOK_CAROUSEL  " → "book_carousel"
 */
export function normalizeType(type?: string): string {
  if (!type) return '';
  
  return type
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')  // "Book Carousel" → "book_carousel"
    .replace(/-/g, '_');   // "book-carousel" → "book_carousel"
}

// ==================================================================
// SECTION ITEM NORMALIZATION
// ==================================================================

export function normalizeItem(raw: any): SectionItem {
  return ({
    // Core fields
    id: raw.id,
    page_section_id: raw.page_section_id ?? raw.pageSectionId,
    
    // Sort order (snake_case → camelCase)
    sort_order: raw.sort_order ?? raw.sortOrder ?? 0,
    sortOrder: raw.sort_order ?? raw.sortOrder ?? 0,  // Provide both
    
    // Item type
    item_type: raw.item_type ?? raw.itemType ?? 'book',
    itemType: raw.item_type ?? raw.itemType ?? 'book',  // Provide both
    
    // Target fields (snake_case → camelCase)
    target_type: raw.target_type ?? raw.targetType,
    target_category_id: raw.target_category_id ?? raw.targetCategoryId ?? null,
    target_tag_id: raw.target_tag_id ?? raw.targetTagId ?? null,
    target_page_id: raw.target_page_id ?? raw.targetPageId ?? null,
    target_book_id: raw.target_book_id ?? raw.targetBookId ?? null,
    target_template_key: raw.target_template_key ?? raw.targetTemplateKey ?? null,
    target_params: raw.target_params ?? raw.targetParams ?? null,
    
    // Book ID aliases
    book_id: raw.book_id ?? raw.bookId ?? raw.target_book_id ?? raw.targetBookId ?? null,
    bookId: raw.book_id ?? raw.bookId ?? raw.target_book_id ?? raw.targetBookId ?? null,  // Provide both
    
    // Status & Visibility
    status: raw.status ?? 'draft',
    visibility: raw.visibility ?? 'visible',
    
    // Timestamps
    created_at: raw.created_at ?? raw.createdAt,
    updated_at: raw.updated_at ?? raw.updatedAt,
    
    // Data & Config
    data: raw.data ?? {},
    config: raw.config ?? {},
    
    // Resolved book data (if populated by JOIN)
    book: raw.book ?? null,
    category: raw.category ?? null,
    tag: raw.tag ?? null,
    page: raw.page ?? null,
  }) as unknown as SectionItem;
}

// ==================================================================
// SECTION NORMALIZATION
// ==================================================================

export function normalizeSection(raw: any): PageSection {
  // Normalize section type
  const sectionType = normalizeType(raw.section_type ?? raw.type);
  
  // Normalize zone
  const zoneRaw = raw.zone ?? 'main';
  const zone = ZONE_DB_TO_UI[zoneRaw] ?? zoneRaw;
  
  // Normalize items
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const items = itemsRaw.map(normalizeItem);
  
  return {
    // Core fields
    id: raw.id,
    page_id: raw.page_id ?? raw.pageId,
    
    // Zone
    zone,
    
    // Sort order (snake_case → camelCase)
    sort_order: raw.sort_order ?? raw.sortOrder ?? 0,
    sortOrder: raw.sort_order ?? raw.sortOrder ?? 0,  // Provide both
    
    // Section type (both aliases)
    section_type: sectionType,
    type: sectionType,  // Alias for convenience
    
    // Status & Visibility
    status: raw.status ?? 'draft',
    visibility: raw.visibility ?? 'visible',
    
    // Config
    config: raw.config ?? {},
    
    // Timestamps
    created_at: raw.created_at ?? raw.createdAt,
    updated_at: raw.updated_at ?? raw.updatedAt,
    publish_at: raw.publish_at ?? raw.publishAt ?? null,
    
    // Items (normalized)
    items,
  };
}

// ==================================================================
// BATCH NORMALIZATION
// ==================================================================

/**
 * Normalize an array of sections
 */
export function normalizeSections(sections: any[]): PageSection[] {
  if (!Array.isArray(sections)) {
    console.warn('[normalize] Expected array of sections, got:', typeof sections);
    return [];
  }
  
  return sections.map(normalizeSection);
}

// ==================================================================
// DEBUG UTILITIES
// ==================================================================

export function debugNormalization(raw: any, normalized: any) {
  console.log('🔄 Normalization Debug:', {
    raw: {
      type: raw.section_type ?? raw.type,
      zone: raw.zone,
      sort_order: raw.sort_order,
      items_count: raw.items?.length,
    },
    normalized: {
      type: normalized.type,
      zone: normalized.zone,
      sortOrder: normalized.sortOrder,
      items_count: normalized.items?.length,
    },
  });
}