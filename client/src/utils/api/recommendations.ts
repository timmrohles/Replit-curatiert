/**
 * RECOMMENDATIONS API
 * ====================
 * Intelligent book recommendation system (ONIX 3.0)
 * Waterfall algorithm with fallback strategies per book category
 * 
 * ARCHITECTURE:
 * - getRecommendedBooks: Main entry point that routes to category-specific algorithms
 * - Category handlers: Belletristik, Kinderbuch, Sachbuch, Fachbuch, Foreign Language
 * - Generic fallback for unknown categories
 * - Helper functions for scoring and similarity calculation
 */

import type { Book } from '../apiSchemas';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determines book "world" based on Warengruppe (WGS)
 * Used for routing recommendations to appropriate algorithm
 */
export function getBookWorld(warengruppe?: string): 'belletristik' | 'kinderbuch' | 'sachbuch' | 'fachbuch' | 'nonbook' | 'fremdsprache' | 'unknown' {
  if (!warengruppe) return 'unknown';
  
  const wgs = parseInt(warengruppe);
  
  // Belletristik: 1xx
  if (wgs >= 100 && wgs < 200) return 'belletristik';
  
  // Kinderbuch: 2xx
  if (wgs >= 200 && wgs < 300) return 'kinderbuch';
  
  // Sachbuch: 4xx, 7xx, 8xx
  if ((wgs >= 400 && wgs < 500) || (wgs >= 700 && wgs < 800) || (wgs >= 800 && wgs < 900)) return 'sachbuch';
  
  // Fachbuch: 5xx, 6xx, 9xx
  if ((wgs >= 500 && wgs < 600) || (wgs >= 600 && wgs < 700) || (wgs >= 900 && wgs < 1000)) return 'fachbuch';
  
  // Non-Book: 5xx (overlaps with Fachbuch, but productForm can differentiate)
  // We'll check productForm separately in the algorithm
  
  return 'unknown';
}

/**
 * Calculate similarity score between two arrays (tags, themes, etc.)
 */
function calculateArraySimilarity(arr1: string[] = [], arr2: string[] = []): number {
  if (arr1.length === 0 && arr2.length === 0) return 0;
  if (arr1.length === 0 || arr2.length === 0) return 0;
  
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  
  let matches = 0;
  set1.forEach(item => {
    if (set2.has(item)) matches++;
  });
  
  // Jaccard similarity
  const union = new Set([...set1, ...set2]);
  return matches / union.size;
}

/**
 * Calculate age range overlap for children's books
 */
function calculateAgeOverlap(book1: Book, book2: Book): number {
  if (!book1.ageRangeFrom || !book1.ageRangeTo || !book2.ageRangeFrom || !book2.ageRangeTo) {
    return 0;
  }
  
  const start = Math.max(book1.ageRangeFrom, book2.ageRangeFrom);
  const end = Math.min(book1.ageRangeTo, book2.ageRangeTo);
  
  if (start > end) return 0; // No overlap
  
  const overlap = end - start;
  const totalRange = Math.max(book1.ageRangeTo - book1.ageRangeFrom, book2.ageRangeTo - book2.ageRangeFrom);
  
  return overlap / totalRange;
}

// ============================================
// MAIN RECOMMENDATION FUNCTION
// ============================================

/**
 * Waterfall-Algorithmus: Intelligente Buchempfehlungen basierend auf ONIX 3.0
 * Returns up to maxResults similar books with fallback strategy
 */
export async function getRecommendedBooks(
  currentBook: Book,
  allBooks: Book[],
  maxResults: number = 4
): Promise<Book[]> {
  
  console.log(`🎯 Recommendation System: Finding similar books to "${currentBook.title}"`);
  
  // Exclude current book and unavailable books
  const candidateBooks = allBooks.filter(b => 
    b.id !== currentBook.id && 
    b.availability !== 'unavailable'
  );
  
  if (candidateBooks.length === 0) {
    console.log('⚠️ No candidate books available');
    return [];
  }
  
  // Determine book world
  const world = getBookWorld(currentBook.warengruppe);
  console.log(`📚 Book World: ${world} (WGS: ${currentBook.warengruppe || 'N/A'})`);
  
  // Special case: Foreign language books
  if (currentBook.languageCode && currentBook.languageCode !== 'ger') {
    return getRecommendationsForForeignLanguage(currentBook, candidateBooks, maxResults);
  }
  
  // Route to appropriate algorithm based on world
  switch (world) {
    case 'belletristik':
      return getRecommendationsForBelletristik(currentBook, candidateBooks, maxResults);
    
    case 'kinderbuch':
      return getRecommendationsForKinderbuch(currentBook, candidateBooks, maxResults);
    
    case 'sachbuch':
      return getRecommendationsForSachbuch(currentBook, candidateBooks, maxResults);
    
    case 'fachbuch':
      return getRecommendationsForFachbuch(currentBook, candidateBooks, maxResults);
    
    default:
      return getGenericRecommendations(currentBook, candidateBooks, maxResults);
  }
}

