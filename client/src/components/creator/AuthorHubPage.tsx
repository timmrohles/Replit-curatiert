import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSafeNavigate } from '../../utils/routing';
import { Heart, ExternalLink, ChevronDown, Instagram, Twitter, Facebook } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Container, Section, Heading, Text } from '../ui';
import { BookCarouselItem, type BookCarouselItemData } from '../book/BookCarouselItem';
import { CarouselContainer } from '../carousel/CarouselContainer';
import { CreatorEventsSection } from './CreatorEventsSection';
import { LikeButton } from '../favorites/LikeButton';
import { useFavorites } from '../favorites/FavoritesContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { isRealPublisher } from '../../utils/publisherUtils';

interface AuthorBook {
  id: string;
  title: string; // ONIX: <TitleDetail> → <TitleText>
  subtitle?: string;
  author: string;
  authorSlug: string;
  bookSlug: string;
  collectionNumber?: number; // ONIX: <Collection> → <PartNumber> - Bandnummer innerhalb der Reihe
  price: string; // ONIX: <Price> → <PriceAmount> - Format: "19.99" (mit Punkt!)
  isbn: string; // ONIX: <ProductIdentifier> → <IDValue> (bei ProductIDType 15 = ISBN-13)
  publisher: string; // ONIX: <PublisherName> - Hauptverlag (z.B. "Penguin Random House")
  imprint?: string; // ONIX: <ImprintName> - Untermarke/Imprint (z.B. "Heyne") - PRIORITÄT IM UI!
  year: number; // Extrahiert aus publicationDate
  coverImage: string; // ONIX: <CollateralDetail> → <SupportingResource> → <ResourceLink>
  description?: string; // ONIX: <TextContent> (Type 03 = Main Description)
  publicationDate: string; // ONIX: <PublicationDate> - Format: YYYYMMDD oder YYYY-MM-DD
  productForm?: string; // ONIX: <ProductForm> - BC=Paperback, BB=Hardcover, E101=EPUB
  seriesName?: string; // ONIX: <Collection> → <TitleDetail> → <TitleText>
  language?: string; // ONIX: <Language> (Code List 74) - de, en, fr, etc.
  awardsCount?: number; // Custom metric (merged from DB, not in ONIX)
  followersCount?: number; // Custom metric (merged from DB, not in ONIX)
}

interface Author {
  name: string;
  slug: string;
  bio: string;
  image: string;
  professionalPosition?: string;
  affiliation?: string;
  birthDate?: string;
  birthPlace?: string;
  website?: string;
  booksCount: number;
  followersCount: number;
  awardsCount: number;
  mainGenres?: string[];
  tags?: string[]; // Themengebiete für Schema.org knowsAbout
  alumniOf?: string; // Bildungseinrichtung
  worksFor?: string; // Aktuelle Organisation/Arbeitgeber
  publisher?: string; // ONIX: <PublisherName> - Hauptverlag des Autors (z.B. "Penguin Random House")
  imprint?: string; // ONIX: <ImprintName> - Haupt-Imprint des Autors (z.B. "Heyne") - Hat PRIORITÄT!
  series?: {
    name: string;
    slug: string;
    bookCount?: number;
  }[];
}

const SORT_OPTIONS = [
  { id: 'newest' as const, label: 'Neueste zuerst' },
  { id: 'oldest' as const, label: 'Älteste zuerst' },
  { id: 'popularity' as const, label: 'Beliebtheit' },
  { id: 'awarded' as const, label: 'Ausgezeichnet' },
  { id: 'series' as const, label: 'Reihe' }
];

const FORMAT_OPTIONS = [
  { id: 'all' as const, label: 'Alle Formate' },
  { id: 'hardcover' as const, label: 'Hardcover' },
  { id: 'paperback' as const, label: 'Taschenbuch' },
  { id: 'ebook' as const, label: 'E-Book' }
];

const LANGUAGE_OPTIONS = [
  { id: 'all' as const, label: 'Alle Sprachen' },
  { id: 'de' as const, label: 'Deutsch' },
  { id: 'en' as const, label: 'Englisch' },
  { id: 'fr' as const, label: 'Französisch' }
];

