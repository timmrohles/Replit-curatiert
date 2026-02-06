/**
 * ONIX 3.0 Image Metadata Utilities
 * Helper functions for working with ONIX ResourceFeature image metadata
 */

export interface ONIXImageMetadata {
  alt?: string; // ResourceFeature 07 (Resource description)
  caption?: string; // ResourceFeature 08 (Caption)
  credit?: string; // ResourceFeature 06 (Credit line)
}

/**
 * Generate a fallback alt text for book covers
 * Following WCAG 2.1 Level AA guidelines
 */
export function generateBookCoverAlt(title: string, author: string, customAlt?: string): string {
  if (customAlt) return customAlt;
  return `Buchcover: ${title} von ${author}`;
}

/**
 * Generate a fallback caption for book covers
 */
export function generateBookCoverCaption(
  publisher?: string, 
  year?: string, 
  edition?: string,
  customCaption?: string
): string {
  if (customCaption) return customCaption;
  
  const parts: string[] = ['Buchcover'];
  
  if (edition) parts.push(edition);
  if (publisher) parts.push(publisher);
  if (year) parts.push(year);
  
  return parts.join(', ');
}

/**
 * Format credit line for book cover images
 */
export function formatCreditLine(
  year?: string,
  rightsHolder?: string,
  designer?: string,
  customCredit?: string
): string {
  if (customCredit) return customCredit;
  
  const parts: string[] = [];
  
  if (year) parts.push(`© ${year}`);
  if (rightsHolder) parts.push(rightsHolder);
  if (designer) parts.push(`Covergestaltung: ${designer}`);
  
  return parts.join(', ');
}

/**
 * Get complete ONIX image metadata for a book
 */
export function getBookImageMetadata(
  book: {
    title: string;
    author: string;
    coverImageAlt?: string;
    coverImageCaption?: string;
    coverImageCredit?: string;
    publisher?: string;
    year?: string;
  }
): ONIXImageMetadata {
  return {
    alt: generateBookCoverAlt(book.title, book.author, book.coverImageAlt),
    caption: book.coverImageCaption || generateBookCoverCaption(book.publisher, book.year),
    credit: book.coverImageCredit
  };
}
