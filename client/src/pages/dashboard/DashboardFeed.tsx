import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useDashboardFeed, type FeedSectionType, type ReadingStatus, type FeedSortOrder } from './DashboardFeedContext';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Pencil,
  Check,
  RotateCcw,
  GripVertical,
  Eye,
  EyeOff,
  Globe,
  Lock,
  BadgeCheck,
  Plus,
  X,
  Search,
  BookOpen,
  BookMarked,
  BookCheck,
  ChevronDown,
  ArrowDownUp,
  Hash,
  Home,
  Megaphone,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Clock,
} from 'lucide-react';
import type { FeedSectionConfig } from './DashboardFeedContext';
import { BookCarouselItem, type BookCarouselItemData } from '../../components/book/BookCarouselItem';
import { CarouselContainer } from '../../components/carousel/CarouselContainer';
import { LikeButton } from '../../components/favorites/LikeButton';
import { useFavorites, type FavoriteItem, type FrontendEntityType } from '../../components/favorites/FavoritesContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Text } from '../../components/ui/typography';

interface MockCurator {
  name: string;
  avatar: string;
  focus: string;
  isVerified: boolean;
  occasion: string;
  curationReason: string;
}

const MOCK_CURATORS: MockCurator[] = [
  {
    name: 'coratiert Redaktion',
    avatar: '/uploads/avatars/coratiert-redaktion.jpg',
    focus: 'Die Allzweckwaffe unter den Redakteur*innen',
    isVerified: true,
    occasion: 'Neue Bücher für Leseratten',
    curationReason: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren.',
  },
  {
    name: 'Elena Hartmann',
    avatar: '',
    focus: 'Belletristik & Literarische Fiction',
    isVerified: false,
    occasion: 'Lesetipps im Frühling',
    curationReason: 'Meine persönlichen Empfehlungen für gemütliche Lesestunden.',
  },
];

const MOCK_SPONSOR: MockCurator = {
  name: 'Klett-Cotta Verlag',
  avatar: '',
  focus: 'Literatur, Sachbuch & Fantasy',
  isVerified: true,
  occasion: 'Neuerscheinungen im Herbst 2025',
  curationReason: 'Entdecke handverlesene Neuerscheinungen aus unserem Herbstprogramm. Von preisgekrönter Literatur bis hin zu fesselnden Fantasy-Welten – für jeden Geschmack ist etwas dabei.',
};

const MOCK_BOOKS: BookCarouselItemData[] = [
  {
    id: 'mock-1',
    title: 'Border River – Die Teufelspassage',
    author: 'William Sackheim; Louis Stevens',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
    price: '14,99',
    isbn: '9783423282789',
    shortDescription: 'Während des amerikanischen Bürgerkriegs geht der Südstaatler Clete Mattson über die Grenze nach Mexiko, um dort Waffen und...',
    klappentext: 'Während des amerikanischen Bürgerkriegs geht der Südstaatler Clete Mattson (Joel McCrea) über die Grenze nach Mexiko, um dort Waffen und Munition zu kaufen.',
  },
  {
    id: 'mock-2',
    title: 'Lebenselixier Bewegung',
    author: 'Wessinghage, Thomas',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
    price: '22,00',
    isbn: '9783462054781',
    shortDescription: '"Unser modernes digitales Leben ist ein Angriff auf unseren Körper, der sich bewegen möchte", sagt Thomas Wessinghage, ehemaliger...',
    klappentext: '"Unser modernes digitales Leben ist ein Angriff auf unseren Körper, der sich bewegen möchte", sagt Thomas Wessinghage, ehemaliger Weltklasseläufer.',
  },
  {
    id: 'mock-3',
    title: 'Sich in Minuten besser fühlen',
    author: 'Rohleder, Luca',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
    price: '16,90',
    isbn: '9783499000652',
    shortDescription: 'Mit diesem LUCA TAGEBUCH kannst du schnell deine Stimmung heben. Du wirst die große Freiheit kennenlernen, jederzeit selbst entscheiden zu können.',
    klappentext: 'Mit diesem LUCA TAGEBUCH kannst du schnell deine Stimmung heben.',
  },
  {
    id: 'mock-4',
    title: 'LARA. das Ende.',
    author: 'Wilk, Thea',
    coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop',
    price: '12,99',
    isbn: '9783404180233',
    shortDescription: 'LARA. das Ende. ist das Finale der Bild-Bestseller Serie LARA. LARA. der Anfang ist das Thriller-Debüt von THEA WiLK.',
    klappentext: 'LARA. das Ende. ist das Finale der Bild-Bestseller Serie LARA.',
  },
  {
    id: 'mock-5',
    title: 'Die Stadt der träumenden Bücher',
    author: 'Walter Moers',
    coverImage: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop',
    price: '24,00',
    isbn: '9783813503791',
    shortDescription: 'Hildegunst von Mythenmetz erbt ein perfektes Manuskript und macht sich auf die Suche nach dem Autor – in der gefährlichsten Stadt Zamoniens.',
    klappentext: 'Hildegunst von Mythenmetz, ein junger Lindwurm mit dichterischen Ambitionen, erbt ein perfektes Manuskript.',
  },
  {
    id: 'mock-6',
    title: 'Klara und die Sonne',
    author: 'Kazuo Ishiguro',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop',
    price: '13,00',
    isbn: '9783896759221',
    shortDescription: 'Klara ist eine künstliche Freundin, die in einem Geschäft darauf wartet, ausgewählt zu werden. Sie beobachtet die Welt durch das Schaufenster.',
    klappentext: 'Klara ist eine künstliche Freundin mit herausragender Beobachtungsgabe.',
  },
];

