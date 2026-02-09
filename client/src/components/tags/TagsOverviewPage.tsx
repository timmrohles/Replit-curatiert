import React, { useState, useEffect, useMemo } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { getAllONIXTags, ONIXTag, ONIXTagType } from '../../utils/api';
import { Helmet } from 'react-helmet';
import { Tag as TagIcon, TrendingUp, Award, Sparkles, MapPin, Globe, Users } from 'lucide-react';

/**
 * Tag Overview Page - /tags
 * Shows all tags grouped by type
 */
export function TagsOverviewPage() {
  const navigate = useSafeNavigate();
  const [tags, setTags] = useState<ONIXTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    const allTags = await getAllONIXTags();
    // Filter visible tags only
    const visibleTags = allTags.filter(tag => tag.visible);
    setTags(visibleTags);
    setLoading(false);
  }

  // Group tags by type
  const tagsByType = tags.reduce((acc, tag) => {
    const tagType = tag.type as ONIXTagType;
    if (!acc[tagType]) {
      acc[tagType] = [];
    }
    acc[tagType].push(tag);
    return acc;
  }, {} as Record<ONIXTagType, ONIXTag[]>);

  const getTypeIcon = (type: ONIXTagType) => {
    switch (type) {
      case 'Status':
      case 'Auszeichnung':
        return <Award className="w-6 h-6" />;
      case 'Feeling':
      case 'Motiv (MVB)':
        return <Sparkles className="w-6 h-6" />;
      case 'Serie':
        return <TrendingUp className="w-6 h-6" />;
      case 'Schauplatz':
        return <MapPin className="w-6 h-6" />;
      case 'Herkunft':
        return <Globe className="w-6 h-6" />;
      case 'Zielgruppe':
        return <Users className="w-6 h-6" />;
      default:
        return <TagIcon className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: ONIXTagType): string => {
    switch (type) {
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

  const getTypeDisplayName = (type: ONIXTagType): string => {
    switch (type) {
      case 'Genre (THEMA)':
        return 'Genres';
      case 'Motiv (MVB)':
        return 'Lesemotive';
      case 'Stil-Veredelung':
        return 'Stilistik';
      default:
        return type;
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

  // Get tag types that have visible tags (excluding internal/badge/link)
  const displayTypes = Object.keys(tagsByType).filter(type => {
    const typedType = type as ONIXTagType;
    const firstTag = tagsByType[typedType][0];
    return firstTag && !['internal', 'badge'].includes(firstTag.visibilityLevel);
  }) as ONIXTagType[];

  return (
    <>
      <Helmet>
        <title>Alle Tags - coratiert.de</title>
        <meta name="description" content="Entdecke Bücher nach Tags: Auszeichnungen, Genres, Lesemotive, Schauplätze und mehr. Kuratierte Buchempfehlungen bei coratiert.de." />
        <meta property="og:title" content="Alle Tags - coratiert.de" />
        <meta property="og:description" content="Entdecke Bücher nach Tags" />
      </Helmet>

      <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 
              className="text-5xl mb-4"
              style={{ 
                fontFamily: 'Fjalla One',
                color: '#3A3A3A',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
              }}
            >
              Alle Tags
            </h1>
            <p className="text-lg" style={{ color: '#666666' }}>
              Entdecke Bücher nach deinen Interessen
            </p>
          </div>

          {/* Tag Type Sections */}
          <div className="space-y-8">
            {displayTypes.map(type => {
              const typeTags = tagsByType[type];
              const typeColor = getTypeColor(type);
              
              return (
                <div key={type} className="bg-white rounded-xl p-6">
                  {/* Type Header */}
                  <div 
                    className="flex items-center gap-3 mb-4 pb-3 border-b-2 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderColor: typeColor }}
                    onClick={() => navigate(`/tags/${type.toLowerCase().replace(/\s+/g, '-')}`)}
                  >
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                    >
                      {getTypeIcon(type)}
                    </div>
                    <div className="flex-1">
                      <h2 
                        className="text-2xl"
                        style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
                      >
                        {getTypeDisplayName(type)}
                      </h2>
                      <p className="text-sm" style={{ color: '#666666' }}>
                        {typeTags.length} {typeTags.length === 1 ? 'Tag' : 'Tags'}
                      </p>
                    </div>
                    <div className="text-sm" style={{ color: typeColor }}>
                      Alle anzeigen →
                    </div>
                  </div>

                  {/* Tags Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {typeTags.map(tag => (
                      <div
                        key={tag.id}
                        className="px-4 py-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                        style={{ 
                          backgroundColor: `${tag.color || typeColor}15`,
                          border: `1px solid ${tag.color || typeColor}30`
                        }}
                        onClick={() => {
                          const slug = tag.slug || tag.displayName.toLowerCase().replace(/\s+/g, '-');
                          navigate(`/tag/${slug}`);
                        }}
                      >
                        <div className="text-sm" style={{ color: '#3A3A3A' }}>
                          {tag.displayName}
                        </div>
                      </div>
                    ))}
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