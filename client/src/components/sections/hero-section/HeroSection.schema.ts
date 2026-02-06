// ============================================================================
// Hero Section - Type Definitions
// ============================================================================

/**
 * Props for HeroSection Component
 */
export interface HeroSectionProps {
  onNavigateToCreatorDashboard?: () => void;
}

/**
 * Hero Section Configuration
 */
export interface HeroSectionConfig {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  heroImage?: string;
  showStats?: boolean;
}