// ============================================
// CATEGORY-SPECIFIC ALGORITHMS
// ============================================

/**
 * BELLETRISTIK: Genre + Schauplatz + Lesemotiv
 */
function getRecommendationsForBelletristik(currentBook: Book, candidates: Book[], maxResults: number): Book[] {
  console.log('📖 Using Belletristik algorithm');
  
  // Versuch 1: Volles Matching (Genre + Ort + Motiv)
  let results = candidates.map(book => ({
    book,
    score: 
      calculateArraySimilarity(currentBook.themaCodes, book.themaCodes) * 3 +
      calculateArraySimilarity(currentBook.geographicFocus, book.geographicFocus) * 2 +
      calculateArraySimilarity(currentBook.lesemotive, book.lesemotive) * 2 +
      calculateArraySimilarity(currentBook.zeitperiode, book.zeitperiode) * 1
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length >= maxResults) {
    console.log(`✅ Attempt 1 (Full Match): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Versuch 2: Reduziertes Matching (Genre + Ort)
  results = candidates.map(book => ({
    book,
    score: 
      calculateArraySimilarity(currentBook.themaCodes, book.themaCodes) * 3 +
      calculateArraySimilarity(currentBook.geographicFocus, book.geographicFocus) * 2
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length >= maxResults) {
    console.log(`✅ Attempt 2 (Reduced Match): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Versuch 3: Minimales Matching (nur Genre)
  results = candidates.map(book => ({
    book,
    score: calculateArraySimilarity(currentBook.themaCodes, book.themaCodes)
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length > 0) {
    console.log(`✅ Attempt 3 (Minimal Match): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Versuch 4: Hard Fallback (Same Warengruppe or recent books)
  console.log('⚠️ Using hard fallback');
  return candidates
    .filter(b => b.warengruppe && b.warengruppe.startsWith('1')) // Any Belletristik
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxResults);
}

/**
 * KINDERBUCH: Altersstufe + Genre
 */
function getRecommendationsForKinderbuch(currentBook: Book, candidates: Book[], maxResults: number): Book[] {
  console.log('👶 Using Kinderbuch algorithm');
  
  // Versuch 1: Exakte Altersstufe + Genre
  let results = candidates.map(book => ({
    book,
    score: 
      calculateAgeOverlap(currentBook, book) * 5 +
      calculateArraySimilarity(currentBook.themaCodes, book.themaCodes) * 3
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length >= maxResults) {
    console.log(`✅ Attempt 1 (Age + Genre): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Versuch 2: Nur Altersstufe
  results = candidates.map(book => ({
    book,
    score: calculateAgeOverlap(currentBook, book)
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length >= maxResults) {
    console.log(`✅ Attempt 2 (Age Only): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Versuch 3: Nur Genre
  results = candidates.map(book => ({
    book,
    score: calculateArraySimilarity(currentBook.themaCodes, book.themaCodes)
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length > 0) {
    console.log(`✅ Attempt 3 (Genre Only): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Hard Fallback: Any children's books
  console.log('⚠️ Using hard fallback');
  return candidates
    .filter(b => b.warengruppe && b.warengruppe.startsWith('2'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxResults);
}

/**
 * SACHBUCH: Thema-Code + Aktualität
 */
function getRecommendationsForSachbuch(currentBook: Book, candidates: Book[], maxResults: number): Book[] {
  console.log('📚 Using Sachbuch algorithm');
  
  const currentYear = new Date().getFullYear();
  const bookYear = parseInt(currentBook.year || '0');
  
  // Versuch 1: Thema + Aktualität (Books from last 3 years get bonus)
  let results = candidates.map(book => {
    const candidateYear = parseInt(book.year || '0');
    const recencyBonus = (candidateYear >= currentYear - 3) ? 1 : 0;
    
    return {
      book,
      score: 
        calculateArraySimilarity(currentBook.themaCodes, book.themaCodes) * 4 +
        calculateArraySimilarity(currentBook.keywords, book.keywords) * 2 +
        recencyBonus
    };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length >= maxResults) {
    console.log(`✅ Attempt 1 (Theme + Recency): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Versuch 2: Nur Thema
  results = candidates.map(book => ({
    book,
    score: calculateArraySimilarity(currentBook.themaCodes, book.themaCodes)
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length > 0) {
    console.log(`✅ Attempt 2 (Theme Only): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Hard Fallback: Recent books in Sachbuch
  console.log('⚠️ Using hard fallback');
  return candidates
    .filter(b => {
      if (!b.warengruppe) return false;
      const wgs = parseInt(b.warengruppe);
      return (wgs >= 400 && wgs < 500) || (wgs >= 700 && wgs < 900);
    })
    .sort((a, b) => {
      const yearA = parseInt(a.year || '0');
      const yearB = parseInt(b.year || '0');
      return yearB - yearA;
    })
    .slice(0, maxResults);
}

/**
 * FACHBUCH: Thema-Code + Expertise-Level
 */
function getRecommendationsForFachbuch(currentBook: Book, candidates: Book[], maxResults: number): Book[] {
  console.log('🎓 Using Fachbuch algorithm');
  
  // Versuch 1: Thema + Expertise Level
  let results = candidates.map(book => {
    const expertiseMatch = (currentBook.expertiseLevel === book.expertiseLevel) ? 2 : 0;
    
    return {
      book,
      score: 
        calculateArraySimilarity(currentBook.themaCodes, book.themaCodes) * 4 +
        calculateArraySimilarity(currentBook.keywords, book.keywords) * 2 +
        expertiseMatch
    };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length >= maxResults) {
    console.log(`✅ Attempt 1 (Theme + Expertise): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Versuch 2: Nur Thema
  results = candidates.map(book => ({
    book,
    score: calculateArraySimilarity(currentBook.themaCodes, book.themaCodes)
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length > 0) {
    console.log(`✅ Attempt 2 (Theme Only): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Hard Fallback: Same expertise level or recent books
  console.log('⚠️ Using hard fallback');
  return candidates
    .filter(b => {
      if (!b.warengruppe) return false;
      const wgs = parseInt(b.warengruppe);
      return (wgs >= 500 && wgs < 700) || (wgs >= 900 && wgs < 1000);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxResults);
}

/**
 * FREMDSPRACHE: Gleiche Sprache + Sprachniveau
 */
function getRecommendationsForForeignLanguage(currentBook: Book, candidates: Book[], maxResults: number): Book[] {
  console.log('🌍 Using Foreign Language algorithm');
  
  // Versuch 1: Same language + Same level
  let results = candidates.map(book => {
    const langMatch = (currentBook.languageCode === book.languageCode) ? 5 : 0;
    const levelMatch = (currentBook.languageLevel === book.languageLevel) ? 3 : 0;
    
    return {
      book,
      score: langMatch + levelMatch + calculateArraySimilarity(currentBook.themaCodes, book.themaCodes)
    };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length >= maxResults) {
    console.log(`✅ Attempt 1 (Language + Level): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Versuch 2: Same language only
  results = candidates.map(book => {
    const langMatch = (currentBook.languageCode === book.languageCode) ? 5 : 0;
    return { book, score: langMatch };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length > 0) {
    console.log(`✅ Attempt 2 (Language Only): Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Hard Fallback: Any foreign language books
  console.log('⚠️ Using hard fallback');
  return candidates
    .filter(b => b.languageCode && b.languageCode !== 'ger')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxResults);
}

/**
 * GENERIC: Fallback for unknown categories
 */
function getGenericRecommendations(currentBook: Book, candidates: Book[], maxResults: number): Book[] {
  console.log('🔧 Using Generic algorithm');
  
  // Try theme codes + tags
  let results = candidates.map(book => ({
    book,
    score: 
      calculateArraySimilarity(currentBook.themaCodes, book.themaCodes) * 3 +
      calculateArraySimilarity(currentBook.tags, book.tags) * 2 +
      calculateArraySimilarity(currentBook.keywords, book.keywords) * 1
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults);
  
  if (results.length >= maxResults) {
    console.log(`✅ Generic Match: Found ${results.length} books`);
    return results.map(r => r.book);
  }
  
  // Hard Fallback: Same author or curator
  console.log('⚠️ Using hard fallback (same author/curator)');
  const sameAuthor = candidates.filter(b => 
    b.author.toLowerCase() === currentBook.author.toLowerCase()
  ).slice(0, 2);
  
  const sameCurator = candidates.filter(b => 
    b.curatorId === currentBook.curatorId && 
    b.author.toLowerCase() !== currentBook.author.toLowerCase()
  ).slice(0, maxResults - sameAuthor.length);
  
  const fallbackResults = [...sameAuthor, ...sameCurator];
  
  // If still not enough, add recent books
  if (fallbackResults.length < maxResults) {
    const remaining = candidates
      .filter(b => !fallbackResults.some(fb => fb.id === b.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, maxResults - fallbackResults.length);
    
    fallbackResults.push(...remaining);
  }
  
  return fallbackResults.slice(0, maxResults);
}
