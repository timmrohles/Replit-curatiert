// ============================================================================
// Featured Section - Type Definitions
// ============================================================================

import type { Section, Book } from './SectionRenderer';

export interface FeaturedSectionProps {
  section: Section;
  books: Book[];
  className?: string;
}
