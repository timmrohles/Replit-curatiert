/**
 * ==================================================================
 * SAFE NAVIGATE HOOK - Crash-Prevention für Navigation
 * ==================================================================
 * 
 * Verhindert Crashes durch:
 * - Ungültige IDs (undefined, null, '')
 * - Fehlende Parameter
 * - Kaputte URLs
 * 
 * Features:
 * - Dev-only Warnings
 * - Fallback zu Homepage oder 404
 * - Type-safe Navigation
 * ==================================================================
 */

import { useNavigate } from 'react-router-dom';

const isDev = typeof import.meta !== 'undefined' && 
              import.meta.env && 
              import.meta.env.DEV;

interface NavigationOptions {
  /** Fallback route if validation fails */
  fallback?: string;
  /** Should log warnings in dev mode */
  silent?: boolean;
}

export function useSafeNavigate() {
  const navigate = useNavigate();

  /**
   * Safe navigate to book detail page
   */
  const toBook = (bookId: string | undefined | null, options?: NavigationOptions) => {
    if (!bookId || bookId.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation to book - invalid ID:', bookId);
      }
      if (options?.fallback) {
        navigate(options.fallback);
      }
      return false;
    }
    navigate(`/buch/${bookId}`);
    return true;
  };

  /**
   * Safe navigate to creator storefront
   */
  const toCreator = (creatorSlug: string | undefined | null, options?: NavigationOptions) => {
    if (!creatorSlug || creatorSlug.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation to creator - invalid slug:', creatorSlug);
      }
      if (options?.fallback) {
        navigate(options.fallback);
      }
      return false;
    }
    navigate(`/c/${creatorSlug}`);
    return true;
  };

  /**
   * Safe navigate to tag page
   */
  const toTag = (tagSlug: string | undefined | null, options?: NavigationOptions) => {
    if (!tagSlug || tagSlug.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation to tag - invalid slug:', tagSlug);
      }
      if (options?.fallback) {
        navigate(options.fallback);
      }
      return false;
    }
    navigate(`/t/${tagSlug}`);
    return true;
  };

  /**
   * Safe navigate to category page
   */
  const toCategory = (categorySlug: string | undefined | null, options?: NavigationOptions) => {
    if (!categorySlug || categorySlug.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation to category - invalid slug:', categorySlug);
      }
      if (options?.fallback) {
        navigate(options.fallback);
      }
      return false;
    }
    navigate(`/kategorie/${categorySlug}`);
    return true;
  };

  /**
   * Safe navigate to any path with validation
   */
  const toPath = (path: string | undefined | null, options?: NavigationOptions) => {
    if (!path || path.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation - invalid path:', path);
      }
      if (options?.fallback) {
        navigate(options.fallback);
      }
      return false;
    }
    navigate(path);
    return true;
  };

  /**
   * Generic safe navigate - validates before navigation
   */
  const safe = (path: string | undefined | null, options?: NavigationOptions) => {
    return toPath(path, options);
  };

  return {
    toBook,
    toCreator,
    toTag,
    toCategory,
    toPath,
    safe,
    // Expose raw navigate for cases where you already validated
    raw: navigate
  };
}