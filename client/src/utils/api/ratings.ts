/**
 * RATINGS API
 * =============
 * Book rating system with scales and matching algorithms
 * 
 * ARCHITECTURE:
 * - 6 Book Worlds: Belletristik, Sachbuch, Fachbuch, Kinderbuch, Fremdsprachig, Spiele
 * - Each world has 4 custom rating scales (3 standard + 1 pro)
 * - User ratings are aggregated to create book profiles
 * - Matching algorithm compares user profile with book profile
 * 
 * RATING SCALES:
 * - Belletristik: Erzähltempo, Stimmung, Sprachstil, Fokus
 * - Sachbuch: Zielrichtung, Tiefe, Tonfall, Transfer
 * - Fachbuch: Niveau, Ausrichtung, Struktur, Aktualität
 * - Kinderbuch: Textanteil, Dramatik, Komplexität, Vorlese-Charakter
 * - Fremdsprachig: Vokabular, Satzbau, Kontextabhängigkeit, Kulturfokus
 * - Spiele: Interaktion, Zufallseinfluss, Komplexität, Spielcharakter
 */

import type { Book } from '../apiSchemas';
import { API_BASE_URL, safeJsonParse, type ApiResponse } from './config';

// ============================================
// TYPES
// ============================================

/**
 * Die 6 Buchwelten für das Rating-System
 */
export type BookWorldForRating = 
  | 'belletristik' 
  | 'sachbuch' 
  | 'fachbuch' 
  | 'kinderbuch' 
  | 'fremdsprachig' 
  | 'spiele';

/**
 * Eine Skala (Slider) für das Bewertungssystem
 */
export interface RatingScale {
  id: string;
  label: string;
  labelLeft: string;  // z.B. "Ruhig"
  labelRight: string; // z.B. "Packend"
  description?: string; // Optional: Tooltip-Text
  isPro?: boolean; // Markiert die "Profi-Skala"
}

/**
 * Mapping: Buchwelt → 4 Skalen (3 Standard + 1 Profi)
 */
