/**
 * Serie Badge Utility
 * 
 * Zeigt Serie-Badges prominent auf Buch-Covers an
 * Unterstützt ONIX Tag System
 */

import { ONIXTag } from './api';

export interface SerieBadge {
  serieName: string;
  serieNumber?: number;
  color: string;
}

/**
 * Extract series badge from ONIX tags
 */
export function getSeriesBadge(onixTags: ONIXTag[] | undefined): SerieBadge | null {
  if (!onixTags || onixTags.length === 0) return null;

  // Find Serie tag
  const serieTag = onixTags.find(tag => tag.type === 'Serie' && tag.visible);
  
  if (!serieTag) return null;

  // Try to find Band (Volume) number
  const bandTag = onixTags.find(tag => tag.type === 'Band' && tag.visible);
  const bandNumber = bandTag ? parseInt((bandTag as any).displayName.replace(/\D/g, ''), 10) : undefined;

  return {
    serieName: serieTag.displayName,
    serieNumber: bandNumber,
    color: serieTag.color || '#70c1b3' // Default to teal
  };
}

/**
 * Format series badge text
 */
export function formatSeriesBadgeText(badge: SerieBadge): string {
  if (badge.serieNumber) {
    return `${badge.serieName} #${badge.serieNumber}`;
  }
  return badge.serieName;
}

/**
 * Get badge display style (for different UI contexts)
 */
export interface BadgeStyle {
  fontSize: string;
  padding: string;
  maxWidth: string;
}

export function getBadgeStyle(context: 'cover' | 'detail' | 'list'): BadgeStyle {
  switch (context) {
    case 'cover':
      return {
        fontSize: '0.75rem',
        padding: '0.25rem 0.625rem',
        maxWidth: '150px'
      };
    case 'detail':
      return {
        fontSize: '0.875rem',
        padding: '0.375rem 0.75rem',
        maxWidth: '200px'
      };
    case 'list':
      return {
        fontSize: '0.6875rem',
        padding: '0.1875rem 0.5rem',
        maxWidth: '120px'
      };
    default:
      return {
        fontSize: '0.75rem',
        padding: '0.25rem 0.625rem',
        maxWidth: '150px'
      };
  }
}