const TAG_COLORS = [
  'var(--vibrant-coral, #f25f5c)',
  'var(--color-saffron, #e8a838)',
  'var(--color-teal, #70c1b3)',
  'var(--color-cerulean, #247ba0)',
  '#8b5cf6',
  '#ec4899',
];

const SECTION_TO_ENTITY_TYPES: Record<string, FrontendEntityType[]> = {
  sponsored: ['book'],
  favorites: ['book'],
  currently_reading: ['book'],
  already_read: ['book'],
  want_to_read: ['book'],
  reading_list: ['book'],
  followed_authors: ['author'],
  followed_publishers: ['publisher'],
  followed_categories: ['category'],
  followed_tags: ['tag', 'genre', 'topic'],
  followed_media: ['media'],
  followed_awards: ['award'],
  followed_events: ['event'],
  followed_curators: ['creator'],
  recommendations: ['book'],
};

const READING_SECTIONS: ReadingStatus[] = ['currently_reading', 'already_read', 'want_to_read'];

const BOOK_ONLY_SECTIONS = new Set([
  'favorites', 'reading_list', 'currently_reading', 'already_read',
  'want_to_read', 'recommendations', 'sponsored',
]);

const READING_STATUS_OPTIONS: { id: ReadingStatus; label: string; icon: typeof BookOpen }[] = [
  { id: 'currently_reading', label: 'Lese ich zurzeit', icon: BookOpen },
  { id: 'already_read', label: 'Habe ich gelesen', icon: BookCheck },
  { id: 'want_to_read', label: 'Möchte ich lesen', icon: BookMarked },
];

const SECTION_SEARCH_ENDPOINTS: Record<string, string> = {
  sponsored: '/api/books/search',
  favorites: '/api/books/search',
  currently_reading: '/api/books/search',
  already_read: '/api/books/search',
  want_to_read: '/api/books/search',
  reading_list: '/api/books/search',
  followed_authors: '/api/books/search',
  followed_publishers: '/api/books/search',
  followed_categories: '/api/onix-tags',
  followed_tags: '/api/onix-tags',
  followed_media: '/api/onix-tags',
  followed_awards: '/api/awards',
  followed_events: '/api/user-events',
  followed_curators: '/api/curators',
  recommendations: '/api/books/search',
};

const SECTION_PLACEHOLDER: Record<string, string> = {
  sponsored: 'Buch suchen...',
  favorites: 'Buch suchen...',
  currently_reading: 'Buch suchen...',
  already_read: 'Buch suchen...',
  want_to_read: 'Buch suchen...',
  reading_list: 'Buch suchen...',
  followed_authors: 'Autor:in suchen...',
  followed_publishers: 'Verlag suchen...',
  followed_categories: 'Kategorie suchen...',
  followed_tags: 'Thema suchen...',
  followed_media: 'Medienformat suchen...',
  followed_awards: 'Auszeichnung suchen...',
  followed_events: 'Veranstaltung suchen...',
  followed_curators: 'Kurator:in suchen...',
  recommendations: 'Buch suchen...',
};

interface TagData {
  label: string;
  color: string;
  entityId: string;
  entityType: FrontendEntityType;
  image?: string;
}

function favoritesToTags(
  favorites: FavoriteItem[],
  sectionId: string
): TagData[] {
  const entityTypes = SECTION_TO_ENTITY_TYPES[sectionId] || [];
  const matched = favorites.filter((fav) => entityTypes.includes(fav.type));
  return matched.map((fav, i) => ({
    label: fav.title,
    color: fav.color || TAG_COLORS[i % TAG_COLORS.length],
    entityId: fav.id,
    entityType: fav.type,
    image: fav.image,
  }));
}

interface SuggestionItem {
  id: string;
  title: string;
  type: FrontendEntityType;
  subtitle?: string;
  image?: string;
  color?: string;
}