export const BOOK_WORLD_SCALES: Record<BookWorldForRating, RatingScale[]> = {
  belletristik: [
    {
      id: 'erzähltempo',
      label: 'Erzähltempo',
      labelLeft: 'Ruhig / kontemplativ',
      labelRight: 'Dynamisch / vorantreibend',
      description: 'Wie schnell entwickelt sich die Handlung?'
    },
    {
      id: 'stimmung',
      label: 'Stimmung',
      labelLeft: 'Düster / melancholisch',
      labelRight: 'Hoffnungsvoll / heiter',
      description: 'Welche emotionale Grundstimmung hat das Buch?'
    },
    {
      id: 'sprachstil',
      label: 'Sprachstil',
      labelLeft: 'Zugänglich / klar',
      labelRight: 'Literarisch / anspruchsvoll',
      description: 'Wie komplex ist die Sprache?'
    },
    {
      id: 'fokus',
      label: 'Fokus',
      labelLeft: 'Handlung / Plot',
      labelRight: 'Sprache / Stil',
      description: 'Was steht im Vordergrund? Plot-getriebene Genre-Romane vs. sprachlich ambitionierte Literatur',
      isPro: true
    }
  ],
  
  sachbuch: [
    {
      id: 'zielrichtung',
      label: 'Zielrichtung',
      labelLeft: 'Inspirierend / Denkanstoß',
      labelRight: 'Lösungsorientiert / anleitend',
      description: 'Welches Ziel verfolgt das Buch?'
    },
    {
      id: 'tiefe',
      label: 'Tiefe',
      labelLeft: 'Überblick / Einordnung',
      labelRight: 'Tiefgehende Analyse',
      description: 'Wie detailliert wird das Thema behandelt?'
    },
    {
      id: 'tonfall',
      label: 'Tonfall',
      labelLeft: 'Erzählerisch / essayistisch',
      labelRight: 'Sachlich / nüchtern',
      description: 'Wie ist der Schreibstil?'
    },
    {
      id: 'transfer',
      label: 'Transfer',
      labelLeft: 'Verstehen & Einordnen',
      labelRight: 'Anwenden & Umsetzen',
      description: 'Fokussiert das Buch auf Erkenntnis oder konkrete Anwendung?',
      isPro: true
    }
  ],
  
  fachbuch: [
    {
      id: 'niveau',
      label: 'Niveau',
      labelLeft: 'Grundlagenorientiert',
      labelRight: 'Expertenniveau',
      description: 'Für welches Wissens-Level ist das Buch gedacht?'
    },
    {
      id: 'ausrichtung',
      label: 'Ausrichtung',
      labelLeft: 'Theoretisch / akademisch',
      labelRight: 'Praxisnah / handlungsorientiert',
      description: 'Fokus auf Theorie oder praktische Anwendung?'
    },
    {
      id: 'struktur',
      label: 'Struktur',
      labelLeft: 'Lesebuch',
      labelRight: 'Nachschlagewerk',
      description: 'Wie ist das Buch aufgebaut?'
    },
    {
      id: 'aktualität',
      label: 'Aktualität',
      labelLeft: 'Zeitloses Grundlagenwissen',
      labelRight: 'Hochaktuelles Spezialwissen',
      description: 'Klassiker oder brandneue Fachpublikation?',
      isPro: true
    }
  ],
  
  kinderbuch: [
    {
      id: 'textanteil',
      label: 'Textanteil',
      labelLeft: 'Stark visuell',
      labelRight: 'Stark textbasiert',
      description: 'Verhältnis von Bild zu Text'
    },
    {
      id: 'dramatik',
      label: 'Dramatik',
      labelLeft: 'Sanft / beruhigend',
      labelRight: 'Spannend / aufregend',
      description: 'Wie aufregend ist die Geschichte?'
    },
    {
      id: 'komplexität',
      label: 'Narrative Komplexität',
      labelLeft: 'Einfach / linear',
      labelRight: 'Vielschichtig / mehrdimensional',
      description: 'Wie anspruchsvoll ist die Erzählstruktur?'
    },
    {
      id: 'vorleseCharakter',
      label: 'Vorlese-Charakter',
      labelLeft: 'Aktivierend / interaktiv',
      labelRight: 'Ruhig / ritualtauglich',
      description: 'Eignet sich das Buch zum abendlichen Vorlesen oder zum gemeinsamen Spielen?',
      isPro: true
    }
  ],
  
  fremdsprachig: [
    {
      id: 'vokabular',
      label: 'Vokabular',
      labelLeft: 'Alltagssprachlich',
      labelRight: 'Gehobene Lexik',
      description: 'Art des verwendeten Wortschatzes'
    },
    {
      id: 'satzbau',
      label: 'Satzbau',
      labelLeft: 'Kurz / klar',
      labelRight: 'Komplex / verschachtelt',
      description: 'Wie komplex sind die Satzstrukturen?'
    },
    {
      id: 'kontextabhängigkeit',
      label: 'Kontextabhängigkeit',
      labelLeft: 'International verständlich',
      labelRight: 'Stark kulturgebunden',
      description: 'Wie viel Kulturwissen wird vorausgesetzt?'
    },
    {
      id: 'kulturfokus',
      label: 'Kulturfokus',
      labelLeft: 'Globaler Mainstream',
      labelRight: 'Regionales Original',
      description: 'Universelle Themen oder kulturspezifische Eigenheiten?',
      isPro: true
    }
  ],
  
  spiele: [
    {
      id: 'interaktion',
      label: 'Interaktion',
      labelLeft: 'Parallel / individuell',
      labelRight: 'Stark interaktiv',
      description: 'Wie viel Interaktion gibt es zwischen Spielern?'
    },
    {
      id: 'zufallseinfluss',
      label: 'Zufallseinfluss',
      labelLeft: 'Strategie / Können',
      labelRight: 'Glück / Zufall',
      description: 'Entscheidet Strategie oder Glück über den Ausgang?'
    },
    {
      id: 'komplexität',
      label: 'Komplexität',
      labelLeft: 'Schnell erlernbar',
      labelRight: 'Regelintensiv',
      description: 'Wie umfangreich sind die Regeln?'
    },
    {
      id: 'spielcharakter',
      label: 'Spielcharakter',
      labelLeft: 'Wettbewerb / Konfrontation',
      labelRight: 'Kooperation / Gemeinsamkeit',
      description: 'Spielen Spieler gegeneinander oder miteinander?',
      isPro: true
    }
  ]
};

