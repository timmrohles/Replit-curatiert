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
  { 
    value: 'hero', 
    label: 'Hero-Banner', 
    allowedZones: ['aboveFold'],
    description: 'Großes Banner mit Bild und Call-to-Action'
  },
  { 
    value: 'category_grid', 
    label: 'Kategorie-Raster', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Raster mit Kategorien und Bildern'
  },
  { 
    value: 'recipient_category_grid', 
    label: 'Empfänger-Raster', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Raster mit Empfänger-Kategorien (Geschenke für...)'
  },
  { 
    value: 'topic_tags_grid', 
    label: 'Themen-Raster', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Raster mit Themen-Tags'
  },
  { 
    value: 'creator_carousel', 
    label: 'Kurator:innen-Karussell', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Karussell mit Kurator:in und Büchern'
  },
  { 
    value: 'book_carousel', 
    label: 'Buch-Karussell', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Horizontal scrollendes Bücher-Karussell'
  },
  { 
    value: 'book_grid', 
    label: 'Bücher-Raster', 
    allowedZones: ['main'],
    description: 'Bücher als Raster-Layout'
  },
  { 
    value: 'book_list_row', 
    label: 'Bücher-Zeile', 
    allowedZones: ['main'],
    description: 'Horizontale Zeile mit Büchern'
  },
  { 
    value: 'book_featured', 
    label: 'Buch-Highlight', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Hervorgehobenes Buch in großer Darstellung'
  },
  { 
    value: 'text_block', 
    label: 'Textblock', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Textinhalt mit Formatierung'
  },
  { 
    value: 'image_gallery', 
    label: 'Bildergalerie', 
    allowedZones: ['main'],
    description: 'Galerie mit mehreren Bildern'
  },
  { 
    value: 'video_gallery', 
    label: 'Videogalerie', 
    allowedZones: ['main'],
    description: 'Galerie mit mehreren Videos'
  },
  { 
    value: 'image', 
    label: 'Einzelbild', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Einzelnes Bild mit optionaler Beschriftung'
  },
  { 
    value: 'video', 
    label: 'Einzelvideo', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Einzelnes eingebettetes Video'
  },
];

// ============================================================================
// SECTION COMPONENTS REGISTRY
// ============================================================================

export interface SectionComponentProps {
  section: PageSection;
  books?: any[];
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
  book_carousel: CreatorCarouselSection as any,
  
  // Book Sections
  book_grid: GridSection as any,
  book_list_row: CreatorCarouselSection as any,
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