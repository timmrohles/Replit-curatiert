// ============================================================================
// Scroll Section - Type Definitions
// ============================================================================

import { ReactNode } from 'react';

export interface ScrollSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  carouselRef: React.RefObject<HTMLDivElement>;
  scrollAmount: number;
  className?: string;
  fadeColor?: string;
}
