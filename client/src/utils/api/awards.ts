/**
 * ==================================================================
 * AWARDS API CLIENT - Frontend Integration
 * ==================================================================
 * 
 * Public read-only API für Awards-Daten
 * Verwendung in BookCard, BookCarouselItem, Filters
 * 
 * ==================================================================
 */

const BASE_URL = '/api';

const headers = {
  'Content-Type': 'application/json'
};

// ==================================================================
// TYPES
// ==================================================================

export type AwardType = 'Gewinner' | 'Shortlist' | 'Longlist' | 'Nominierung' | 'Sonderpreis';

export interface Award {
  id: number | string;
  name: string;
  slug: string;
  issuer_name?: string;
  website_url?: string;
  logo_url?: string;
  logoUrl?: string;
  description?: string;
  type?: AwardType;
  visible?: boolean;
  order?: number;
  tag_id?: number;
  onixTagIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AwardEdition {
  id: number;
  award_id: number;
  year: number;
  label?: string;
  status: 'active' | 'archived' | 'draft';
}

export interface AwardOutcome {
  id: number;
  award_edition_id: number;
  outcome_type: 'winner' | 'shortlist' | 'longlist' | 'nominee' | 'finalist' | 'special';
  title?: string;
  sort_order: number;
}

export interface BookAward {
  award_id: number;
  award_name: string;
  award_logo_url?: string;
  edition_year: number;
  edition_label?: string;
  outcome_type: 'winner' | 'shortlist' | 'longlist' | 'nominee' | 'finalist' | 'special';
  outcome_title?: string;
  role?: string;
  notes?: string;
}

// ==================================================================
// API FUNCTIONS
// ==================================================================

/**
 * Get all awards for a specific book
 */
export async function getBookAwards(bookId: number | string): Promise<BookAward[]> {
  try {
    const response = await fetch(`${BASE_URL}/awards/books/${bookId}`, {
          credentials: 'include',
      headers
    });

    const data = await response.json();

    if (!data.ok) {
      // Silently fail if tables don't exist yet (migration pending)
      if (data.error?.code === 'INTERNAL_ERROR' && data.error?.details?.includes('does not exist')) {
        console.warn('⚠️  Awards tables not ready yet. Auto-migration pending.');
        return [];
      }
      console.error('Failed to fetch book awards:', data.error);
      return [];
    }

    return data.data.awards || [];
  } catch (error) {
    console.error('Error fetching book awards:', error);
    return [];
  }
}

/**
 * Get all awards (for filter chips)
 */
export async function getAllAwards(): Promise<Award[]> {
  try {
    const response = await fetch(`${BASE_URL}/awards?limit=100`, {
          credentials: 'include',
      headers
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Failed to fetch awards:', data.error);
      return [];
    }

    return data.data.awards || [];
  } catch (error) {
    console.error('Error fetching awards:', error);
    return [];
  }
}

/**
 * Get books with awards (for filter)
 * Uses the v_books_award_stats view
 */
export async function getBooksWithAwards(
  awardType?: 'winner' | 'shortlist' | 'longlist' | 'any'
): Promise<number[]> {
  try {
    // This would need a dedicated endpoint in the backend
    // For now, we'll fetch all books and filter client-side
    // TODO: Create optimized backend endpoint
    console.warn('getBooksWithAwards: Client-side filtering not optimal. Add backend endpoint.');
    return [];
  } catch (error) {
    console.error('Error fetching books with awards:', error);
    return [];
  }
}

// ==================================================================
// UTILITY FUNCTIONS
// ==================================================================

/**
 * Format award for display in AwardBadge component
 */
export function formatAwardForBadge(bookAward: BookAward): {
  status: 'winner' | 'shortlist' | 'longlist';
  name: string;
  year: string;
} {
  return {
    status: bookAward.outcome_type === 'winner' 
      ? 'winner' 
      : bookAward.outcome_type === 'shortlist' 
        ? 'shortlist' 
        : 'longlist',
    name: bookAward.award_name,
    year: bookAward.edition_year.toString()
  };
}

/**
 * Get prominent awards for badge display (max 3)
 * Priority: Winner > Shortlist > Longlist
 */
export function getProminentAwards(awards: BookAward[]): BookAward[] {
  if (!awards || awards.length === 0) return [];

  // Sort by priority
  const sorted = [...awards].sort((a, b) => {
    const priorityMap = {
      'winner': 1,
      'shortlist': 2,
      'longlist': 3,
      'finalist': 4,
      'nominee': 5,
      'special': 6
    };

    const priorityA = priorityMap[a.outcome_type] || 99;
    const priorityB = priorityMap[b.outcome_type] || 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // If same priority, sort by year (newest first)
    return b.edition_year - a.edition_year;
  });

  // Return top 3
  return sorted.slice(0, 3);
}

/**
 * Check if book has any award
 */
export function hasAnyAward(awards: BookAward[]): boolean {
  return awards && awards.length > 0;
}

/**
 * Check if book won an award
 */
export function hasWonAward(awards: BookAward[]): boolean {
  return awards?.some(award => award.outcome_type === 'winner') || false;
}

/**
 * Get award count by type
 */
export function getAwardCountByType(awards: BookAward[], type: 'winner' | 'shortlist' | 'longlist'): number {
  return awards?.filter(award => award.outcome_type === type).length || 0;
}

/**
 * Get all unique award years
 */
export function getAwardYears(awards: BookAward[]): number[] {
  if (!awards || awards.length === 0) return [];
  
  const years = awards.map(award => award.edition_year);
  return Array.from(new Set(years)).sort((a, b) => b - a);
}

/**
 * Get award summary text (for SEO/meta)
 */
export function getAwardSummaryText(awards: BookAward[]): string {
  if (!awards || awards.length === 0) return '';

  const winnerCount = getAwardCountByType(awards, 'winner');
  const shortlistCount = getAwardCountByType(awards, 'shortlist');
  const longlistCount = getAwardCountByType(awards, 'longlist');

  const parts: string[] = [];

  if (winnerCount > 0) {
    parts.push(`${winnerCount} ${winnerCount === 1 ? 'Auszeichnung' : 'Auszeichnungen'} gewonnen`);
  }

  if (shortlistCount > 0) {
    parts.push(`${shortlistCount}x Shortlist`);
  }

  if (longlistCount > 0) {
    parts.push(`${longlistCount}x Longlist`);
  }

  return parts.join(', ');
}

// ==================================================================
// CACHING (Optional, for performance)
// ==================================================================

const awardsCache = new Map<string, { data: BookAward[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get book awards with caching
 */
export async function getBookAwardsCached(bookId: number | string): Promise<BookAward[]> {
  const cacheKey = `book_${bookId}`;
  const cached = awardsCache.get(cacheKey);

  // Return cached data if valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Fetch fresh data
  const awards = await getBookAwards(bookId);

  // Cache it
  awardsCache.set(cacheKey, {
    data: awards,
    timestamp: Date.now()
  });

  return awards;
}

/**
 * Clear awards cache (call after admin updates)
 */
export function clearAwardsCache(): void {
  awardsCache.clear();
}

function getAdminHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export async function saveAward(award: Partial<Award>): Promise<Award | null> {
  try {
    const response = await fetch(`${BASE_URL}/awards`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
      body: JSON.stringify(award),
    });
    const data = await response.json();
    if (!data.success) return null;
    clearAwardsCache();
    return data.data || null;
  } catch (error) {
    console.error('Error saving award:', error);
    return null;
  }
}

export async function deleteAward(id: string | number): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/awards/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAdminHeaders(),
    });
    const data = await response.json();
    if (data.success) clearAwardsCache();
    return data.success || false;
  } catch (error) {
    console.error('Error deleting award:', error);
    return false;
  }
}

export async function toggleAwardVisibility(id: string | number, visible: boolean): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/awards/${id}/visibility`, {
          method: 'PATCH',
          credentials: 'include',
          headers: getAdminHeaders(),
      body: JSON.stringify({ visible }),
    });
    const data = await response.json();
    if (data.success) clearAwardsCache();
    return data.success || false;
  } catch (error) {
    console.error('Error toggling award visibility:', error);
    return false;
  }
}

export async function uploadAwardLogo(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('logo', file);

    const token = localStorage.getItem('admin_token') || localStorage.getItem('admin_neon_token') || '';
    const response = await fetch(`${BASE_URL}/admin/awards/upload-logo`, {
      method: 'POST',
      credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      body: formData,
    });
    const data = await response.json();
    if (!data.ok) return null;
    return data.data?.url || null;
  } catch (error) {
    console.error('Error uploading award logo:', error);
    return null;
  }
}
