/**
 * Zod Schemas for API Response Validation
 * 
 * Diese Schemas bieten Runtime-Validierung für alle API Responses
 * und verhindern, dass kaputte Daten vom Backend durchrutschen.
 * 
 * @module apiSchemas
 */

import { z } from 'zod';

// ============================================
// BASE SCHEMAS
// ============================================

/**
 * Social Media Links Schema
 */
export const SocialMediaSchema = z.object({
  youtube: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  website: z.string().optional(),
  tiktok: z.string().optional(),
}).passthrough(); // Allow additional social platforms

/**
 * Additional Image Schema (for Books)
 */
export const AdditionalImageSchema = z.object({
  url: z.string(),
  type: z.enum(['gallery', 'author', 'interior', 'back_cover', 'other']),
  alt: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
}).strict();

// ============================================
// CURATOR SCHEMA
// ============================================

/**
 * Curator Schema with full validation
 */
export const CuratorSchema = z.object({
  id: z.string().or(z.number()).transform(String), // Accept both string and number IDs
  name: z.string(),
  slug: z.string().optional(),
  avatar_url: z.string().optional().nullable(), // ✅ Backend uses avatar_url, not avatar
  bio: z.string().optional().nullable(), // ✅ Can be null in DB
  focus: z.string().optional().nullable(),
  
  // ✅ Social columns from DB (individual columns, not JSONB)
  instagram_url: z.string().optional().nullable(),
  youtube_url: z.string().optional().nullable(),
  tiktok_url: z.string().optional().nullable(),
  podcast: z.string().optional().nullable(),
  website_url: z.string().optional().nullable(),
  
  // ✅ Status/visibility fields
  visible: z.boolean().optional().default(false),
  display_order: z.number().optional().default(0),
  
  // ✅ Follower/count fields (from views or joins)
  follower_count: z.number().optional().default(0),
  curation_count: z.number().optional().default(0),
  book_count: z.number().optional().default(0),
  
  // ✅ Timestamps (snake_case from DB)
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
}).passthrough(); // Allow additional fields for future compatibility

export type Curator = z.infer<typeof CuratorSchema>;

// ============================================
// BOOK SCHEMA
// ============================================

/**
 * Book Schema with full ONIX 3.0 support
 */
export const BookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  authorSlug: z.string().optional(),
  slug: z.string().optional(),
  publisher: z.string(),
  year: z.string(),
  isbn: z.string(),
  coverUrl: z.string(),
  tags: z.array(z.string()),
  onixTagIds: z.array(z.string()),
  availability: z.string(),
  price: z.string(),
  newPrice: z.string().optional(),
  usedPrice: z.string().optional(),
  curatorId: z.string(),
  
  // ONIX Image Metadata
  coverImageAlt: z.string().optional(),
  coverImageCaption: z.string().optional(),
  coverImageCredit: z.string().optional(),
  additionalImages: z.array(AdditionalImageSchema).optional(),
  
  // ONIX Collection Fields
  collection: z.string().optional(),
  collectionSlug: z.string().optional(),
  collectionNumber: z.number().optional(),
  collectionType: z.string().optional(),
  
  // Extended ONIX Fields
  warengruppe: z.string().optional(),
  themaCodes: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  lesemotive: z.array(z.string()).optional(),
  geographicFocus: z.array(z.string()).optional(),
  zeitperiode: z.array(z.string()).optional(),
  ageRangeFrom: z.number().optional(),
  ageRangeTo: z.number().optional(),
  expertiseLevel: z.string().optional(),
  languageCode: z.string().optional(),
  languageLevel: z.string().optional(),
  shortDescription: z.string().optional(),
  klappentext: z.string().optional(),
  pressQuotes: z.array(z.string()).optional(),
  authorBio: z.string().optional(),
  productForm: z.string().optional(),
  productFormDetail: z.string().optional(),
  pageCount: z.number().optional(),
  onix: z.object({
    subtitle: z.string().optional(),
    bookWorld: z.string().optional(),
  }).optional(),
  
  seriesName: z.string().optional(),
  seriesSlug: z.string().optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  format: z.string().optional(),
  
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough(); // Allow additional ONIX fields

