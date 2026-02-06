/**
 * ==================================================================
 * ADMIN TOKEN HELPER
 * ==================================================================
 * 
 * Zentrale Funktion zum Holen des Admin-Tokens
 * Unterstützt BEIDE Token-Systeme: admin_neon_token + admin_token
 * 
 * ==================================================================
 */

/**
 * Get admin token from localStorage
 * Checks for NEON token (new system) or falls back to old token
 */
export function getAdminToken(): string | null {
  return localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
}

/**
 * Check if admin is logged in
 */
export function isAdminLoggedIn(): boolean {
  return !!getAdminToken();
}

/**
 * Logout admin (clear all tokens)
 */
export function logoutAdmin(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_neon_token');
  localStorage.removeItem('admin_neon_expires');
  localStorage.removeItem('admin_last_activity');
}
