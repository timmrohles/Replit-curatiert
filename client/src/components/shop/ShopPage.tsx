import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from '../../utils/routing';
import { Search, X, ChevronDown, Loader2, SlidersHorizontal } from 'lucide-react';
import { BookCarouselItem, BookCarouselItemData } from '../book/BookCarouselItem';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Container } from '../ui/container';
import { Section } from '../ui/section';
import { Heading, Text } from '../ui/typography';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { InfoBar } from '../layout/InfoBar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FilterSection } from './FilterSection';
import { MobileFilterDrawer } from './MobileFilterDrawer';

type SortOption = 'relevance' | 'newest' | 'most-awarded' | 'popular' | 'hidden-gems' | 'az' | 'date';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  totalLabel?: string;
}

function FilterDropdown({ label, options, selected, onToggle, onSearch, isLoading, totalLabel }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const updatePosition = useCallback(() => {
    if (!buttonRef.current || !panelRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const panelW = 320;
    const panelH = panelRef.current.scrollHeight || 300;
    let left = rect.left;
    if (left + panelW > window.innerWidth - 8) {
      left = window.innerWidth - panelW - 8;
    }
    if (left < 8) left = 8;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    if (spaceBelow < panelH && spaceAbove > spaceBelow) {
      const maxH = Math.min(spaceAbove, 384);
      const top = Math.max(8, rect.top - maxH - 4);
      panelRef.current.style.top = `${top}px`;
      panelRef.current.style.maxHeight = `${maxH}px`;
    } else {
      const maxH = Math.min(spaceBelow, 384);
      panelRef.current.style.top = `${rect.bottom + 4}px`;
      panelRef.current.style.maxHeight = `${maxH}px`;
    }
    panelRef.current.style.left = `${left}px`;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      updatePosition();
      if (inputRef.current) inputRef.current.focus();
    });

    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
      setFilterSearch('');
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setFilterSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, updatePosition]);

  const handleSearchChange = (value: string) => {
    setFilterSearch(value);
    if (onSearch) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(value), 300);
    }
  };

  const localFiltered = onSearch
    ? options
    : [...options].filter(opt => opt.toLowerCase().includes(filterSearch.toLowerCase()));

  const sortedOptions = [...localFiltered].sort((a, b) => a.localeCompare(b, 'de'));

  const hasSelection = selected.length > 0;
  const testId = label.toLowerCase().replace(/[^a-z]/g, '');

  return (
    <div className="flex-shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2.5 border bg-card text-sm font-medium transition-colors hover-elevate whitespace-nowrap"
        style={{
          borderColor: hasSelection ? 'var(--color-blue)' : 'var(--color-border)',
          borderRadius: '4px',
        }}
        data-testid={`filter-dropdown-${testId}`}
      >
        <span>{label}</span>
        {hasSelection && (
          <span
            className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-sm text-[11px] font-bold"
            style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
          >
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          className="fixed w-80 overflow-hidden bg-card border shadow-lg flex flex-col"
          style={{ borderColor: 'var(--color-border)', borderRadius: '4px', zIndex: 9999 }}
        >
          <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                ref={inputRef}
                type="text"
                value={filterSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`${label} suchen...`}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border"
                style={{ borderColor: 'var(--color-border)', borderRadius: '4px' }}
                data-testid={`filter-search-${testId}`}
              />
            </div>
            {hasSelection && (
              <button
                type="button"
                onClick={() => { selected.forEach(s => onToggle(s)); }}
                className="mt-2 text-xs hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-teal)' }}
                data-testid={`filter-clear-${testId}`}
              >
                Auswahl aufheben ({selected.length})
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-foreground/40" />
              </div>
            ) : sortedOptions.length === 0 ? (
              <div className="p-4 text-center">
                <Text variant="small" className="text-foreground/50">
                  {filterSearch ? `Keine Ergebnisse für "${filterSearch}"` : 'Keine Einträge'}
                </Text>
              </div>
            ) : (
              sortedOptions.map(option => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onToggle(option)}
                    className="w-full text-left px-4 py-2.5 text-sm hover-elevate flex items-center gap-3"
                    data-testid={`filter-option-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    <span
                      className="w-[18px] h-[18px] border flex-shrink-0 flex items-center justify-center"
                      style={{
                        borderRadius: '3px',
                        backgroundColor: isSelected ? 'var(--color-blue)' : 'transparent',
                        borderColor: isSelected ? 'var(--color-blue)' : 'var(--color-border)',
                      }}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{option}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
            <Text variant="xs" className="text-foreground/40">
              {sortedOptions.length} {totalLabel || 'Einträge'}
              {filterSearch && ' gefunden'}
            </Text>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

interface APIBook {
  id: number;
  title: string;
  author: string;
  publisher: string;
  cover_url: string | null;
  price: string | null;
  isbn13: string | null;
  isbn: string | null;
  description: string | null;
  availability: string | null;
  language: string | null;
  is_indie?: boolean;
  indie_type?: string | null;
  is_hidden_gem?: boolean;
  award_count?: number;
  nomination_count?: number;
  onix_tag_ids?: string[];
  award_details?: Array<{ name: string; year?: number; outcome: string }>;
}

function apiBookToCarouselItem(book: APIBook): BookCarouselItemData {
  return {
    id: String(book.id),
    title: book.title,
    author: book.author,
    coverImage: book.cover_url || '',
    price: book.price || '',
    isbn: book.isbn13 || book.isbn || undefined,
    publisher: book.publisher || undefined,
    klappentext: book.description || undefined,
    is_indie: book.is_indie,
    indie_type: book.indie_type,
    is_hidden_gem: book.is_hidden_gem,
    award_count: book.award_count,
    nomination_count: book.nomination_count,
    onixTagIds: book.onix_tag_ids,
  };
}

function FilterModeToggle({ filterMode, onFilterModeChange }: { filterMode: 'and' | 'or'; onFilterModeChange: (mode: 'and' | 'or') => void }) {
  return (
    <div className="flex items-center gap-0 border" style={{ borderColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => onFilterModeChange('and')}
        className="px-3 py-1.5 text-xs font-semibold transition-colors"
        style={{
          backgroundColor: filterMode === 'and' ? 'var(--color-blue)' : 'transparent',
          color: filterMode === 'and' ? 'white' : 'var(--color-foreground)',
        }}
        data-testid="filter-mode-and"
      >
        UND
      </button>
      <button
        type="button"
        onClick={() => onFilterModeChange('or')}
        className="px-3 py-1.5 text-xs font-semibold transition-colors"
        style={{
          backgroundColor: filterMode === 'or' ? 'var(--color-blue)' : 'transparent',
          color: filterMode === 'or' ? 'white' : 'var(--color-foreground)',
        }}
        data-testid="filter-mode-or"
      >
        ODER
      </button>
    </div>
  );
}

export function ShopPage() {
  const { t } = useTranslation();
  const navigate = useSafeNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [books, setBooks] = useState<APIBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showPopular, setShowPopular] = useState(false);
  const PAGE_SIZE = 50;

  const [filterMode, setFilterMode] = useState<'and' | 'or'>('and');
  const [isMobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedAwards, setSelectedAwards] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedPubTypes, setSelectedPubTypes] = useState<string[]>([]);

  const formatOptions = ['Hardcover', 'Softcover', 'eBook', 'Hörbuch'];
  const pubTypeOptions = [
    { id: 'indie', label: 'Indie (Kurt-Wolff-Verlage)' },
    { id: 'selfpublishing', label: 'Selfpublishing' },
    { id: 'debut', label: 'Debüt' },
  ];

  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [themeOptions, setThemeOptions] = useState<string[]>([]);
  const [seriesOptions] = useState<string[]>([]);
  const [awardOptions, setAwardOptions] = useState<string[]>([]);
  const [mediaOptions, setMediaOptions] = useState<string[]>([]);

  const [authorOptions, setAuthorOptions] = useState<string[]>([]);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [publisherOptions, setPublisherOptions] = useState<string[]>([]);
  const [publisherLoading, setPublisherLoading] = useState(false);

  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    const safeFetch = (url: string) => fetch(url).then(r => r.json()).catch(() => ({ ok: false, data: [] }));

    safeFetch('/api/books/score-thresholds').then(data => {
      if (data?.ok) setShowPopular(data.showPopular === true);
    });

    Promise.all([
      safeFetch('/api/categories?include_drafts=true'),
      safeFetch('/api/onix-tags'),
      safeFetch('/api/public/content-source-names'),
      safeFetch('/api/books/filter/authors?limit=50'),
      safeFetch('/api/books/filter/publishers?limit=50'),
      safeFetch('/api/awards'),
    ]).then(([catData, tagsData, mediaData, authorsData, pubsData, awardsData]) => {
      const cats = (catData?.data || []).map((c: any) => c.name || c).sort((a: string, b: string) => a.localeCompare(b, 'de'));
      if (cats.length > 0) setCategoryOptions(cats);

      const tags = tagsData?.data || [];
      if (tags.length > 0) {
        const themes = tags
          .filter((t: any) => ['topic', 'genre', 'audience', 'feature', 'publisher_cluster'].includes(t.tag_type))
          .map((t: any) => t.name)
          .sort((a: string, b: string) => a.localeCompare(b, 'de'));
        setThemeOptions(themes);
      }

      const awardNames = new Set<string>();
      (tags || []).filter((t: any) => t.tag_type === 'award').forEach((t: any) => awardNames.add(t.name));
      (awardsData?.data || []).forEach((a: any) => { if (a.name) awardNames.add(a.name); });
      const sortedAwards = Array.from(awardNames).sort((a, b) => a.localeCompare(b, 'de'));
      if (sortedAwards.length > 0) setAwardOptions(sortedAwards);

      const media = (mediaData?.data || []).map((m: any) => m.name || m.title).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b, 'de'));
      if (media.length > 0) setMediaOptions(media);

      if (authorsData?.data?.length > 0) setAuthorOptions(authorsData.data);
      if (pubsData?.data?.length > 0) setPublisherOptions(pubsData.data);
    });
  }, []);

  const searchAuthors = useCallback((q: string) => {
    setAuthorLoading(true);
    fetch(`/api/books/filter/authors?q=${encodeURIComponent(q)}&limit=50`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setAuthorOptions(data.data || []);
      })
      .catch(() => {})
      .finally(() => setAuthorLoading(false));
  }, []);

  const searchPublishers = useCallback((q: string) => {
    setPublisherLoading(true);
    fetch(`/api/books/filter/publishers?q=${encodeURIComponent(q)}&limit=50`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setPublisherOptions(data.data || []);
      })
      .catch(() => {})
      .finally(() => setPublisherLoading(false));
  }, []);

  const fetchBooks = useCallback(async (offset: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(offset));
      params.set('sort', sortBy);
      params.set('filterMode', filterMode);
      if (searchQuery) params.set('q', searchQuery);
      if (selectedAuthors.length > 0) params.set('authors', selectedAuthors.join(','));
      if (selectedPublishers.length > 0) params.set('publishers', selectedPublishers.join(','));
      if (selectedAwards.length > 0) params.set('awards', selectedAwards.join(','));
      if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
      if (selectedThemes.length > 0) params.set('themes', selectedThemes.join(','));
      if (selectedMedia.length > 0) params.set('podcasts', selectedMedia.join(','));
      if (selectedPubTypes.length > 0) params.set('pubTypes', selectedPubTypes.join(','));

      const res = await fetch(`/api/books?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        const fetched: APIBook[] = data.data || [];
        if (offset === 0) {
          setBooks(fetched);
          setTotalCount(data.total ?? fetched.length);
        } else {
          setBooks(prev => [...prev, ...fetched]);
        }
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortBy, filterMode, selectedAuthors, selectedPublishers, selectedAwards, selectedCategories, selectedThemes, selectedMedia, selectedPubTypes]);

  useEffect(() => {
    setPage(0);
    fetchBooks(0);
  }, [fetchBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBooks(nextPage * PAGE_SIZE);
  };

  const toggleFilter = (list: string[], item: string, setter: (v: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(x => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const sortedBooks = books;

  const hasActiveFilters = selectedCategories.length > 0 || selectedThemes.length > 0 ||
    selectedSeries.length > 0 || selectedPublishers.length > 0 || selectedAuthors.length > 0 ||
    selectedAwards.length > 0 || selectedMedia.length > 0 || selectedFormats.length > 0 || selectedPubTypes.length > 0;

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedThemes([]);
    setSelectedSeries([]);
    setSelectedPublishers([]);
    setSelectedAuthors([]);
    setSelectedAwards([]);
    setSelectedMedia([]);
    setSelectedFormats([]);
    setSelectedPubTypes([]);
  };

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'relevance', label: t('shop.sortRelevance', 'Relevanz') },
    { id: 'newest', label: t('shop.sortNewest', 'Neu') },
    { id: 'most-awarded', label: t('shop.sortAwarded', 'Am meisten ausgezeichnet') },
    ...(showPopular ? [{ id: 'popular' as SortOption, label: t('shop.sortPopular', 'Beliebt') }] : []),
    { id: 'hidden-gems', label: t('shop.sortHiddenGems', 'Geheimtipps') },
    { id: 'az', label: t('shop.sortAZ', 'A–Z') },
  ];

  const allSelectedFilters = [
    ...selectedCategories.map(v => ({ label: v, type: 'category' as const })),
    ...selectedThemes.map(v => ({ label: v, type: 'theme' as const })),
    ...selectedSeries.map(v => ({ label: v, type: 'series' as const })),
    ...selectedAuthors.map(v => ({ label: v, type: 'author' as const })),
    ...selectedPublishers.map(v => ({ label: v, type: 'publisher' as const })),
    ...selectedAwards.map(v => ({ label: v, type: 'award' as const })),
    ...selectedMedia.map(v => ({ label: v, type: 'media' as const })),
    ...selectedFormats.map(v => ({ label: v, type: 'format' as const })),
    ...selectedPubTypes.map(v => ({ label: pubTypeOptions.find(p => p.id === v)?.label || v, type: 'pubtype' as const })),
  ];

  const pubTypeLabelItems = pubTypeOptions.map(p => p.label);

  return (
    <div className="bg-background min-h-screen">
      <Helmet>
        <title>Bücher entdecken – Kuratierte Buchempfehlungen | coratiert.de</title>
        <meta name="description" content="Durchstöbere unseren kuratierten Buchkatalog. Finde Bücher nach Autor:innen, Verlagen, Genres, Auszeichnungen und mehr – empfohlen von echten Literaturkenner:innen." />
        <link rel="canonical" href="https://coratiert.de/de-de/buecher" />
        <meta property="og:title" content="Bücher entdecken – Kuratierte Buchempfehlungen | coratiert.de" />
        <meta property="og:description" content="Durchstöbere unseren kuratierten Buchkatalog. Finde Bücher nach Autor:innen, Verlagen, Genres, Auszeichnungen und mehr." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://coratiert.de/de-de/buecher" />
      </Helmet>
      <InfoBar />
      <Header />

      <Breadcrumb
        items={[
          { label: "Start", href: "/" },
          { label: "Bücher" }
        ]}
      />

      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading as="h1" variant="h1" className="mb-4 !text-foreground">
              Bücher
            </Heading>
            <Text variant="large" className="max-w-3xl !text-foreground">
              Durchstöbern Sie unseren kompletten Buchkatalog - kuratiert von Expert*innen, für echte Literaturliebhaber*innen.
            </Text>
          </div>
        </Container>
      </Section>

      <Section variant="compact" className="!pb-2 !pt-6">
        <Container>
          <div className="max-w-2xl mx-auto mb-6">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Bücher, Autor*innen, Verlage durchsuchen..."
                  className="search-input"
                  aria-label="Buchkatalog durchsuchen"
                  data-testid="input-book-search"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-wrap" style={{ scrollbarWidth: 'none' }}>
            <Text variant="xs" className="whitespace-nowrap text-foreground/50 flex-shrink-0 !font-semibold">Sortieren:</Text>
            {sortOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSortBy(option.id)}
                className="sort-chip flex-shrink-0"
                aria-pressed={sortBy === option.id}
                data-testid={`sort-${option.id}`}
              >
                <Text as="span" variant="xs" className="whitespace-nowrap !normal-case !tracking-normal !font-semibold">
                  {option.label}
                </Text>
              </button>
            ))}
          </div>

          {allSelectedFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {allSelectedFilters.map(f => (
                <Badge
                  key={`${f.type}-${f.label}`}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => {
                    if (f.type === 'category') toggleFilter(selectedCategories, f.label, setSelectedCategories);
                    if (f.type === 'theme') toggleFilter(selectedThemes, f.label, setSelectedThemes);
                    if (f.type === 'series') toggleFilter(selectedSeries, f.label, setSelectedSeries);
                    if (f.type === 'publisher') toggleFilter(selectedPublishers, f.label, setSelectedPublishers);
                    if (f.type === 'author') toggleFilter(selectedAuthors, f.label, setSelectedAuthors);
                    if (f.type === 'award') toggleFilter(selectedAwards, f.label, setSelectedAwards);
                    if (f.type === 'media') toggleFilter(selectedMedia, f.label, setSelectedMedia);
                    if (f.type === 'format') toggleFilter(selectedFormats, f.label, setSelectedFormats);
                    if (f.type === 'pubtype') {
                      const opt = pubTypeOptions.find(p => p.label === f.label);
                      toggleFilter(selectedPubTypes, opt?.id || f.label, setSelectedPubTypes);
                    }
                  }}
                >
                  {f.label}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity px-3 py-1 flex-shrink-0 whitespace-nowrap"
                style={{ color: 'var(--color-teal)' }}
                data-testid="button-clear-filters"
              >
                <X className="w-3.5 h-3.5" />
                Zurücksetzen
              </button>
            </div>
          )}
        </Container>
      </Section>

      <Section className="!py-6 md:!py-8 px-2 md:px-4">
        <Container>
          <div className="flex gap-8">
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <Heading as="h3" variant="h5">Filter</Heading>
                  <FilterModeToggle filterMode={filterMode} onFilterModeChange={setFilterMode} />
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity mb-4"
                    style={{ color: 'var(--color-teal)' }}
                    data-testid="button-sidebar-clear-filters"
                  >
                    <X className="w-3.5 h-3.5" />
                    Alle Filter zurücksetzen
                  </button>
                )}

                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  <FilterSection
                    title="Kategorien"
                    items={categoryOptions}
                    selectedItems={selectedCategories}
                    onToggle={(v) => toggleFilter(selectedCategories, v, setSelectedCategories)}
                    defaultExpanded
                  />
                  <FilterSection
                    title="Themen"
                    items={themeOptions}
                    selectedItems={selectedThemes}
                    onToggle={(v) => toggleFilter(selectedThemes, v, setSelectedThemes)}
                  />
                  <FilterSection
                    title="Buchpreise"
                    items={awardOptions}
                    selectedItems={selectedAwards}
                    onToggle={(v) => toggleFilter(selectedAwards, v, setSelectedAwards)}
                  />
                  <FilterSection
                    title="Medienresonanz"
                    items={mediaOptions}
                    selectedItems={selectedMedia}
                    onToggle={(v) => toggleFilter(selectedMedia, v, setSelectedMedia)}
                  />
                  <FilterSection
                    title="Autor*innen"
                    items={authorOptions}
                    selectedItems={selectedAuthors}
                    onToggle={(v) => toggleFilter(selectedAuthors, v, setSelectedAuthors)}
                  />
                  <FilterSection
                    title="Verlage"
                    items={publisherOptions}
                    selectedItems={selectedPublishers}
                    onToggle={(v) => toggleFilter(selectedPublishers, v, setSelectedPublishers)}
                  />
                  <FilterSection
                    title="Buchreihen"
                    items={seriesOptions}
                    selectedItems={selectedSeries}
                    onToggle={(v) => toggleFilter(selectedSeries, v, setSelectedSeries)}
                  />
                  <FilterSection
                    title="Medienarten"
                    items={formatOptions}
                    selectedItems={selectedFormats}
                    onToggle={(v) => toggleFilter(selectedFormats, v, setSelectedFormats)}
                  />
                  <FilterSection
                    title="Publikationsform"
                    items={pubTypeLabelItems}
                    selectedItems={selectedPubTypes.map(id => pubTypeOptions.find(p => p.id === id)?.label || id)}
                    onToggle={(label) => {
                      const opt = pubTypeOptions.find(p => p.label === label);
                      if (opt) toggleFilter(selectedPubTypes, opt.id, setSelectedPubTypes);
                    }}
                  />
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <Text variant="base" className="text-foreground/70" data-testid="text-result-count">
                  {isLoading && books.length === 0
                    ? t('shop.searching', 'Suche...')
                    : searchQuery
                      ? t('shop.searchResults', '{{count}} Ergebnis{{plural}} für "{{query}}"', { count: totalCount, plural: totalCount !== 1 ? 'se' : '', query: searchQuery })
                      : t('shop.totalBooks', '{{count}} Bücher', { count: totalCount })
                  }
                </Text>

                <button
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 border bg-card text-sm font-medium"
                  style={{ borderColor: 'var(--color-border)', borderRadius: '4px' }}
                  onClick={() => setMobileFilterOpen(true)}
                  data-testid="button-mobile-filter"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filter
                  {hasActiveFilters && (
                    <span
                      style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
                      className="rounded-sm px-1.5 text-xs font-bold"
                    >
                      {allSelectedFilters.length}
                    </span>
                  )}
                </button>
              </div>

              {isLoading && books.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-foreground/40" />
                </div>
              ) : sortedBooks.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {sortedBooks.map(book => (
                      <BookCarouselItem
                        key={book.id}
                        book={apiBookToCarouselItem(book)}
                        size="sm"
                      />
                    ))}
                  </div>

                  {sortedBooks.length < totalCount && (
                    <div className="flex justify-center mt-8">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        data-testid="button-load-more"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            {t('shop.loading', 'Laden...')}
                          </>
                        ) : (
                          t('shop.loadMore', 'Mehr Bücher laden ({{loaded}} von {{total}})', { loaded: sortedBooks.length, total: totalCount })
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Heading as="h2" variant="h2" className="mb-3">
                    {searchQuery ? `Keine Ergebnisse für "${searchQuery}"` : 'Keine Bücher gefunden'}
                  </Heading>
                  <Text variant="large" className="mb-6 text-foreground/60">
                    {searchQuery ? 'Versuchen Sie einen anderen Suchbegriff' : 'Versuchen Sie, einige Filter zu entfernen'}
                  </Text>
                  {hasActiveFilters && (
                    <Button
                      variant="default"
                      onClick={clearAllFilters}
                      data-testid="button-reset-all-filters"
                    >
                      Alle Filter zurücksetzen
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        hasActiveFilters={hasActiveFilters}
        clearAllFilters={clearAllFilters}
        resultCount={totalCount}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        categories={categoryOptions}
        selectedCategories={selectedCategories}
        onToggleCategory={(v) => toggleFilter(selectedCategories, v, setSelectedCategories)}
        themes={themeOptions}
        selectedThemes={selectedThemes}
        onToggleTheme={(v) => toggleFilter(selectedThemes, v, setSelectedThemes)}
        awards={awardOptions}
        selectedAwards={selectedAwards}
        onToggleAward={(v) => toggleFilter(selectedAwards, v, setSelectedAwards)}
        media={mediaOptions}
        selectedMedia={selectedMedia}
        onToggleMedia={(v) => toggleFilter(selectedMedia, v, setSelectedMedia)}
        authors={authorOptions}
        selectedAuthors={selectedAuthors}
        onToggleAuthor={(v) => toggleFilter(selectedAuthors, v, setSelectedAuthors)}
        publishers={publisherOptions}
        selectedPublishers={selectedPublishers}
        onTogglePublisher={(v) => toggleFilter(selectedPublishers, v, setSelectedPublishers)}
        series={seriesOptions}
        selectedSeries={selectedSeries}
        onToggleSeries={(v) => toggleFilter(selectedSeries, v, setSelectedSeries)}
        formats={formatOptions}
        selectedFormats={selectedFormats}
        onToggleFormat={(v) => toggleFilter(selectedFormats, v, setSelectedFormats)}
        pubTypeLabels={pubTypeLabelItems}
        selectedPubTypeLabels={selectedPubTypes.map(id => pubTypeOptions.find(p => p.id === id)?.label || id)}
        onTogglePubType={(label) => {
          const opt = pubTypeOptions.find(p => p.label === label);
          if (opt) toggleFilter(selectedPubTypes, opt.id, setSelectedPubTypes);
        }}
      />

      <Footer />
    </div>
  );
}
