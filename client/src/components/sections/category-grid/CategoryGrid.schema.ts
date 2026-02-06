// ============================================================================
// Category Grid Section - Type Definitions
// ============================================================================

import { PageSection } from '../../../types/page-resolve';

/**
 * Props for CategoryGrid Section Component
 */
export interface CategoryGridProps {
  section: PageSection;
}

/**
 * Category Grid Section Configuration
 */
export interface CategoryGridConfig {
  title?: string;
  columns?: number; // Desktop columns (2-6)
  gridGap?: string; // e.g., "4" for gap-4
}
