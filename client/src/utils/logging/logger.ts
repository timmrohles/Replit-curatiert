/**
 * Centralized logging utility
 * Only logs in development mode
 * In production, errors are still logged but info/debug are suppressed
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log warning messages (always logged)
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log error messages (always logged)
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Log API errors with structured data
   */
  apiError: (endpoint: string, error: any) => {
    console.error(`[API ERROR] ${endpoint}:`, error);
  }
};
