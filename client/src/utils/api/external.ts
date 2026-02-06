/**
 * EXTERNAL APIs
 * ===============
 * Integration with external services (Google Books, etc.)
 */

// ============================================
// TYPES
// ============================================

export interface GoogleBooksRating {
  averageRating: number;
  ratingsCount: number;
}

// ============================================
// GOOGLE BOOKS API
// ============================================

/**
 * Fetch book ratings from Google Books API
 * @param isbn - ISBN-13 or ISBN-10 of the book
 * @returns GoogleBooksRating or null if not found
 */
export async function getGoogleBooksRating(isbn: string): Promise<GoogleBooksRating | null> {
  try {
    // Remove hyphens from ISBN
    const cleanIsbn = isbn.replace(/-/g, '');
    
    // Google Books API endpoint (no API key needed for basic queries, but rate limited)
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
    
    // ✅ ADD TIMEOUT: Prevent browser hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log(`📚 Google Books: No data found for ISBN ${isbn}`);
      return null;
    }
    
    const volumeInfo = data.items[0].volumeInfo;
    
    if (!volumeInfo.averageRating || !volumeInfo.ratingsCount) {
      console.log(`📚 Google Books: No ratings available for ISBN ${isbn}`);
      return null;
    }
    
    console.log(`✅ Google Books: Found ${volumeInfo.ratingsCount} ratings (avg: ${volumeInfo.averageRating}) for ISBN ${isbn}`);
    
    return {
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⏱️ Google Books: Request timeout after 5s');
    } else {
      console.error('Error fetching Google Books rating:', error);
    }
    return null;
  }
}
