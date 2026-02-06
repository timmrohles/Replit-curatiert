import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSafeNavigate } from '../utils/routing';
import { ArrowLeft, BookOpen, Tag as TagIcon, Sparkles } from 'lucide-react';
import { getAllBooks, getAllONIXTags, ONIXTag, Book } from '../utils/api';
import { BookCard } from '../book/BookCard';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Helmet } from 'react-helmet';
import { getRelatedTags, TagRecommendation } from '../utils/tagRecommendations';

// ✅ SAFE ROUTING: Import utilities
import { getValidatedParam } from '../utils/routing';
import { LoadingState, NotFoundState, EmptyState } from '../utils/pageState';

/**
 * Dynamic Tag Landing Page
 * Shows all books with a specific ONIX tag
 * SEO-optimized with Schema.org markup
 */
export function TagPage() {
  const params = useParams<{ tagSlug: string }>();
  const navigate = useSafeNavigate();
  
  // ✅ PARAM GUARD: Validate tagSlug immediately
  const tagSlug = getValidatedParam(params.tagSlug);
  
  const [tag, setTag] = useState<ONIXTag | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [relatedTags, setRelatedTags] = useState<TagRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ✅ PARAM GUARD: If tagSlug is invalid, show 404
  if (!tagSlug) {
    return <NotFoundState resourceType="Tag" message="Der Tag-Slug ist ungültig." />;
  }

  // Load tag and books
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [allTags, allBooks] = await Promise.all([
          getAllONIXTags(),
          getAllBooks()
        ]);

        if (!isMounted) return;

        // Find tag by slug
        const foundTag = allTags.find(t => 
          t.slug === tagSlug || 
          t.displayName.toLowerCase().replace(/\s+/g, '-') === tagSlug
        );

        if (!foundTag) {
          setTag(null);
          setLoading(false);
          return;
        }

        setTag(foundTag);

        // Filter books by this tag with safe array access
        const taggedBooks = (allBooks || []).filter(book =>
          book.onixTagIds?.includes(foundTag.id)
        );

        // Sort by newest first
        taggedBooks.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setBooks(taggedBooks);

        // Get related tags
        const related = getRelatedTags(foundTag, allTags, allBooks);
        setRelatedTags(related || []);
        
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error loading tag page:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden des Tags');
        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [tagSlug]);

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'Auszeichnung': return '🏆';
      case 'Medienecho': return '📺';
      case 'Motiv (MVB)': return '💫';
      case 'Stil-Veredelung': return '✍️';
      case 'Schauplatz': return '📍';
      case 'Genre (THEMA)': return '🎭';
      case 'Zielgruppe': return '👥';
      case 'Zeitgeist': return '🕰️';
      case 'Herkunft': return '🌍';
      default: return '🏷️';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Auszeichnung': return '#FFD700';
      case 'Medienecho': return '#9C27B0';
      case 'Motiv (MVB)': return '#ffe066';
      case 'Stil-Veredelung': return '#FF5722';
      case 'Schauplatz': return '#E67E22';
      case 'Genre (THEMA)': return '#247ba0';
      case 'Zielgruppe': return '#2ECC71';
      case 'Zeitgeist': return '#E91E63';
      case 'Herkunft': return '#70c1b3';
      default: return '#70c1b3';
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!tag) {
    return <NotFoundState />;
  }

  const tagColor = tag.color || getTypeColor(tag.type);

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{tag.displayName} - Bücher bei coratiert.de</title>
        <meta 
          name="description" 
          content={`Entdecke ${books.length} Bücher mit ${tag.displayName}. ${tag.description || ''} Kuratierte Auswahl bei coratiert.de.`} 
        />
        <meta property="og:title" content={`${tag.displayName} - Bücher bei coratiert.de`} />
        <meta property="og:description" content={`Entdecke ${books.length} Bücher mit ${tag.displayName}`} />
        <meta property="og:type" content="website" />
        
        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": tag.displayName,
            "description": tag.description || `Bücher mit ${tag.displayName}`,
            "numberOfItems": books.length,
            "about": {
              "@type": "Thing",
              "name": tag.displayName,
              "description": tag.description
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Tags', href: '/tags' },
              { label: tag.displayName }
            ]}
          />

          {/* Header */}
          <div className="mt-6 mb-8">
            <div className="bg-white rounded-xl p-8">
              <div className="flex items-start gap-4">
                {/* Tag Icon */}
                <div 
                  className="p-4 rounded-xl text-4xl"
                  style={{ backgroundColor: `${tagColor}20` }}
                >
                  {getTypeIcon(tag.type)}
                </div>

                {/* Tag Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span 
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: tagColor, color: '#FFFFFF' }}
                    >
                      {tag.type}
                    </span>
                    {tag.visibilityLevel === 'prominent' && (
                      <span className="text-sm" style={{ color: '#666666' }}>⭐ Prominent</span>
                    )}
                  </div>
                  
                  <h1 className="text-4xl mb-3" style={{ 
                    fontFamily: 'Fjalla One', 
                    color: '#3A3A3A',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
                  }}>
                    {tag.displayName}
                  </h1>

                  {tag.description && (
                    <p className="text-lg mb-4" style={{ color: '#666666' }}>
                      {tag.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm" style={{ color: '#666666' }}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{books.length} {books.length === 1 ? 'Buch' : 'Bücher'}</span>
                    </div>
                    {tag.onixCode && (
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4" />
                        <span>ONIX: {tag.onixCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Tags */}
          {relatedTags.length > 0 && (
            <div className="mb-8">
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5" style={{ color: '#f25f5c' }} />
                  <h2 
                    className="text-2xl"
                    style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
                  >
                    Ähnliche Tags
                  </h2>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {relatedTags.slice(0, 8).map((rec) => {
                    const recColor = rec.tag.color || getTypeColor(rec.tag.type);
                    const slug = rec.tag.slug || rec.tag.displayName.toLowerCase().replace(/\s+/g, '-');
                    
                    return (
                      <button
                        key={rec.tag.id}
                        onClick={() => navigate(`/tag/${slug}`)}
                        className="px-4 py-2 rounded-full flex items-center gap-2 transition-all hover:shadow-md"
                        style={{ 
                          backgroundColor: `${recColor}20`,
                          border: `1px solid ${recColor}40`
                        }}
                      >
                        <span className="text-sm" style={{ color: '#3A3A3A' }}>
                          {rec.tag.displayName}
                        </span>
                        {rec.score > 0.7 && (
                          <span className="text-xs" style={{ color: recColor }}>★</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Books Grid */}
          {books.length === 0 ? (
            <EmptyState message="Noch keine Bücher mit diesem Tag vorhanden." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {books.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}