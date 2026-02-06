// ============================================================================
// Recipient Category Grid Section - Type Definitions
// ============================================================================

import { PageSection } from '../../../types/page-resolve';

/**
 * Props for RecipientCategoryGrid Section Component
 */
export interface RecipientCategoryGridProps {
  section: PageSection;
}

/**
 * Recipient Category Grid Section Configuration
 */
export interface RecipientCategoryGridConfig {
  title?: string;
  columns?: number;
  gridGap?: string;
}
