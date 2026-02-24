/**
 * ADMIN AUTH API
 * ================
 * Admin authentication operations
 */

import { API_BASE_URL, type ApiResponse } from './config';
// TYPES
// ============================================

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
}

// ============================================
// AUTH OPERATIONS
// ============================================

// Creator Dashboard Login (uses simpler KV-based auth)
export async function creatorLogin(password: string): Promise<AdminLoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Response not OK:', text);
      return {
        success: false,
        error: `Server error: ${response.status} - ${text}`
      };
    }
    
    const result = await response.json();
    
    // Backend returns { ok: true, data: { token, ... } }
    if (result.ok && result.data?.token) {
      return { 
        success: true, 
        token: result.data.token,
        message: result.data.message || 'Login successful'
      };
    } else {
      console.error('❌ Creator login failed:', result.error);
      return { 
        success: false, 
        error: result.error?.message || result.error || 'Login failed'
      };
    }
  } catch (error) {
    console.error('❌ Creator login error:', error);
    console.error('❌ Error type:', error instanceof TypeError ? 'TypeError (Network)' : typeof error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'unknown',
      stack: error instanceof Error ? error.stack : 'no stack'
    });
    return { 
      success: false, 
      error: `Network error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Admin Login (uses Neon-based auth for main admin panel)
export async function adminLogin(password: string): Promise<AdminLoginResponse> {
  try {
    // ✅ MIGRATED: Use canonical /api/admin/auth/login endpoint
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    
    const result = await response.json();
    
    // Transform response to match AdminLoginResponse interface
    if (result.ok && result.data?.token) {
      return { 
        success: true, 
        token: result.data.token,
        message: 'Login successful'
      };
    } else {
      console.error('❌ Login failed:', result.error);
      return { 
        success: false, 
        error: result.error?.message || 'Login failed' 
      };
    }
  } catch (error) {
    console.error('❌ Error during admin login:', error);
    return { success: false, error: 'Login failed: ' + String(error) };
  }
}

export async function adminVerify(token: string): Promise<boolean> {
  try {
    // ✅ MIGRATED: Use canonical /api/admin/auth/verify endpoint
    const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    const result = await response.json();
    return result.ok === true && result.data?.valid === true;
  } catch (error) {
    console.error('❌ Error verifying admin session:', error);
    return false;
  }
}

export async function adminLogout(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    // Check if response is ok
    if (!response.ok) {
      console.warn('⚠️ Logout request failed with status:', response.status);
      // Even if the server request fails, we still want to logout locally
      return true;
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('⚠️ Logout response is not JSON, assuming success');
      return true;
    }
    
    const result: ApiResponse<any> = await response.json();
    return result.success || true; // Default to true for logout
  } catch (error) {
    console.error('Error during admin logout:', error);
    // Even if there's an error, we still logout locally
    return true;
  }
}

export async function adminChangePassword(currentPassword: string, newPassword: string, token: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword, token }),
    });
    const result: { success: boolean; error?: string; message?: string } = await response.json();
    return result;
  } catch (error) {
    console.error('Error changing admin password:', error);
    return { success: false, error: 'Password change failed' };
  }
}