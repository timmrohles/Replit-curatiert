// ============================================================================
// Horizontal Row Section - Type Definitions
// ============================================================================

import type { Section, Book } from './SectionRenderer';

export interface HorizontalRowSectionProps {
  section: Section;
  books: Book[];
  className?: string;
}
