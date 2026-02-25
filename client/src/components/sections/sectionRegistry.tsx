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
import { BookGridFilteredSection } from './BookGridFiltered.section';
import { UserCurationsSection } from './UserCurationsSection.section';
import { CategoryHeroSection } from './CategoryHeroSection.section';
import type { PageSection } from '../../types/page-resolve';
import { normalizeType } from '../../types/normalize';

// ============================================================================
// SECTION TYPE DEFINITIONS
// ============================================================================

export interface SectionTypeDefinition {
  value: string;
  label: string;
  allowedZones: string[];
  description?: string;
}

export const SECTION_TYPES: SectionTypeDefinition[] = [
  { 
    value: 'category_hero', 
    label: 'Kategorie-Hero', 
    allowedZones: ['above_fold', 'main'],
    description: 'Hero-Banner für Kategorie-Seiten mit Hintergrundbild, Titel und Filter-Tabs'
  },
  { 
    value: 'hero', 
    label: 'Hero-Banner (Startseite)', 
    allowedZones: ['above_fold', 'main'],
    description: 'Großes Hero-Banner mit Bild und Call-to-Action'
  },
  { 
    value: 'book_carousel', 
    label: 'Buch-Karussell', 
    allowedZones: ['above_fold', 'main'],
    description: 'Horizontales Karussell mit Büchern und Kurator:in'
  },
  { 
    value: 'book_grid_filtered', 
    label: 'Buch-Grid (gefiltert)', 
    allowedZones: ['above_fold', 'main'],
    description: 'Bücher-Raster mit Sortierung (z.B. Neueste, Hidden Gems)'
  },
  { 
    value: 'user_curations', 
    label: 'Kurationen', 
    allowedZones: ['above_fold', 'main'],
    description: 'Kuratierte Buchlisten aus der Community'
  },
  { 
    value: 'category_grid', 
    label: 'Kategorie-Kacheln', 
    allowedZones: ['above_fold', 'main'],
    description: 'Kachel-Raster mit Kategorien und Bildern'
  },
  { 
    value: 'recipient_category_grid', 
    label: 'Empfänger-Kacheln', 
    allowedZones: ['above_fold', 'main'],
    description: 'Kacheln für Geschenke-Empfänger (Geschenke für...)'
  },
  { 
    value: 'creator_carousel', 
    label: 'Kurator:innen-Karussell', 
    allowedZones: ['above_fold', 'main'],
    description: 'Karussell mit Kurator:innen-Profilen'
  },
  { 
    value: 'storefronts', 
    label: 'Buchläden', 
    allowedZones: ['above_fold', 'main'],
    description: 'Kuratierte Buchläden von Expert:innen'
  },
  { 
    value: 'events', 
    label: 'Veranstaltungen', 
    allowedZones: ['above_fold', 'main'],
    description: 'Literarische Veranstaltungen und Lesungen'
  },
  { 
    value: 'genre_categories', 
    label: 'Medien & Buch', 
    allowedZones: ['above_fold', 'main'],
    description: 'Podcasts und Media mit Buchempfehlungen'
  },
  { 
    value: 'supporters', 
    label: 'Unterstützer:innen', 
    allowedZones: ['above_fold', 'main'],
    description: 'Partner und Unterstützer der Plattform'
  },
];

/**
 * Section types that load data via queries/APIs and don't use manual items.
 * Used to hide the Items manager in the admin UI.
 */
export const QUERY_ONLY_SECTION_TYPES = [
  'book_grid_filtered',
  'user_curations',
  'storefronts',
  'events',
  'supporters',
  'genre_categories',
  'category_hero',
];

export function isQueryOnlySection(sectionType?: string): boolean {
  return QUERY_ONLY_SECTION_TYPES.includes(sectionType || '');
}

// ============================================================================
// SECTION COMPONENTS REGISTRY
// ============================================================================

export interface SectionComponentProps {
  section: PageSection;
  books?: any[];
  className?: string;
  categoryId?: number | null;
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
  book_grid_filtered: BookGridFilteredSection as any,
  user_curations: UserCurationsSection as any,
  category_hero: CategoryHeroSection as any,
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
