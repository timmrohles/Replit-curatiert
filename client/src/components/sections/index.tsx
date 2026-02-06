/**
 * ==================================================================
 * SECTIONS - Central Export
 * ==================================================================
 * 
 * Zentrale Export-Datei für alle Section-bezogenen Exports
 * 
 * ==================================================================
 */

// Registry & Types
export * from './sectionRegistry';

// Renderers
export { UniversalSectionRenderer, BulkSectionRenderer } from './UniversalSectionRenderer';

// Individual Section Components (if needed for direct import)
export { CategoryGrid } from './CategoryGrid.section';
export { RecipientCategoryGrid } from './RecipientCategoryGrid.section';
export { TopicTagsGrid } from './TopicTagsGrid.section';
export { HeroSection } from './HeroSection.section';
export { RefactoredHeroSection } from './RefactoredHeroSection.section';
export { CreatorCarouselSection } from './CreatorCarouselSection.section';
export { FeaturedSection } from './FeaturedSection.section';
export { GridSection } from './GridSection.section';
export { HorizontalRowSection } from './HorizontalRowSection.section';
export { ScrollSection } from './ScrollSection.section';
export { SupportersSection } from './SupportersSection.section';
export { BookCarousel } from './BookCarousel.section';

// Export Types/Schemas
export type * from './CategoryGrid.schema';
export type * from './RecipientCategoryGrid.schema';
export type * from './TopicTagsGrid.schema';
export type * from './HeroSection.schema';
export type * from './RefactoredHeroSection.schema';
export type * from './CreatorCarouselSection.schema';
export type * from './FeaturedSection.schema';
export type * from './GridSection.schema';
export type * from './HorizontalRowSection.schema';
export type * from './ScrollSection.schema';
export type * from './SupportersSection.schema';
export type * from './BookCarousel.schema';