function mapApiResultToSuggestions(data: unknown, sectionId: string): SuggestionItem[] {
  const items: SuggestionItem[] = [];
  const list = (data as { data?: unknown[] })?.data || (Array.isArray(data) ? data : []);
  if (!Array.isArray(list)) return items;

  const entityTypes = SECTION_TO_ENTITY_TYPES[sectionId] || [];
  const primaryType = entityTypes[0] || 'tag';

  for (const item of list.slice(0, 20)) {
    const raw = item as Record<string, unknown>;
    if (primaryType === 'book') {
      items.push({
        id: String(raw.id || raw.isbn || ''),
        title: String(raw.title || raw.name || ''),
        type: 'book',
        subtitle: String(raw.author || raw.contributors || ''),
        image: raw.coverImage as string | undefined,
      });
    } else if (primaryType === 'author') {
      const name = String(raw.contributors || raw.author || raw.name || '');
      if (name) {
        items.push({
          id: `author-${name.toLowerCase().replace(/\s+/g, '-')}`,
          title: name,
          type: 'author',
        });
      }
    } else if (primaryType === 'publisher') {
      const name = String(raw.publisher || raw.name || '');
      if (name) {
        items.push({
          id: `publisher-${name.toLowerCase().replace(/\s+/g, '-')}`,
          title: name,
          type: 'publisher',
        });
      }
    } else if (primaryType === 'award') {
      items.push({
        id: String(raw.id || ''),
        title: String(raw.name || raw.title || ''),
        type: 'award',
        color: String(raw.color || 'var(--color-saffron, #e8a838)'),
      });
    } else if (primaryType === 'creator') {
      items.push({
        id: String(raw.id || ''),
        title: String(raw.name || ''),
        type: 'creator',
        subtitle: String(raw.focus || raw.bio || ''),
        image: raw.avatar as string | undefined,
      });
    } else {
      items.push({
        id: String(raw.id || ''),
        title: String(raw.displayName || raw.name || raw.title || ''),
        type: primaryType,
        color: String(raw.color || ''),
      });
    }
  }
  return items;
}

const POPULAR_SUGGESTIONS_ENDPOINTS: Record<string, string> = {
  favorites: '/api/onix-tags?scope=book&visible=true&limit=8',
  currently_reading: '/api/books/search?q=bestseller&limit=6',
  already_read: '/api/books/search?q=roman&limit=6',
  want_to_read: '/api/books/search?q=neu&limit=6',
  reading_list: '/api/books/search?q=empfehlung&limit=6',
  followed_authors: '/api/books/search?q=autor&limit=6',
  followed_publishers: '/api/books/search?q=verlag&limit=6',
  followed_categories: '/api/onix-tags?scope=book&tag_type=genre&visible=true&limit=8',
  followed_tags: '/api/onix-tags?scope=book&tag_type=topic&visible=true&limit=8',
  followed_media: '/api/onix-tags?scope=book&tag_type=feature&visible=true&limit=8',
  followed_awards: '/api/awards?limit=8',
  followed_curators: '/api/curators?limit=6',
  recommendations: '/api/onix-tags?scope=book&visible=true&limit=8',
};

