/**
 * PAGES API
 * ===========
 * CRUD operations for CMS pages
 */

import { API_BASE_URL, getAdminAuthHeaders, safeJsonParse, type ApiResponse } from './config';

// ============================================
// TYPES
// ============================================

// ✅ TYPE SAFETY: Page type is now inferred from Zod schema
export type { Page } from '../apiSchemas';

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getAllPages(): Promise<import('../apiSchemas').Page[]> {
  try {
    // ✅ NEUE API: Admin List Endpoint mit draft+published
    const response = await fetch(`${API_BASE_URL}/admin/pages`, { credentials: 'include', headers: getAdminAuthHeaders() });
    
    if (!response.ok) {
      console.warn(`Pages endpoint returned ${response.status}`);
      return [];
    }
    
    // Use safe JSON parsing
    const result = await safeJsonParse<import('../apiSchemas').Page[]>(response);
    if (!result) {
      console.warn('Pages endpoint returned non-JSON response');
      return [];
    }
    
    console.log(`✅ Fetched ${result.data?.length || 0} pages from new API`);
    return result.data || [];
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

export async function getPage(id: string): Promise<import('../apiSchemas').Page | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/pages/${id}`, { credentials: 'include', headers: getAdminAuthHeaders() });
    
    if (!response.ok) {
      console.error(`Failed to fetch page: ${response.status}`);
      return null;
    }
    
    const result: ApiResponse<import('../apiSchemas').Page> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export async function savePage(page: Partial<import('../apiSchemas').Page>): Promise<import('../apiSchemas').Page | null> {
  try {
    // ✅ FIX: Use PATCH for existing pages, POST for new pages
    const isUpdate = !!page.id;
    const url = isUpdate 
      ? `${API_BASE_URL}/admin/pages/${page.id}`
      : `${API_BASE_URL}/admin/pages`;
    const method = isUpdate ? 'PATCH' : 'POST';
    
    console.log(`🔍 savePage ${method} ${url}`);
    console.log('🔍 Page data:', page);
    
    const response = await fetch(url, {
          credentials: 'include',
      method,
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(page),
    });
    
    console.log('🔍 Response status:', response.status);
    
    if (!response.ok) {
      // ✅ FIX: Show detailed error message to user
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `Server error: ${response.status}`;
      console.error(`Failed to save page: ${response.status} - ${errorMsg}`);
      alert(`❌ Fehler beim Speichern der Page:\n\n${errorMsg}`);
      return null;
    }
    
    const result: ApiResponse<import('../apiSchemas').Page> = await response.json();
    console.log('🔍 Result:', result);
    return result.data || null;
  } catch (error) {
    console.error('Error saving page:', error);
    alert(`❌ Netzwerkfehler:\n\n${error}`);
    return null;
  }
}

export async function deletePage(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/pages/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAdminAuthHeaders(),
    });
    
    if (!response.ok) {
      console.error(`Failed to delete page: ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    return result.ok || result.success;
  } catch (error) {
    console.error('Error deleting page:', error);
    return false;
  }
}