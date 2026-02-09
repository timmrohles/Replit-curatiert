/**
 * CENTRAL API INDEX
 * ====================
 * Re-exports all API functions from their respective modules
 * 
 * MIGRATION STATUS (2026-01-31 - Phase 3 Complete):
 * ✅ Configuration & Helpers - MIGRATED
 * ✅ Curators - MIGRATED
 * ✅ Books - MIGRATED
 * ✅ Reviews - MIGRATED
 * ✅ Tags - MIGRATED
 * ✅ Lists - MIGRATED
 * ✅ Navigation - MIGRATED
 * ✅ Sections - MIGRATED
 * ✅ Pages - MIGRATED
 * ✅ Admin Auth - MIGRATED
 * ✅ External APIs - MIGRATED
 * ✅ Awards - MIGRATED (existing)
 * ✅ Cache - MIGRATED (existing)
 * ✅ Safe API - MIGRATED (existing)
 * ✅ Storefront - MIGRATED (existing)
 * ✅ Recommendations - MIGRATED (Phase 3)
 * ✅ Ratings - MIGRATED (Phase 3)
 * 
 * ARCHITECTURE:
 * - /utils/api/config.ts - API configuration & shared utilities ✅
 * - /utils/api/helpers.ts - Pure helper functions ✅
 * - /utils/api/curators.ts - Curator CRUD operations ✅
 * - /utils/api/books.ts - Book CRUD operations ✅
 * - /utils/api/reviews.ts - Review CRUD operations ✅
 * - /utils/api/tags.ts - Tags & ONIX Tags CRUD ✅
 * - /utils/api/lists.ts - Curated Lists CRUD ✅
 * - /utils/api/navigation.ts - Menu Items CRUD ✅
 * - /utils/api/sections.ts - Sections CMS CRUD ✅
 * - /utils/api/pages.ts - Pages CRUD ✅
 * - /utils/api/admin.ts - Admin login/logout/verify ✅
 * - /utils/api/external.ts - Google Books API ✅
 * - /utils/api/awards.ts - Awards CRUD ✅
 * - /utils/api/cache.ts - API caching ✅
 * - /utils/api/safe.ts - Safe API wrappers ✅
 * - /utils/api/storefront.ts - Storefront API ✅
 * - /utils/api/recommendations.ts - Book recommendations ✅
 * - /utils/api/ratings.ts - Ratings & matching ✅
 */

// ============================================
// MIGRATED MODULES - Use new structure ✅
// ============================================

// Configuration & Helpers
export * from './config';
export { getBookWorld } from './helpers';

// Core CRUD Operations
export * from './curators';
export * from './books';
export * from './reviews';
export * from './tags';
export * from './lists';
export * from './navigation';
export * from './sections';
export * from './pages';

// Admin & Auth
export * from './admin';

// External Integrations
export * from './external';

// Existing Migrated Modules
export * from './awards';
export * from './cache';
export { fetchWithTimeout, validateResponseShape, safeApiCall, useAbortController } from './safe';
export type { FetchWithTimeoutOptions } from './safe';
export * from './storefront';

// Advanced Features (Phase 3 Complete)
export { getRecommendedBooks } from './recommendations';
export * from './ratings';