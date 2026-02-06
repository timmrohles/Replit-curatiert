/**
 * Slug Generator Utilities
 * Für konsistente URL-Slug-Generierung aus ONIX-Daten
 */

/**
 * Generiert Author-Slug aus ONIX NamesBeforeKey + KeyNames
 * 
 * @param namesBeforeKey - ONIX <NamesBeforeKey> (z.B. "Joanne K.")
 * @param keyNames - ONIX <KeyNames> (z.B. "Rowling")
 * @returns URL-Slug (z.B. "joanne-k-rowling")
 * 
 * @example
 * generateAuthorSlug("Joanne K.", "Rowling") // "joanne-k-rowling"
 * generateAuthorSlug("Mag.", "Miriam Biritz-Wagenbichler") // "mag-miriam-biritz-wagenbichler"
 */
export function generateAuthorSlug(namesBeforeKey: string, keyNames: string): string {
  const fullName = `${namesBeforeKey} ${keyNames}`.trim();
  return normalizeSlug(fullName);
}

/**
 * Generiert Series-Slug aus ONIX Collection TitleText
 * 
 * @param seriesName - ONIX <TitleText> aus Collection (z.B. "Harry Potter")
 * @returns URL-Slug (z.B. "harry-potter")
 * 
 * @example
 * generateSeriesSlug("Harry Potter") // "harry-potter"
 * generateSeriesSlug("Die Känguru-Chroniken") // "die-kaenguru-chroniken"
 */
export function generateSeriesSlug(seriesName: string): string {
  return normalizeSlug(seriesName);
}

/**
 * Generiert Book-Slug aus Buchtitel
 * 
 * @param title - Buchtitel (z.B. "Der Stein der Weisen")
 * @returns URL-Slug (z.B. "der-stein-der-weisen")
 * 
 * @example
 * generateBookSlug("Der Stein der Weisen") // "der-stein-der-weisen"
 * generateBookSlug("Bring Bewegung in deinen Alltag") // "bring-bewegung-in-deinen-alltag"
 */
export function generateBookSlug(title: string): string {
  return normalizeSlug(title);
}

/**
 * Normalisiert einen String zu einem URL-freundlichen Slug
 * 
 * - Konvertiert zu Kleinbuchstaben
 * - Ersetzt Umlaute (ä→ae, ö→oe, ü→ue, ß→ss)
 * - Entfernt Sonderzeichen (außer Bindestriche)
 * - Ersetzt Leerzeichen durch Bindestriche
 * - Entfernt mehrfache Bindestriche
 * 
 * @param text - Zu normalisierender Text
 * @returns URL-Slug
 */
export function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    // Umlaute ersetzen
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    // Sonderzeichen entfernen (außer Leerzeichen und Bindestriche)
    .replace(/[^a-z0-9\s-]/g, '')
    // Leerzeichen durch Bindestriche ersetzen
    .replace(/\s+/g, '-')
    // Mehrfache Bindestriche reduzieren
    .replace(/-+/g, '-')
    // Bindestriche am Anfang/Ende entfernen
    .replace(/^-+|-+$/g, '')
    .trim();
}

/**
 * Generiert vollständige Book-URL aus ONIX-Daten
 * Format: /buecher/[author-slug]-[book-slug]/
 * 
 * @param namesBeforeKey - ONIX <NamesBeforeKey>
 * @param keyNames - ONIX <KeyNames>
 * @param bookTitle - Buchtitel
 * @returns Vollständige URL (z.B. "/buecher/jk-rowling-der-stein-der-weisen/")
 */
export function generateBookUrl(
  namesBeforeKey: string, 
  keyNames: string, 
  bookTitle: string
): string {
  const authorSlug = generateAuthorSlug(namesBeforeKey, keyNames);
  const bookSlug = generateBookSlug(bookTitle);
  return `/buecher/${authorSlug}-${bookSlug}/`;
}

/**
 * Generiert Author-Hub-URL aus ONIX-Daten
 * Format: /autoren/[author-slug]/
 * 
 * @param namesBeforeKey - ONIX <NamesBeforeKey>
 * @param keyNames - ONIX <KeyNames>
 * @returns Vollständige URL (z.B. "/autoren/jk-rowling/")
 */
export function generateAuthorUrl(
  namesBeforeKey: string, 
  keyNames: string
): string {
  const authorSlug = generateAuthorSlug(namesBeforeKey, keyNames);
  return `/autoren/${authorSlug}/`;
}

/**
 * Generiert Series-Hub-URL aus ONIX Collection-Daten
 * Format: /serien/[series-slug]/
 * 
 * @param seriesName - ONIX <TitleText> aus Collection
 * @returns Vollständige URL (z.B. "/serien/harry-potter/")
 */
export function generateSeriesUrl(seriesName: string): string {
  const seriesSlug = generateSeriesSlug(seriesName);
  return `/serien/${seriesSlug}/`;
}

/**
 * Extrahiert PartNumber aus ONIX und normalisiert zu Zahl
 * Bereinigt Texte wie "Band 1", "Teil 2", "Volume III"
 * 
 * @param partNumber - ONIX <PartNumber> (z.B. "1", "Band 2", "Teil 3")
 * @returns Numerischer Band (z.B. 1, 2, 3)
 * 
 * @example
 * normalizePartNumber("1") // 1
 * normalizePartNumber("Band 2") // 2
 * normalizePartNumber("Teil 3") // 3
 * normalizePartNumber("Volume IV") // 4 (römische Ziffern werden unterstützt)
 */
export function normalizePartNumber(partNumber: string): number {
  // Entferne Präfixe wie "Band", "Teil", "Volume"
  const cleaned = partNumber
    .replace(/^(band|teil|volume|part)\s*/i, '')
    .trim();
  
  // Versuche römische Ziffern zu konvertieren
  const romanNumerals: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15
  };
  
  if (romanNumerals[cleaned.toUpperCase()]) {
    return romanNumerals[cleaned.toUpperCase()];
  }
  
  // Parse als Zahl
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
