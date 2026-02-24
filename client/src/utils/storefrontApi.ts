/**
 * ==================================================================
 * STOREFRONT API - Creator Dashboard Integration
 * ==================================================================
 * Vollständige CRUD-Operationen für Storefronts
 * ==================================================================
 */

const API_BASE_URL = '/api';

// ==================================================================
// TYPES
// ==================================================================

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
  heroBackground: string;
  ctaButton: string;
  linkButton: string;
  hoverAccent: string;
}

export interface CreatorInfo {
  name: string;
  bio: string;
  avatar?: string;
}

export interface SocialMedia {
  website?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

export interface Storefront {
  id: string;
  creator_id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  color_scheme?: ColorScheme;
  creator_info?: CreatorInfo;
  social_media?: SocialMedia;
  books?: any[];
  book_series?: any[];
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ==================================================================
// HELPERS
// ==================================================================

/**
 * Get creator auth headers
 * Uses creatorAuthToken from localStorage
 */
function getCreatorAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('creatorAuthToken');
  return {
    'Content-Type': 'application/json',
    'X-Creator-Token': token || '',
  };
}

/**
 * Get admin auth headers
 */
function getAdminAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['x-admin-token'] = token;
  }
  return headers;
}

/**
 * Safe JSON parse with error handling
 */
async function safeJsonParse<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
}

// ==================================================================
// CREATOR API FUNCTIONS
// ==================================================================

/**
 * Get all storefronts for logged-in creator
 */
export async function getCreatorStorefronts(): Promise<Storefront[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/creator/storefronts`, {
          credentials: 'include',
      headers: getCreatorAuthHeaders(),
    });

    const result = await safeJsonParse<Storefront[]>(response);
    return result?.data || [];
  } catch (error) {
    console.error('Error fetching creator storefronts:', error);
    return [];
  }
}

/**
 * Get single storefront by ID (creator-owned)
 */
export async function getCreatorStorefront(id: string): Promise<Storefront | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/creator/storefronts/${id}`, {
          credentials: 'include',
      headers: getCreatorAuthHeaders(),
    });

    const result = await safeJsonParse<Storefront>(response);
    return result?.data || null;
  } catch (error) {
    console.error('Error fetching storefront:', error);
    return null;
  }
}

/**
 * Create new storefront
 */
export async function createStorefront(data: Partial<Storefront>): Promise<Storefront | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/creator/storefronts`, {
          credentials: 'include',
      method: 'POST',
      headers: getCreatorAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await safeJsonParse<Storefront>(response);
    
    if (!result?.ok) {
      console.error('❌ Failed to create storefront:', result?.error);
      return null;
    }

    return result.data || null;
  } catch (error) {
    console.error('❌ Error creating storefront:', error);
    return null;
  }
}

/**
 * Update storefront
 */
export async function updateStorefront(id: string, data: Partial<Storefront>): Promise<Storefront | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/creator/storefronts/${id}`, {
          credentials: 'include',
      method: 'PUT',
      headers: getCreatorAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await safeJsonParse<Storefront>(response);
    
    if (!result?.ok) {
      console.error('❌ Failed to update storefront:', result?.error);
      return null;
    }

    return result.data || null;
  } catch (error) {
    console.error('❌ Error updating storefront:', error);
    return null;
  }
}

/**
 * Delete storefront
 */
export async function deleteStorefront(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/creator/storefronts/${id}`, {
          credentials: 'include',
      method: 'DELETE',
      headers: getCreatorAuthHeaders(),
    });

    const result = await safeJsonParse<any>(response);
    
    return result?.ok === true;
  } catch (error) {
    console.error('❌ Error deleting storefront:', error);
    return false;
  }
}

/**
 * Toggle publish status
 */
export async function publishStorefront(id: string, isPublished: boolean): Promise<Storefront | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/creator/storefronts/${id}/publish`, {
          credentials: 'include',
      method: 'POST',
      headers: getCreatorAuthHeaders(),
      body: JSON.stringify({ is_published: isPublished }),
    });

    const result = await safeJsonParse<Storefront>(response);
    
    if (!result?.ok) {
      console.error('❌ Failed to publish storefront:', result?.error);
      return null;
    }

    return result.data || null;
  } catch (error) {
    console.error('❌ Error publishing storefront:', error);
    return null;
  }
}

// ==================================================================
// PUBLIC API FUNCTIONS
// ==================================================================

/**
 * Get public storefront by slug
 */
export async function getPublicStorefront(slug: string): Promise<Storefront | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/storefronts/${slug}`, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await safeJsonParse<Storefront>(response);
    return result?.data || null;
  } catch (error) {
    console.error('Error fetching public storefront:', error);
    return null;
  }
}

// ==================================================================
// ADMIN API FUNCTIONS
// ==================================================================

/**
 * Admin: Get all storefronts
 */
export async function getAllStorefrontsAdmin(): Promise<Storefront[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/storefronts`, { credentials: 'include', headers: getAdminAuthHeaders() });

    const result = await safeJsonParse<Storefront[]>(response);
    return result?.data || [];
  } catch (error) {
    console.error('Error fetching admin storefronts:', error);
    return [];
  }
}

/**
 * Admin: Delete any storefront
 */
export async function deleteStorefrontAdmin(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/storefronts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAdminAuthHeaders(),
    });

    const result = await safeJsonParse<any>(response);
    return result?.ok === true;
  } catch (error) {
    console.error('Error deleting storefront:', error);
    return false;
  }
}
