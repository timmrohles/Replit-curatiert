// ============================================================================
// Refactored Hero Section - Type Definitions
// ============================================================================

import type { Creator } from '../../types/homepage';

export interface RefactoredHeroSectionProps {
  creators: Creator[];
  availableTags: string[];
  onNavigateToStorefront?: (storefrontId: string) => void;
}
