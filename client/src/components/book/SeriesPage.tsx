import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSafeNavigate } from '../../utils/routing';
import { ChevronDown, ChevronUp, Heart, Info, ExternalLink, Clock, BookOpen, Star, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Breadcrumb } from '../layout/Breadcrumb';
import { BookCarouselItem, type BookCarouselItemData } from './BookCarouselItem';
import { CarouselContainer } from '../carousel/CarouselContainer';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { BookCard } from './BookCard';
import { LikeButton } from '../favorites/LikeButton';
import { Container, Section, Heading, Text } from '../ui';
import { isRealPublisher } from '../../utils/publisherUtils';
import { useFavorites } from '../favorites/FavoritesContext';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';

interface SeriesBook {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  authorSlug: string;
  bookSlug: string;
  collectionNumber: number;  // ONIX: <PartNumber>
  price: string;             // ONIX: <PriceAmount>
  isbn: string;              // ONIX: <ProductIdentifier> Type 15
  publisher: string;         // ONIX: <PublisherName>
  publisherSlug: string;     // For routing to publisher pages
  year: number;              // ONIX: <PublicationDate>
  coverImage: string;        // ONIX: <ResourceLink>
  description?: string;
}

interface RelatedBook {
  id: string;
  title: string;
  author: string;
  authorSlug: string;
  bookSlug: string;
  price: string;
  isbn: string;
  publisher: string;
  year: number;
  coverImage: string;
  description?: string;
  // ONIX Tags for matching
  mainSubject?: string;      // ONIX: <SubjectSchemeIdentifier>93</SubjectSchemeIdentifier>
  keywords: string[];        // ONIX: <SubjectSchemeIdentifier>20</SubjectSchemeIdentifier>
}

interface Series {
  name: string;                      // ONIX: <Collection> → <TitleText>
  slug: string;
  identifier?: string;               // ONIX: <CollectionIdentifier> (z.B. ISSN)
  description?: string;              // ONIX: <TextContent> Type 02/03
  descriptionHTML?: string;          // HTML-Version der Beschreibung
  status: 'completed' | 'ongoing';   // ONIX: <CollectionSequence> Info
  genre?: string;                    // Für Breadcrumb
  genreSlug?: string;                // Für Breadcrumb-Link
  topics?: string[];                 // ONIX: <Subject> MainSubject + Keywords (Code 20)
  books: SeriesBook[];
  totalBooks: number;
  author: {
    name: string;                    // ONIX: <Contributor> → <PersonName>
    slug: string;
    bio: string;                     // ONIX: <TextContent> Type 12
    bioHTML?: string;                // HTML-Version der Bio
    image: string;                   // ONIX: <MediaFile> Code 01
    professionalPosition?: string;   // ONIX: <ProfessionalPosition>
    affiliation?: string;
  };
  publisher: {
    name: string;
    slug: string;
  };
}

const SORT_OPTIONS = [
  { id: 'popularity' as const, label: 'Beliebtheit' },
  { id: 'trending' as const, label: 'Neueste zuerst' },
  { id: 'awarded' as const, label: 'Ausgezeichnet' }
];