export type Book = z.infer<typeof BookSchema>;

// ============================================
// TAG SCHEMA
// ============================================

/**
 * Tag Schema
 */
export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  slug: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough(); // Allow additional fields

export type Tag = z.infer<typeof TagSchema>;

/**
 * ONIX Tag Schema
 */
export const ONIXTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  slug: z.string().optional(),
  icon: z.string().optional(),
  displayName: z.string().default(''),
  visible: z.boolean().default(true),
  visibilityLevel: z.string().default('filter'),
  type: z.string().default(''),
  onixCode: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough();

export type ONIXTag = z.infer<typeof ONIXTagSchema>;

// ============================================
// PAGE SCHEMA
// ============================================

/**
 * Page Schema
 */
export const PageSchema = z.object({
  id: z.number(),
  slug: z.string(),
  type: z.enum(['composed', 'static', 'dynamic']).optional(),
  template_key: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  visibility: z.enum(['visible', 'hidden']).optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
  robots: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough(); // Allow additional CMS fields

export type Page = z.infer<typeof PageSchema>;

// ============================================
// MENU ITEM SCHEMA
// ============================================

/**
 * Menu Item Schema (for navigation)
 */
export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
  enabled: z.boolean().optional(),
  pageId: z.number().optional(),
  subcategories: z.array(z.object({
    title: z.string(),
    order: z.number().optional(),
    pageId: z.number().optional(),
  })).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough();

export type MenuItem = z.infer<typeof MenuItemSchema>;

// ============================================
// SECTION SCHEMA
// ============================================

/**
 * Section Schema (for page composition)
 */
export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  curatorId: z.string().nullable().optional(),
  curatorType: z.enum(['redaktion', 'user']).optional(),
  reason: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  bookIds: z.array(z.string()).optional(),
  sectionType: z.string(),
  status: z.enum(['active', 'archived']).optional(),
  publishDate: z.string().optional(),
  archiveDate: z.string().nullable().optional(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough();

export type Section = z.infer<typeof SectionSchema>;

// ============================================
// API RESPONSE WRAPPER
// ============================================

/**
 * Generic API Response Schema
 */
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Safely parse and validate data with fallback
 * 
 * @param schema - Zod schema to validate against
 * @param data - Unknown data to validate
 * @param fallback - Fallback value if validation fails
 * @returns Validated data or fallback
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation Error:', {
        errors: error.errors,
        data,
      });
    }
    console.warn('⚠️ Using fallback value');
    return fallback;
  }
}

/**
 * Safely parse and validate array data
 * 
 * @param schema - Zod schema for array items
 * @param data - Unknown data to validate
 * @returns Validated array (filters out invalid items)
 */
export function validateArray<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T[] {
  if (!Array.isArray(data)) {
    console.error('❌ Expected array, got:', typeof data);
    return [];
  }

  const validated: T[] = [];
  data.forEach((item, index) => {
    try {
      validated.push(schema.parse(item));
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn(`⚠️ Skipping invalid item at index ${index}:`);
        // Log each validation error with path and message
        error.errors.forEach(err => {
          console.warn(`   - ${err.path.join('.')}: ${err.message}`);
        });
        // Log the actual item for debugging
        console.log('   Item data:', item);
      }
    }
  });

  return validated;
}

/**
 * Validate API response with type safety
 */
export function validateApiResponse<T>(
  dataSchema: z.ZodSchema<T>,
  response: unknown
): ApiResponse<T> {
  const responseSchema = createApiResponseSchema(dataSchema);
  
  try {
    return responseSchema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ API Response Validation Error:', error.errors);
    }
    return {
      success: false,
      error: 'Invalid API response format',
    };
  }
}