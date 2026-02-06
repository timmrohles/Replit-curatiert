import { useEffect, useState } from 'react';
import { ONIXTag, getAllONIXTags } from '../utils/api';

interface BookONIXTagsProps {
  onixTagIds: string[];
  visibilityFilter?: 'prominent' | 'filter' | 'all'; // Welche Tags anzeigen?
  compact?: boolean; // Kompakte Darstellung?
}

export function BookONIXTags({ onixTagIds, visibilityFilter = 'prominent', compact = false }: BookONIXTagsProps) {
  const [tags, setTags] = useState<ONIXTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    const allTags = await getAllONIXTags();
    // Filter nur die Tags, die diesem Buch zugeordnet sind
    const bookTags = allTags.filter(tag => 
      onixTagIds.includes(tag.id) && 
      tag.visible &&
      (visibilityFilter === 'all' || tag.visibilityLevel === visibilityFilter)
    );
    setTags(bookTags);
    setLoading(false);
  }

  if (loading || tags.length === 0) {
    return null;
  }

  // Group tags by type for better organization
  const groupedTags: Record<string, ONIXTag[]> = {};
  tags.forEach(tag => {
    if (!groupedTags[tag.type]) {
      groupedTags[tag.type] = [];
    }
    groupedTags[tag.type].push(tag);
  });

  // Priority order for prominent tags
  const priorityOrder = [
    'Auszeichnung',
    'Medienecho',
    'Motiv (MVB)',
    'Stil-Veredelung',
    'Schauplatz'
  ];

  const sortedGroups = Object.entries(groupedTags).sort(([typeA], [typeB]) => {
    const indexA = priorityOrder.indexOf(typeA);
    const indexB = priorityOrder.indexOf(typeB);
    
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });

  if (compact) {
    // Compact mode: Just show tags as badges
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span
            key={tag.id}
            className="inline-block px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: tag.color || getDefaultColor(tag.type),
              color: '#FFFFFF'
            }}
          >
            {tag.displayName}
          </span>
        ))}
      </div>
    );
  }

  // Full mode: Show tags grouped by type
  return (
    <div className="space-y-3">
      {sortedGroups.map(([type, typeTags]) => (
        <div key={type}>
          <p className="text-xs mb-2" style={{ color: '#999999' }}>
            {getTypeIcon(type)} {type}
          </p>
          <div className="flex flex-wrap gap-2">
            {typeTags.map(tag => (
              <span
                key={tag.id}
                className="inline-block px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: tag.color || getDefaultColor(tag.type),
                  color: '#FFFFFF'
                }}
              >
                {tag.displayName}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper: Get default color for tag type
function getDefaultColor(type: string): string {
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
}

// Helper: Get icon for tag type
function getTypeIcon(type: string): string {
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
}
