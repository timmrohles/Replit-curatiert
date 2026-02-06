// ============================================================================
// Supporters Section - Type Definitions
// ============================================================================

export interface Supporter {
  name: string;
  logo: string;
  quote: string;
}

export interface SupportersSectionProps {
  supporters?: Supporter[];
}
