/**
 * REVIEWS API
 * =============
 * CRUD operations for book reviews
 */

import { API_BASE_URL, getAdminAuthHeaders, type ApiResponse } from './config';
// TYPES
// ============================================

export interface Review {
  id: string;
  bookId: string;
  curatorId: string;
  rating: number;
  text: string;
  type: 'Kurz' | 'Ausführlich';
  mood: string;
  occasion: string;
  targetAudience: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getAllReviews(): Promise<Review[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      headers: {
      },
    });
    const result: ApiResponse<Review[]> = await response.json();
    return result.data || [];
  } catch (error) {
    // Silent fallback
    return [];
  }
}

export async function getReviewsByBook(bookId: string): Promise<Review[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/book/${bookId}`, {
      headers: {
      },
    });
    const result: ApiResponse<Review[]> = await response.json();
    return result.data || [];
  } catch (error) {
    // Silent fallback
    return [];
  }
}

export async function getReviewsByCurator(curatorId: string): Promise<Review[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/curator/${curatorId}`, {
      headers: {
      },
    });
    const result: ApiResponse<Review[]> = await response.json();
    return result.data || [];
  } catch (error) {
    // Silent fallback
    return [];
  }
}

export async function saveReview(review: Review): Promise<Review | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(review),
    });
    const result: ApiResponse<Review> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error saving review:', error);
    return null;
  }
}
