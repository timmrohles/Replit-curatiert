/**
 * Book URL Helper
 * Generiert konsistente URLs für Bücher basierend auf Slugs oder IDs
 */

import { Book } from './api';
import { generateBookSlug } from './slugGenerator';

/**
 * Generiert die URL für ein Buch
 * Priorität: id (für jetzt, bis Slugs in Datenbank vorhanden)
 * 
 * @param book - Book-Objekt
 * @returns URL-Pfad (z.B. "/book/bewegung-alltag-1")
 */
export function getBookUrl(book: Book | { id: string; title?: string; slug?: string }): string {
  // TEMPORARY: Verwende ID-basierte Route bis Slugs in DB vorhanden
  // TODO: Später auf Slug-basierte Route umstellen wenn DB migriert wurde
  return `/book/${book.id}`;
  
  /* FUTURE VERSION (wenn Slugs in DB vorhanden):
  // Priorität 1: Slug vorhanden → /buecher/:slug
  if (book.slug) {
    return `/buecher/${book.slug}`;
  }
  
  // Priorität 2: Titel vorhanden → Slug generieren → /buecher/:slug
  if ('title' in book && book.title) {
    const generatedSlug = generateBookSlug(book.title);
    return `/buecher/${generatedSlug}`;
  }
  
  // Fallback: ID verwenden → /book/:id (alte Route)
  return `/book/${book.id}`;
  */
}

/**
 * Extrahiert die Book-ID aus verschiedenen URL-Formaten
 * Unterstützt: /book/:id und /buecher/:slug
 * 
 * @param pathname - URL Pathname
 * @returns Book-ID oder Slug
 */
export function extractBookIdFromUrl(pathname: string): string | null {
  // Format: /book/:id
  const bookMatch = pathname.match(/^\/book\/([^\/]+)/);
  if (bookMatch) {
    return bookMatch[1];
  }
  
  // Format: /buecher/:slug
  const buecherMatch = pathname.match(/^\/buecher\/([^\/]+)/);
  if (buecherMatch) {
    return buecherMatch[1];
  }
  
  return null;
}