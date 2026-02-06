/**
 * Book Metadata Generator
 * Generates realistic sorting metadata for books based on title patterns
 */

export interface BookSortingMetadata {
  popularity: number; // 0-100: Saves, interactions, platform engagement
  awards: number; // Number of awards/nominations
  criticsScore: number; // 0-100: Press quotes and media resonance
  hiddenGemScore: number; // 0-100: Quality score vs visibility
  releaseDate: string; // ISO date string for trending/relevance
}

/**
 * Generates consistent, deterministic metadata based on book title
 * This ensures the same book always gets the same scores
 */
export function generateBookMetadata(title: string, year?: string): BookSortingMetadata {
  // Use title as seed for consistent generation
  const seed = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Deterministic pseudo-random number generator
  const seededRandom = (min: number, max: number, offset: number = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    return Math.floor(((x - Math.floor(x)) * (max - min + 1)) + min);
  };
  
  // Generate metadata
  const popularity = seededRandom(20, 95, 1);
  const awards = seededRandom(0, 8, 2);
  const criticsScore = seededRandom(30, 98, 3);
  const hiddenGemScore = seededRandom(25, 90, 4);
  
  // Generate release date (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearNum = year ? parseInt(year) : seededRandom(currentYear - 5, currentYear, 5);
  const month = seededRandom(1, 12, 6);
  const day = seededRandom(1, 28, 7);
  const releaseDate = `${yearNum}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return {
    popularity,
    awards,
    criticsScore,
    hiddenGemScore,
    releaseDate
  };
}

/**
 * Example fictional book data with metadata
 * This demonstrates how books should be structured with sorting criteria
 */
export const exampleBooksWithMetadata = [
  {
    id: '1',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300',
    title: 'Das Kapital im 21. Jahrhundert',
    author: 'Thomas Piketty',
    publisher: 'C.H. Beck',
    year: '2023',
    price: '29,95 €',
    category: 'Wirtschaft & Politik',
    tags: ['Ökonomie', 'Gesellschaftskritik'],
    // Fictional metadata for sorting
    popularity: 92, // Very popular - many saves and shares
    awards: 5, // Won 5 awards
    criticsScore: 95, // Highly praised by critics
    hiddenGemScore: 35, // Well-known, not a hidden gem
    releaseDate: '2023-09-15'
  },
  {
    id: '2',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
    title: 'Kleine Geschichte des Neoliberalismus',
    author: 'David Harvey',
    publisher: 'Rotbuch Verlag',
    year: '2022',
    price: '18,00 €',
    category: 'Wirtschaft & Politik',
    tags: ['Neoliberalismus', 'Kritik'],
    // Fictional metadata for sorting
    popularity: 78, // Popular in academic circles
    awards: 2, // 2 awards
    criticsScore: 88, // Strong critical reception
    hiddenGemScore: 72, // Known but underrated in mainstream
    releaseDate: '2022-03-20'
  },
  {
    id: '3',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
    title: 'Die Schlafwandler',
    author: 'Christopher Clark',
    publisher: 'DVA',
    year: '2024',
    price: '39,00 €',
    category: 'Geschichte',
    tags: ['Erster Weltkrieg', 'Deutscher Buchpreis'],
    // Fictional metadata for sorting
    popularity: 65, // Moderate popularity
    awards: 8, // Many awards including Deutscher Buchpreis
    criticsScore: 97, // Universally acclaimed
    hiddenGemScore: 45, // Well-established, not hidden
    releaseDate: '2024-01-10'
  },
  {
    id: '4',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300',
    title: 'Bewohner der Erde',
    author: 'Anke Stelling',
    publisher: 'Verbrecher Verlag',
    year: '2024',
    price: '24,00 €',
    category: 'Belletristik',
    tags: ['Roman', 'Gegenwartsliteratur'],
    // Fictional metadata for sorting
    popularity: 42, // Lower mainstream popularity
    awards: 1, // 1 award
    criticsScore: 91, // Highly praised by literary critics
    hiddenGemScore: 88, // TRUE HIDDEN GEM - high quality, low visibility
    releaseDate: '2024-08-22'
  },
  {
    id: '5',
    cover: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300',
    title: 'Klimawandel kompakt',
    author: 'Stefan Rahmstorf',
    publisher: 'Springer',
    year: '2024',
    price: '16,99 €',
    category: 'Wissenschaft',
    tags: ['Klimakrise', 'Sachbuch'],
    // Fictional metadata for sorting
    popularity: 87, // Very trendy topic
    awards: 0, // No awards yet
    criticsScore: 75, // Good reception but not literary
    hiddenGemScore: 58, // Somewhat niche
    releaseDate: '2024-11-05' // Recent release = trending
  },
  {
    id: '6',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300',
    title: 'Unsichtbare Frauen',
    author: 'Caroline Criado-Perez',
    publisher: 'btb Verlag',
    year: '2023',
    price: '24,00 €',
    category: 'Gesellschaft',
    tags: ['Feminismus', 'Datenanalyse'],
    // Fictional metadata for sorting
    popularity: 94, // BESTSELLER - highest popularity
    awards: 6, // Multiple awards
    criticsScore: 93, // Strong critical acclaim
    hiddenGemScore: 30, // Well-known mainstream hit
    releaseDate: '2023-06-12'
  },
  {
    id: '7',
    cover: 'https://images.unsplash.com/photo-1550399504-8953e1a1e3e4?w=300',
    title: 'Verlorene Seelen',
    author: 'Maria Schneider',
    publisher: 'Kiepenheuer & Witsch',
    year: '2021',
    price: '22,00 €',
    category: 'Belletristik',
    tags: ['Roman', 'Psychologie'],
    // Fictional metadata for sorting
    popularity: 38, // Lower visibility
    awards: 0, // No awards
    criticsScore: 82, // Good critical reception despite low sales
    hiddenGemScore: 92, // ULTIMATE HIDDEN GEM - excellent but obscure
    releaseDate: '2021-04-18'
  },
  {
    id: '8',
    cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300',
    title: 'Postkoloniale Theorie',
    author: 'Edward Said',
    publisher: 'Suhrkamp',
    year: '2020',
    price: '28,00 €',
    category: 'Theorie',
    tags: ['Postkolonialismus', 'Kulturkritik'],
    // Fictional metadata for sorting
    popularity: 55, // Academic circles
    awards: 3, // Historical significance
    criticsScore: 99, // CRITICS' FAVORITE - highest score
    hiddenGemScore: 65, // Important but niche
    releaseDate: '2020-02-28'
  }
];

/**
 * Helper function to enrich existing book data with metadata
 */
export function enrichBookWithMetadata<T extends { title: string; year?: string }>(
  book: T
): T & BookSortingMetadata {
  const metadata = generateBookMetadata(book.title, book.year);
  return {
    ...book,
    ...metadata
  };
}

/**
 * Helper function to enrich an array of books
 */
export function enrichBooksWithMetadata<T extends { title: string; year?: string }>(
  books: T[]
): Array<T & BookSortingMetadata> {
  return books.map(enrichBookWithMetadata);
}
