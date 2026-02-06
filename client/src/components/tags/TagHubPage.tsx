import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSafeNavigate } from '../../utils/routing';
import { getAllONIXTags, getAllBooks, ONIXTag, Book, ONIXTagType } from '../../utils/api';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Tag as TagIcon } from 'lucide-react';
import { Breadcrumb } from '../layout/Breadcrumb';

/**
 * Tag Hub Page - /tags/:type
 * Shows all tags of a specific type (e.g. /tags/auszeichnungen)
 */
export function TagHubPage() {
  const params = useParams<{ type?: string; param?: string }>();
  const type = params.type || params.param || '';
  const navigate = useSafeNavigate();
  
  const [tags, setTags] = useState<ONIXTag[]>([]);
  const [bookCounts, setBookCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!type) return;
    
    // Check if this is a combination (contains +)
    if (type.includes('+')) {
      // This should be handled by TagCombinationPage
      // Redirect or handle differently
      return;
    }
    
    loadData(type);
  }, [type]);

  async function loadData(typeSlug: string) {
    setLoading(true);
    try {
      const [allTags, allBooks] = await Promise.all([
        getAllONIXTags(),
        getAllBooks()
      ]);

      // Map type slug to ONIXTagType
      const typeMap: Record<string, ONIXTagType> = {
        'auszeichnungen': 'Auszeichnung',
        'status': 'Status',
        'feeling': 'Feeling',
        'lesemotive': 'Motiv (MVB)',
        'motiv-mvb': 'Motiv (MVB)',
        'genres': 'Genre (THEMA)',
        'genre-thema': 'Genre (THEMA)',
        'serien': 'Serie',
        'serie': 'Serie',
        'schauplätze': 'Schauplatz',
        'schauplatz': 'Schauplatz',
        'herkunft': 'Herkunft',
        'übersetzungen': 'Herkunft',
        'zielgruppe': 'Zielgruppe',
        'zeitgeist': 'Zeitgeist',
        'stilistik': 'Stil-Veredelung',
        'stil-veredelung': 'Stil-Veredelung',
        'medienecho': 'Medienecho'
      };

      const tagType = typeMap[typeSlug];
      if (!tagType) {
        setLoading(false);
        return;
      }

      // Filter tags by type
      const typeTags = allTags.filter(tag => 
        tag.type === tagType && tag.visible
      );

      setTags(typeTags);

      // Count books for each tag
      const counts: Record<string, number> = {};
      typeTags.forEach(tag => {
        counts[tag.id] = allBooks.filter(book => 
          book.onixTagIds?.includes(tag.id)
        ).length;
      });
      setBookCounts(counts);

    } catch (error) {
      console.error('Error loading tag hub:', error);
    } finally {
      setLoading(false);
    }
  }

  const getTypeDisplayName = (type?: string): string => {
    if (!type) return 'Tags';
    
    const map: Record<string, string> = {
      'auszeichnungen': 'Auszeichnungen',
      'status': 'Status & Bestseller',
      'feeling': 'Lesegefühle',
      'lesemotive': 'Lesemotive',
      'genres': 'Genres',
      'serien': 'Serien',
      'schauplätze': 'Schauplätze',
      'herkunft': 'Übersetzungen',
      'zielgruppe': 'Zielgruppen',
      'zeitgeist': 'Epochen & Zeitgeist',
      'stilistik': 'Stilistik',
      'medienecho': 'Medienecho'
    };
    
    return map[type] || type;
  };

  const getTypeColor = (tagType?: ONIXTagType): string => {
    if (!tagType) return '#70c1b3';
    
    switch (tagType) {
      case 'Status':
      case 'Auszeichnung':
        return '#FFD700';
      case 'Feeling':
      case 'Motiv (MVB)':
        return '#ffe066';
      case 'Serie':
        return '#9C27B0';
      case 'Genre (THEMA)':
        return '#247ba0';
      case 'Schauplatz':
        return '#E67E22';
      case 'Herkunft':
        return '#70c1b3';
      case 'Zielgruppe':
        return '#2ECC71';
      case 'Zeitgeist':
        return '#E91E63';
      case 'Stil-Veredelung':
        return '#FF5722';
      case 'Medienecho':
        return '#9C27B0';
      default:
        return '#70c1b3';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p style={{ color: '#3A3A3A' }}>Lädt...</p>
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/tags')}
            className="mb-6 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: '#3A3A3A' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu allen Tags
          </button>
          <p style={{ color: '#3A3A3A' }}>Keine Tags gefunden</p>
        </div>
      </div>
    );
  }

  const typeDisplayName = getTypeDisplayName(type);
  const typeColor = getTypeColor(tags[0]?.type);

  return (
    <>
      <Helmet>
        <title>{typeDisplayName} - Tags bei coratiert.de</title>
        <meta name="description" content={`Entdecke alle ${typeDisplayName}-Tags und finde Bücher nach deinen Interessen.`} />
      </Helmet>

      <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Tags', href: '/tags' },
              { label: typeDisplayName }
            ]}
          />

          {/* Header */}
          <div className="mt-6 mb-8">
            <div className="bg-white rounded-xl p-8">
              <h1 
                className="text-4xl mb-3"
                style={{ 
                  fontFamily: 'Fjalla One',
                  color: '#3A3A3A',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
                }}
              >
                {typeDisplayName}
              </h1>
              <p className="text-lg" style={{ color: '#666666' }}>
                {tags.length} {tags.length === 1 ? 'Tag' : 'Tags'} verfügbar
              </p>
            </div>
          </div>

          {/* Tags Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map(tag => {
              const bookCount = bookCounts[tag.id] || 0;
              const tagColor = tag.color || typeColor;
              
              return (
                <div
                  key={tag.id}
                  className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    const slug = tag.slug || tag.displayName.toLowerCase().replace(/\s+/g, '-');
                    navigate(`/tag/${slug}`);
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Tag Icon */}
                    <div 
                      className="p-3 rounded-lg text-2xl flex-shrink-0"
                      style={{ backgroundColor: `${tagColor}20` }}
                    >
                      {getTagEmoji(tag.type)}
                    </div>

                    {/* Tag Info */}
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-xl mb-2"
                        style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
                      >
                        {tag.displayName}
                      </h3>
                      
                      {tag.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: '#666666' }}>
                          {tag.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <span 
                          className="px-3 py-1 rounded-full text-xs"
                          style={{ backgroundColor: tagColor, color: '#FFFFFF' }}
                        >
                          {bookCount} {bookCount === 1 ? 'Buch' : 'Bücher'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// Helper: Get emoji for tag type
function getTagEmoji(type: ONIXTagType): string {
  switch (type) {
    case 'Auszeichnung':
    case 'Status':
      return '🏆';
    case 'Feeling':
    case 'Motiv (MVB)':
      return '💫';
    case 'Serie':
      return '📚';
    case 'Genre (THEMA)':
      return '🎭';
    case 'Schauplatz':
      return '📍';
    case 'Herkunft':
      return '🌍';
    case 'Zielgruppe':
      return '👥';
    case 'Zeitgeist':
      return '🕰️';
    case 'Stil-Veredelung':
      return '✍️';
    case 'Medienecho':
      return '📺';
    default:
      return '🏷️';
  }
}