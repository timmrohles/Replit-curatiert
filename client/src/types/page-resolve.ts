// ============================================================================
// Page Resolve Types - Datenvertrag für datengetriebene Pages
// ============================================================================

/**
 * Item Target - wohin eine Section Item verlinkt
 */
export type ItemTarget =
  | { type: "category"; category: { id: number; slug: string; name: string } }
  | { type: "tag"; tag: { id: number; slug: string; name: string; tagType?: string } }
  | { type: "page"; page: { id: number; slug: string } }
  | { type: "template"; templateKey: string; params?: Record<string, any> };

/**
 * Section Item - einzelnes Element innerhalb einer Section
 */
export interface SectionItem {
  id: number;
  sortOrder: number;
  itemType: string;
  data: Record<string, any>;
  target: ItemTarget;
}

/**
 * Page Section - eine Section auf einer Page
 */
export interface PageSection {
  id: number;
  zone: "header" | "above_fold" | "main" | "footer";
  sortOrder: number;
  type: string; // Alias for section_type (for backward compatibility)
  section_type: string; // Database column name
  status?: 'draft' | 'published';
  visibility?: 'visible' | 'hidden';
  config: Record<string, any>;
  items: SectionItem[];
}

/**
 * Page Metadata
 */
export interface PageMeta {
  lastModified?: string;
  version?: number;
  [key: string]: any;
}

/**
 * Page SEO
 */
export interface PageSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  [key: string]: any;
}

/**
 * Page Object
 */
export interface Page {
  id: number;
  slug: string;
  title: string;
  seo: PageSEO;
  status: "draft" | "published" | "archived";
  [key: string]: any;
}

/**
 * Layout Zones
 */
export interface LayoutZones {
  header: PageSection[];
  aboveFold: PageSection[];
  main: PageSection[];
  footer: PageSection[];
}

/**
 * Layout Object
 */
export interface Layout {
  id: number;
  name: string;
  zones: LayoutZones;
  [key: string]: any;
}

/**
 * Breadcrumb
 */
export interface Breadcrumb {
  label: string;
  path: string;
}

/**
 * Page Resolve Response - Success
 */
export interface PageResolveSuccess {
  ok: true;
  path: string;
  page: Page;
  layout: Layout;
  breadcrumbs: Breadcrumb[];
  meta?: PageMeta;
}

/**
 * Page Resolve Response - Error
 */
export interface PageResolveError {
  ok: false;
  path: string;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Page Resolve Response - Union Type
 */
export type PageResolveResponse = PageResolveSuccess | PageResolveError;
