/**
 * ONIX 3.0 Helper Functions
 * Utilities für ONIX-Datenverarbeitung und -Formatierung
 */

/**
 * Formatiert ONIX-Preis für UI-Anzeige (Deutsch)
 * 
 * @param onixPrice - Preis im ONIX-Format (mit Punkt): "19.99"
 * @returns Preis im deutschen Format: "19,99 €"
 * 
 * @example
 * formatPriceForUI("19.99") // "19,99 €"
 * formatPriceForUI("9.90") // "9,90 €"
 */
export const formatPriceForUI = (onixPrice: string): string => {
  // Entferne bereits vorhandene Euro-Zeichen
  const cleanPrice = onixPrice.replace(/[€\s]/g, '');
  // Ersetze Punkt durch Komma und füge Euro-Symbol hinzu
  return cleanPrice.replace('.', ',') + ' €';
};

/**
 * Formatiert UI-Preis für Schema.org (maschinenlesbar)
 * 
 * @param uiPrice - Preis im UI-Format: "19,99 €" oder "19.99 €"
 * @returns Preis für Schema.org (nur Zahl mit Punkt): "19.99"
 * 
 * @example
 * formatPriceForSchema("19,99 €") // "19.99"
 * formatPriceForSchema("19.99 €") // "19.99"
 */
export const formatPriceForSchema = (uiPrice: string): string => {
  // Entferne alle Nicht-Ziffern außer Komma
  const cleaned = uiPrice.replace(/[^\d,]/g, '');
  // Ersetze Komma durch Punkt
  return cleaned.replace(',', '.');
};

/**
 * Säubert ISBN für Schema.org (entfernt Bindestriche)
 * 
 * @param isbn - ISBN im beliebigen Format
 * @returns ISBN nur mit Ziffern
 * 
 * @example
 * cleanISBN("978-3-7423-2137-6") // "9783742321376"
 * cleanISBN("9783742321376") // "9783742321376"
 */
export const cleanISBN = (isbn: string): string => {
  return isbn.replace(/-/g, '');
};

/**
 * Generiert Autor-Slug aus PersonName
 * 
 * @param authorName - Autor-Name aus ONIX <PersonName>
 * @returns URL-freundlicher Slug
 * 
 * @example
 * generateAuthorSlug("Mag. Miriam Biritz-Wagenbichler") 
 * // "mag-miriam-biritz-wagenbichler"
 */
export const generateAuthorSlug = (authorName: string): string => {
  return authorName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9äöüß-]/g, '');
};

/**
 * Generiert Buchreihen-Slug aus Series Name
 * 
 * @param seriesName - Reihenname aus ONIX <Collection>
 * @returns URL-freundlicher Slug
 * 
 * @example
 * generateSeriesSlug("Gesundheitsreihe") // "gesundheitsreihe"
 */
export const generateSeriesSlug = (seriesName: string): string => {
  return seriesName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9äöüß-]/g, '');
};

/**
 * Parst ONIX PublicationDate in verschiedenen Formaten
 * 
 * @param dateString - ONIX <PublicationDate> in Format YYYYMMDD, YYYY-MM-DD oder YYYY
 * @returns Date-Objekt
 * 
 * @example
 * parseONIXDate("20240315") // Date(2024-03-15)
 * parseONIXDate("2024-03-15") // Date(2024-03-15)
 * parseONIXDate("2024") // Date(2024-01-01)
 */
export const parseONIXDate = (dateString: string): Date => {
  if (!dateString) return new Date(0); // Invalid date fallback
  
  // Remove any non-digit characters except dash
  const cleaned = dateString.replace(/[^\d-]/g, '');
  
  // Format: YYYYMMDD (e.g., 20240315)
  if (/^\d{8}$/.test(cleaned)) {
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);
    return new Date(`${year}-${month}-${day}`);
  }
  
  // Format: YYYY-MM-DD (e.g., 2024-03-15)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return new Date(cleaned);
  }
  
  // Format: YYYY (e.g., 2024)
  if (/^\d{4}$/.test(cleaned)) {
    return new Date(`${cleaned}-01-01`);
  }
  
  // Fallback: Try native Date parsing
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

/**
 * Extrahiert Jahr aus ONIX PublicationDate
 * 
 * @param publicationDate - ONIX <PublicationDate>
 * @returns Jahr als Zahl
 * 
 * @example
 * extractYear("20240315") // 2024
 * extractYear("2024-03-15") // 2024
 */
export const extractYear = (publicationDate: string): number => {
  const date = parseONIXDate(publicationDate);
  return date.getFullYear();
};

/**
 * Mappt ONIX ProductForm zu TypeScript Enum
 * 
 * @param productForm - ONIX <ProductForm> Code
 * @returns TypeScript-freundlicher String
 * 
 * @example
 * mapProductForm("BB") // "hardcover"
 * mapProductForm("BC") // "paperback"
 * mapProductForm("E101") // "ebook"
 */
export const mapProductForm = (productForm: string): 'hardcover' | 'paperback' | 'ebook' | undefined => {
  const mapping: Record<string, 'hardcover' | 'paperback' | 'ebook'> = {
    'BB': 'hardcover',     // Hardcover / Gebunden
    'BC': 'paperback',     // Paperback / Taschenbuch
    'E101': 'ebook',       // EPUB
    'E116': 'ebook',       // PDF
    'E127': 'ebook',       // Kindle
  };
  
  return mapping[productForm];
};

/**
 * Mappt TypeScript ProductForm zu Schema.org bookFormat
 * 
 * @param productForm - TypeScript Format: "hardcover" | "paperback" | "ebook"
 * @returns Schema.org bookFormat URL
 * 
 * @example
 * mapToSchemaBookFormat("hardcover") // "https://schema.org/Hardcover"
 * mapToSchemaBookFormat("paperback") // "https://schema.org/Paperback"
 */
export const mapToSchemaBookFormat = (productForm: string): string => {
  const mapping: Record<string, string> = {
    'hardcover': 'https://schema.org/Hardcover',
    'paperback': 'https://schema.org/Paperback',
    'ebook': 'https://schema.org/EBook',
  };
  
  return mapping[productForm] || 'https://schema.org/Paperback';
};

/**
 * Baut Reihen-Badge-Text aus ONIX-Daten
 * 
 * @param seriesName - ONIX <Collection> → <TitleText>
 * @param partNumber - ONIX <Collection> → <PartNumber>
 * @returns Formatierter Badge-Text
 * 
 * @example
 * buildSeriesBadgeText("Gesundheitsreihe", 4) 
 * // "Band 4 der Gesundheitsreihe"
 */
export const buildSeriesBadgeText = (seriesName: string, partNumber: number): string => {
  return `Band ${partNumber} der ${seriesName}`;
};

/**
 * Prüft ob Imprint oder Publisher im UI angezeigt werden soll
 * 
 * @param imprint - ONIX <ImprintName>
 * @param publisher - ONIX <PublisherName>
 * @returns Name der im UI anzuzeigenden Organisation
 * 
 * @example
 * getDisplayPublisher("Heyne", "Penguin Random House") // "Heyne"
 * getDisplayPublisher(undefined, "Selfpublishing") // "Selfpublishing"
 */
export const getDisplayPublisher = (imprint: string | undefined, publisher: string): string => {
  // ONIX Best Practice: Imprint hat Priorität, da es die bekanntere Marke ist
  return imprint || publisher;
};