export function SeriesPage() {
  const { seriesSlug } = useParams<{ seriesSlug: string }>();
  const navigate = useSafeNavigate();
  const [series, setSeries] = useState<Series | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [seriesSortBy, setSeriesSortBy] = useState<'popularity' | 'trending' | 'awarded'>('popularity');
  const [recommendedSortBy, setRecommendedSortBy] = useState<'popularity' | 'trending' | 'awarded'>('popularity');
  const seriesSortChipsRef = useRef<HTMLDivElement>(null);
  const recommendedSortChipsRef = useRef<HTMLDivElement>(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const mockSeries: Series = {
      name: "Gesundheitsreihe",
      slug: "gesundheitsreihe",
      identifier: "ISSN-1234-5678",  // ONIX: <CollectionIdentifier>
      description: "Eine umfassende Ratgeberreihe für ein gesundes und aktives Leben. Von Bewegung über Ernährung bis hin zu Stressmanagement - alle wichtigen Aspekte der Gesundheit.",
      descriptionHTML: "<p>Eine umfassende Ratgeberreihe für ein <strong>gesundes und aktives Leben</strong>. Von Bewegung über Ernährung bis hin zu Stressmanagement - alle wichtigen Aspekte der Gesundheit.</p>",
      status: 'completed',
      genre: "Ratgeber",         // Für Breadcrumb
      genreSlug: "ratgeber",     // Für Breadcrumb-Link
      topics: ["Bewegung", "Ernährung", "Stressmanagement", "Regeneration"],
      totalBooks: 4,
      books: [
        {
          id: "bewegung-alltag-1",
          title: "Bring Bewegung in deinen Alltag",
          subtitle: "30 Übungen für mehr Vitalität und Gesundheit",
          author: "Mag. Miriam Biritz-Wagenbichler",
          authorSlug: "mag-miriam-biritz-wagenbichler",
          bookSlug: "bring-bewegung-in-deinen-alltag",
          collectionNumber: 1,
          price: "19,99 €",
          isbn: "978-3-7423-2134-5",
          publisher: "Selfpublishing",
          publisherSlug: "selfpublishing",
          year: 2024,
          coverImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop",
          description: "Praktische Tipps für mehr Bewegung im Alltag"
        },
        {
          id: "gesundheitsreihe-2",
          title: "Ernährung für ein langes Leben",
          author: "Mag. Miriam Biritz-Wagenbichler",
          authorSlug: "mag-miriam-biritz-wagenbichler",
          bookSlug: "ernaehrung-fuer-ein-langes-leben",
          collectionNumber: 2,
          price: "19,99 €",
          isbn: "978-3-7423-2135-2",
          publisher: "Selfpublishing",
          publisherSlug: "selfpublishing",
          year: 2024,
          coverImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=600&fit=crop",
          description: "Gesunde Ernährung für ein langes und vitales Leben"
        },
        {
          id: "gesundheitsreihe-3",
          title: "Stressmanagement im Alltag",
          author: "Mag. Miriam Biritz-Wagenbichler",
          authorSlug: "mag-miriam-biritz-wagenbichler",
          bookSlug: "stressmanagement-im-alltag",
          collectionNumber: 3,
          price: "18,99 €",
          isbn: "978-3-7423-2136-9",
          publisher: "Selfpublishing",
          publisherSlug: "selfpublishing",
          year: 2024,
          coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop",
          description: "Effektive Strategien gegen Stress und Überlastung"
        },
        {
          id: "gesundheitsreihe-4",
          title: "Regeneration & Schlaf",
          author: "Mag. Miriam Biritz-Wagenbichler",
          authorSlug: "mag-miriam-biritz-wagenbichler",
          bookSlug: "regeneration-und-schlaf",
          collectionNumber: 4,
          price: "19,99 €",
          isbn: "978-3-7423-2137-6",
          publisher: "Selfpublishing",
          publisherSlug: "selfpublishing",
          year: 2024,
          coverImage: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=600&fit=crop",
          description: "Optimale Erholung für Körper und Geist"
        }
      ],
      author: {
        name: "Mag. Miriam Biritz-Wagenbichler",
        slug: "mag-miriam-biritz-wagenbichler",
        bio: "Mag. Miriam Biritz-Wagenbichler ist eine Expertin für Gesundheit und Wohlbefinden. Sie hat sich auf die Themen Bewegung, Ernährung und Stressmanagement spezialisiert und veröffentlicht mehrere Bücher zu diesen Themen.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        professionalPosition: "Gesundheitsexpertin",
        affiliation: "Universität Wien"
      },
      publisher: {
        name: "Selfpublishing",
        slug: "selfpublishing"
      }
    };

    setSeries(mockSeries);
    
    // Mock-Daten für verwandte Bücher mit ONIX Tags
    const mockRelatedBooks: RelatedBook[] = [
      {
        id: "yoga-alltag",
        title: "Yoga für den Alltag",
        author: "Anna Schmidt",
        authorSlug: "anna-schmidt",
        bookSlug: "yoga-fuer-den-alltag",
        price: "22,99 €",
        isbn: "978-3-1234-5678-9",
        publisher: "Wellness Verlag",
        year: 2023,
        coverImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=600&fit=crop",
        description: "Einfache Yoga-Übungen für jeden Tag",
        mainSubject: "Gesundheit",
        keywords: ["Bewegung", "Regeneration", "Entspannung"]
      },
      {
        id: "plant-based-nutrition",
        title: "Pflanzliche Ernährung leicht gemacht",
        author: "Dr. Maria Grün",
        authorSlug: "dr-maria-gruen",
        bookSlug: "pflanzliche-ernaehrung-leicht-gemacht",
        price: "24,99 €",
        isbn: "978-3-2345-6789-0",
        publisher: "GreenLife Verlag",
        year: 2024,
        coverImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=600&fit=crop",
        description: "Der ultimative Guide für gesunde pflanzliche Ernährung",
        mainSubject: "Gesundheit",
        keywords: ["Ernährung", "Gesundheit", "Vitalität"]
      },
      {
        id: "mindfulness-daily",
        title: "Achtsamkeit im Alltag",
        author: "Thomas Ruhig",
        authorSlug: "thomas-ruhig",
        bookSlug: "achtsamkeit-im-alltag",
        price: "19,99 €",
        isbn: "978-3-3456-7890-1",
        publisher: "Zen Verlag",
        year: 2023,
        coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop",
        description: "Meditation und Achtsamkeit für Anfänger",
        mainSubject: "Gesundheit",
        keywords: ["Stressmanagement", "Regeneration", "Meditation"]
      },
      {
        id: "sleep-better",
        title: "Besser schlafen in 30 Tagen",
        author: "Dr. Petra Traum",
        authorSlug: "dr-petra-traum",
        bookSlug: "besser-schlafen-in-30-tagen",
        price: "21,99 €",
        isbn: "978-3-4567-8901-2",
        publisher: "Schlafgut Verlag",
        year: 2024,
        coverImage: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=600&fit=crop",
        description: "Wissenschaftlich fundierte Methoden für erholsamen Schlaf",
        mainSubject: "Gesundheit",
        keywords: ["Regeneration", "Schlaf", "Gesundheit"]
      },
      {
        id: "strength-training-women",
        title: "Krafttraining für Frauen",
        author: "Lisa Stark",
        authorSlug: "lisa-stark",
        bookSlug: "krafttraining-fuer-frauen",
        price: "26,99 €",
        isbn: "978-3-5678-9012-3",
        publisher: "FitLife Verlag",
        year: 2023,
        coverImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop",
        description: "Effektives Krafttraining speziell für Frauen",
        mainSubject: "Fitness",
        keywords: ["Bewegung", "Kraft", "Training"]
      },
      {
        id: "intermittent-fasting",
        title: "Intervallfasten - Der Praxis-Guide",
        author: "Dr. Hans Fasten",
        authorSlug: "dr-hans-fasten",
        bookSlug: "intervallfasten-der-praxis-guide",
        price: "18,99 €",
        isbn: "978-3-6789-0123-4",
        publisher: "Gesundheitsverlag",
        year: 2024,
        coverImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=600&fit=crop",
        description: "Alles über Intervallfasten und seine Vorteile",
        mainSubject: "Gesundheit",
        keywords: ["Ernährung", "Gesundheit", "Abnehmen"]
      },
      {
        id: "burnout-prevention",
        title: "Burnout vorbeugen",
        author: "Sarah Balance",
        authorSlug: "sarah-balance",
        bookSlug: "burnout-vorbeugen",
        price: "23,99 €",
        isbn: "978-3-7890-1234-5",
        publisher: "Work-Life Verlag",
        year: 2023,
        coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop",
        description: "Strategien für ein ausgewogenes Leben ohne Burnout",
        mainSubject: "Psychologie",
        keywords: ["Stressmanagement", "Gesundheit", "Work-Life-Balance"]
      },
      {
        id: "recovery-methods",
        title: "Moderne Regenerationsmethoden",
        author: "Prof. Dr. Stefan Fit",
        authorSlug: "prof-dr-stefan-fit",
        bookSlug: "moderne-regenerationsmethoden",
        price: "29,99 €",
        isbn: "978-3-8901-2345-6",
        publisher: "Sportmedizin Verlag",
        year: 2024,
        coverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
        description: "Von Kryotherapie bis Wärmebehandlung - alles über Regeneration",
        mainSubject: "Sportmedizin",
        keywords: ["Regeneration", "Sport", "Gesundheit"]
      }
    ];
    
    // ONIX Tag-Matching: Berechne Überschneidungen mit Serien-Topics
    const booksWithScores = mockRelatedBooks.map(book => {
      const seriesTopics = mockSeries.topics || [];
      let score = 0;
      
      // MainSubject Match (höhere Gewichtung)
      if (book.mainSubject && seriesTopics.some(t => t.toLowerCase().includes(book.mainSubject!.toLowerCase()))) {
        score += 3;
      }
      
      // Keyword Matches (1 Punkt pro Übereinstimmung)
      book.keywords.forEach(keyword => {
        if (seriesTopics.some(t => t.toLowerCase() === keyword.toLowerCase())) {
          score += 1;
        }
      });
      
      return { book, score };
    });
    
    // Sortiere nach Score (höchste zuerst) und nehme max. 20
    const sortedByScore = booksWithScores
      .filter(item => item.score > 0)  // Nur Bücher mit Überschneidungen
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(item => item.book);
    
    setRelatedBooks(sortedByScore);
    setLoading(false);
  }, [seriesSlug]);

  // Apply sorting to series books (must be before any early returns)
  const sortedSeriesBooks = useMemo(() => {
    if (!series?.books) return [];
    
    if (seriesSortBy === 'awarded') {
      return [...series.books].sort((a, b) => {
        // Sort by collectionNumber since we don't have awards data
        return a.collectionNumber - b.collectionNumber;
      });
    } else if (seriesSortBy === 'trending') {
      return [...series.books].sort((a, b) => {
        const aNum = a.collectionNumber || 0;
        const bNum = b.collectionNumber || 0;
        return bNum - aNum; // Newest volumes first
      });
    }
    
    // Default: popularity (series order)
    return [...series.books].sort((a, b) => {
      const aNum = a.collectionNumber || 0;
      const bNum = b.collectionNumber || 0;
      return aNum - bNum; // Series order
    });
  }, [series?.books, seriesSortBy]);

  // Sortierung für verwandte Bücher
  const sortedRelatedBooks = useMemo(() => {
    if (!relatedBooks.length) return [];
    
    if (recommendedSortBy === 'trending') {
      return [...relatedBooks].sort((a, b) => b.year - a.year);
    } else if (recommendedSortBy === 'awarded') {
      return [...relatedBooks].sort((a, b) => a.title.localeCompare(b.title));
    }
    
    // Default: popularity (bereits nach ONIX-Match sortiert)
    return relatedBooks;
  }, [relatedBooks, recommendedSortBy]);

  // Generate author ID for favorites
  const authorId = series?.author.slug || '';

  if (loading) {
    return (
      <>
        <Header />
        <div className="gradient-bg min-h-screen flex items-center justify-center">
          <Container>
          <div className="text-center" role="status" aria-live="polite">
            <div 
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
              style={{ borderColor: 'var(--color-blue)' }}
              aria-hidden="true"
            />
            <Text variant="body" className="text-foreground">
              Lädt Serie...
            </Text>
          </div>
        </Container>
        </div>
        <Footer />
      </>
    );
  }

  if (!series) {
    return (
      <>
        <Header />
        <div className="gradient-bg min-h-screen">
          <Container>
          <Section variant="default">
            <div className="text-center">
              <Heading as="h1" variant="h1" className="mb-6 text-foreground">
                Serie nicht gefunden
              </Heading>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: 'var(--color-blue)',
                  color: 'var(--color-surface)',
                  fontFamily: 'var(--font-family-headline)'
                }}
              >
                Zurück zur Startseite
              </button>
            </div>
          </Section>
        </Container>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
        {/* Schema.org JSON-LD für Buchreihe - ONIX 3.0 compliant */}
      <Helmet>
        <title>{series.name} - Alle Bücher der Reihe | coratiert.de</title>
        <meta name="description" content={series.description} />
        <link rel="canonical" href={`https://coratiert.de/serien/${series.slug}/`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BookSeries",
            "@id": `https://coratiert.de/reihen/${series.slug}/`,
            "name": series.name,
            "identifier": series.identifier,
            "description": series.description,
            "numberOfItems": series.totalBooks,
            "url": `https://coratiert.de/reihen/${series.slug}/`,
            "genre": series.genre,
            "author": {
              "@type": "Person",
              "@id": `https://coratiert.de/autoren/${series.author.slug}/`,
              "name": series.author.name,
              "description": series.author.bio,
              "image": series.author.image,
              "jobTitle": series.author.professionalPosition
            },
            "publisher": {
              "@type": "Organization",
              "@id": `https://coratiert.de/verlage/${series.publisher.slug}/`,
              "name": series.publisher.name
            },
            "hasPart": sortedSeriesBooks.map(book => ({
            "@type": "Book",
            "name": book.title,
            "position": book.collectionNumber,
            "isbn": book.isbn?.replace(/-/g, ''), // ISBN ohne Bindestriche
            "image": book.coverImage,
            "author": {
              "@type": "Person",
              "name": book.author,
              "url": `https://coratiert.de/autoren/${book.authorSlug}/`
            },
            "publisher": {
              "@type": "Organization",
              "name": book.publisher
            },
            "datePublished": book.year.toString(),
            "offers": {
              "@type": "Offer",
              "price": book.price.replace(/[^\d,]/g, '').replace(',', '.'),
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `https://coratiert.de/buecher/${book.bookSlug}/`
            }
          }))
        })}
        </script>
      </Helmet>

      {/* Breadcrumb - mit Genre */}
      <Breadcrumb 
        items={[
          { label: "Start", href: "/", onClick: () => navigate('/') },
          ...(series.genre && series.genreSlug ? [{ 
            label: series.genre, 
            href: `/genre/${series.genreSlug}/`,
            onClick: () => navigate(`/genre/${series.genreSlug}/`) 
          }] : [{ label: "Bücher", href: "/", onClick: () => navigate('/') }]),
          { 
            label: series.author.name, 
            href: `/autoren/${series.author.slug}/`,
            onClick: () => navigate(`/autoren/${series.author.slug}/`) 
          },
          { label: `${series.name} (Reihe)` }
        ]}
      />

      {/* 1. Hero-Sektion: Der Reihen-Kontext */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            {/* Reihen-Titel (H1) */}
            <Heading as="h1" variant="h1" className="mb-4 !text-white">
              {series.name} von {series.author.name}
            </Heading>
            
            {/* Reihen-Info: Beschreibung (HTML-Support) */}
            {series.descriptionHTML ? (
              <div 
                className="max-w-3xl text-white"
                style={{ 
                  fontSize: 'var(--fluid-body)',
                  lineHeight: '1.6' 
                }}
                dangerouslySetInnerHTML={{ __html: series.descriptionHTML }}
              />
            ) : series.description && (
              <Text variant="large" className="max-w-3xl !text-white">
                {series.description}
              </Text>
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
                    src={series.author.image}
                    alt={series.author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1 self-center">
                <div className="inline-flex items-center gap-1.5">
                  <span className="kuratorname text-blue inline-block">
                    {series.author.name}
                  </span>
                </div>

                {/* Focus - Autorin */}
                <div className="flex flex-wrap items-center gap-x-2 mt-1">
                  {series.author.professionalPosition && (
                    <Text 
                      as="span"
                      variant="xs" 
                      className="text-foreground"
                    >
                      {series.author.professionalPosition}
                    </Text>
                  )}
                  {series.author.professionalPosition && series.author.affiliation && (
                    <span className="text-foreground">·</span>
                  )}
                  {series.author.affiliation && (
                    <Text 
                      as="span"
                      variant="xs" 
                      className="text-foreground"
                    >
                      {series.author.affiliation}
                    </Text>
                  )}
                </div>
              </div>
            </div>

            {/* Author Button (Saffron) + Topic Buttons (Coral) */}
            <div className="w-full mt-4">
              <div className="flex flex-wrap gap-2">
                {/* Autor-Button - Saffron */}
                <a 
                  href={`/autoren/${series.author.slug}/`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/autoren/${series.author.slug}/`);
                  }}
                  className="px-3 py-1.5 border border-transparent hover:border-blue rounded-full transition-all duration-200 inline-flex items-center gap-2 shadow-lg"
                  style={{ backgroundColor: 'var(--color-saffron)' }}
                >
                  <Text as="span" variant="small" className="text-white font-semibold whitespace-nowrap">
                    {series.author.name}
                  </Text>
                  <LikeButton 
                    entityId={authorId}
                    entityType="creator"
                    entityTitle={series.author.name}
                    variant="minimal"
                    size="sm"
                    iconColor="#ffffff"
                    backgroundColor="var(--color-saffron)"
                  />
                </a>

                {/* Verlags-Button - Teal (nur zeigen wenn echter Verlag) */}
                {isRealPublisher(series.publisher.name) && (
                  <a 
                    href={`/verlage/${series.publisher.slug}/`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/verlage/${series.publisher.slug}/`);
                    }}
                    className="px-3 py-1.5 border border-transparent hover:border-blue rounded-full transition-all duration-200 inline-flex items-center gap-2 shadow-lg"
                    style={{ backgroundColor: 'var(--color-teal)' }}
                  >
                    <Text as="span" variant="small" className="text-white font-semibold whitespace-nowrap">
                      {series.publisher.name}
                    </Text>
                    <LikeButton 
                      entityId={series.publisher.slug}
                      entityType="publisher"
                      entityTitle={series.publisher.name}
                      variant="minimal"
                      size="sm"
                      iconColor="#ffffff"
                      backgroundColor="var(--color-teal)"
                    />
                  </a>
                )}

                {/* Topic-Buttons (ONIX: <Subject> Keywords) - Coral */}
                {series.topics && series.topics.map((topic, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 border border-transparent hover:border-blue rounded-full transition-all duration-200 inline-flex items-center gap-2 shadow-lg bg-coral cursor-pointer"
                    onClick={() => {
                      // Optional: Navigation zu Topic-Seite
                      console.log(`Topic clicked: ${topic}`);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        console.log(`Topic clicked: ${topic}`);
                      }
                    }}
                  >
                    <Text as="span" variant="small" className="text-white font-semibold whitespace-nowrap">
                      {topic}
                    </Text>
                    <LikeButton 
                      entityId={`topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                      entityType="topic"
                      entityTitle={topic}
                      variant="minimal"
                      size="sm"
                      iconColor="#ffffff"
                      backgroundColor="var(--vibrant-coral)"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bio-Block wie curationReason */}
            {series.author.bio && (
              <div className="w-full mt-4">
                <Text 
                  as="div"
                  variant="body"
                  style={
                    series.author.bio.length > 330 && !showMoreInfo
                      ? {
                          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        }
                      : undefined
                  }
                  className={`leading-relaxed ${
                    series.author.bio.length > 330 && !showMoreInfo ? 'line-clamp-3' : ''
                  } text-foreground`}
                >
                  {series.author.bio}
                </Text>
                {series.author.bio.length > 330 && (
                  <button
                    onClick={() => setShowMoreInfo(!showMoreInfo)}
                    className="font-headline flex items-center gap-1 mt-2 text-blue hover:text-blue hover:opacity-80 uppercase tracking-tight transition-colors"
                    aria-expanded={showMoreInfo}
                    aria-label={showMoreInfo ? 'Bio-Text einklappen' : 'Bio-Text vollständig anzeigen'}
                  >
                    <Text as="span" variant="xs" className="text-blue">
                      {showMoreInfo ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                    </Text>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-300 ${showMoreInfo ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* 3. Die Band-Liste: Chronologische Übersicht */}
      <Section variant="default" className="!pt-4 !pb-12">
        <Container>
          <Heading 
            as="h3"
            variant="h3"
            className="mb-4 text-foreground"
          >
            Bücher aus der Reihe „{series.name}"{series.status && ` - ${series.status === 'completed' ? 'Abgeschlossene Serie' : 'Laufende Serie'}`}
          </Heading>
          
          {/* Sort Chips */}
          <div className="mb-4 flex justify-end">
            <div 
              ref={seriesSortChipsRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full md:flex-wrap md:overflow-visible"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {SORT_OPTIONS.map((option) => {
                const isActive = seriesSortBy === option.id;
                
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSeriesSortBy(option.id as 'popularity' | 'trending' | 'awarded')}
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
          
          <CarouselContainer
            showDesktopButtons={sortedSeriesBooks.length >= 6}
            showMobileButtons={sortedSeriesBooks.length >= 3}
            className="pb-4"
            buttonOffset={8}
          >
            <div className="flex -ml-4">
                {sortedSeriesBooks.map((seriesBook) => {
                  const bookData: BookCarouselItemData = {
                    id: seriesBook.id,
                    title: seriesBook.title,
                    author: seriesBook.author,
                    coverImage: seriesBook.coverImage,
                    price: seriesBook.price,
                    isbn: seriesBook.isbn,
                    publisher: seriesBook.publisher,
                    year: seriesBook.year.toString(),
                    shortDescription: seriesBook.description,
                    collectionNumber: seriesBook.collectionNumber
                  };
                  
                  return (
                    <div key={seriesBook.id} className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 pl-4">
                      <BookCarouselItem 
                        book={bookData}
                        size="md"
                      />
                    </div>
                  );
                })}
              </div>
          </CarouselContainer>
          
          {/* Call-to-Action - Alle Bücher vom Autor */}
          <div className="flex justify-center mt-8">
            <a
              href={`/autoren/${series.author.slug}/`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/autoren/${series.author.slug}/`);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: 'var(--color-blue)',
                color: 'var(--color-surface)',
                fontFamily: 'var(--font-family-headline)',
                fontSize: '16px'
              }}
            >
              Alle Bücher von {series.author.name.split(' ')[0]} entdecken
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </Container>
      </Section>

      {/* 4. Könnte dich auch interessieren - ONIX Tag-basierte Empfehlungen */}
      {sortedRelatedBooks.length > 0 && (
        <Section variant="default" className="!pt-8 !pb-12">
          <Container>
            <Heading 
              as="h3"
              variant="h3"
              className="mb-4 text-foreground"
            >
              Könnte dich auch interessieren
            </Heading>
            
            <Text variant="body" className="mb-6 text-foreground/80">
              Bücher mit ähnlichen Themen – sortiert nach größter Übereinstimmung
            </Text>
            
            {/* Sort Chips */}
            <div className="mb-4 flex justify-end">
              <div 
                ref={recommendedSortChipsRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full md:flex-wrap md:overflow-visible"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {SORT_OPTIONS.map((option) => {
                  const isActive = recommendedSortBy === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRecommendedSortBy(option.id as 'popularity' | 'trending' | 'awarded')}
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
            
            <CarouselContainer
              showDesktopButtons={sortedRelatedBooks.length >= 6}
              showMobileButtons={sortedRelatedBooks.length >= 3}
              className="pb-4"
              buttonOffset={8}
            >
              <div className="flex -ml-4">
                  {sortedRelatedBooks.map((relatedBook) => {
                    const bookData: BookCarouselItemData = {
                      id: relatedBook.id,
                      title: relatedBook.title,
                      author: relatedBook.author,
                      coverImage: relatedBook.coverImage,
                      price: relatedBook.price,
                      isbn: relatedBook.isbn,
                      publisher: relatedBook.publisher,
                      year: relatedBook.year.toString(),
                      shortDescription: relatedBook.description
                    };
                    
                    return (
                      <div key={relatedBook.id} className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 pl-4">
                        <BookCarouselItem 
                          book={bookData}
                          size="md"
                        />
                      </div>
                    );
                  })}
                </div>
            </CarouselContainer>
          </Container>
        </Section>
      )}
      </div>
      <Footer />
    </>
  );
}