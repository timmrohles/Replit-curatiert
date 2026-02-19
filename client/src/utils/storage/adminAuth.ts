/**
 * ==================================================================
 * ADMIN AUTH NEON - Client-Side Utilities
 * ==================================================================
 * 
 * Helper functions für Admin-Login mit Neon PostgreSQL Backend
 * ACHTUNG: localStorage Side-Effect! Deswegen in /storage/ statt /api/
 * 
 * ==================================================================
 */

import { getErrorMessage, logError } from '../pure/errorHelpers';

const API_BASE_URL = '/api';

interface LoginResponse {
  ok: boolean;
  data?: {
    token: string;
    expiresAt: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Login mit Neon Admin Backend
 */
export async function loginAdminNeon(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // ✅ MIGRATED: Use canonical /api/admin/auth/login endpoint
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
          credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const data: LoginResponse = await response.json();

    if (data.ok && data.data && data.data.token) {
      // Store token in localStorage
      localStorage.setItem('admin_neon_token', data.data.token);
      localStorage.setItem('admin_neon_expires', data.data.expiresAt);
      
      return {
        success: true,
        token: data.data.token
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Login fehlgeschlagen'
      };
    }
  } catch (error: unknown) {
    logError('Admin login error', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Netzwerkfehler')
    };
  }
}

/**
 * Logout
 */
export async function logoutAdminNeon(): Promise<void> {
  const token = localStorage.getItem('admin_neon_token');
  
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/admin/auth/neon/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      logError('Logout error:', error);
    }
  }

  localStorage.removeItem('admin_neon_token');
  localStorage.removeItem('admin_neon_expires');
}

/**
 * Verify token is still valid
 */
export async function verifyAdminNeonToken(): Promise<boolean> {
  const token = localStorage.getItem('admin_neon_token');
  
  if (!token) return false;

  try {
    // ✅ MIGRATED: Use canonical /api/admin/auth/verify endpoint
    const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
          credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();
    return data.ok && data.data?.valid;
  } catch (error) {
    logError('Token verification error:', error);
    return false;
  }
}

/**
 * Check if user is logged in (without API call)
 */
export function isAdminNeonLoggedIn(): boolean {
  const token = localStorage.getItem('admin_neon_token');
  const expiresAt = localStorage.getItem('admin_neon_expires');
  
  if (!token || !expiresAt) return false;
  
  // Check if token is expired
  const expiryDate = new Date(expiresAt);
  return expiryDate > new Date();
}

/**
 * Get admin token from localStorage
 */
export function getAdminNeonToken(): string | null {
  return localStorage.getItem('admin_neon_token');
}