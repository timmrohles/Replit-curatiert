// ============================================================================
// Grid Section - Type Definitions
// ============================================================================

import type { Section, Book } from './SectionRenderer';

export interface GridSectionProps {
  section: Section;
  books: Book[];
  className?: string;
}
