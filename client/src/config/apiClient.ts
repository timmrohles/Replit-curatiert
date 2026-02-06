/**
 * API CLIENT - CANONICAL CONTRACT
 * 
 * Single Source of Truth for all Backend-Calls.
 * Now points to local Express backend instead of Supabase Edge Functions.
 */

function getApiBaseUrl(): string {
  return '/api';
}

export const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
}

export function getPublicHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export function getAdminHeaders(token?: string): HeadersInit {
  const adminToken = token || (typeof window !== 'undefined' 
    ? (localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || localStorage.getItem('neon_admin_token'))
    : null);
  
  return {
    'Content-Type': 'application/json',
    'X-Admin-Token': adminToken || '',
  };
}

export const API_ENDPOINTS = {
  health: '/health',
  auth: {
    login: '/admin/auth/login',
    verify: '/admin/auth/verify',
    logout: '/admin/logout',
    changePassword: '/admin/change-password',
    status: '/admin/auth/status',
    setup: '/admin/auth/setup',
  },
  navigation: {
    public: '/navigation',
    metadata: '/navigation/metadata',
    items: '/v2/navigation/items',
    columns: '/navigation/columns',
    publish: '/navigation/admin/publish',
  },
  pages: {
    list: '/pages',
    byId: (id: string | number) => `/pages/${id}`,
    bySlug: (slug: string) => `/pages/slug/${slug}`,
    resolve: '/pages/resolve',
  },
  sections: {
    list: '/sections',
    byId: (id: string | number) => `/sections/${id}`,
    byPage: (pageId: string | number) => `/sections/page/${pageId}`,
    move: (id: string | number) => `/sections/${id}/move`,
  },
  books: {
    list: '/books',
    byId: (id: string | number) => `/books/${id}`,
    byIsbn: (isbn: string) => `/books/isbn/${isbn}`,
    batch: '/books/batch',
    stats: '/books/stats',
    uploadCover: '/books/upload-cover',
  },
  categories: {
    list: '/categories',
    byId: (id: string | number) => `/categories/${id}`,
    bySlug: (slug: string) => `/categories/slug/${slug}`,
  },
  tags: {
    list: '/tags',
    byId: (id: string | number) => `/tags/${id}`,
    bySlug: (slug: string) => `/tags/slug/${slug}`,
    onix: '/onix-tags',
  },
  persons: {
    list: '/persons',
    byId: (id: string | number) => `/persons/${id}`,
  },
  publishers: {
    list: '/publishers',
    byId: (id: string | number) => `/publishers/${id}`,
  },
  curators: {
    list: '/curators',
    byId: (id: string | number) => `/curators/${id}`,
    bySlug: (slug: string) => `/curators/slug/${slug}`,
    uploadAvatar: '/curators/upload-avatar',
  },
  curations: {
    list: '/curations',
    byId: (id: string | number) => `/curations/${id}`,
    byCurator: (curatorId: string | number) => `/curations/curator/${curatorId}`,
  },
  awards: {
    list: '/awards',
    byId: (id: string | number) => `/awards/${id}`,
    bySlug: (slug: string) => `/awards/slug/${slug}`,
    uploadLogo: '/awards/upload-logo',
  },
  posts: {
    list: '/posts',
    byId: (id: string | number) => `/posts/${id}`,
    bySlug: (slug: string) => `/posts/slug/${slug}`,
  },
  affiliates: {
    list: '/affiliates',
    byId: (id: string | number) => `/affiliates/${id}`,
    bySlug: (slug: string) => `/affiliates/slug/${slug}`,
  },
  categoryCards: {
    list: '/category-cards',
    byId: (id: string | number) => `/category-cards/${id}`,
  },
  user: {
    follows: '/me/follows',
    bookFollows: '/me/follows/books',
    personFollows: '/me/follows/persons',
    publisherFollows: '/me/follows/publishers',
  },
  reviews: {
    list: '/reviews',
    byBook: (bookId: string | number) => `/reviews/book/${bookId}`,
    byCurator: (curatorId: string | number) => `/reviews/curator/${curatorId}`,
  },
  ratings: {
    byBook: (bookId: string | number) => `/ratings/${bookId}`,
    byUser: (bookId: string | number, userId: string) => `/ratings/${bookId}/user/${userId}`,
    create: '/ratings',
  },
} as const;

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  isAdmin?: boolean;
  token?: string;
  customHeaders?: HeadersInit;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    isAdmin = false,
    token,
    customHeaders = {},
  } = options;

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...(isAdmin ? getAdminHeaders(token) : getPublicHeaders()),
      ...customHeaders,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const textResponse = await response.text();
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!isJson && textResponse) {
      return {
        success: false,
        error: `Non-JSON response from server (${response.status}): ${textResponse.substring(0, 100)}`,
      };
    }

    const data: ApiResponse<T> = textResponse ? JSON.parse(textResponse) : {};

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        meta: data.meta,
      };
    }

    return {
      success: data.success !== false,
      data: data.data,
      error: data.error,
      message: data.message,
      meta: data.meta,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function apiGet<T = any>(endpoint: string, isAdmin = false): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'GET', isAdmin });
}

export async function apiPost<T = any>(endpoint: string, body: any, isAdmin = false): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'POST', body, isAdmin });
}

export async function apiPut<T = any>(endpoint: string, body: any, isAdmin = false): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'PUT', body, isAdmin });
}

export async function apiDelete<T = any>(endpoint: string, isAdmin = false): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'DELETE', isAdmin });
}

export async function apiPatch<T = any>(endpoint: string, body: any, isAdmin = false): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'PATCH', body, isAdmin });
}

export function createApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

export async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}
