/**
 * API HELPERS
 * =============
 * Pure helper functions for API-related logic
 */

import type { Book } from '../apiSchemas';

// ============================================
// BOOK WORLD CLASSIFICATION
// ============================================

/**
 * Determine book world from Warengruppe code
 * @param warengruppe - German book classification code
 * @returns Book world category
 */
export function getBookWorld(warengruppe?: string): 'belletristik' | 'kinderbuch' | 'sachbuch' | 'fachbuch' | 'nonbook' | 'fremdsprache' | 'unknown' {
  if (!warengruppe) return 'unknown';
  
  const code = parseInt(warengruppe);
  
  // Belletristik: 1000-1999
  if (code >= 1000 && code < 2000) return 'belletristik';
  
  // Kinderbuch & Jugendbuch: 2000-2999
  if (code >= 2000 && code < 3000) return 'kinderbuch';
  
  // Sachbuch: 3000-8999
  if (code >= 3000 && code < 9000) return 'sachbuch';
  
  // Fachbuch: 9000-9999
  if (code >= 9000 && code < 10000) return 'fachbuch';
  
  // Nonbook: 9900+
  if (code >= 9900) return 'nonbook';
  
  // Fremdsprachige Bücher haben oft spezielle Codes
  if (code >= 1900 && code < 2000) return 'fremdsprache';
  
  return 'unknown';
}
