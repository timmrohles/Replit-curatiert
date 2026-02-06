import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSafeNavigate } from "../utils/routing";
import { Share2, ShoppingCart, ArrowLeft, ExternalLink, Award, Sparkles, BookOpen } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Button } from "../ui/button";
import { LikeButton } from "../favorites/LikeButton";
import { Breadcrumb } from "../layout/Breadcrumb";
import { getBookById, getAllONIXTags, ONIXTag, Book } from "../../utils/api";
import { BookSchema } from "../seo/BookSchema";
import { SimilarBooksSection } from "./SimilarBooksSection";
import { SerieBadgeComponent } from "../common/SerieBadge";
import { getBookImageMetadata } from "../../utils/onixImageMetadata";
import { Heading, Text } from "../ui/typography";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { DSButton } from "./design-system/DSButton";

// ✅ SAFE ROUTING: Import new utilities
import { getValidatedParam } from "../utils/routing";
import { LoadingState, ErrorState, NotFoundState } from "../utils/pageState";
import { fetchWithTimeout } from "../utils/safeApi";

/**
 * Dynamic Book Detail Page
 * Loads real book data from the API and displays ONIX tags
 * Optimized for ONIX data display with Schema.org integration
 */
export function BookDetailPageDynamic() {
  const params = useParams<{ bookId: string }>();
  const navigate = useSafeNavigate();
  
  // ✅ PARAM GUARD: Validate bookId immediately
  const bookId = getValidatedParam(params.bookId);
  
  const [book, setBook] = useState<Book | null>(null);
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // ✅ PARAM GUARD: If bookId is invalid, show 404
  if (!bookId) {
    return <NotFoundState resourceType="Buch" message="Die Buch-ID ist ungültig." />;
  }

  // Load book and ONIX tags
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [bookData, tagsData] = await Promise.all([
          getBookById(bookId),
          getAllONIXTags()
        ]);

        if (!isMounted) return;

        if (!bookData) {
          setBook(null);
          setLoading(false);
          return;
        }

        setBook(bookData);
        setOnixTags(tagsData || []);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error loading book:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden des Buches');
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  // Get ONIX tags for this book
  const bookTags = onixTags.filter(tag => 
    book?.onixTagIds?.includes(tag.id) && tag.visible
  );

  // Separate prominent tags (Serie, Band, Status, Feeling)
  const serieTags = bookTags.filter(t => t.type === 'Serie');
  const bandTags = bookTags.filter(t => t.type === 'Band');
  const statusTags = bookTags.filter(t => t.type === 'Status');
  const feelingTags = bookTags.filter(t => t.type === 'Feeling');
  
  // Other tags (Genre, Schauplatz, Herkunft, etc.)
  const otherTags = bookTags.filter(t => 
    !['Serie', 'Band', 'Status', 'Feeling'].includes(t.type)
  );

  // Group tags by type
  const tagsByType: Record<string, ONIXTag[]> = {};
  otherTags.forEach(tag => {
    if (!tagsByType[tag.type]) {
      tagsByType[tag.type] = [];
    }
    tagsByType[tag.type].push(tag);
  });

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Schau dir dieses Buch an: ${book?.title} von ${book?.author}`);
    
    const shareUrls: { [key: string]: string } = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      email: `mailto:?subject=${encodeURIComponent(book?.title || '')}&body=${text}%20${url}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
      setShareDialogOpen(false);
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'Status':
      case 'Auszeichnung': return '🏆';
      case 'Feeling':
      case 'Motiv (MVB)': return '💫';
      case 'Serie': return '📚';
      case 'Band': return '🔢';
      case 'Medienecho': return '📺';
      case 'Stil-Veredelung': return '✍️';
      case 'Schauplatz': return '📍';
      case 'Genre (THEMA)': return '🎭';
      case 'Zielgruppe': return '👥';
      case 'Zeitgeist': return '🕰️';
      case 'Herkunft': return '🌍';
      case 'Gattung': return '📖';
      default: return '🏷️';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Status':
      case 'Auszeichnung': return '#FFD700';
      case 'Feeling':
      case 'Motiv (MVB)': return '#ffe066';
      case 'Serie': return '#9C27B0';
      case 'Band': return '#2196F3';
      case 'Medienecho': return '#9C27B0';
      case 'Stil-Veredelung': return '#FF5722';
      case 'Schauplatz': return '#E67E22';
      case 'Genre (THEMA)': return '#247ba0';
      case 'Zielgruppe': return '#2ECC71';
      case 'Zeitgeist': return '#E91E63';
      case 'Herkunft': return '#70c1b3';
      case 'Gattung': return '#8B4513';
      default: return '#70c1b3';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-pastel">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Text variant="base" className="text-foreground">
            Lädt...
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-pastel">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button onClick={() => navigate(-1)} variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Text variant="base" className="text-foreground mt-8">
            Fehler beim Laden des Buches: {error}
          </Text>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-pastel">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button onClick={() => navigate(-1)} variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Text variant="base" className="text-foreground mt-8">
            Buch nicht gefunden
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-pastel">
      {/* Schema.org JSON-LD für besseres SEO - ONIX 3.0 compliant */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Book",
          "@id": `https://coratiert.de/book/${book.id}`,
          "name": book.title,
          "isbn": book.isbn?.replace(/-/g, ''), // ISBN ohne Bindestriche für Schema.org
          "image": book.coverUrl,
          "description": book.description,
          "author": {
            "@type": "Person",
            "name": book.author,
            "url": book.authorSlug ? `https://coratiert.de/autoren/${book.authorSlug}` : undefined
          },
          "publisher": {
            "@type": "Organization",
            "name": book.publisher
          },
          "datePublished": book.year,
          "inLanguage": "de",
          "bookFormat": book.format === "hardcover" ? "https://schema.org/Hardcover" : 
                        book.format === "paperback" ? "https://schema.org/Paperback" : 
                        book.format === "ebook" ? "https://schema.org/EBook" : 
                        "https://schema.org/Paperback",
          ...(book.collection && book.collectionNumber ? {
            "isPartOf": {
              "@type": "BookSeries",
              "name": book.collection,
              "position": book.collectionNumber
            }
          } : {}),
          "offers": {
            "@type": "Offer",
            "price": book.price?.replace(/[^\d,]/g, '').replace(',', '.') || "0",
            "priceCurrency": "EUR",
            "availability": book.availability === "verfügbar" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": `https://coratiert.de/book/${book.id}`
          }
        })}
      </script>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb - erweitert mit Autor und Serie */}
        <Breadcrumb
          items={[
            { label: 'Start', onClick: () => navigate('/') },
            { label: 'Bücher', onClick: () => navigate('/buecher') },
            ...(book.authorSlug ? [{ 
              label: book.author, 
              onClick: () => navigate(`/autoren/${book.authorSlug}`) 
            }] : book.author ? [{ 
              label: book.author, 
              onClick: () => {} 
            }] : []),
            ...(book.collection && book.collectionSlug ? [{ 
              label: `${book.collection} (Reihe)`, 
              onClick: () => navigate(`/serien/${book.collectionSlug}`) 
            }] : []),
            { label: book.collectionNumber ? `Band ${book.collectionNumber}: ${book.title}` : book.title }
          ]}
        />

        {/* Book Details */}
        <div className="bg-white rounded-xl p-6 md:p-8 mt-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Cover */}
            <div>
              {/* 🏆 Serie Badge - Above Cover */}
              {bookTags.length > 0 && (
                <div className="mb-4">
                  <SerieBadgeComponent 
                    onixTags={bookTags}
                    context="detail"
                  />
                </div>
              )}
              
              <div className="aspect-[2/3] max-w-md mx-auto" style={{ boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)', border: '1px solid #e5e5e5' }}>
                <ImageWithFallback
                  src={book.coverUrl}
                  alt={getBookImageMetadata(book).alt}
                  className="w-full h-full rounded-[1px]"
                  style={{ objectFit: 'contain' }}
                  title={getBookImageMetadata(book).caption}
                />
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Prominent Tags: Serie, Band, Status, Feeling */}
              {(serieTags.length > 0 || bandTags.length > 0 || statusTags.length > 0 || feelingTags.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {/* Serie Tags */}
                  {serieTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => navigate(`/serie/${tag.slug || tag.displayName.toLowerCase().replace(/\s+/g, '-')}`)}
                      className="px-4 py-2 rounded-full flex items-center gap-2 transition-all hover:shadow-md"
                      style={{
                        backgroundColor: tag.color || '#9C27B0',
                        color: '#FFFFFF'
                      }}
                    >
                      <span>📚 {tag.displayName}</span>
                    </button>
                  ))}

                  {/* Band Tags */}
                  {bandTags.map(tag => (
                    <span
                      key={tag.id}
                      className="px-4 py-2 rounded-full"
                      style={{
                        backgroundColor: tag.color || '#2196F3',
                        color: '#FFFFFF'
                      }}
                    >
                      {tag.displayName}
                    </span>
                  ))}

                  {/* Status Tags (Awards, Bestseller) */}
                  {statusTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => navigate(`/tag/${tag.slug || tag.displayName.toLowerCase().replace(/\s+/g, '-')}`)}
                      className="px-4 py-2 rounded-full flex items-center gap-2 transition-all hover:shadow-md"
                      style={{
                        backgroundColor: tag.color || '#FFD700',
                        color: '#FFFFFF'
                      }}
                    >
                      <Award className="w-4 h-4" />
                      <span>{tag.displayName}</span>
                    </button>
                  ))}

                  {/* Feeling Tags */}
                  {feelingTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => navigate(`/tag/${tag.slug || tag.displayName.toLowerCase().replace(/\s+/g, '-')}`)}
                      className="px-4 py-2 rounded-full flex items-center gap-2 transition-all hover:shadow-md"
                      style={{
                        backgroundColor: tag.color || '#ffe066',
                        color: '#3A3A3A'
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{tag.displayName}</span>
                    </button>
                  ))}
                </div>
              )}

              <div>
                <Heading as="h1" variant="h1" className="mb-2 text-foreground">
                  {book.title}
                </Heading>
                
                {/* Series Link - ONIX compliant */}
                {book.collection && book.collectionNumber && book.collectionSlug && (
                  <a
                    href={`/reihen/${book.collectionSlug}/`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/reihen/${book.collectionSlug}/`);
                    }}
                    className="inline-block mb-2"
                  >
                    <Text 
                      as="span" 
                      variant="base" 
                      className="series-link !normal-case !tracking-normal font-semibold"
                    >
                      Band {book.collectionNumber} der {book.collection}
                    </Text>
                  </a>
                )}
                
                <Text variant="large" className="text-foreground-muted">
                  von <span className="text-foreground font-semibold">{book.author}</span>
                </Text>
              </div>

              {/* Metadata */}
              <div className="space-y-2">
                {book.publisher && (
                  <Text variant="small" className="text-foreground-muted">
                    <strong>Verlag:</strong> {book.publisher}
                  </Text>
                )}
                {book.year && (
                  <Text variant="small" className="text-foreground-muted">
                    <strong>Jahr:</strong> {book.year}
                  </Text>
                )}
                {book.isbn && (
                  <Text variant="small" className="text-foreground-muted">
                    <strong>ISBN:</strong> {book.isbn}
                  </Text>
                )}
              </div>

              {/* ONIX Tags */}
              {Object.keys(tagsByType).length > 0 && (
                <div className="space-y-4">
                  <Heading as="h3" variant="h3" className="text-foreground">
                    Tags & Kategorien
                  </Heading>
                  {Object.entries(tagsByType).map(([type, tags]) => (
                    <div key={type}>
                      <Text variant="small" className="mb-2 text-foreground-muted">
                        {getTypeIcon(type)} {type}
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <span
                            key={tag.id}
                            className="px-3 py-1 text-sm rounded-full text-white"
                            style={{
                              backgroundColor: tag.color || getTypeColor(tag.type)
                            }}
                          >
                            {tag.displayName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price & Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Text variant="small" className="mb-1 text-foreground-muted">
                      Preis
                    </Text>
                    <Heading as="p" variant="h3" className="text-foreground">
                      ab {book.price}
                    </Heading>
                  </div>
                  <Text 
                    variant="small" 
                    className="font-bold"
                    style={{ color: book.availability === 'Verfügbar' ? '#16a34a' : '#f59e0b' }}
                  >
                    {book.availability || 'Verfügbar'}
                  </Text>
                </div>

                <div className="flex gap-2">
                  <LikeButton
                    entityId={book.id}
                    entityType="book"
                    entityTitle={book.title}
                    entitySubtitle={book.author}
                    size="lg"
                  />
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#f25f5c', color: '#f25f5c' }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Teilen
                  </Button>
                  <DSButton
                    variant="primary"
                    size="medium"
                    iconRight={ExternalLink}
                    onClick={() => window.open('https://www.buecher.de/', '_blank', 'noopener,noreferrer')}
                    aria-label={`${book.title} bei bücher.de kaufen`}
                    className="flex-1"
                  >
                    Zum Shop
                  </DSButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Teilen auf</DialogTitle>
              <DialogDescription>Wähle eine Plattform, um das Buch zu teilen.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              <Button variant="outline" onClick={() => handleShare('linkedin')} className="flex items-center justify-start gap-3 h-auto py-3">
                <div className="w-8 h-8 rounded bg-[#0077B5] flex items-center justify-center text-white">in</div>
                <span>LinkedIn</span>
              </Button>
              <Button variant="outline" onClick={() => handleShare('whatsapp')} className="flex items-center justify-start gap-3 h-auto py-3">
                <div className="w-8 h-8 rounded bg-[#25D366] flex items-center justify-center text-white">W</div>
                <span>WhatsApp</span>
              </Button>
              <Button variant="outline" onClick={() => handleShare('facebook')} className="flex items-center justify-start gap-3 h-auto py-3">
                <div className="w-8 h-8 rounded bg-[#1877F2] flex items-center justify-center text-white">f</div>
                <span>Facebook</span>
              </Button>
              <Button variant="outline" onClick={() => handleShare('twitter')} className="flex items-center justify-start gap-3 h-auto py-3">
                <div className="w-8 h-8 rounded bg-[#1DA1F2] flex items-center justify-center text-white">𝕏</div>
                <span>Twitter/X</span>
              </Button>
              <Button variant="outline" onClick={() => handleShare('email')} className="flex items-center justify-start gap-3 h-auto py-3 col-span-2">
                <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-white">@</div>
                <span>E-Mail</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schema.org Book Schema */}
        <BookSchema book={book} tags={bookTags} />

        {/* Similar Books Section */}
        <SimilarBooksSection currentBook={book} maxSuggestions={8} />
      </div>
    </div>
  );
}