import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSafeNavigate } from '../../utils/routing';
import { Search, X, ChevronDown, Loader2 } from 'lucide-react';
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

type SortOption = 'popularity' | 'awarded' | 'hidden-gems' | 'az' | 'date';

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFilterSearch('');
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
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      <button
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

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-80 max-h-96 overflow-hidden bg-card border shadow-lg z-50 flex flex-col"
          style={{ borderColor: 'var(--color-border)', borderRadius: '4px' }}
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
        </div>
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
  award_count?: number;
  nomination_count?: number;
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
  };
}

export function ShopPage() {
  const navigate = useSafeNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [books, setBooks] = useState<APIBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedAwards, setSelectedAwards] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

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
      const sortedAwards = [...awardNames].sort((a, b) => a.localeCompare(b, 'de'));
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

  const fetchBooks = useCallback(async (query: string, offset: number) => {
    setIsLoading(true);
    try {
      const url = query
        ? `/api/books/search?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}`
        : `/api/books?limit=${PAGE_SIZE}&offset=${offset}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        const fetched: APIBook[] = data.data || [];
        if (offset === 0) {
          setBooks(fetched);
        } else {
          setBooks(prev => [...prev, ...fetched]);
        }
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    fetchBooks(searchQuery, 0);
  }, [searchQuery, fetchBooks]);

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
    fetchBooks(searchQuery, nextPage * PAGE_SIZE);
  };

  const toggleFilter = (list: string[], item: string, setter: (v: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(x => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const filteredBooks = books.filter(book => {
    if (selectedPublishers.length > 0 && !selectedPublishers.includes(book.publisher)) {
      return false;
    }
    if (selectedAuthors.length > 0 && !selectedAuthors.includes(book.author)) {
      return false;
    }
    return true;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'az':
        return (a.title || '').localeCompare(b.title || '', 'de');
      case 'date':
        return b.id - a.id;
      case 'awarded':
        return (b.award_count || 0) - (a.award_count || 0);
      case 'popularity':
      case 'hidden-gems':
      default:
        return 0;
    }
  });

  const hasActiveFilters = selectedCategories.length > 0 || selectedThemes.length > 0 ||
    selectedSeries.length > 0 || selectedPublishers.length > 0 || selectedAuthors.length > 0 ||
    selectedAwards.length > 0 || selectedMedia.length > 0;

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedThemes([]);
    setSelectedSeries([]);
    setSelectedPublishers([]);
    setSelectedAuthors([]);
    setSelectedAwards([]);
    setSelectedMedia([]);
  };

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'popularity', label: 'Beliebtheit' },
    { id: 'awarded', label: 'Auszeichnungen' },
    { id: 'hidden-gems', label: 'Hidden Gems' },
    { id: 'az', label: 'A-Z' },
    { id: 'date', label: 'Veröffentlichung' },
  ];

  const allSelectedFilters = [
    ...selectedCategories.map(v => ({ label: v, type: 'category' as const })),
    ...selectedThemes.map(v => ({ label: v, type: 'theme' as const })),
    ...selectedSeries.map(v => ({ label: v, type: 'series' as const })),
    ...selectedAuthors.map(v => ({ label: v, type: 'author' as const })),
    ...selectedPublishers.map(v => ({ label: v, type: 'publisher' as const })),
    ...selectedAwards.map(v => ({ label: v, type: 'award' as const })),
    ...selectedMedia.map(v => ({ label: v, type: 'media' as const })),
  ];

  return (
    <div className="bg-background min-h-screen">
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

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            <FilterDropdown
              label="Kategorien"
              options={categoryOptions}
              selected={selectedCategories}
              onToggle={(v) => toggleFilter(selectedCategories, v, setSelectedCategories)}
              totalLabel="Kategorien"
            />
            <FilterDropdown
              label="Themen"
              options={themeOptions}
              selected={selectedThemes}
              onToggle={(v) => toggleFilter(selectedThemes, v, setSelectedThemes)}
              totalLabel="Themen"
            />
            <FilterDropdown
              label="Buchreihen"
              options={seriesOptions}
              selected={selectedSeries}
              onToggle={(v) => toggleFilter(selectedSeries, v, setSelectedSeries)}
              totalLabel="Buchreihen"
            />
            <FilterDropdown
              label="Autoren"
              options={authorOptions}
              selected={selectedAuthors}
              onToggle={(v) => toggleFilter(selectedAuthors, v, setSelectedAuthors)}
              onSearch={searchAuthors}
              isLoading={authorLoading}
              totalLabel="Autor*innen"
            />
            <FilterDropdown
              label="Verlage"
              options={publisherOptions}
              selected={selectedPublishers}
              onToggle={(v) => toggleFilter(selectedPublishers, v, setSelectedPublishers)}
              onSearch={searchPublishers}
              isLoading={publisherLoading}
              totalLabel="Verlage"
            />
            <FilterDropdown
              label="Auszeichnungen"
              options={awardOptions}
              selected={selectedAwards}
              onToggle={(v) => toggleFilter(selectedAwards, v, setSelectedAwards)}
              totalLabel="Auszeichnungen"
            />
            <FilterDropdown
              label="Medien"
              options={mediaOptions}
              selected={selectedMedia}
              onToggle={(v) => toggleFilter(selectedMedia, v, setSelectedMedia)}
              totalLabel="Medien"
            />

            <div className="h-6 w-px bg-foreground/15 flex-shrink-0" />

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

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity px-3 py-2 flex-shrink-0 whitespace-nowrap"
                style={{ color: 'var(--color-teal)' }}
                data-testid="button-clear-filters"
              >
                <X className="w-3.5 h-3.5" />
                Zurücksetzen
              </button>
            )}
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
                  }}
                >
                  {f.label}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <Section className="!py-6 md:!py-8 px-2 md:px-4">
        <Container>
          {searchQuery && (
            <div className="mb-4">
              <Text variant="base" className="text-foreground/70">
                {isLoading ? 'Suche...' : `${sortedBooks.length} Ergebnis${sortedBooks.length !== 1 ? 'se' : ''} für "${searchQuery}"`}
              </Text>
            </div>
          )}

          {isLoading && books.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-foreground/40" />
            </div>
          ) : sortedBooks.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {sortedBooks.map(book => (
                  <BookCarouselItem
                    key={book.id}
                    book={apiBookToCarouselItem(book)}
                    size="sm"
                  />
                ))}
              </div>

              {!searchQuery && sortedBooks.length >= PAGE_SIZE && (
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
                        Laden...
                      </>
                    ) : (
                      'Mehr Bücher laden'
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
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
