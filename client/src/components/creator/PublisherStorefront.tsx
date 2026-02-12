import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSafeNavigate } from '../../utils/routing';
import { Search, Heart, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Container, Section, Heading, Text } from '../ui';
import { BookCarouselItem, type BookCarouselItemData } from '../book/BookCarouselItem';
import { LikeButton } from '../favorites/LikeButton';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { isRealPublisher } from '../../utils/publisherUtils';
import { useFavorites } from '../favorites/FavoritesContext';
import { getPublisherLogoUrl, getPublisherLogoSchemaOrg, type PublisherLogoData } from '../../utils/publisherLogoUtils';

interface PublisherBook {
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
  collectionNumber?: number;
  seriesName?: string;
  seriesSlug?: string;
  productForm?: string;
  awardsCount?: number;
}

interface PublisherAuthor {
  id: string;
  name: string;
  slug: string;
  photo: string;
  bio: string;
  shortBio?: string;
  booksCount: number;
  followersCount: number;
  tags: string[];
}

interface Publisher {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  shortDescription?: string;
  booksCount: number;
  followersCount: number;
  foundingYear?: number;
  website?: string;
  tags: string[];
}

const SORT_OPTIONS = [
  { id: 'newest' as const, label: 'Neueste zuerst' },
  { id: 'oldest' as const, label: 'Älteste zuerst' },
  { id: 'popularity' as const, label: 'Beliebtheit' },
  { id: 'awarded' as const, label: 'Ausgezeichnet' },
];

const FORMAT_OPTIONS = [
  { id: 'all' as const, label: 'Alle Formate' },
  { id: 'hardcover' as const, label: 'Hardcover' },
  { id: 'paperback' as const, label: 'Taschenbuch' },
  { id: 'ebook' as const, label: 'E-Book' },
];

