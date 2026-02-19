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

type SortOption = 'newest' | 'popularity' | 'awarded' | 'critics' | 'hidden-gems' | 'trending';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterDropdown({ label, options, selected, onToggle }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const sortedOptions = [...options].sort((a, b) => a.localeCompare(b, 'de'));

  const filteredOptions = sortedOptions.filter(opt =>
    opt.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const hasSelection = selected.length > 0;
  const testId = label.toLowerCase().replace(/[^a-z]/g, '');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2.5 border bg-card text-sm font-medium transition-colors hover-elevate"
        style={{
          borderColor: hasSelection ? 'var(--color-blue)' : 'var(--color-border)',
          borderRadius: '4px',
        }}
        data-testid={`filter-dropdown-${testId}`}
      >
        <span className="whitespace-nowrap">{label}</span>
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
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder={`${label} suchen...`}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border"
                style={{ borderColor: 'var(--color-border)', borderRadius: '4px' }}
                data-testid={`filter-search-${testId}`}
              />
            </div>
            {hasSelection && (
              <button
                type="button"
                onClick={() => {
                  selected.forEach(s => onToggle(s));
                }}
                className="mt-2 text-xs hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-teal)' }}
                data-testid={`filter-clear-${testId}`}
              >
                Auswahl aufheben ({selected.length})
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center">
                <Text variant="small" className="text-foreground/50">
                  Keine Ergebnisse für &quot;{filterSearch}&quot;
                </Text>
              </div>
            ) : (
              filteredOptions.map(option => {
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
              {filteredOptions.length} von {options.length} {label === 'Autor' ? 'Autor*innen' : label === 'Verlag' ? 'Verlage' : 'Einträge'}
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
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [books, setBooks] = useState<APIBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedAwards, setSelectedAwards] = useState<string[]>([]);

  const [publisherOptions, setPublisherOptions] = useState<string[]>([]);
  const [authorOptions, setAuthorOptions] = useState<string[]>([]);
  const [awardOptions, setAwardOptions] = useState<string[]>([]);

  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    fetch('/api/onix-tags')
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          const awards = (data.data || [])
            .filter((t: any) => t.tag_type === 'award')
            .map((t: any) => t.name)
            .sort((a: string, b: string) => a.localeCompare(b, 'de'));
          setAwardOptions(awards);
        }
      })
      .catch(() => {});
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

        const pubs = Array.from(new Set(fetched.map((b: APIBook) => b.publisher).filter(Boolean))) as string[];
        const authors = Array.from(new Set(fetched.map((b: APIBook) => b.author).filter(Boolean))) as string[];
        if (offset === 0) {
          setPublisherOptions(pubs);
          setAuthorOptions(authors);
        } else {
          setPublisherOptions(prev => Array.from(new Set([...prev, ...pubs])));
          setAuthorOptions(prev => Array.from(new Set([...prev, ...authors])));
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
      case 'newest':
        return b.id - a.id;
      case 'popularity':
        return (a.title || '').localeCompare(b.title || '', 'de');
      case 'awarded':
        return (b.award_count || 0) - (a.award_count || 0);
      default:
        return 0;
    }
  });

  const hasActiveFilters = selectedPublishers.length > 0 || selectedAuthors.length > 0 || selectedAwards.length > 0;

  const clearAllFilters = () => {
    setSelectedPublishers([]);
    setSelectedAuthors([]);
    setSelectedAwards([]);
  };

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'newest', label: 'Neueste' },
    { id: 'popularity', label: 'Beliebtheit' },
    { id: 'awarded', label: 'Auszeichnungen' },
    { id: 'critics', label: 'Kritiker-Lieblinge' },
    { id: 'hidden-gems', label: 'Hidden Gems' },
    { id: 'trending', label: 'Aktuell' },
  ];

  const allSelectedFilters = [
    ...selectedPublishers.map(v => ({ label: v, type: 'publisher' as const })),
    ...selectedAuthors.map(v => ({ label: v, type: 'author' as const })),
    ...selectedAwards.map(v => ({ label: v, type: 'award' as const })),
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

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap md:flex-wrap"
              style={{ scrollbarWidth: 'none' }}>
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortBy(option.id)}
                  className="sort-chip"
                  aria-pressed={sortBy === option.id}
                  data-testid={`sort-${option.id}`}
                >
                  <Text as="span" variant="xs" className="whitespace-nowrap !normal-case !tracking-normal !font-semibold">
                    {option.label}
                  </Text>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Verlag"
              options={publisherOptions}
              selected={selectedPublishers}
              onToggle={(v) => toggleFilter(selectedPublishers, v, setSelectedPublishers)}
            />
            <FilterDropdown
              label="Autor"
              options={authorOptions}
              selected={selectedAuthors}
              onToggle={(v) => toggleFilter(selectedAuthors, v, setSelectedAuthors)}
            />
            <FilterDropdown
              label="Auszeichnung"
              options={awardOptions}
              selected={selectedAwards}
              onToggle={(v) => toggleFilter(selectedAwards, v, setSelectedAwards)}
            />

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity px-3 py-2"
                style={{ color: 'var(--color-teal)' }}
                data-testid="button-clear-filters"
              >
                <X className="w-3.5 h-3.5" />
                Alle zurücksetzen
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
                    if (f.type === 'publisher') toggleFilter(selectedPublishers, f.label, setSelectedPublishers);
                    if (f.type === 'author') toggleFilter(selectedAuthors, f.label, setSelectedAuthors);
                    if (f.type === 'award') toggleFilter(selectedAwards, f.label, setSelectedAwards);
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
