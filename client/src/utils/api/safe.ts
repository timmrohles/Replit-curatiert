/**
 * SAFE API UTILITIES
 * ====================
 * Sichere API Calls mit Timeout, Abort Controller und Error Handling
 * 
 * REGELN:
 * 1. Jeder Fetch hat Timeout (default: 15s)
 * 2. AbortController für cleanup
 * 3. "Unexpected shape" ist ein Error
 */

import * as React from 'react';

const DEFAULT_TIMEOUT = 15000; // 15 seconds

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch with automatic timeout and abort controller
 * @param url - Request URL
 * @param options - Fetch options including custom timeout
 * @returns Response or throws error
 * 
 * @example
 * try {
 *   const response = await fetchWithTimeout('/api/books', { timeout: 10000 });
 *   const data = await response.json();
 * } catch (error) {
 *   if (error.name === 'AbortError') {
 *     console.error('Request timed out');
 *   }
 * }
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}

/**
 * Safe JSON parse with validation
 * @param response - Fetch response
 * @returns Parsed JSON or throws error
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Response is not JSON');
  }

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Failed to parse JSON response');
  }
}

/**
 * Validate API response shape
 * @param data - Response data
 * @param schema - Expected schema (simple key check)
 * @returns true if valid
 * 
 * @example
 * const data = await response.json();
 * if (!validateResponseShape(data, ['books', 'total'])) {
 *   throw new Error('Unexpected API response shape');
 * }
 */
export function validateResponseShape(
  data: any,
  requiredKeys: string[]
): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  for (const key of requiredKeys) {
    if (!(key in data)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ validateResponseShape: Missing key '${key}'`, data);
      }
      return false;
    }
  }

  return true;
}

/**
 * Safe API call wrapper with all best practices
 * @param url - API endpoint
 * @param options - Fetch options
 * @returns Typed response data
 * 
 * @example
 * const books = await safeApiCall<Book[]>('/api/books', {
 *   requiredKeys: ['data'],
 *   timeout: 10000
 * });
 */
export async function safeApiCall<T = any>(
  url: string,
  options: FetchWithTimeoutOptions & {
    requiredKeys?: string[];
    transformResponse?: (data: any) => T;
  } = {}
): Promise<T> {
  const { requiredKeys, transformResponse, ...fetchOptions } = options;

  try {
    const response = await fetchWithTimeout(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await safeJsonParse(response);

    // Validate shape if required keys specified
    if (requiredKeys && !validateResponseShape(data, requiredKeys)) {
      throw new Error('Unexpected API response shape');
    }

    // Transform if transformer provided
    if (transformResponse) {
      return transformResponse(data);
    }

    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ safeApiCall failed:', url, error);
    }
    throw error;
  }
}

/**
 * Create an abort controller hook for React components
 * Automatically aborts on unmount
 * 
 * @example
 * const abortController = useAbortController();
 * 
 * useEffect(() => {
 *   fetch('/api/data', { signal: abortController.signal })
 *     .then(...)
 *     .catch(error => {
 *       if (error.name === 'AbortError') return;
 *       // Handle other errors
 *     });
 * }, []);
 */
export function useAbortController() {
  const controllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    controllerRef.current = new AbortController();

    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return controllerRef.current;
}
