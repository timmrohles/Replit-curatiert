/**
 * SAFE ROUTING UTILITIES
 * ========================
 * Zentraler Ort für alle URL-Generierung und sichere Navigation
 * 
 * REGELN:
 * 1. Builder-Funktionen geben null zurück bei unvollständigen Daten
 * 2. SafeNavigate blockiert null/undefined/""
 * 3. Alle URLs werden NUR über diese Builder erzeugt
 */

import { useNavigate, NavigateFunction } from 'react-router-dom';
import { useCallback } from 'react';
import { useLocale } from '../LocaleContext';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type BookMinimal = {
  id?: string | null;
};

export type TagMinimal = {
  slug?: string | null;
  name?: string | null;
};

export type CuratorMinimal = {
  id?: string | null;
  name?: string | null;
};

export type MenuItemMinimal = {
  slug?: string | null;
  name?: string | null;
};

export type PageMinimal = {
  slug?: string | null;
  name?: string | null;
};

// ============================================
// URL BUILDER FUNCTIONS
// ============================================

/**
 * Build URL for a book detail page
 * @returns URL string or null if book data is incomplete
 */
export function buildBookUrl(book: BookMinimal | null | undefined): string | null {
  if (!book || !book.id) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ buildBookUrl: book.id missing', book);
    }
    return null;
  }
  return `/books/${book.id}`;
}

/**
 * Build URL for a tag page
 * @returns URL string or null if tag data is incomplete
 */
export function buildTagUrl(tag: TagMinimal | null | undefined): string | null {
  if (!tag || !tag.slug) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ buildTagUrl: tag.slug missing', tag);
    }
    return null;
  }
  return `/tags/${tag.slug}`;
}

/**
 * Build URL for a curator page
 * @returns URL string or null if curator data is incomplete
 */
export function buildCuratorUrl(curator: CuratorMinimal | null | undefined): string | null {
  if (!curator || !curator.id) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ buildCuratorUrl: curator.id missing', curator);
    }
    return null;
  }
  return `/kurator/${curator.id}`;
}

/**
 * Build URL for a category page (from navigation menu item)
 * @returns URL string or null if item data is incomplete
 */
export function buildCategoryUrl(item: MenuItemMinimal | null | undefined): string | null {
  if (!item || !item.slug) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ buildCategoryUrl: item.slug missing', item);
    }
    return null;
  }
  return `/kategorie/${item.slug}`;
}

/**
 * Build URL for a custom page
 * @returns URL string or null if page data is incomplete
 */
export function buildPageUrl(page: PageMinimal | null | undefined): string | null {
  if (!page || !page.slug) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ buildPageUrl: page.slug missing', page);
    }
    return null;
  }
  return `/page/${page.slug}`;
}

// ============================================
// SAFE NAVIGATE WRAPPER
// ============================================

/**
 * Safe navigate function that validates URLs before navigation
 * @param navigate - React Router navigate function
 * @param url - Target URL (can be null/undefined)
 * @param options - Navigation options
 * @returns true if navigation succeeded, false if blocked
 */
export function safeNavigate(
  navigate: NavigateFunction,
  url: string | null | undefined,
  options?: { replace?: boolean }
): boolean {
  // Block null/undefined
  if (url == null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ safeNavigate: URL is null or undefined');
    }
    return false;
  }

  // Block empty strings
  if (typeof url !== 'string' || url.trim() === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ safeNavigate: URL is empty or not a string', url);
    }
    return false;
  }

  // Navigate
  try {
    navigate(url, options);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ safeNavigate: Navigation failed', error);
    }
    return false;
  }
}

/**
 * Hook for safe programmatic navigation
 * @returns Safe navigate function
 * 
 * @example
 * const safeNav = useSafeNavigate();
 * safeNav(buildBookUrl(book)); // Will not crash if book.id is missing
 */
const ADMIN_PREFIX = '/sys-mgmt-xK9';

export function useSafeNavigate() {
  const navigate = useNavigate();
  const { localePath } = useLocale();
  
  return useCallback(
    (url: string | null | undefined, options?: { replace?: boolean }) => {
      if (url && !url.startsWith(ADMIN_PREFIX)) {
        return safeNavigate(navigate, localePath(url), options);
      }
      return safeNavigate(navigate, url, options);
    },
    [navigate, localePath]
  );
}

// ============================================
// LINK HELPERS
// ============================================

/**
 * Check if a URL is safe to use in a Link component
 * @returns true if URL can be used, false if Link should be disabled
 */
export function isValidLinkUrl(url: string | null | undefined): url is string {
  return url != null && typeof url === 'string' && url.trim() !== '';
}

/**
 * Get safe props for a Link component
 * @returns Props object with `to` and `onClick` handlers
 * 
 * @example
 * <Link {...getSafeLinkProps(buildBookUrl(book))}>
 *   {book.title}
 * </Link>
 */
export function getSafeLinkProps(url: string | null | undefined) {
  if (isValidLinkUrl(url)) {
    return {
      to: url,
      onClick: undefined,
    };
  }

  // Return disabled link props
  return {
    to: '#',
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Link clicked with invalid URL');
      }
    },
    style: { cursor: 'not-allowed', opacity: 0.5 } as React.CSSProperties,
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate route parameters
 * @returns true if all required params are present and valid
 * 
 * @example
 * const { id } = useParams();
 * if (!validateRouteParams({ id })) {
 *   return <NotFound />;
 * }
 */
export function validateRouteParams(params: Record<string, string | undefined>): boolean {
  for (const [key, value] of Object.entries(params)) {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ validateRouteParams: Invalid param '${key}'`, value);
      }
      return false;
    }
  }
  return true;
}

/**
 * Get validated route param or redirect to fallback
 * @returns Validated param value or null
 * 
 * @example
 * const id = getValidatedParam(params.id);
 * if (!id) {
 *   return <NotFound />;
 * }
 */
export function getValidatedParam(param: string | undefined): string | null {
  if (!param || typeof param !== 'string' || param.trim() === '') {
    return null;
  }
  return param;
}