/**
 * Ermittelt die Buchwelt basierend auf Warengruppe (WGS) und Tags
 * Diese Funktion wird auf der BookDetailPage aufgerufen um zu entscheiden,
 * welche 4 Skalen dem Nutzer angezeigt werden.
 */
export function getBookWorldForRating(book: Book): BookWorldForRating {
  // 1. Prüfe productForm für Spiele/Non-Book
  if (book.productForm === 'ZE' || book.productForm === 'ZA') {
    return 'spiele';
  }
  
  // 2. Prüfe Warengruppe (WGS)
  if (book.warengruppe) {
    const wgs = parseInt(book.warengruppe);
    
    // Kinderbuch: 1xxx, 2xxx, 3xxx
    if (wgs >= 1000 && wgs < 4000) {
      return 'kinderbuch';
    }
    
    // Belletristik: 1xxx (hardcoded fiction codes)
    if ((wgs >= 100 && wgs < 200) || (wgs >= 1100 && wgs < 1200)) {
      return 'belletristik';
    }
    
    // Sachbuch: 4xx, 7xx, 8xx
    if ((wgs >= 400 && wgs < 500) || (wgs >= 700 && wgs < 900)) {
      return 'sachbuch';
    }
    
    // Fachbuch: 5xx, 6xx, 9xx
    if ((wgs >= 500 && wgs < 700) || (wgs >= 900 && wgs < 1000)) {
      return 'fachbuch';
    }
  }
  
  // 3. Fallback: Prüfe Tags
  const bookTags = [
    ...(book.tags || []),
    ...(book.themaCodes || []),
    ...(book.keywords || [])
  ].map(t => t.toLowerCase());
  
  if (bookTags.some(t => t.includes('kinder') || t.includes('jugend'))) {
    return 'kinderbuch';
  }
  
  if (bookTags.some(t => 
    t.includes('roman') || 
    t.includes('fantasy') || 
    t.includes('krimi') || 
    t.includes('thriller')
  )) {
    return 'belletristik';
  }
  
  if (bookTags.some(t => 
    t.includes('ratgeber') || 
    t.includes('biografie') ||
    t.includes('politik')
  )) {
    return 'sachbuch';
  }
  
  if (bookTags.some(t => 
    t.includes('lehrbuch') || 
    t.includes('forschung') ||
    t.includes('wissenschaft')
  )) {
    return 'fachbuch';
  }
  
  // 4. Prüfe Sprachlevel für Fremdsprachig
  if (book.languageLevel || (book.languageCode && book.languageCode !== 'ger')) {
    return 'fremdsprachig';
  }
  
  // Hard Fallback: Belletristik
  return 'belletristik';
}

/**
 * Gibt die 4 spezifischen Skalen für ein Buch zurück
 */
export function getScalesForBook(book: Book): RatingScale[] {
  const world = getBookWorldForRating(book);
  return BOOK_WORLD_SCALES[world];
}

// ============================================
// RATING DATA TYPES
// ============================================

export interface BookRating {
  bookId: string;
  userId: string | null;
  sessionId: string | null;
  scales: Record<string, number>; // z.B. { erzähltempo: 65, stimmung: 42, sprachstil: 78, fokus: 55 } (0-100)
  createdAt: string;
  updatedAt: string;
}

export interface AggregateRating {
  bookId: string;
  scales: Record<string, number>; // Durchschnittswerte
  totalRatings: number;
  updatedAt: string;
}

