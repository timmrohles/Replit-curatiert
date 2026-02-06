/**
 * NAVIGATION API
 * ================
 * CRUD operations for menu items
 */

import { API_BASE_URL, type ApiResponse } from './config';
// TYPES
// ============================================

// ✅ TYPE SAFETY: MenuItem type is now inferred from Zod schema
export type { MenuItem } from '../apiSchemas';

// MenuSubcategory is embedded in MenuItem schema
export interface MenuSubcategory {
  title: string;
  items?: string[];
  visible?: boolean;
  pageId?: number;
  order?: number;
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getAllMenuItems(): Promise<import('../apiSchemas').MenuItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/navigation/items`, {
      headers: {
      },
    });
    const result: ApiResponse<import('../apiSchemas').MenuItem[]> = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
}

export async function getMenuItem(id: string): Promise<import('../apiSchemas').MenuItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/navigation/${id}`, {
      headers: {
      },
    });
    const result: ApiResponse<import('../apiSchemas').MenuItem> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }
}

export async function saveMenuItem(menuItem: import('../apiSchemas').MenuItem): Promise<import('../apiSchemas').MenuItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/navigation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(menuItem),
    });
    const result: ApiResponse<import('../apiSchemas').MenuItem> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error saving menu item:', error);
    return null;
  }
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/navigation/${id}`, {
      method: 'DELETE',
      headers: {
      },
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return false;
  }
}