// ============================================================================
// Book Carousel Section - Type Definitions
// ============================================================================

import { Book } from '../../../types/homepage';

/**
 * Props for BookCarousel Section Component
 */
export interface BookCarouselProps {
  books: Book[];
}

/**
 * Book Carousel Section Configuration
 */
export interface BookCarouselConfig {
  title?: string;
  subtitle?: string;
  maxBooks?: number;
  showPrices?: boolean;
}
