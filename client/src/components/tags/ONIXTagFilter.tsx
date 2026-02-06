import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { ONIXTag, getAllONIXTags } from '../utils/api';

interface ONIXTagFilterProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  visibilityFilter?: 'prominent' | 'filter' | 'internal' | 'all';
  showOnlyVisible?: boolean;
}

/**
 * ONIX Tag Filter Component
 * Filters tags by type, visibility, and allows multi-selection
 */
export function ONIXTagFilter({
  selectedTagIds,
  onTagsChange,
  visibilityFilter = 'all',
  showOnlyVisible = true
}: ONIXTagFilterProps) {
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load ONIX tags
  useEffect(() => {
    getAllONIXTags().then(tags => {
      setOnixTags(tags);
      setLoading(false);
    });
  }, []);

  // Filter tags by visibility
  const filteredTags = useMemo(() => {
    let filtered = onixTags;

    // Apply visibility filter
    if (showOnlyVisible) {
      filtered = filtered.filter(tag => tag.visible);
    }

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(tag => tag.visibilityLevel === visibilityFilter);
    }

    return filtered;
  }, [onixTags, visibilityFilter, showOnlyVisible]);

  // Group tags by type
  const tagsByType = useMemo(() => {
    const grouped: Record<string, ONIXTag[]> = {};
    filteredTags.forEach(tag => {
      if (!grouped[tag.type]) {
        grouped[tag.type] = [];
      }
      grouped[tag.type].push(tag);
    });

    // Sort tags within each type
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => a.displayName.localeCompare(b.displayName));
    });

    return grouped;
  }, [filteredTags]);

  // Sort types by priority
  const sortedTypes = useMemo(() => {
    const typeOrder = [
      'Auszeichnung',
      'Medienecho',
      'Motiv (MVB)',
      'Stil-Veredelung',
      'Schauplatz',
      'Genre (THEMA)',
      'Zielgruppe',
      'Zeitgeist',
      'Herkunft'
    ];

    return Object.keys(tagsByType).sort((a, b) => {
      const aIndex = typeOrder.indexOf(a);
      const bIndex = typeOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [tagsByType]);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'Auszeichnung':
        return '🏆';
      case 'Medienecho':
        return '📺';
      case 'Motiv (MVB)':
        return '💫';
      case 'Stil-Veredelung':
        return '✍️';
      case 'Schauplatz':
        return '📍';
      case 'Genre (THEMA)':
        return '🎭';
      case 'Zielgruppe':
        return '👥';
      case 'Zeitgeist':
        return '🕰️';
      case 'Herkunft':
        return '🌍';
      default:
        return '🏷️';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Auszeichnung':
        return '#FFD700';
      case 'Medienecho':
        return '#9C27B0';
      case 'Motiv (MVB)':
        return '#ffe066';
      case 'Stil-Veredelung':
        return '#FF5722';
      case 'Schauplatz':
        return '#E67E22';
      case 'Genre (THEMA)':
        return '#247ba0';
      case 'Zielgruppe':
        return '#2ECC71';
      case 'Zeitgeist':
        return '#E91E63';
      case 'Herkunft':
        return '#70c1b3';
      default:
        return '#70c1b3';
    }
  };

  if (loading) {
    return <div className="p-4" style={{ color: '#666666' }}>Lade Tags...</div>;
  }

  if (sortedTypes.length === 0) {
    return (
      <div className="p-4" style={{ color: '#666666' }}>
        Keine Tags verfügbar
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Clear All Button */}
      {selectedTagIds.length > 0 && (
        <button
          onClick={clearAll}
          className="w-full px-3 py-2 text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
        >
          <X className="w-4 h-4" />
          Alle Filter löschen ({selectedTagIds.length})
        </button>
      )}

      {/* Tag Types */}
      {sortedTypes.map((type) => {
        const tags = tagsByType[type];
        const isExpanded = expandedTypes.has(type);
        const selectedCount = tags.filter(tag => selectedTagIds.includes(tag.id)).length;

        return (
          <div key={type} className="border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
            {/* Type Header */}
            <button
              onClick={() => toggleType(type)}
              className="w-full px-3 py-2 flex items-center justify-between transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span>{getTypeIcon(type)}</span>
                <span style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {type}
                </span>
                {selectedCount > 0 && (
                  <span
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{ backgroundColor: getTypeColor(type), color: '#FFFFFF' }}
                  >
                    {selectedCount}
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" style={{ color: '#666666' }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: '#666666' }} />
              )}
            </button>

            {/* Tags List */}
            {isExpanded && (
              <div className="px-3 pb-2 space-y-1">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="w-full px-3 py-1.5 text-sm text-left rounded-lg transition-all flex items-center justify-between"
                      style={{
                        backgroundColor: isSelected ? (tag.color || getTypeColor(tag.type)) : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#3A3A3A',
                        border: isSelected ? 'none' : '1px solid #E5E7EB'
                      }}
                    >
                      <span>{tag.displayName}</span>
                      {tag.visibilityLevel === 'prominent' && (
                        <span className="text-xs">⭐</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