function TagPickerDropdown({
  sectionId,
  onAdd,
  existingIds,
}: {
  sectionId: string;
  onAdd: (item: FavoriteItem) => void;
  existingIds: Set<string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [popularItems, setPopularItems] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popularLoaded, setPopularLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !popularLoaded) {
      const endpoint = POPULAR_SUGGESTIONS_ENDPOINTS[sectionId];
      if (!endpoint) { setPopularLoaded(true); return; }
      (async () => {
        try {
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            const mapped = mapApiResultToSuggestions(data, sectionId);
            setPopularItems(mapped.filter((s) => !existingIds.has(s.id)).slice(0, 8));
          }
        } catch { /* ignore */ }
        setPopularLoaded(true);
      })();
    }
  }, [isOpen, popularLoaded, sectionId, existingIds]);

  const searchItems = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    const endpoint = SECTION_SEARCH_ENDPOINTS[sectionId] || '/api/onix-tags';

    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `${endpoint}${separator}q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const mapped = mapApiResultToSuggestions(data, sectionId);
        setSuggestions(mapped.filter((s) => !existingIds.has(s.id)));
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [sectionId, existingIds]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchItems(value), 300);
  }, [searchItems]);

  const handleSelect = useCallback((item: SuggestionItem) => {
    onAdd({
      id: item.id,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      image: item.image,
      color: item.color,
    });
    setPopularItems((prev) => prev.filter((p) => p.id !== item.id));
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  }, [onAdd]);

  const showPopular = isOpen && query.length < 2 && !isSearching && popularItems.length > 0;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full inline-flex items-center justify-center border-2 border-dashed transition-colors"
        style={{ borderColor: '#9CA3AF', color: '#9CA3AF' }}
        data-testid={`button-add-tag-${sectionId}`}
      >
        <Plus className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-72 rounded-lg shadow-xl border z-50"
          style={{ backgroundColor: 'var(--color-beige, #faf6f1)', borderColor: '#E5E7EB' }}
        >
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={SECTION_PLACEHOLDER[sectionId] || 'Suchen...'}
                className="w-full pl-8 pr-3 py-2 rounded-md border text-sm"
                style={{ borderColor: '#E5E7EB', backgroundColor: 'white' }}
                data-testid={`input-search-tag-${sectionId}`}
              />
            </div>
          </div>
          {showPopular && (
            <div className="px-3 pt-1 pb-2">
              <div className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>
                Beliebt bei anderen Nutzer:innen
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularItems.map((item, idx) => {
                  const tagColor = item.color || TAG_COLORS[idx % TAG_COLORS.length];
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 inline-flex items-center gap-1.5 shadow-sm hover:shadow-md hover:scale-105"
                      style={{ backgroundColor: tagColor, color: '#ffffff', border: 'none' }}
                      data-testid={`popular-${item.id}`}
                    >
                      <span className="truncate max-w-[140px]">{item.title}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0" style={{ opacity: 0.8 }}>
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {isSearching && (
            <div className="px-3 py-2 text-sm" style={{ color: '#9CA3AF' }}>
              Suche...
            </div>
          )}
          {!isSearching && suggestions.length > 0 && (
            <div className="max-h-48 overflow-y-auto px-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((item, idx) => {
                  const tagColor = item.color || TAG_COLORS[idx % TAG_COLORS.length];
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 inline-flex items-center gap-1.5 shadow-sm hover:shadow-md hover:scale-105"
                      style={{ backgroundColor: tagColor, color: '#ffffff', border: 'none' }}
                      data-testid={`suggestion-${item.id}`}
                    >
                      {item.image && (
                        <img src={item.image} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-white/30" />
                      )}
                      <span className="truncate max-w-[140px]">{item.title}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0" style={{ opacity: 0.8 }}>
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {!isSearching && query.length >= 2 && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm" style={{ color: '#9CA3AF' }}>
              Keine Ergebnisse
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReadingStatusDropdown({
  bookId,
  bookTitle,
  currentStatus,
  onStatusChange,
}: {
  bookId: string;
  bookTitle: string;
  currentStatus: ReadingStatus;
  onStatusChange: (bookId: string, bookTitle: string, newStatus: ReadingStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const otherStatuses = READING_STATUS_OPTIONS.filter((s) => s.id !== currentStatus);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-0.5 rounded-full transition-colors"
        style={{ color: '#ffffff' }}
        data-testid={`button-reading-status-${bookId}`}
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-52 rounded-lg shadow-xl border z-50"
          style={{ backgroundColor: 'var(--color-beige, #faf6f1)', borderColor: '#E5E7EB' }}
        >
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs font-semibold" style={{ color: '#9CA3AF' }}>
              Status ändern
            </div>
            {otherStatuses.map((status) => {
              const StatusIcon = status.icon;
              return (
                <button
                  key={status.id}
                  onClick={() => {
                    onStatusChange(bookId, bookTitle, status.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                  style={{ color: '#3A3A3A' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  data-testid={`reading-status-option-${status.id}-${bookId}`}
                >
                  <StatusIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#247ba0' }} />
                  <span>{status.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const SORT_OPTIONS = [
  { id: 'popularity', label: 'Beliebtheit' },
  { id: 'awarded', label: 'Auszeichnungen' },
  { id: 'hidden-gems', label: 'Hidden Gems' },
  { id: 'trending', label: 'Aktuell' },
];

function getMockBooksForSection(sectionId: FeedSectionType): BookCarouselItemData[] {
  const shuffled = [...MOCK_BOOKS];
  const seed = sectionId.length;
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (i * seed + 3) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function CuratorSectionHeader({ curator, isSponsored }: { curator: MockCurator; isSponsored?: boolean }) {
  return (
    <div className="w-full text-base leading-normal text-left">
      <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-cerulean ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <ImageWithFallback
              src={curator.avatar}
              alt={curator.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1 self-center">
          <div className="flex items-center gap-2 w-fit">
            <div className="kuratorname flex items-center gap-1.5 text-cerulean">
              {curator.name}
              {curator.isVerified && (
                <BadgeCheck className="w-5 h-5 flex-shrink-0" style={{ color: '#247ba0' }} />
              )}
              {isSponsored && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(232, 168, 56, 0.15)', color: '#c48a1a' }}
                >
                  Gesponsert
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
            <Text as="span" variant="small" className="font-semibold text-gray-500">
              {curator.focus}
            </Text>
          </div>
        </div>
      </div>
      <div className="w-full mt-4 md:mt-6 isolate">
        <h3 className="section-title mb-4 text-foreground">
          {curator.occasion}
        </h3>
      </div>
      {curator.curationReason && (
        <div className="w-full">
          <Text as="div" variant="base" className="leading-relaxed text-black line-clamp-3">
            {curator.curationReason}
          </Text>
        </div>
      )}
    </div>
  );
}

interface MockEvent {
  id: string;
  title: string;
  organizer: string;
  description: string;
  event_type: string;
  event_date: string;
  location_name: string;
  location_type: string;
  background_image_url: string;
  entry_fee: number;
  max_participants: number | null;
  participant_count: number;
  event_page_url?: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  lesung: 'Lesung',
  buchclub: 'Buchclub',
  workshop: 'Workshop',
  signierstunde: 'Signierstunde',
  messe: 'Messe',
  vortrag: 'Vortrag',
  sonstiges: 'Sonstiges',
};

const MOCK_EVENTS: MockEvent[] = [
  {
    id: 'evt-1',
    title: 'Lesung: Die Welt von morgen',
    organizer: 'Buchhandlung am Markt',
    description: 'Eine fesselnde Lesung mit der Autorin Maria Schneider. Erleben Sie eine Reise durch die Zukunftswelten ihres neuen Romans. Im Anschluss gibt es die Möglichkeit zum Gespräch und Signieren.',
    event_type: 'lesung',
    event_date: '2026-03-15T19:00:00Z',
    location_name: 'Buchhandlung am Markt, München',
    location_type: 'vor_ort',
    background_image_url: '',
    entry_fee: 8,
    max_participants: 40,
    participant_count: 28,
    event_page_url: '',
  },
  {
    id: 'evt-2',
    title: 'Buchclub: Klassiker neu entdecken',
    organizer: 'Literaturkreis Berlin',
    description: 'Jeden Monat widmen wir uns einem Klassiker der Weltliteratur und diskutieren ihn aus heutiger Perspektive. Diesen Monat: Franz Kafkas "Der Prozess".',
    event_type: 'buchclub',
    event_date: '2026-03-20T18:30:00Z',
    location_name: 'Online via Zoom',
    location_type: 'online',
    background_image_url: '',
    entry_fee: 0,
    max_participants: null,
    participant_count: 15,
  },
  {
    id: 'evt-3',
    title: 'Workshop: Kreatives Schreiben',
    organizer: 'Schreibwerkstatt Hamburg',
    description: 'Ein intensiver Workshop für alle, die ihre Schreibfähigkeiten verbessern möchten. Techniken, Übungen und persönliches Feedback von erfahrenen Autor:innen.',
    event_type: 'workshop',
    event_date: '2026-04-05T10:00:00Z',
    location_name: 'Kulturzentrum Altona, Hamburg',
    location_type: 'vor_ort',
    background_image_url: '',
    entry_fee: 45,
    max_participants: 20,
    participant_count: 12,
    event_page_url: 'https://example.com/workshop',
  },
  {
    id: 'evt-4',
    title: 'Signierstunde mit Thomas Müller',
    organizer: 'Thalia Buchhandlung',
    description: 'Treffen Sie den Bestseller-Autor Thomas Müller persönlich und lassen Sie sich Ihr Exemplar signieren. Begrenzte Plätze!',
    event_type: 'signierstunde',
    event_date: '2026-03-28T14:00:00Z',
    location_name: 'Thalia, Zeil, Frankfurt',
    location_type: 'vor_ort',
    background_image_url: '',
    entry_fee: 0,
    max_participants: 50,
    participant_count: 42,
  },
];

function EventCard({ event }: { event: MockEvent }) {
  const [expanded, setExpanded] = useState(false);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localParticipantCount, setLocalParticipantCount] = useState(event.participant_count);
  const dateStr = new Date(event.event_date).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const timeStr = new Date(event.event_date).toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit',
  });
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || event.event_type;
  const spotsLeft = event.max_participants ? event.max_participants - localParticipantCount : null;

  const userId = 'demo-user-123';
  const numericId = parseInt(String(event.id));
  const isRealEvent = !isNaN(numericId);

  useEffect(() => {
    if (!isRealEvent) return;
    fetch(`/api/user-events/${numericId}/booking-status?userId=${userId}`)
      .then(r => r.json())
      .then(data => { if (data.booked) setBooked(true); })
      .catch(() => {});
  }, [event.id, isRealEvent, numericId]);

  const handleParticipate = async () => {
    if (!isRealEvent) {
      if (booked) {
        setBooked(false);
        setLocalParticipantCount(prev => Math.max(0, prev - 1));
      } else {
        setBooked(true);
        setLocalParticipantCount(prev => prev + 1);
      }
      return;
    }
    setLoading(true);
    try {
      if (booked) {
        const res = await fetch(`/api/user-events/${numericId}/book?userId=${userId}`, { method: 'DELETE' });
        if (res.ok) {
          setBooked(false);
          setLocalParticipantCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const res = await fetch(`/api/user-events/${numericId}/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, displayName: 'Demo User' }),
        });
        const data = await res.json();
        if (data.ok) {
          setBooked(true);
          setLocalParticipantCount(prev => prev + 1);
        } else if (data.error) {
          console.warn('Booking failed:', data.error);
        }
      }
    } catch (err) {
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col h-full"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
      data-testid={`event-card-${event.id}`}
    >
      <div
        className="h-36 w-full relative flex items-end"
        style={{
          background: event.background_image_url
            ? `url(${event.background_image_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #247ba0 0%, #1a5c78 50%, #0f3d52 100%)',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        <div className="relative z-10 p-3 w-full">
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', backdropFilter: 'blur(4px)' }}
          >
            {typeLabel}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3
          className="text-lg font-bold leading-tight line-clamp-2"
          style={{ color: '#3A3A3A', fontFamily: 'Fjalla One' }}
          data-testid={`text-event-title-${event.id}`}
        >
          {event.title}
        </h3>
        <Text as="span" variant="small" className="text-gray-500 font-medium">
          {event.organizer}
        </Text>

        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#247ba0' }} />
            <Text as="span" variant="xs" className="text-gray-600">{dateStr}</Text>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#247ba0' }} />
            <Text as="span" variant="xs" className="text-gray-600">{timeStr} Uhr</Text>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#247ba0' }} />
            <Text as="span" variant="xs" className="text-gray-600 line-clamp-1">{event.location_name}</Text>
          </div>
        </div>

        <div className="mt-1">
          <Text
            as="p"
            variant="xs"
            className={`text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}
          >
            {event.description}
          </Text>
          {event.description.length > 80 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-semibold mt-0.5"
              style={{ color: '#247ba0' }}
              data-testid={`button-expand-event-${event.id}`}
            >
              {expanded ? 'weniger' : 'mehr lesen'}
            </button>
          )}
        </div>

        <div className="mt-auto pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: '#F3F4F6' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <Text as="span" variant="xs" className="text-gray-500">
                {localParticipantCount}{event.max_participants ? `/${event.max_participants}` : ''}
              </Text>
            </div>
            {event.entry_fee > 0 && (
              <Text as="span" variant="xs" className="font-semibold" style={{ color: '#247ba0' }}>
                {event.entry_fee.toFixed(2).replace('.', ',')} &euro;
              </Text>
            )}
            {event.entry_fee === 0 && (
              <Text as="span" variant="xs" className="font-semibold" style={{ color: '#16a34a' }}>
                Kostenlos
              </Text>
            )}
          </div>
          <div className="flex items-center gap-1">
            {event.event_page_url && (
              <a
                href={event.event_page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md transition-colors"
                style={{ color: '#247ba0' }}
                data-testid={`link-event-page-${event.id}`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={handleParticipate}
              className="text-xs px-3 py-1.5 rounded-md font-semibold transition-colors"
              style={{
                backgroundColor: loading ? '#D1D5DB' : booked ? '#16a34a' : (spotsLeft !== null && spotsLeft <= 0 ? '#E5E7EB' : '#247ba0'),
                color: loading ? '#9CA3AF' : (spotsLeft !== null && spotsLeft <= 0 && !booked ? '#9CA3AF' : '#FFFFFF'),
              }}
              disabled={loading || (spotsLeft !== null && spotsLeft <= 0 && !booked)}
              data-testid={`button-participate-${event.id}`}
            >
              {loading ? '...' : booked ? 'Angemeldet' : (spotsLeft !== null && spotsLeft <= 0 ? 'Ausgebucht' : 'Teilnehmen')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedEventCarousel({ events }: { events: MockEvent[] }) {
  return (
    <CarouselContainer
      showDesktopButtons={events.length > 3}
      showMobileButtons={events.length > 1}
      className="pb-4"
      buttonOffset={8}
    >
      <div className="flex -ml-4">
        {events.map((event) => (
          <div key={event.id} className="flex-[0_0_85%] sm:flex-[0_0_50%] md:flex-[0_0_33.333%] min-w-0 pl-4">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </CarouselContainer>
  );
}

function FeedBookCarousel({ books }: { books: BookCarouselItemData[] }) {
  return (
    <CarouselContainer
      showDesktopButtons={books.length > 4}
      showMobileButtons={books.length > 2}
      className="pb-4"
      buttonOffset={8}
    >
      <div className="flex -ml-4">
        {books.map((book) => (
          <div key={book.id} className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 pl-4">
            <BookCarouselItem book={book} size="md" />
          </div>
        ))}
      </div>
    </CarouselContainer>
  );
}

function SortChips({ sortBy, setSortBy }: { sortBy: string; setSortBy: (id: string) => void }) {
  return (
    <div className="mb-4 md:mb-6">
      <div className="relative flex justify-end">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full select-none overscroll-x-contain pr-6 md:pr-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className="sort-chip"
              aria-pressed={sortBy === option.id}
              data-testid={`sort-chip-${option.id}`}
            >
              <Text as="span" variant="xs" className="whitespace-nowrap !normal-case !tracking-normal !font-semibold">
                {option.label}
              </Text>
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-10 pointer-events-none bg-gradient-to-l from-[var(--color-beige)] to-transparent md:hidden" />
      </div>
    </div>
  );
}

function FeedSection({ section, isEditMode, onToggleVisibility, onTogglePublic }: {
  section: FeedSectionConfig;
  isEditMode: boolean;
  onToggleVisibility: () => void;
  onTogglePublic: () => void;
}) {
  const [sortBy, setSortBy] = useState('popularity');
  const { favorites, toggleFavorite } = useFavorites();
  const isCuratorSection = section.id === 'followed_curators';
  const isSponsoredSection = section.id === 'sponsored';
  const isEventsSection = section.id === 'followed_events';
  const isReadingSection = READING_SECTIONS.includes(section.id as ReadingStatus);
  const isBookOnlySection = BOOK_ONLY_SECTIONS.has(section.id);
  const showTagBar = !isBookOnlySection;
  const books = useMemo(() => getMockBooksForSection(section.id), [section.id]);
  const tags = useMemo(() => favoritesToTags(favorites, section.id), [favorites, section.id]);
  const existingIds = useMemo(() => new Set(tags.map((t) => t.entityId)), [tags]);
  const curatorIndex = 0;
  const curator = MOCK_CURATORS[curatorIndex];

  const handleAddTag = useCallback((item: FavoriteItem) => {
    toggleFavorite(item);
  }, [toggleFavorite]);

  const handleRemoveTag = useCallback((tag: TagData) => {
    toggleFavorite({
      id: tag.entityId,
      type: tag.entityType,
      title: tag.label,
      image: tag.image,
      color: tag.color,
    });
  }, [toggleFavorite]);

  const handleReadingStatusChange = useCallback((_bookId: string, _bookTitle: string, _newStatus: ReadingStatus) => {
    // Reading status is conceptual - books in reading sections are tracked by section membership
    // Future: implement backend reading_status per book and move between sections
  }, []);

  return (
    <section
      className="py-1 md:py-2 w-full"
      style={{ backgroundColor: 'transparent', overflow: 'visible' }}
      data-testid={`feed-section-${section.id}`}
    >
      <div className="max-w-7xl mx-auto w-full" style={{ backgroundColor: 'transparent', overflow: 'visible' }}>

        {isEditMode && (
          <div className="flex items-center justify-end gap-1 mb-2 flex-shrink-0">
            <button
              onClick={onToggleVisibility}
              data-testid={`toggle-visibility-${section.id}`}
              className="p-1.5 rounded-md"
              style={{ color: section.visible ? '#247ba0' : '#9CA3AF' }}
            >
              {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={onTogglePublic}
              data-testid={`toggle-public-${section.id}`}
              className="p-1.5 rounded-md"
              style={{ color: section.isPublic ? '#247ba0' : '#9CA3AF' }}
            >
              {section.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>
        )}

        <div className="w-full mt-4 md:mt-6 isolate">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="section-title text-foreground">
              {section.label}
            </h2>
          </div>
        </div>

        {(isCuratorSection && curator) ? (
          <div className="w-full mb-4 md:mb-6">
            <CuratorSectionHeader curator={curator} />
          </div>
        ) : isSponsoredSection ? (
          <div className="w-full mb-4 md:mb-6">
            <CuratorSectionHeader curator={MOCK_SPONSOR} isSponsored />
          </div>
        ) : null}

        {showTagBar && (
          <div className="w-full mt-4 mb-4">
            <div className="flex gap-2 flex-wrap items-center">
              {isCuratorSection && curator && (
                <div
                  role="group"
                  className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg select-none"
                  style={{ backgroundColor: 'var(--color-saffron, #e8a838)' }}
                >
                  <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                    {curator.name}
                  </Text>
                  <LikeButton
                    entityId={`curator-${curator.name.toLowerCase().replace(/\s+/g, '-')}`}
                    entityType="creator"
                    entityTitle={curator.name}
                    entityImage={curator.avatar}
                    variant="minimal"
                    size="sm"
                    iconColor="#ffffff"
                    backgroundColor="var(--color-saffron)"
                  />
                </div>
              )}
              {tags.map((tag) => (
                <div
                  role="group"
                  key={tag.entityId}
                  className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg select-none cursor-pointer transition-all duration-200 hover-elevate"
                  style={{ backgroundColor: tag.color }}
                >
                  <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                    {tag.label}
                  </Text>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="p-0.5 rounded-full transition-colors"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                    data-testid={`button-remove-tag-${tag.entityId}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <TagPickerDropdown
                sectionId={section.id}
                onAdd={handleAddTag}
                existingIds={existingIds}
              />
            </div>
          </div>
        )}


        {!isCuratorSection && !isSponsoredSection && (
          <div className="w-full mt-2 mb-4">
            <Text as="div" variant="base" className="leading-relaxed text-black">
              {section.description}
            </Text>
          </div>
        )}

        {!isEventsSection && (
          <SortChips sortBy={sortBy} setSortBy={setSortBy} />
        )}

        <div className="mb-4">
          {isEventsSection ? (
            <FeedEventCarousel events={MOCK_EVENTS} />
          ) : (
            <FeedBookCarousel books={books} />
          )}
        </div>
      </div>
    </section>
  );
}

function SortableFeedSection({
  section,
  isEditMode,
  onToggleVisibility,
  onTogglePublic,
}: {
  section: FeedSectionConfig;
  isEditMode: boolean;
  onToggleVisibility: () => void;
  onTogglePublic: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
    opacity: !section.visible && isEditMode ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex gap-2">
        {isEditMode && (
          <div
            className="flex items-start pt-5 cursor-grab"
            style={{ color: '#9CA3AF' }}
            {...attributes}
            {...listeners}
            data-testid={`drag-handle-${section.id}`}
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <FeedSection
            section={section}
            isEditMode={isEditMode}
            onToggleVisibility={onToggleVisibility}
            onTogglePublic={onTogglePublic}
          />
        </div>
      </div>
    </div>
  );
}

function FeedToolbar() {
  const {
    sections,
    toggleVisibility,
    scrollToSection,
    sortOrder,
    setSortOrder,
    feedAsHomepage,
    setFeedAsHomepage,
    isEditMode,
    setEditMode,
    resetToDefaults,
  } = useDashboardFeed();

  const [jumpOpen, setJumpOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const jumpRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (jumpRef.current && !jumpRef.current.contains(e.target as Node)) {
        setJumpOpen(false);
      }
      if (visibilityRef.current && !visibilityRef.current.contains(e.target as Node)) {
        setVisibilityOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleSections = sections.filter((s) => s.visible);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2" data-testid="feed-toolbar">
      <button
        onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors"
        style={{ color: '#3A3A3A', borderColor: '#E5E7EB' }}
        data-testid="button-sort-order"
      >
        <ArrowDownUp className="w-4 h-4" />
        {sortOrder === 'newest' ? 'Neueste zuerst' : 'Älteste zuerst'}
      </button>

      <div className="relative" ref={jumpRef}>
        <button
          onClick={() => { setJumpOpen(!jumpOpen); setVisibilityOpen(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors"
          style={{ color: '#3A3A3A', borderColor: '#E5E7EB' }}
          data-testid="button-jump-to-section"
        >
          <Hash className="w-4 h-4" />
          Springen
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {jumpOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-56 rounded-lg shadow-xl border z-50 py-1"
            style={{ backgroundColor: 'var(--color-beige, #faf6f1)', borderColor: '#E5E7EB' }}
          >
            {visibleSections.map((s) => (
              <button
                key={s.id}
                onClick={() => { scrollToSection(s.id); setJumpOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm transition-colors"
                style={{ color: '#3A3A3A' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                data-testid={`jump-to-${s.id}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={visibilityRef}>
        <button
          onClick={() => { setVisibilityOpen(!visibilityOpen); setJumpOpen(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors"
          style={{ color: '#3A3A3A', borderColor: '#E5E7EB' }}
          data-testid="button-toggle-sections"
        >
          <Eye className="w-4 h-4" />
          Sektionen
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {visibilityOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-64 rounded-lg shadow-xl border z-50 py-1"
            style={{ backgroundColor: 'var(--color-beige, #faf6f1)', borderColor: '#E5E7EB' }}
          >
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleVisibility(s.id)}
                className="w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors"
                style={{ color: s.visible ? '#3A3A3A' : '#9CA3AF' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                data-testid={`section-toggle-${s.id}`}
              >
                <span className="truncate">{s.label}</span>
                {s.visible ? (
                  <Eye className="w-4 h-4 flex-shrink-0" style={{ color: '#247ba0' }} />
                ) : (
                  <EyeOff className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setFeedAsHomepage(!feedAsHomepage)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors"
        style={{
          color: feedAsHomepage ? '#ffffff' : '#3A3A3A',
          borderColor: feedAsHomepage ? '#247ba0' : '#E5E7EB',
          backgroundColor: feedAsHomepage ? '#247ba0' : 'transparent',
        }}
        data-testid="button-feed-as-homepage"
      >
        <Home className="w-4 h-4" />
        {feedAsHomepage ? 'Startseite: Feed' : 'Als Startseite'}
      </button>

      {isEditMode && (
        <button
          onClick={resetToDefaults}
          data-testid="button-reset-feed"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
          style={{ color: '#3A3A3A', borderColor: '#E5E7EB' }}
        >
          <RotateCcw className="w-4 h-4" />
          Zurücksetzen
        </button>
      )}

      <button
        onClick={() => setEditMode(!isEditMode)}
        data-testid="button-toggle-edit-mode"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
        style={{
          backgroundColor: isEditMode ? '#247ba0' : 'transparent',
          color: isEditMode ? '#FFFFFF' : '#247ba0',
          border: isEditMode ? 'none' : '1px solid #E5E7EB',
        }}
      >
        {isEditMode ? (
          <>
            <Check className="w-4 h-4" />
            Fertig
          </>
        ) : (
          <>
            <Pencil className="w-4 h-4" />
            Anpassen
          </>
        )}
      </button>
    </div>
  );
}

export function DashboardFeed() {
  const {
    sections,
    reorderSections,
    toggleVisibility,
    togglePublic,
    isEditMode,
    sortOrder,
  } = useDashboardFeed();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSections(active.id as string, over.id as string);
    }
  };

  const filteredSections = isEditMode
    ? sections
    : sections.filter((s) => s.visible);

  const visibleSections = sortOrder === 'oldest'
    ? [...filteredSections].reverse()
    : filteredSections;

  return (
    <div className="space-y-8" data-testid="dashboard-feed">
      <div className="text-center">
        <h1
          className="text-2xl md:text-3xl mb-2"
          style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
          data-testid="text-feed-heading"
        >
          Mein Feed
        </h1>
        <div className="mt-3">
          <FeedToolbar />
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={visibleSections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-12">
            {visibleSections.map((section) => (
              <SortableFeedSection
                key={section.id}
                section={section}
                isEditMode={isEditMode}
                onToggleVisibility={() => toggleVisibility(section.id)}
                onTogglePublic={() => togglePublic(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
