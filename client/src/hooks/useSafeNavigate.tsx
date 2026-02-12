import { useNavigate } from 'react-router-dom';
import { useLocale } from '../utils/LocaleContext';

const isDev = typeof import.meta !== 'undefined' && 
              import.meta.env && 
              import.meta.env.DEV;

const ADMIN_PREFIX = '/sys-mgmt-xK9';

function isAdminPath(path: string): boolean {
  return path.startsWith(ADMIN_PREFIX);
}

interface NavigationOptions {
  fallback?: string;
  silent?: boolean;
  skipLocale?: boolean;
}

export function useSafeNavigate() {
  const navigate = useNavigate();
  const { localePath } = useLocale();

  const prefixPath = (path: string, skipLocale?: boolean): string => {
    if (skipLocale || isAdminPath(path)) return path;
    return localePath(path);
  };

  const toBook = (bookId: string | undefined | null, options?: NavigationOptions) => {
    if (!bookId || bookId.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation to book - invalid ID:', bookId);
      }
      if (options?.fallback) navigate(prefixPath(options.fallback, options?.skipLocale));
      return false;
    }
    navigate(prefixPath(`/buch/${bookId}`, options?.skipLocale));
    return true;
  };

  const toCreator = (creatorSlug: string | undefined | null, options?: NavigationOptions) => {
    if (!creatorSlug || creatorSlug.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation to creator - invalid slug:', creatorSlug);
      }
      if (options?.fallback) navigate(prefixPath(options.fallback, options?.skipLocale));
      return false;
    }
    navigate(prefixPath(`/c/${creatorSlug}`, options?.skipLocale));
    return true;
  };

  const toTag = (tagSlug: string | undefined | null, options?: NavigationOptions) => {
    if (!tagSlug || tagSlug.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation to tag - invalid slug:', tagSlug);
      }
      if (options?.fallback) navigate(prefixPath(options.fallback, options?.skipLocale));
      return false;
    }
    navigate(prefixPath(`/t/${tagSlug}`, options?.skipLocale));
    return true;
  };

  const toCategory = (categorySlug: string | undefined | null, options?: NavigationOptions) => {
    if (!categorySlug || categorySlug.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation to category - invalid slug:', categorySlug);
      }
      if (options?.fallback) navigate(prefixPath(options.fallback, options?.skipLocale));
      return false;
    }
    navigate(prefixPath(`/kategorie/${categorySlug}`, options?.skipLocale));
    return true;
  };

  const toPath = (path: string | undefined | null, options?: NavigationOptions) => {
    if (!path || path.trim() === '') {
      if (isDev && !options?.silent) {
        console.warn('[SafeNavigate] Blocked navigation - invalid path:', path);
      }
      if (options?.fallback) navigate(prefixPath(options.fallback, options?.skipLocale));
      return false;
    }
    navigate(prefixPath(path, options?.skipLocale));
    return true;
  };

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
    raw: navigate
  };
}
