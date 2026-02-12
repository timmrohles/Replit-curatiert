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
import { HeroSection } from './HeroSection.section';
import { CreatorCarouselSection } from './CreatorCarouselSection.section';
import { SupportersSection } from './SupportersSection.section';
import { GenreCategoriesSection } from '../tags/GenreCategoriesSection';
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
 * SINGLE SOURCE OF TRUTH für alle Section Types
 * Diese Liste wird sowohl im Admin UI als auch für Rendering verwendet
 *
 * Above the Fold: hero, category_grid
 * Main Content: book_carousel, recipient_category_grid, storefronts, events, genre_categories, supporters
 */
export const SECTION_TYPES: SectionTypeDefinition[] = [
  { 
    value: 'hero', 
    label: 'Hero-Banner', 
    allowedZones: ['aboveFold'],
    description: 'Hero-Banner mit Bild und Call-to-Action'
  },
  { 
    value: 'category_grid', 
    label: 'Kategorie-Raster', 
    allowedZones: ['aboveFold', 'main'],
    description: 'Raster mit Kategorien und Bildern'
  },
  { 
    value: 'book_carousel', 
    label: 'Buch-Karussell', 
    allowedZones: ['main'],
    description: 'Karussell mit Kurator:in und Büchern'
  },
  { 
    value: 'recipient_category_grid', 
    label: 'Empfänger-Raster', 
    allowedZones: ['main'],
    description: 'Raster mit Empfänger-Kategorien (Geschenke für...)'
  },
  { 
    value: 'storefronts', 
    label: 'Bookstores', 
    allowedZones: ['main'],
    description: 'Kuratierte Buchläden von Expert:innen'
  },
  { 
    value: 'events', 
    label: 'Events', 
    allowedZones: ['main'],
    description: 'Literarische Veranstaltungen und Lesungen'
  },
  { 
    value: 'genre_categories', 
    label: 'Medien & Buch', 
    allowedZones: ['main'],
    description: 'Podcasts und Media-Einbettungen mit Buchempfehlungen'
  },
  { 
    value: 'supporters', 
    label: 'Unterstützer:innen', 
    allowedZones: ['main'],
    description: 'Partner und Unterstützer der Plattform'
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
 * Component Registry - Maps section.type to React Component
 * 
 * WICHTIG: Keys müssen EXAKT mit SECTION_TYPES.value UND DB.section_type übereinstimmen!
 */
export const SECTION_COMPONENTS: Record<string, React.FC<SectionComponentProps>> = {
  hero: HeroSection as any,
  category_grid: CategoryGrid,
  book_carousel: CreatorCarouselSection as any,
  recipient_category_grid: RecipientCategoryGrid,
  storefronts: ({ section }) => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2
        className="mb-6 text-center leading-tight text-[1.75rem] md:text-[2rem]"
        style={{ fontFamily: 'Fjalla One', color: '#2a2a2a' }}
      >
        {section.config?.title || 'Bookstores'}
      </h2>
      <p className="text-center text-sm" style={{ color: '#555' }}>
        Bookstores werden geladen…
      </p>
    </div>
  ),
  events: ({ section }) => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2
        className="mb-6 text-center leading-tight text-[1.75rem] md:text-[2rem]"
        style={{ fontFamily: 'Fjalla One', color: '#2a2a2a' }}
      >
        {section.config?.title || 'Events'}
      </h2>
      <p className="text-center text-sm" style={{ color: '#555' }}>
        Events werden geladen…
      </p>
    </div>
  ),
  genre_categories: GenreCategoriesSection as any,
  supporters: SupportersSection as any,
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
