// ============================================================================
// Topic Tags Grid Section - Type Definitions
// Tag Cloud / Pills Layout
// ============================================================================

import { PageSection } from '../../../types/page-resolve';

/**
 * Props for TopicTagsGrid Section Component
 */
export interface TopicTagsGridProps {
  section: PageSection;
}

/**
 * Topic Tags Grid Section Configuration
 */
export interface TopicTagsGridConfig {
  title?: string;
  layout?: 'cloud' | 'grid'; // Tag cloud (flexbox) or grid layout
  tagSize?: 'sm' | 'md' | 'lg';
}