export function PublisherStorefront() {
  const { publisherId } = useParams<{ publisherId: string }>();
  const navigate = useSafeNavigate();
  
  // Redirect if trying to access selfpublishing page
  useEffect(() => {
    if (publisherId && !isRealPublisher(publisherId)) {
      navigate('/', { replace: true });
    }
  }, [publisherId, navigate]);

  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [books, setBooks] = useState<PublisherBook[]>([]);
  const [authors, setAuthors] = useState<PublisherAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'books' | 'authors'>('books');
  
  // Books filters
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popularity' | 'awarded'>('newest');
  const [formatFilter, setFormatFilter] = useState<'all' | 'hardcover' | 'paperback' | 'ebook'>('all');
  
  // Authors filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [showMoreDescription, setShowMoreDescription] = useState(false);
  const sortChipsRef = useRef<HTMLDivElement>(null);
  const formatChipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock data - in production, fetch from backend
    const mockPublisher: Publisher = {
      id: 'heyne',
      name: 'Heyne Verlag',
      slug: 'heyne',
      logo: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
      description: 'Der Heyne Verlag ist einer der bekanntesten deutschsprachigen Verlage und gehört zur Penguin Random House Verlagsgruppe. Seit 1934 publiziert Heyne ein breites Spektrum an Büchern: von internationaler und deutscher Belletristik über spannende Thriller und Fantasy bis hin zu Sachbüchern und Ratgebern. Mit einem vielseitigen Programm erreicht der Verlag Millionen von Leserinnen und Lesern weltweit.',
      shortDescription: 'Belletristik, Thriller, Fantasy und Sachbuch seit 1934',
      booksCount: 2100,
      followersCount: 16200,
      foundingYear: 1934,
      website: 'https://www.heyne.de',
      tags: ['Belletristik', 'Thriller', 'Fantasy', 'Sachbuch']
    };

    const mockBooks: PublisherBook[] = [
      {
        id: 'book-1',
        title: 'Die Welle',
        author: 'Morton Rhue',
        authorSlug: 'morton-rhue',
        bookSlug: 'die-welle',
        price: '9.99 €',
        isbn: '978-3-453-54321-0',
        publisher: 'Heyne',
        year: 2024,
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
        description: 'Ein packender Jugendroman über ein Experiment',
        productForm: 'paperback',
        awardsCount: 3
      },
      {
        id: 'book-2',
        title: 'Der Schwarm',
        author: 'Frank Schätzing',
        authorSlug: 'frank-schaetzing',
        bookSlug: 'der-schwarm',
        price: '14.99 €',
        isbn: '978-3-453-43210-1',
        publisher: 'Heyne',
        year: 2023,
        coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
        description: 'Spannender Science-Thriller',
        productForm: 'hardcover',
        awardsCount: 5
      },
      {
        id: 'book-3',
        title: 'Tintenherz',
        author: 'Cornelia Funke',
        authorSlug: 'cornelia-funke',
        bookSlug: 'tintenherz',
        price: '12.99 €',
        isbn: '978-3-453-26789-3',
        publisher: 'Heyne',
        year: 2023,
        coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
        description: 'Fantastische Abenteuergeschichte',
        productForm: 'hardcover',
        awardsCount: 2
      },
      {
        id: 'book-4',
        title: 'Der Medicus',
        author: 'Noah Gordon',
        authorSlug: 'noah-gordon',
        bookSlug: 'der-medicus',
        price: '11.99 €',
        isbn: '978-3-453-19876-2',
        publisher: 'Heyne',
        year: 2022,
        coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop',
        description: 'Historischer Roman',
        productForm: 'paperback',
        awardsCount: 4
      }
    ];

    const mockAuthors: PublisherAuthor[] = [
      {
        id: 'morton-rhue',
        name: 'Morton Rhue',
        slug: 'morton-rhue',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        bio: 'Morton Rhue ist ein amerikanischer Autor, der für seine gesellschaftskritischen Jugendromane bekannt ist.',
        shortBio: 'Amerikanischer Autor gesellschaftskritischer Jugendromane',
        booksCount: 12,
        followersCount: 8500,
        tags: ['Jugendbuch', 'Gesellschaftskritik']
      },
      {
        id: 'frank-schaetzing',
        name: 'Frank Schätzing',
        slug: 'frank-schaetzing',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        bio: 'Frank Schätzing ist ein deutscher Schriftsteller, der mit seinen Science-Thrillern internationale Erfolge feierte.',
        shortBio: 'Deutscher Bestsellerautor von Science-Thrillern',
        booksCount: 8,
        followersCount: 15200,
        tags: ['Thriller', 'Science-Fiction', 'Bestseller']
      },
      {
        id: 'cornelia-funke',
        name: 'Cornelia Funke',
        slug: 'cornelia-funke',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        bio: 'Cornelia Funke ist eine der erfolgreichsten deutschen Kinder- und Jugendbuchautorinnen weltweit.',
        shortBio: 'Internationale Bestseller-Autorin für Kinder- und Jugendbücher',
        booksCount: 24,
        followersCount: 22400,
        tags: ['Fantasy', 'Jugendbuch', 'Bestseller']
      },
      {
        id: 'noah-gordon',
        name: 'Noah Gordon',
        slug: 'noah-gordon',
        photo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop',
        bio: 'Noah Gordon ist ein amerikanischer Autor historischer Romane, der mit "Der Medicus" einen Welterfolg landete.',
        shortBio: 'Autor des Bestsellers "Der Medicus"',
        booksCount: 9,
        followersCount: 11800,
        tags: ['Historischer Roman', 'Bestseller']
      }
    ];

    setPublisher(mockPublisher);
    setBooks(mockBooks);
    setAuthors(mockAuthors);
    setLoading(false);
  }, [publisherId]);

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = [...books];
    
    // Format filter
    if (formatFilter !== 'all') {
      filtered = filtered.filter(book => book.productForm === formatFilter);
    }
    
    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => b.year - a.year);
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => a.year - b.year);
    } else if (sortBy === 'awarded') {
      filtered.sort((a, b) => (b.awardsCount || 0) - (a.awardsCount || 0));
    }
    
    return filtered;
  }, [books, sortBy, formatFilter]);

  // Filter authors
  const filteredAuthors = useMemo(() => {
    let filtered = [...authors];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(author =>
        author.name.toLowerCase().includes(query) ||
        author.bio.toLowerCase().includes(query) ||
        author.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(author =>
        selectedTags.every(tag => author.tags.includes(tag))
      );
    }
    
    return filtered;
  }, [authors, searchQuery, selectedTags]);

  // Get all unique tags from authors
  const allAuthorTags = useMemo(() => {
    const tags = new Set<string>();
    authors.forEach(author => author.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [authors]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <Container>
          <div className="text-center">
            <div 
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
              style={{ borderColor: 'var(--color-blue)' }}
            />
            <Text variant="body" className="text-foreground">
              Lädt Verlag...
            </Text>
          </div>
        </Container>
      </div>
    );
  }

  if (!publisher) {
    return (
      <div className="gradient-bg min-h-screen">
        <Container>
          <Section variant="default">
            <div className="text-center">
              <Heading as="h1" variant="h1" className="mb-6 text-foreground">
                Verlag nicht gefunden
              </Heading>
              <button
                onClick={() => navigate('/verlage')}
                className="px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: 'var(--color-blue)',
                  color: 'var(--color-surface)',
                  fontFamily: 'var(--font-family-headline)'
                }}
              >
                Zurück zur Verlagsübersicht
              </button>
            </div>
          </Section>
        </Container>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Verlage', href: '/verlage' },
    { label: publisher.name, href: `/verlage/${publisher.slug}` }
  ];

  // Prepare logo data for fallback logic
  const logoData: PublisherLogoData = {
    onixLogoUrl: undefined, // In real app: from ONIX <SupportingResource> ResourceContentType 16
    publisherId: publisher.id, // In real app: ONIX <PublisherIdentifier> (GLN/Verkehrsnummer)
    publisherName: publisher.name
  };

  const publisherLogoUrl = getPublisherLogoUrl(logoData);
  const publisherLogoSchemaOrg = getPublisherLogoSchemaOrg(logoData);

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      {/* Schema.org JSON-LD für Verlag - ONIX 3.0 compliant */}
      <Helmet>
        <title>{publisher.name} - Alle Bücher & Programm | coratiert.de</title>
        <meta name="description" content={publisher.description} />
        <link rel="canonical" href={`https://coratiert.de/verlage/${publisher.slug}/`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `https://coratiert.de/verlage/${publisher.slug}/`,
            "name": publisher.name,
            "url": publisher.website || `https://coratiert.de/verlage/${publisher.slug}/`,
            "description": publisher.description,
            ...(publisherLogoSchemaOrg && { "logo": publisherLogoSchemaOrg }),
            ...(publisher.foundingYear && { "foundingDate": publisher.foundingYear.toString() }),
            "sameAs": publisher.website ? [publisher.website] : undefined,
            "publishingPrinciples": `https://coratiert.de/verlage/${publisher.slug}/`,
            "knowsAbout": publisher.tags,
            "numberOfEmployees": {
              "@type": "QuantitativeValue",
              "value": publisher.booksCount,
              "unitText": "Bücher im Katalog"
            },
            "makesOffer": filteredAndSortedBooks.slice(0, 20).map(book => ({
              "@type": "Offer",
              "itemOffered": {
                "@type": "Book",
                "@id": `https://coratiert.de/buecher/${book.bookSlug}/`,
                "name": book.title,
                "isbn": book.isbn?.replace(/-/g, ''),
                "author": {
                  "@type": "Person",
                  "name": book.author,
                  "url": `https://coratiert.de/autoren/${book.authorSlug}/`
                },
                "publisher": {
                  "@type": "Organization",
                  "@id": `https://coratiert.de/verlage/${publisher.slug}/`,
                  "name": publisher.name
                },
                "datePublished": book.year.toString(),
                "image": book.coverImage,
                "description": book.description,
                "bookFormat": book.productForm === 'hardcover' ? 'https://schema.org/Hardcover' : 
                              book.productForm === 'paperback' ? 'https://schema.org/Paperback' : 
                              book.productForm === 'ebook' ? 'https://schema.org/EBook' : 
                              'https://schema.org/Paperback',
                "isPartOf": book.seriesName ? {
                  "@type": "BookSeries",
                  "name": book.seriesName,
                  "position": book.collectionNumber
                } : undefined
              },
              "price": book.price.replace(/[^\d,]/g, '').replace(',', '.'),
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `https://coratiert.de/buecher/${book.bookSlug}/`
            }))
          })}
        </script>
      </Helmet>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Hero Section */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading as="h1" variant="h1" className="mb-4 !text-foreground">
              {publisher.name}
            </Heading>
            {publisher.shortDescription && (
              <Text variant="large" className="!text-foreground">
                {publisher.shortDescription}
              </Text>
            )}
          </div>
        </Container>
      </Section>

      {/* Publisher Profile */}
      <Section variant="compact" className="!pb-4">
        <Container>
          <div className="w-full text-base leading-normal text-left">
            <div className="flex items-center gap-3 md:gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-cerulean ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  <ImageWithFallback
                    src={publisher.logo}
                    alt={publisher.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1 self-center">
                <div className="inline-flex items-center gap-1.5">
                  <span className="kuratorname text-blue inline-block">
                    {publisher.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 mt-1">
                  {publisher.foundingYear && (
                    <Text as="span" variant="xs" className="text-foreground">
                      Gegründet {publisher.foundingYear}
                    </Text>
                  )}
                  {publisher.foundingYear && publisher.booksCount && (
                    <span className="text-foreground">·</span>
                  )}
                  {publisher.booksCount && (
                    <Text as="span" variant="xs" className="text-foreground">
                      {publisher.booksCount.toLocaleString()} Bücher
                    </Text>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="w-full mt-4">
              <div className="flex flex-wrap gap-2">
                {/* Verlags-Tag - Teal */}
                <div 
                  className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg"
                  style={{ backgroundColor: 'var(--color-teal)' }}
                >
                  <Text as="span" variant="small" className="text-white font-semibold whitespace-nowrap">
                    {publisher.name}
                  </Text>
                  <LikeButton 
                    entityId={publisher.slug}
                    entityType="publisher"
                    entityTitle={publisher.name}
                    variant="minimal"
                    size="sm"
                    iconColor="#ffffff"
                    backgroundColor="var(--color-teal)"
                  />
                </div>

                {/* Thementags - Coral */}
                {publisher.tags.map((tag) => (
                  <div 
                    key={tag}
                    className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg bg-coral cursor-pointer hover:scale-105 transition-all duration-200"
                    onClick={() => navigate(`/tags/${tag.toLowerCase().replace(/\s+/g, '-')}/`)}
                  >
                    <Text as="span" variant="small" className="text-white font-semibold whitespace-nowrap">
                      {tag}
                    </Text>
                    <LikeButton 
                      entityId={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                      entityType="tag"
                      entityTitle={tag}
                      variant="minimal"
                      size="sm"
                      iconColor="#ffffff"
                      backgroundColor="var(--vibrant-coral)"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {publisher.description && (
              <div className="w-full mt-4">
                <Text 
                  as="div"
                  variant="body"
                  style={
                    publisher.description.length > 330 && !showMoreDescription
                      ? {
                          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        }
                      : undefined
                  }
                  className={`leading-relaxed ${
                    publisher.description.length > 330 && !showMoreDescription ? 'line-clamp-3' : ''
                  } text-foreground`}
                >
                  {publisher.description}
                </Text>
                {publisher.description.length > 330 && (
                  <button
                    onClick={() => setShowMoreDescription(!showMoreDescription)}
                    className="font-headline flex items-center gap-1 mt-2 text-blue hover:text-blue hover:opacity-80 uppercase tracking-tight transition-colors"
                  >
                    <Text as="span" variant="xs" className="text-blue">
                      {showMoreDescription ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                    </Text>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-300 ${showMoreDescription ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* Tabs */}
      <Section variant="compact" className="!pt-4 !pb-2">
        <Container>
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('books')}
              className={`pb-3 px-4 font-headline text-lg transition-colors relative ${
                activeTab === 'books' 
                  ? 'text-blue' 
                  : 'text-foreground hover:text-blue'
              }`}
            >
              Bücher
              {activeTab === 'books' && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: 'var(--color-blue)' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('authors')}
              className={`pb-3 px-4 font-headline text-lg transition-colors relative ${
                activeTab === 'authors' 
                  ? 'text-blue' 
                  : 'text-foreground hover:text-blue'
              }`}
            >
              Autoren
              {activeTab === 'authors' && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: 'var(--color-blue)' }}
                />
              )}
            </button>
          </div>
        </Container>
      </Section>

      {/* Books Tab */}
      {activeTab === 'books' && (
        <Section variant="default" className="!pt-4 !pb-12">
          <Container>
            <Heading as="h3" variant="h3" className="mb-4 text-foreground">
              Bücher von {publisher.name}
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
                      >
                        <Text as="span" variant="xs" className="whitespace-nowrap !normal-case !tracking-normal !font-semibold">
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
                      >
                        <Text as="span" variant="xs" className="whitespace-nowrap !normal-case !tracking-normal !font-semibold">
                          {option.label}
                        </Text>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Books Grid */}
            {filteredAndSortedBooks.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
                    seriesSlug: book.seriesSlug
                  };
                  
                  return (
                    <div key={book.id}>
                      <BookCarouselItem book={bookData} size="md" />
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
      )}

      {/* Authors Tab */}
      {activeTab === 'authors' && (
        <Section variant="default" className="!pt-4 !pb-12">
          <Container>
            <Heading as="h3" variant="h3" className="mb-4 text-foreground">
              Autoren bei {publisher.name}
            </Heading>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground opacity-50" />
                <input
                  type="text"
                  placeholder="Autoren durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue focus:ring-2 focus:ring-blue focus:ring-opacity-20 transition-colors"
                  style={{ 
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-foreground)'
                  }}
                />
              </div>
            </div>

            {/* Tag Filter */}
            {allAuthorTags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {allAuthorTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`tag-button ${selectedTags.includes(tag) ? 'tag-button-active' : ''}`}
                    >
                      {tag}
                      <Heart className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Authors Grid */}
            {filteredAuthors.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {filteredAuthors.map((author) => (
                  <div
                    key={author.id}
                    onClick={() => navigate(`/autoren/${author.slug}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/autoren/${author.slug}`);
                      }
                    }}
                    className="author-card group"
                    role="article"
                    tabIndex={0}
                    aria-label={`Autor ${author.name}, ${author.booksCount} Bücher, ${author.followersCount} Follower`}
                  >
                    {/* Author Photo */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <ImageWithFallback
                        src={author.photo}
                        alt={`Porträt von ${author.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Stats Overlay */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex gap-3 author-stats">
                          <span>
                            {author.booksCount} Bücher
                          </span>
                          <span>
                            {author.followersCount.toLocaleString()} Follower
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Author Info */}
                    <div className="p-4">
                      <Heading className="text-base mb-2 author-card-name">
                        {author.name}
                      </Heading>
                      <Text className="text-xs mb-3 author-card-bio">
                        {author.shortBio || (author.bio.length > 80 ? author.bio.substring(0, 80).trim() + '...' : author.bio)}
                      </Text>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {author.tags.slice(0, 2).map(tag => (
                          <button
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTag(tag);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleTag(tag);
                              }
                            }}
                            className="tag-button tag-button-small"
                            aria-pressed={selectedTags.includes(tag)}
                          >
                            {tag}
                            <Heart className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heading as="h4" variant="h4" className="mb-2 text-foreground">
                  Keine Autoren gefunden
                </Heading>
                <Text variant="body" className="text-foreground">
                  Versuche es mit anderen Suchkriterien
                </Text>
              </div>
            )}
          </Container>
        </Section>
      )}
    </div>
  );
}