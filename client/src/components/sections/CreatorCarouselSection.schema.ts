// ============================================================================
// Creator Carousel Section - Type Definitions
// ============================================================================

import type { Section, Book } from './SectionRenderer';

export interface CreatorCarouselSectionProps {
  section: Section;
  books: Book[];
  className?: string;
}
