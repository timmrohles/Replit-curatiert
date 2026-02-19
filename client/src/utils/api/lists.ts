/**
 * LISTS API
 * ===========
 * CRUD operations for curated book lists
 */

import { API_BASE_URL, getAdminAuthHeaders, type ApiResponse } from './config';
// TYPES
// ============================================

export interface CuratedList {
  id: string;
  title: string;
  description: string;
  curatorId: string;
  bookIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getAllLists(): Promise<CuratedList[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/lists`, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const result: ApiResponse<CuratedList[]> = await response.json();
    return result.data || [];
  } catch (error) {
    // Silent fallback
    return [];
  }
}

export async function getList(id: string): Promise<CuratedList | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/lists/${id}`, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const result: ApiResponse<CuratedList> = await response.json();
    return result.data || null;
  } catch (error) {
    // Silent fallback
    return null;
  }
}

export async function saveList(list: CuratedList): Promise<CuratedList | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/lists`, {
      method: 'POST',
      credentials: 'include',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(list),
    });
    const result: ApiResponse<CuratedList> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error saving list:', error);
    return null;
  }
}