// Erweiterte Aggregate-Daten mit Details pro Skala
export interface AggregateRatings {
  bookId: string;
  scales: Record<string, {
    average: number;
    count: number;
  }>;
  totalRatings: number;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  profile: Record<string, number>; // Durchschnitt aller User-Bewertungen
  totalRatings: number;
  updatedAt: string;
}

export interface MatchResult {
  match: number; // 0-100%
  details?: {
    userProfile: Record<string, number>;
    bookProfile: Record<string, number>;
    scalesCompared: number;
  };
  message?: string;
}

// ============================================
// RATING API CALLS
// ============================================

/**
 * Holt die aggregierten Community-Bewertungen für ein Buch
 */
export async function getBookRatings(bookId: string): Promise<AggregateRating | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/ratings/${bookId}`, {
      headers: {
      },
    });
    const result: ApiResponse<AggregateRating> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching book ratings:', error);
    return null;
  }
}

/**
 * Holt die persönliche Bewertung eines Users für ein Buch
 */
export async function getUserBookRating(bookId: string, userId: string): Promise<BookRating | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/ratings/${bookId}/user/${userId}`, {
      headers: {
      },
    });
    const result: ApiResponse<BookRating> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching user book rating:', error);
    return null;
  }
}

/**
 * Speichert/aktualisiert eine Buch-Bewertung
 * @param bookId - Die Buch-ID
 * @param scales - Die Skalen-Werte (0-100)
 * @param userId - Optional: User-ID für eingeloggte User
 * @param sessionId - Optional: Session-ID für anonyme User
 */
export async function saveBookRating(
  bookId: string,
  scales: Record<string, number>,
  userId?: string,
  sessionId?: string
): Promise<BookRating | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookId, scales, userId, sessionId }),
    });
    const result: ApiResponse<BookRating> = await response.json();
    
    if (!result.success && result.error) {
      throw new Error(result.error);
    }
    
    return result.data || null;
  } catch (error) {
    console.error('Error saving book rating:', error);
    throw error;
  }
}

/**
 * Holt das Lese-Profil eines Users (Durchschnitt aller seiner Bewertungen)
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/profile`, {
      headers: {
      },
    });
    const result: ApiResponse<UserProfile> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Holt alle Bewertungen eines Users
 */
export async function getUserRatings(userId: string): Promise<BookRating[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/ratings`, {
      headers: {
      },
    });
    const result: ApiResponse<{ ratings: BookRating[], total: number }> = await response.json();
    return result.data?.ratings || [];
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return [];
  }
}

/**
 * Holt ein einzelnes Rating für ein Buch (User oder Session)
 */
export async function getBookRating(
  bookId: string, 
  userId?: string, 
  sessionId?: string
): Promise<BookRating | null> {
  try {
    if (!userId && !sessionId) {
      return null;
    }
    
    const identifier = userId ? `user/${userId}` : `session/${sessionId}`;
    const response = await fetch(`${API_BASE_URL}/ratings/${bookId}/${identifier}`, {
      headers: {
      },
    });
    const result: ApiResponse<BookRating> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching book rating:', error);
    return null;
  }
}

/**
 * Holt die aggregierten Bewertungen für ein Buch (mit Details pro Skala)
 */
export async function getBookAggregateRatings(bookId: string): Promise<AggregateRatings | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/ratings/${bookId}/aggregate`, {
      headers: {
      },
    });
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.info('ℹ️ Ratings API not available, using defaults');
      return null;
    }
    
    const result: ApiResponse<AggregateRatings> = await response.json();
    return result.data || null;
  } catch (error) {
    // Silent fallback - this is expected when server is not running
    return null;
  }
}

/**
 * Berechnet die Match-Quote zwischen User-Profil und Buch-Profil
 * @returns Match-Percentage (0-100%)
 */
export async function calculateBookMatch(userId: string, bookId: string): Promise<MatchResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/ratings/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, bookId }),
    });
    const result: ApiResponse<MatchResult> = await response.json();
    return result.data || { match: 0, message: 'Failed to calculate match' };
  } catch (error) {
    console.error('Error calculating book match:', error);
    return { match: 0, message: 'Error calculating match' };
  }
}
