/**
 * API CONFIGURATION
 * ====================
 * Central API configuration and shared utilities
 */

// ============================================
// API BASE URL
// ============================================

export const API_BASE_URL = '/api';

// Version tracking
console.log('🚀 API MODULE LOADED - VERSION 2.1.0 - ZOD VALIDATION ACTIVE');

// ============================================
// ADMIN AUTH HEADERS HELPER
// ============================================

/**
 * Get headers with admin authentication token
 * Used for all admin-protected endpoints
 */
export function getAdminAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Get basic public headers (no auth)
 */
export function getPublicHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * API Response type - imported from schemas
 */
export type { ApiResponse } from '../apiSchemas';

/**
 * Helper function to safely parse JSON responses
 */
export async function safeJsonParse<T>(response: Response): Promise<import('../apiSchemas').ApiResponse<T> | null> {
  try {
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }
    return await response.json();
  } catch (error) {
    return null;
  }
}
