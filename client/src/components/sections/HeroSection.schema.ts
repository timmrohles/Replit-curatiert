export interface HeroSectionProps {
  section?: {
    config?: {
      title?: string;
      description?: string;
      subtitle?: string;
      ctaText?: string;
      ctaLink?: string;
    };
  };
  onNavigateToCreatorDashboard?: () => void;
}
