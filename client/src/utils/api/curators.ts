/**
 * CURATORS API
 * ==============
 * CRUD operations for curators
 */

import { API_BASE_URL, getAdminAuthHeaders, safeJsonParse, type ApiResponse } from './config';
import { CuratorSchema, validateData, validateArray } from '../apiSchemas';

// ============================================
// TYPES
// ============================================

// ✅ TYPE SAFETY: Curator type is now inferred from Zod schema
export type { Curator } from '../apiSchemas';

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getAllCurators(): Promise<import('../apiSchemas').Curator[]> {
  try {
    // ✅ ADMIN AUTH: Use admin headers for content manager
    const response = await fetch(`${API_BASE_URL}/curators`, {
      headers: getAdminAuthHeaders(),
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch curators:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('   Error body:', errorText.substring(0, 200));
      throw new Error(`Failed to fetch curators: ${response.status}`);
    }
    
    const result = await safeJsonParse<import('../apiSchemas').Curator[]>(response);
    
    if (result?.data) {
      return validateArray(CuratorSchema, result.data as any) as any;
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading curators:', error);
    throw error;
  }
}

export async function getCurator(id: string): Promise<import('../apiSchemas').Curator | null> {
  try {
    // ✅ MIGRATED: Use canonical /api/curators/:id endpoint
    const response = await fetch(`${API_BASE_URL}/curators/${id}`, {
      headers: {
      },
    });
    const result: ApiResponse<import('../apiSchemas').Curator> = await response.json();
    
    // ✅ VALIDATION: Validate curator with Zod
    if (result.data) {
      return validateData(CuratorSchema, result.data as any, null) as any;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function saveCurator(curator: import('../apiSchemas').Curator): Promise<import('../apiSchemas').Curator | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/curators`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(curator),
    });
    
    if (!response.ok) {
      console.error('❌ Failed to save curator:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('   Error body:', errorText.substring(0, 200));
      throw new Error(`Failed to save curator: ${response.status}`);
    }
    
    const result: ApiResponse<import('../apiSchemas').Curator> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('❌ Error saving curator:', error);
    throw error; // Don't swallow errors!
  }
}

export async function deleteCurator(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/curators/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    const result: ApiResponse<{ id: string }> = await response.json();
    return (result as any).ok || result.success || false;
  } catch (error) {
    console.error('Error deleting curator:', error);
    return false;
  }
}

// ============================================
// FILE UPLOADS
// ============================================

export async function uploadCuratorAvatar(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // ✅ FIXED: Use correct token fallback chain
    const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/curators/upload-avatar`, {
      method: 'POST',
      headers: {
        'X-Admin-Token': token || '',
      },
      body: formData,
    });
    
    if (!response.ok) {
      console.error('❌ Failed to upload curator avatar:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('   Error body:', errorText.substring(0, 200));
      throw new Error(`Failed to upload avatar: ${response.status}`);
    }
    
    const result: any = await response.json();
    
    if (!result.success) {
      console.error('Avatar upload failed:', result.error, result.details);
      throw new Error(result.error || 'Upload failed');
    }
    
    return result.url;
  } catch (error) {
    console.error('Error uploading curator avatar:', error);
    throw error;
  }
}