/**
 * ==================================================================
 * SECTION REGISTRY - Single Source of Truth
 * ==================================================================
 * 
 * Zentrale Registry für alle Section Types:
 * - SECTION_TYPES: Für Admin UI Dropdown (mit allowedZones)
 * - SECTION_COMPONENTS: Für Public Rendering
 * 
 * WICHTIG: Keys müssen EXAKT mit DB section_type übereinstimmen!
 * 
 * ==================================================================
 */

import React from 'react';
import { CategoryGrid } from './CategoryGrid.section';
import { RecipientCategoryGrid } from './RecipientCategoryGrid.section';
import { TopicTagsGrid } from './TopicTagsGrid.section';
import { HeroSection } from './HeroSection.section';
import { CreatorCarouselSection } from './CreatorCarouselSection.section';
import { FeaturedSection } from './FeaturedSection.section';
import { GridSection } from './GridSection.section';
import { HorizontalRowSection } from './HorizontalRowSection.section';
import type { PageSection } from '../../types/page-resolve';
import { normalizeType } from '../../types/normalize';

// ============================================================================
// SECTION TYPE DEFINITIONS
// ============================================================================

export interface SectionTypeDefinition {
  value: string;
  label: string;
  allowedZones: ('aboveFold' | 'main')[];
  description?: string;
}

/**
 * ✅ SINGLE SOURCE OF TRUTH für alle Section Types
 * Diese Liste wird sowohl im Admin UI als auch für Rendering verwendet
 */
export const SECTION_TYPES: SectionTypeDefinition[] = [
  // Category & Grid Sections
  { 
    value: 'category_grid', 
    label: 'Category Grid', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Grid of categories with images'
  },
  { 
    value: 'recipient_category_grid', 
    label: 'Recipient Category Grid', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Grid of recipient categories (gifts for...)'
  },
  { 
    value: 'topic_tags_grid', 
    label: 'Topic Tags Grid', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Grid of topic tags'
  },
  
  // Hero & Feature Sections
  { 
    value: 'hero', 
    label: 'Hero Section', 
    allowedZones: ['aboveFold'],
    description: 'Large hero banner with image and CTA'
  },
  
  // Creator & Carousels
  { 
    value: 'creator_carousel', 
    label: 'Creator Carousel', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Carousel with creator header and books'
  },
  { 
    value: 'book_carousel', 
    label: 'Book Carousel', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Horizontal scrolling book carousel'
  },
  
  // Book Sections
  { 
    value: 'book_grid', 
    label: 'Book Grid', 
    allowedZones: ['main'],
    description: 'Grid layout of books'
  },
  { 
    value: 'book_list_row', 
    label: 'Book List Row', 
    allowedZones: ['main'],
    description: 'Horizontal row of books'
  },
  { 
    value: 'book_featured', 
    label: 'Book Featured', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Featured book with large display'
  },
  
  // Content Sections
  { 
    value: 'text_block', 
    label: 'Text Block', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Rich text content block'
  },
  { 
    value: 'image_gallery', 
    label: 'Image Gallery', 
    allowedZones: ['main'],
    description: 'Gallery of images'
  },
  { 
    value: 'video_gallery', 
    label: 'Video Gallery', 
    allowedZones: ['main'],
    description: 'Gallery of videos'
  },
  { 
    value: 'image', 
    label: 'Single Image', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Single image with optional caption'
  },
  { 
    value: 'video', 
    label: 'Single Video', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Single video embed'
  },
];

// ============================================================================
// SECTION COMPONENTS REGISTRY
// ============================================================================

export interface SectionComponentProps {
  section: PageSection;
  className?: string;
}

/**
 * ✅ Component Registry - Maps section.type to React Component
 * 
 * WICHTIG: Keys müssen EXAKT mit SECTION_TYPES.value UND DB.section_type übereinstimmen!
 */
export const SECTION_COMPONENTS: Record<string, React.FC<SectionComponentProps>> = {
  // Category & Grid Sections
  category_grid: CategoryGrid,
  recipient_category_grid: RecipientCategoryGrid,
  topic_tags_grid: TopicTagsGrid,
  
  // Hero & Feature Sections
  hero: HeroSection as any,
  
  // Creator & Carousels
  creator_carousel: CreatorCarouselSection as any,
  book_carousel: HorizontalRowSection as any,
  
  // Book Sections
  book_grid: GridSection as any,
  book_list_row: HorizontalRowSection as any,
  book_featured: FeaturedSection as any,
  
  // Content Sections (Fallbacks for now)
  text_block: ({ section }) => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="prose prose-lg" dangerouslySetInnerHTML={{ __html: section.config?.content || '' }} />
    </div>
  ),
  image_gallery: ({ section }) => (
    <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg mx-4">
      <p>Image Gallery Section</p>
      <p className="text-sm">Coming soon</p>
    </div>
  ),
  video_gallery: ({ section }) => (
    <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg mx-4">
      <p>Video Gallery Section</p>
      <p className="text-sm">Coming soon</p>
    </div>
  ),
  image: ({ section }) => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {section.config?.imageUrl && (
        <img 
          src={section.config.imageUrl} 
          alt={section.config?.caption || ''} 
          className="w-full h-auto rounded-lg"
        />
      )}
      {section.config?.caption && (
        <p className="text-center text-sm text-gray-600 mt-4">{section.config.caption}</p>
      )}
    </div>
  ),
  video: ({ section }) => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {section.config?.videoUrl && (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={section.config.videoUrl}
            className="w-full h-full"
            allowFullScreen
            title={section.config?.title || 'Video'}
          />
        </div>
      )}
    </div>
  ),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get section types filtered by zone
 */
export function getSectionTypesForZone(zone?: string): SectionTypeDefinition[] {
  if (!zone) return SECTION_TYPES;
  return SECTION_TYPES.filter(type => type.allowedZones.includes(zone as any));
}

/**
 * Get component for section type with fallback
 */
export function getSectionComponent(sectionType?: string): React.FC<SectionComponentProps> | null {
  const key = normalizeType(sectionType);
  return (key && SECTION_COMPONENTS[key]) || null;
}

/**
 * Check if section type exists
 */
export function isSectionTypeValid(sectionType: string): boolean {
  return sectionType in SECTION_COMPONENTS;
}

/**
 * Get section type definition
 */
export function getSectionTypeDefinition(sectionType: string): SectionTypeDefinition | undefined {
  return SECTION_TYPES.find(t => t.value === sectionType);
}