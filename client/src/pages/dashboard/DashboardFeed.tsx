import { useState, useMemo } from 'react';
import { useDashboardFeed, type FeedSectionType } from './DashboardFeedContext';
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
} from 'lucide-react';
import type { FeedSectionConfig } from './DashboardFeedContext';
import { BookCarouselItem, type BookCarouselItemData } from '../../components/book/BookCarouselItem';
import { CarouselContainer } from '../../components/carousel/CarouselContainer';
import { LikeButton } from '../../components/favorites/LikeButton';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Text } from '../../components/ui/typography';

interface MockCurator {
  name: string;
  avatar: string;
  focus: string;
  isVerified: boolean;
}

const MOCK_CURATORS: MockCurator[] = [
  {
    name: 'coratiert Redaktion',
    avatar: '/uploads/avatars/coratiert-redaktion.jpg',
    focus: 'Die Allzweckwaffe unter den Redakteur*innen',
    isVerified: true,
  },
  {
    name: 'Elena Hartmann',
    avatar: '',
    focus: 'Belletristik & Literarische Fiction',
    isVerified: false,
  },
];

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

const MOCK_TAGS_BY_SECTION: Record<string, Array<{ label: string; color: string }>> = {
  favorites: [
    { label: 'Belletristik', color: 'var(--vibrant-coral, #f25f5c)' },
    { label: 'Krimi & Thriller', color: 'var(--color-saffron, #e8a838)' },
    { label: 'Sachbuch', color: 'var(--color-teal, #70c1b3)' },
  ],
  currently_reading: [
    { label: 'Roman', color: 'var(--vibrant-coral, #f25f5c)' },
    { label: 'Biografie', color: 'var(--color-teal, #70c1b3)' },
  ],
  already_read: [
    { label: 'Klassiker', color: 'var(--color-saffron, #e8a838)' },
    { label: 'Fantasy', color: 'var(--vibrant-coral, #f25f5c)' },
    { label: 'Sachbuch', color: 'var(--color-teal, #70c1b3)' },
  ],
  want_to_read: [
    { label: 'Neuerscheinungen', color: 'var(--vibrant-coral, #f25f5c)' },
    { label: 'Empfohlen', color: 'var(--color-saffron, #e8a838)' },
  ],
  reading_list: [
    { label: 'Vorgemerkt', color: 'var(--color-teal, #70c1b3)' },
    { label: 'Geschenk-Ideen', color: 'var(--color-saffron, #e8a838)' },
  ],
  followed_authors: [
    { label: 'Kazuo Ishiguro', color: 'var(--color-saffron, #e8a838)' },
    { label: 'Walter Moers', color: 'var(--vibrant-coral, #f25f5c)' },
  ],
  followed_publishers: [
    { label: 'Suhrkamp', color: 'var(--color-teal, #70c1b3)' },
    { label: 'Diogenes', color: 'var(--color-saffron, #e8a838)' },
  ],
  followed_categories: [
    { label: 'Belletristik', color: 'var(--vibrant-coral, #f25f5c)' },
    { label: 'Sachbuch', color: 'var(--color-teal, #70c1b3)' },
  ],
  followed_tags: [
    { label: 'Achtsamkeit', color: 'var(--color-saffron, #e8a838)' },
    { label: 'Feminismus', color: 'var(--vibrant-coral, #f25f5c)' },
  ],
  recommendations: [
    { label: 'Basierend auf Favoriten', color: 'var(--color-teal, #70c1b3)' },
    { label: 'Trending', color: 'var(--vibrant-coral, #f25f5c)' },
  ],
  followed_curators: [],
};

const SORT_OPTIONS = [
  { id: 'popularity', label: 'Beliebtheit' },
  { id: 'awarded', label: 'Auszeichnungen' },
  { id: 'independent', label: 'Independent' },
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

function CuratorSectionHeader({ curator }: { curator: MockCurator }) {
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
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
            <Text as="span" variant="small" className="font-semibold text-gray-500">
              {curator.focus}
            </Text>
          </div>
        </div>
      </div>
    </div>
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
  const isCuratorSection = section.id === 'followed_curators';
  const books = useMemo(() => getMockBooksForSection(section.id), [section.id]);
  const tags = MOCK_TAGS_BY_SECTION[section.id] || [];
  const curatorIndex = 0;
  const curator = MOCK_CURATORS[curatorIndex];

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

        {isCuratorSection && curator ? (
          <div className="w-full mb-4 md:mb-6">
            <CuratorSectionHeader curator={curator} />
          </div>
        ) : null}

        <div className="w-full mt-4 md:mt-6 isolate">
          <h3 className="section-title mb-4 text-foreground">
            {isCuratorSection ? 'Neue Bücher für Leseratten' : section.label}
          </h3>
        </div>

        {tags.length > 0 && (
          <div className="w-full mt-4 mb-4">
            <div className="flex gap-2 flex-wrap items-start">
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
                  key={tag.label}
                  className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg cursor-pointer transition-all duration-200 select-none hover-elevate"
                  style={{ backgroundColor: tag.color }}
                >
                  <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                    {tag.label}
                  </Text>
                  <LikeButton
                    entityId={`tag-${tag.label.toLowerCase().replace(/\s+/g, '-')}`}
                    entityType="tag"
                    entityTitle={tag.label}
                    variant="minimal"
                    size="sm"
                    iconColor="#ffffff"
                    backgroundColor={tag.color}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {isCuratorSection && curator && (
          <div className="w-full mt-4 mb-4">
            <Text as="div" variant="base" className="leading-relaxed text-black line-clamp-3">
              {section.description}
            </Text>
          </div>
        )}

        {!isCuratorSection && (
          <div className="w-full mt-2 mb-4">
            <Text as="div" variant="base" className="leading-relaxed text-black">
              {section.description}
            </Text>
          </div>
        )}

        <SortChips sortBy={sortBy} setSortBy={setSortBy} />

        <div className="mb-4">
          <FeedBookCarousel books={books} />
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

export function DashboardFeed() {
  const {
    sections,
    reorderSections,
    toggleVisibility,
    togglePublic,
    isEditMode,
    setEditMode,
    resetToDefaults,
  } = useDashboardFeed();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSections(active.id as string, over.id as string);
    }
  };

  const visibleSections = isEditMode
    ? sections
    : sections.filter((s) => s.visible);

  return (
    <div className="space-y-8" data-testid="dashboard-feed">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2
          className="section-title text-foreground"
          data-testid="text-feed-heading"
        >
          Mein Feed
        </h2>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <button
              onClick={resetToDefaults}
              data-testid="button-reset-feed"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
              style={{ color: '#6B7280', borderColor: '#E5E7EB' }}
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
