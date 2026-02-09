import { Helmet } from 'react-helmet-async';
import { Book, ONIXTag } from '../../utils/api';

interface BookSchemaProps {
  book: Book;
  tags?: ONIXTag[];
}

/**
 * Schema.org Structured Data for Books
 * Includes: Book, Product, Offer, AggregateRating, Review
 */
export function BookSchema({ book, tags = [] }: BookSchemaProps) {
  // Get awards/prizes from Status tags
  const awards = tags
    .filter(tag => tag.type === 'Status' && tag.visibilityLevel === 'prominent')
    .map(tag => tag.displayName);

  // Get genre from Genre tags
  const genres = tags
    .filter(tag => tag.type === 'Genre (THEMA)')
    .map(tag => tag.displayName);

  // Get language from Herkunft tags
  const languages = tags
    .filter(tag => tag.type === 'Herkunft')
    .map(tag => {
      const code = tag.onixCode || '';
      if (code.includes('eng')) return 'en';
      if (code.includes('fra')) return 'fr';
      if (code.includes('spa')) return 'es';
      if (code.includes('ita')) return 'it';
      if (code.includes('swe')) return 'sv';
      if (code.includes('nor')) return 'no';
      return 'de';
    });

  // Get series from Serie tags
  const series = tags.find(tag => tag.type === 'Serie');
  const volume = tags.find(tag => tag.type === 'Band');

  // Schema.org Book + Product
  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `https://coratiert.de/book/${book.id}`,
    "name": book.title,
    "author": {
      "@type": "Person",
      "name": book.author
    },
    "publisher": book.publisher ? {
      "@type": "Organization",
      "name": book.publisher
    } : undefined,
    "datePublished": book.year,
    "isbn": book.isbn,
    "image": book.coverUrl,
    "inLanguage": languages[0] || "de",
    "genre": genres.length > 0 ? genres : undefined,
    "award": awards.length > 0 ? awards : undefined,
    "isPartOf": series ? {
      "@type": "BookSeries",
      "name": series.displayName,
      "position": volume?.displayName || undefined
    } : undefined,
    "offers": {
      "@type": "Offer",
      "url": `https://coratiert.de/book/${book.id}`,
      "price": parsePrice(book.price),
      "priceCurrency": "EUR",
      "availability": book.availability === 'Verfügbar' 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "coratiert.de"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "12",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  // Remove undefined properties
  const cleanedSchema = JSON.parse(JSON.stringify(bookSchema));

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(cleanedSchema)}
      </script>
    </Helmet>
  );
}

// Helper: Parse price string to number
function parsePrice(priceStr?: string): string {
  if (!priceStr) return "0";
  const match = priceStr.match(/[\d,]+/);
  if (!match) return "0";
  return match[0].replace(',', '.');
}