/**
 * Helper function to parse ONIX publication dates
 * ONIX <PublicationDate> can come in formats: YYYYMMDD, YYYY-MM-DD, YYYY
 * This ensures correct date parsing for sorting
 */
function parseONIXDate(dateString: string): Date {
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
}

export function AuthorHubPage() {
  const { authorId } = useParams<{ authorId: string }>();
  const navigate = useSafeNavigate();
  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<AuthorBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popularity' | 'awarded' | 'series'>('newest');
  const [formatFilter, setFormatFilter] = useState<'all' | 'hardcover' | 'paperback' | 'ebook'>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'de' | 'en' | 'fr'>('all');
  const sortChipsRef = useRef<HTMLDivElement>(null);
  const formatChipsRef = useRef<HTMLDivElement>(null);
  const languageChipsRef = useRef<HTMLDivElement>(null);
  const [showMoreBio, setShowMoreBio] = useState(false);
  
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    // Mock data - in production, fetch from backend based on authorId
    const mockAuthor: Author = {
      name: "Mag. Miriam Biritz-Wagenbichler",
      slug: "mag-miriam-biritz-wagenbichler",
      bio: "Mag. Miriam Biritz-Wagenbichler ist eine Expertin für Gesundheit und Wohlbefinden. Sie hat sich auf die Themen Bewegung, Ernährung und Stressmanagement spezialisiert und veröffentlicht mehrere Bücher zu diesen Themen. Ihre praxisnahen Ratgeber helfen Tausenden von Menschen dabei, ein gesünderes und erfüllteres Leben zu führen.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      professionalPosition: "Gesundheitsexpertin",
      affiliation: "Universität Wien",
      birthDate: "15. März 1982",
      birthPlace: "Wien, Österreich",
      website: "https://gesundheitsratgeber.at",
      booksCount: 12,
      followersCount: 8450,
      awardsCount: 5,
      mainGenres: ["Gesundheit", "Ratgeber", "Wellness"],
      tags: ["Bewegung", "Ernährung", "Stressmanagement"],
      alumniOf: "Universität Wien",
      worksFor: "Selfpublishing",
      publisher: "Selfpublishing",
      // Kein Imprint bei Selfpublishing
      series: [
        {
          name: "Gesundheitsreihe",
          slug: "gesundheitsreihe",
          bookCount: 4
        }
      ]
    };

    const mockBooks: AuthorBook[] = [
      {
        id: "bewegung-alltag-1",
        title: "Bring Bewegung in deinen Alltag",
        subtitle: "30 Übungen für mehr Vitalität und Gesundheit",
        author: "Mag. Miriam Biritz-Wagenbichler",
        authorSlug: "mag-miriam-biritz-wagenbichler",
        bookSlug: "bring-bewegung-in-deinen-alltag",
        collectionNumber: 1,
        price: "19.99 €",
        isbn: "978-3-7423-2134-5",
        publisher: "Selfpublishing",
        year: 2024,
        coverImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop",
        description: "Praktische Tipps für mehr Bewegung im Alltag",
        publicationDate: "2024-03-15",
        productForm: "hardcover",
        seriesName: "Gesundheitsreihe",
        awardsCount: 2,
        followersCount: 1200
      },
      {
        id: "gesundheitsreihe-2",
        title: "Ernährung für ein langes Leben",
        author: "Mag. Miriam Biritz-Wagenbichler",
        authorSlug: "mag-miriam-biritz-wagenbichler",
        bookSlug: "ernaehrung-fuer-ein-langes-leben",
        collectionNumber: 2,
        price: "19.99 €",
        isbn: "978-3-7423-2135-2",
        publisher: "Selfpublishing",
        year: 2024,
        coverImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=600&fit=crop",
        description: "Gesunde Ernährung für ein langes und vitales Leben",
        publicationDate: "2024-06-20",
        productForm: "paperback",
        seriesName: "Gesundheitsreihe",
        awardsCount: 1,
        followersCount: 980
      },
      {
        id: "gesundheitsreihe-3",
        title: "Stressmanagement im Alltag",
        author: "Mag. Miriam Biritz-Wagenbichler",
        authorSlug: "mag-miriam-biritz-wagenbichler",
        bookSlug: "stressmanagement-im-alltag",
        collectionNumber: 3,
        price: "18.99 €",
        isbn: "978-3-7423-2136-9",
        publisher: "Selfpublishing",
        year: 2024,
        coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop",
        description: "Effektive Strategien gegen Stress und Überlastung",
        publicationDate: "2024-09-10",
        productForm: "ebook",
        seriesName: "Gesundheitsreihe",
        awardsCount: 3,
        followersCount: 1450
      },
      {
        id: "gesundheitsreihe-4",
        title: "Regeneration & Schlaf",
        author: "Mag. Miriam Biritz-Wagenbichler",
        authorSlug: "mag-miriam-biritz-wagenbichler",
        bookSlug: "regeneration-und-schlaf",
        collectionNumber: 4,
        price: "19.99 €",
        isbn: "978-3-7423-2137-6",
        publisher: "Selfpublishing",
        year: 2024,
        coverImage: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=600&fit=crop",
        description: "Optimale Erholung für Körper und Geist",
        publicationDate: "2024-11-25",
        productForm: "hardcover",
        seriesName: "Gesundheitsreihe",
        awardsCount: 1,
        followersCount: 890
      },
      {
        id: "yoga-basics",
        title: "Yoga Basics für Einsteiger",
        author: "Mag. Miriam Biritz-Wagenbichler",
        authorSlug: "mag-miriam-biritz-wagenbichler",
        bookSlug: "yoga-basics-fuer-einsteiger",
        price: "16.99 €",
        isbn: "978-3-7423-2130-7",
        publisher: "Selfpublishing",
        year: 2023,
        coverImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=600&fit=crop",
        description: "Einführung in die Welt des Yoga",
        publicationDate: "2023-04-12",
        productForm: "paperback",
        awardsCount: 0,
        followersCount: 650
      },
      {
        id: "meditation-guide",
        title: "Meditation für den Alltag",
        author: "Mag. Miriam Biritz-Wagenbichler",
        authorSlug: "mag-miriam-biritz-wagenbichler",
        bookSlug: "meditation-fuer-den-alltag",
        price: "14.99 €",
        isbn: "978-3-7423-2131-4",
        publisher: "Selfpublishing",
        year: 2023,
        coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop",
        description: "Einfache Meditationstechniken für jeden Tag",
        publicationDate: "2023-08-05",
        productForm: "ebook",
        awardsCount: 1,
        followersCount: 720
      },
      {
        id: "healthy-cooking",
        title: "Gesund kochen leicht gemacht",
        author: "Mag. Miriam Biritz-Wagenbichler",
        authorSlug: "mag-miriam-biritz-wagenbichler",
        bookSlug: "gesund-kochen-leicht-gemacht",
        price: "22.99 €",
        isbn: "978-3-7423-2132-1",
        publisher: "Selfpublishing",
        year: 2022,
        coverImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=600&fit=crop",
        description: "Rezepte für eine gesunde Ernährung",
        publicationDate: "2022-11-18",
        productForm: "hardcover",
        awardsCount: 2,
        followersCount: 1100
      },
      {
        id: "fitness-home",
        title: "Fitness für Zuhause",
        author: "Mag. Miriam Biritz-Wagenbichler",
        authorSlug: "mag-miriam-biritz-wagenbichler",
        bookSlug: "fitness-fuer-zuhause",
        price: "17.99 €",
        isbn: "978-3-7423-2133-8",
        publisher: "Selfpublishing",
        year: 2022,
        coverImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop",
        description: "Effektive Workouts ohne Geräte",
        publicationDate: "2022-05-22",
        productForm: "paperback",
        awardsCount: 0,
        followersCount: 540
      }
    ];

    setAuthor(mockAuthor);
    setBooks(mockBooks);
    setLoading(false);
  }, [authorId]);

  // Apply filtering and sorting
  const filteredAndSortedBooks = useMemo(() => {
    if (!books.length) return [];
    
    // Filter by format
    let filtered = [...books];
    if (formatFilter !== 'all') {
      filtered = filtered.filter(book => book.productForm === formatFilter);
    }
    
    // Filter by language
    if (languageFilter !== 'all') {
      filtered = filtered.filter(book => book.language === languageFilter);
    }
    
    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => 
        parseONIXDate(b.publicationDate).getTime() - parseONIXDate(a.publicationDate).getTime()
      );
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => 
        parseONIXDate(a.publicationDate).getTime() - parseONIXDate(b.publicationDate).getTime()
      );
    } else if (sortBy === 'popularity') {
      filtered.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
    } else if (sortBy === 'awarded') {
      filtered.sort((a, b) => (b.awardsCount || 0) - (a.awardsCount || 0));
    } else if (sortBy === 'series') {
      // Reihen-Sortierung: Bücher MIT Reihe zuerst (alphabetisch nach Reihenname, dann nach Band-Nummer)
      // Bücher OHNE Reihe danach (alphabetisch nach Titel)
      filtered.sort((a, b) => {
        const aHasSeries = !!a.seriesName;
        const bHasSeries = !!b.seriesName;
        
        // 1. Bücher mit Reihe vor Bücher ohne Reihe
        if (aHasSeries && !bHasSeries) return -1;
        if (!aHasSeries && bHasSeries) return 1;
        
        // 2. Beide haben Reihe: Nach Reihenname, dann nach Band-Nummer
        if (aHasSeries && bHasSeries) {
          const seriesCompare = (a.seriesName || '').localeCompare(b.seriesName || '');
          if (seriesCompare !== 0) return seriesCompare;
          
          // Gleiche Reihe: Nach Band-Nummer sortieren
          return (a.collectionNumber || 0) - (b.collectionNumber || 0);
        }
        
        // 3. Beide haben KEINE Reihe: Nach Titel sortieren
        return a.title.localeCompare(b.title);
      });
    }
    
    return filtered;
  }, [books, sortBy, formatFilter, languageFilter]);

  // Generate author ID for favorites
  const authorFavoriteId = author?.slug || '';

  if (loading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <Container>
          <div className="text-center" role="status" aria-live="polite">
            <div 
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
              style={{ borderColor: 'var(--color-blue)' }}
              aria-hidden="true"
            />
            <Text variant="body" className="text-foreground">
              Lädt Autor...
            </Text>
          </div>
        </Container>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="gradient-bg min-h-screen">
        <Container>
          <Section variant="default">
            <div className="text-center">
              <Heading as="h1" variant="h1" className="mb-6 text-foreground">
                Autor nicht gefunden
              </Heading>
              <button
                onClick={() => navigate('/autoren')}
                className="px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: 'var(--color-blue)',
                  color: 'var(--color-surface)',
                  fontFamily: 'var(--font-family-headline)'
                }}
              >
                Zurück zur Autorenübersicht
              </button>
            </div>
          </Section>
        </Container>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Autoren', href: '/autoren' },
    { label: author.name, href: `/autoren/${author.slug}` }
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      {/* Schema.org JSON-LD für Person/Autor */}
      <Helmet>
        <title>{author.name} - Alle Bücher & Biografie | coratiert.de</title>
        <meta name="description" content={author.bio} />
        <link rel="canonical" href={`https://coratiert.de/autoren/${author.slug}/`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": `https://coratiert.de/autoren/${author.slug}`,
            "name": author.name,
            "description": author.bio,
            "jobTitle": author.professionalPosition,
            "affiliation": author.affiliation ? {
              "@type": "Organization",
              "name": author.affiliation
            } : undefined,
            "birthDate": author.birthDate,
            "birthPlace": author.birthPlace,
            "url": author.website,
            "image": author.image,
            "numberOfBooks": author.booksCount,
            "award": author.awardsCount > 0 ? `${author.awardsCount} Auszeichnungen` : undefined,
            "knowsAbout": author.tags,
            "alumniOf": author.alumniOf,
            "worksFor": author.worksFor,
            "sameAs": [
              author.website,
              (author as any).socialMedia?.instagram ? `https://instagram.com/${(author as any).socialMedia.instagram}` : null,
              (author as any).socialMedia?.twitter ? `https://twitter.com/${(author as any).socialMedia.twitter}` : null
            ].filter(Boolean),
            "workExample": books.map(book => ({
              "@type": "Book",
              "@id": `https://coratiert.de/buecher/${book.bookSlug}/`,
              "name": book.title,
              "isbn": book.isbn?.replace(/-/g, ''),
              "author": {
                "@type": "Person",
                "@id": `https://coratiert.de/autoren/${author.slug}`,
                "name": author.name
              },
              "publisher": {
                "@type": "Organization",
                "name": book.publisher
              },
              "datePublished": book.publicationDate,
              "inLanguage": book.language || "de",
              "bookFormat": book.productForm === 'hardcover' ? 'https://schema.org/Hardcover' : 
                            book.productForm === 'paperback' ? 'https://schema.org/Paperback' : 
                            book.productForm === 'ebook' ? 'https://schema.org/EBook' : 
                            'https://schema.org/Paperback',
              "image": book.coverImage,
              "description": book.description,
              "offers": {
                "@type": "Offer",
                "price": book.price.replace(/[^\d,]/g, '').replace(',', '.'),
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock",
                "url": `https://coratiert.de/buecher/${book.bookSlug}/`
              },
              "award": book.awardsCount && book.awardsCount > 0 ? `${book.awardsCount} Auszeichnungen` : undefined,
              "isPartOf": book.seriesName ? {
                "@type": "BookSeries",
                "name": book.seriesName,
                "position": book.collectionNumber
              } : undefined
            })),
            "hasCreativeWork": books.map(book => ({
            "@type": "Book",
            "name": book.title,
            "isbn": book.isbn?.replace(/-/g, ''), // ISBN ohne Bindestriche für Schema.org
            "author": {
              "@type": "Person",
              "name": author.name
            },
            "publisher": {
              "@type": "Organization",
              "name": book.publisher
            },
            "datePublished": book.publicationDate,
            "inLanguage": book.language || "de",
            "bookFormat": book.productForm === 'hardcover' ? 'https://schema.org/Hardcover' : 
                          book.productForm === 'paperback' ? 'https://schema.org/Paperback' : 
                          book.productForm === 'ebook' ? 'https://schema.org/EBook' : 
                          'https://schema.org/Paperback',
            "numberOfPages": undefined, // Add wenn verfügbar
            "image": book.coverImage,
            "description": book.description,
            "offers": {
              "@type": "Offer",
              "price": book.price.replace(/[^\d,]/g, '').replace(',', '.'),
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `https://coratiert.de/buecher/${book.bookSlug}/`
            },
            "award": book.awardsCount && book.awardsCount > 0 ? `${book.awardsCount} Auszeichnungen` : undefined,
            "isPartOf": book.seriesName ? {
              "@type": "BookSeries",
              "name": book.seriesName,
              "position": book.collectionNumber
            } : undefined
          }))
        })}
      </script>
      </Helmet>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* 1. Hero-Sektion: Der Autor */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            {/* Autoren-Titel (H1) */}
            <Heading as="h1" variant="h1" className="mb-4 !text-foreground">
              {author.name}
            </Heading>
            
            {/* Professional Tag */}
            {(author.professionalPosition || author.affiliation) && (
              <div className="flex flex-wrap items-center gap-x-2">
                {author.professionalPosition && (
                  <Text 
                    as="span"
                    variant="large" 
                    className="!text-foreground"
                  >
                    {author.professionalPosition}
                  </Text>
                )}
                {author.professionalPosition && author.affiliation && (
                  <Text as="span" variant="large" className="!text-foreground">·</Text>
                )}
                {author.affiliation && (
                  <Text 
                    as="span"
                    variant="large" 
                    className="!text-foreground"
                  >
                    {author.affiliation}
                  </Text>
                )}
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* 2. Autoren-Profil: Avatar + Bio */}
      <Section variant="compact" className="!pb-4">
        <Container>
          <div className="w-full text-base leading-normal text-left">
            <div className="flex items-center gap-3 md:gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-cerulean ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  <ImageWithFallback
                    src={author.image}
                    alt={author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1 self-center">
                <div className="inline-flex items-center gap-1.5">
                  <span className="kuratorname text-blue inline-block">
                    {author.name}
                  </span>
                </div>

                {/* Focus - Autor */}
                <div className="flex flex-wrap items-center gap-x-2 mt-1">
                  {author.professionalPosition && (
                    <Text 
                      as="span"
                      variant="xs" 
                      className="text-foreground"
                    >
                      {author.professionalPosition}
                    </Text>
                  )}
                  {author.professionalPosition && author.affiliation && (
                    <span className="text-foreground">·</span>
                  )}
                  {author.affiliation && (
                    <Text 
                      as="span"
                      variant="xs" 
                      className="text-foreground"
                    >
                      {author.affiliation}
                    </Text>
                  )}
                </div>
              </div>
            </div>

            {/* Author Button (Saffron) + Publisher Button (Teal) + Tags (Coral) */}
            <div className="w-full mt-4">
              <div className="flex flex-wrap gap-2">
                {/* Autorin-Tag - Saffron */}
                <div 
                  className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg"
                  style={{ backgroundColor: 'var(--color-saffron)' }}
                >
                  <Text as="span" variant="small" className="text-white font-semibold whitespace-nowrap">
                    {author.name}
                  </Text>
                  <LikeButton 
                    entityId={authorFavoriteId}
                    entityType="creator"
                    entityTitle={author.name}
                    variant="minimal"
                    size="sm"
                    iconColor="#ffffff"
                    backgroundColor="var(--color-saffron)"
                  />
                </div>

                {/* Verlags-/Imprint-Tag - Teal (ONIX: Priorität Imprint > Publisher, nur zeigen wenn echter Verlag) */}
                {(author.imprint || author.publisher) && isRealPublisher(author.imprint || author.publisher) && (
                  <div 
                    className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 transition-all duration-200"
                    style={{ backgroundColor: 'var(--color-teal)' }}
                    onClick={() => {
                      const publisherName = author.imprint || author.publisher;
                      navigate(`/verlage/${publisherName!.toLowerCase().replace(/\s+/g, '-')}/`);
                    }}
                  >
                    <Text as="span" variant="small" className="text-white font-semibold whitespace-nowrap">
                      {/* ONIX-Hierarchie: <ImprintName> hat Priorität vor <PublisherName> */}
                      {author.imprint || author.publisher}
                    </Text>
                    <LikeButton 
                      entityId={`publisher-${(author.imprint || author.publisher)!.toLowerCase().replace(/\s+/g, '-')}`}
                      entityType="publisher"
                      entityTitle={author.imprint || author.publisher!}
                      variant="minimal"
                      size="sm"
                      iconColor="#ffffff"
                      backgroundColor="var(--color-teal)"
                    />
                  </div>
                )}

                {/* Thementags - Coral */}
                {author.tags && author.tags.map((tag) => {
                  const tagId = `tag-${tag.toLowerCase().replace(/\s+/g, '-')}`;
                  return (
                    <div 
                      key={tag}
                      className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg bg-coral cursor-pointer hover:scale-105 transition-all duration-200"
                      onClick={() => navigate(`/tags/${tag.toLowerCase().replace(/\s+/g, '-')}/`)}
                    >
                      <Text as="span" variant="small" className="text-white font-semibold whitespace-nowrap">
                        {tag}
                      </Text>
                      <LikeButton 
                        entityId={tagId}
                        entityType="tag"
                        entityTitle={tag}
                        variant="minimal"
                        size="sm"
                        iconColor="#ffffff"
                        backgroundColor="var(--vibrant-coral)"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bio-Block wie curationReason */}
            {author.bio && (
              <div className="w-full mt-4">
                <Text 
                  as="div"
                  variant="body"
                  style={
                    author.bio.length > 330 && !showMoreBio
                      ? {
                          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        }
                      : undefined
                  }
                  className={`leading-relaxed ${
                    author.bio.length > 330 && !showMoreBio ? 'line-clamp-3' : ''
                  } text-foreground`}
                >
                  {author.bio}
                </Text>
                {author.bio.length > 330 && (
                  <button
                    onClick={() => setShowMoreBio(!showMoreBio)}
                    className="font-headline flex items-center gap-1 mt-2 text-blue hover:text-blue hover:opacity-80 uppercase tracking-tight transition-colors"
                    aria-expanded={showMoreBio}
                    aria-label={showMoreBio ? 'Bio-Text einklappen' : 'Bio-Text vollständig anzeigen'}
                  >
                    <Text as="span" variant="xs" className="text-blue">
                      {showMoreBio ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                    </Text>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-300 ${showMoreBio ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* 3. Bücher-Grid: Alle Werke */}
      <Section variant="default" className="!pt-4 !pb-12">
        <Container>
          <Heading 
            as="h3"
            variant="h3"
            className="mb-4 text-foreground"
          >
            Bücher von {author.name}
          </Heading>
          
          {/* Sort & Filter Chips */}
          <div className="mb-6 space-y-3">
            {/* Sort Chips */}
            <div className="flex justify-end">
              <div 
                ref={sortChipsRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full md:flex-wrap md:overflow-visible"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {SORT_OPTIONS.map((option) => {
                  const isActive = sortBy === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSortBy(option.id)}
                      className="sort-chip"
                      aria-pressed={isActive}
                      aria-label={`Nach ${option.label} sortieren`}
                    >
                      <Text 
                        as="span" 
                        variant="xs" 
                        className="whitespace-nowrap !normal-case !tracking-normal !font-semibold"
                      >
                        {option.label}
                      </Text>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format Filter Chips */}
            <div className="flex justify-end">
              <div 
                ref={formatChipsRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full md:flex-wrap md:overflow-visible"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {FORMAT_OPTIONS.map((option) => {
                  const isActive = formatFilter === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFormatFilter(option.id)}
                      className="filter-chip-coral"
                      aria-pressed={isActive}
                      aria-label={`Filter: ${option.label}`}
                    >
                      <Text 
                        as="span" 
                        variant="xs" 
                        className="whitespace-nowrap !normal-case !tracking-normal !font-semibold"
                      >
                        {option.label}
                      </Text>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Filter Chips */}
            <div className="flex justify-end">
              <div 
                ref={languageChipsRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full md:flex-wrap md:overflow-visible"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {LANGUAGE_OPTIONS.map((option) => {
                  const isActive = languageFilter === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setLanguageFilter(option.id)}
                      className="filter-chip-saffron"
                      aria-pressed={isActive}
                      aria-label={`Filter: ${option.label}`}
                    >
                      <Text 
                        as="span" 
                        variant="xs" 
                        className="whitespace-nowrap !normal-case !tracking-normal !font-semibold"
                      >
                        {option.label}
                      </Text>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Books Grid - 4 per row */}
          {filteredAndSortedBooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredAndSortedBooks.map((book) => {
                const bookData: BookCarouselItemData = {
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  coverImage: book.coverImage,
                  price: book.price,
                  isbn: book.isbn,
                  publisher: book.publisher,
                  year: book.year.toString(),
                  shortDescription: book.description,
                  collectionNumber: book.collectionNumber,
                  seriesName: book.seriesName,
                  seriesSlug: author.series?.find(s => s.name === book.seriesName)?.slug
                };
                
                return (
                  <div key={book.id}>
                    <BookCarouselItem 
                      book={bookData}
                      size="md"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Text variant="body" className="text-foreground">
                Keine Bücher für die ausgewählten Filter gefunden.
              </Text>
            </div>
          )}
        </Container>
      </Section>

      {/* 4. Veranstaltungen */}
      <Section variant="default" className="!pt-4 !pb-12">
        <Container>
          <Heading 
            as="h3"
            variant="h3"
            className="mb-4 text-foreground"
          >
            Veranstaltungen von {author.name}
          </Heading>
          
          <CreatorEventsSection creatorSlug={author.slug} />
        </Container>
      </Section>

    </div>
  );
}