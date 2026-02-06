/**
 * ==================================================================
 * SECTION RENDERER - Central Component für alle Section Types
 * ==================================================================
 * 
 * Unified Section Rendering nach Migration 007
 * - Hero Sections
 * - Creator Carousels
 * - Horizontal Rows
 * - Grid Layouts
 * - Featured Sections
 * 
 * Usage:
 *   <SectionRenderer section={section} books={books} />
 * ==================================================================
 */

import React from 'react';
import { HeroSection } from './HeroSection';
import { CreatorCarouselSection } from './CreatorCarouselSection';
import { HorizontalRowSection } from './HorizontalRowSection';
import { GridSection } from './GridSection';
import { FeaturedSection } from './FeaturedSection';

export interface Book {
  id: string;
  isbn13?: string;
  title: string;
  authors?: string[];
  author?: string;
  coverUrl?: string;
  cover?: string;
  publisher?: string;
  publishedYear?: number;
  year?: string | number;
  price?: number;
  description?: string;
  categories?: string[];
  tags?: string[];
}

export interface Section {
  id: string;
  title: string;
  type: 'hero' | 'creator-carousel' | 'horizontal-row' | 'grid' | 'featured';
  content?: {
    description?: string;
    image_url?: string;
    cta_text?: string;
    cta_link?: string;
    bookIds?: string[];
  };
  curatorId?: string | null;
  curatorType?: 'redaktion' | 'community' | 'extern';
  curatorReason?: string;
  category?: string;
  tags?: string[];
  status?: 'active' | 'scheduled' | 'archived' | 'draft';
  displayOrder?: number;
}

interface SectionRendererProps {
  section: Section;
  books?: Book[];
  className?: string;
}

export function SectionRenderer({ section, books = [], className = '' }: SectionRendererProps) {
  // Filter books for this section (if bookIds specified in content)
  const sectionBooks = section.content?.bookIds 
    ? books.filter(book => section.content?.bookIds?.includes(book.id))
    : [];

  // Render based on section type
  switch (section.type) {
    case 'hero':
      return (
        <HeroSection
          section={section}
          className={className}
        />
      );

    case 'creator-carousel':
      return (
        <CreatorCarouselSection
          section={section}
          books={sectionBooks}
          className={className}
        />
      );

    case 'horizontal-row':
      return (
        <HorizontalRowSection
          section={section}
          books={sectionBooks}
          className={className}
        />
      );

    case 'grid':
      return (
        <GridSection
          section={section}
          books={sectionBooks}
          className={className}
        />
      );

    case 'featured':
      return (
        <FeaturedSection
          section={section}
          books={sectionBooks}
          className={className}
        />
      );

    default:
      console.warn(`Unknown section type: ${section.type}`);
      return null;
  }
}
