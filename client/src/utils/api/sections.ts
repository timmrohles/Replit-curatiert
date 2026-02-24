/**
 * SECTIONS API
 * ==============
 * CRUD operations for CMS sections
 */

import { API_BASE_URL, getAdminAuthHeaders, type ApiResponse } from './config';
// TYPES
// ============================================

// ⚠️ DEPRECATED: Old Section Interface (pre-Migration 007)
// Kept for backward compatibility during transition
export interface SectionOld {
  id: string;
  title: string;
  curatorId: string | null;
  curatorType: 'redaktion' | 'community' | 'extern';
  reason: string;
  category: string;
  tags: string[];
  bookIds: string[];
  sectionType: 'creator-carousel' | 'horizontal-row' | 'grid' | 'featured';
  status: 'active' | 'archived' | 'scheduled';
  publishDate: string;
  archiveDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ✅ TYPE SAFETY: Section type is now inferred from Zod schema  
export type { Section } from '../apiSchemas';

// ============================================
// CRUD OPERATIONS
// ============================================

// ✅ NEW API: Get all sections (Migration 007)
export async function getAllSections(status?: 'active' | 'archived' | 'scheduled' | 'draft'): Promise<import('../apiSchemas').Section[]> {
  try {
    const url = status 
      ? `${API_BASE_URL}/sections?status=${status}` 
      : `${API_BASE_URL}/sections`;
    
    const response = await fetch(url, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch sections: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('❌ Error fetching sections:', error);
    return [];
  }
}

// ✅ NEW API: Get single section by ID
export async function getSection(id: string): Promise<import('../apiSchemas').Section | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/sections/${id}`, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch section ${id}: ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('❌ Error fetching section:', error);
    return null;
  }
}

// ✅ NEW API: Create or update section
export async function saveSection(section: Partial<import('../apiSchemas').Section>): Promise<import('../apiSchemas').Section | null> {
  try {
    const isUpdate = !!section.id && !!section.createdAt;
    const url = isUpdate 
      ? `${API_BASE_URL}/sections/${section.id}` 
      : `${API_BASE_URL}/sections`;
    const method = isUpdate ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
          credentials: 'include',
      method,
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(section),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to save section: ${response.status} - ${errorText}`);
      throw new Error(`Failed to save section: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('❌ Error saving section:', error);
    throw error;
  }
}

// ✅ NEW API: Delete section (soft delete)
export async function deleteSection(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/sections/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAdminAuthHeaders(),
    });
    
    if (!response.ok) {
      console.error(`Failed to delete section: ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('❌ Error deleting section:', error);
    return false;
  }
}

// ✅ NEW: Update section order (use saveSection with updated displayOrder instead)
// Keeping this for backward compatibility
export async function moveSection(id: string, direction: 'up' | 'down'): Promise<boolean> {
  console.warn('⚠️ moveSection is deprecated. Use saveSection with updated displayOrder instead.');
  return false;
}