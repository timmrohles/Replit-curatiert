import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSafeNavigate } from '../../utils/routing';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { BookCard } from '../book/BookCard';
import { DSButton } from '../design-system/DSButton';
import { DSSectionHeader } from '../design-system/DSSectionHeader';
import { DSCarousel } from '../design-system/DSCarousel';
import { DSGenreCard } from '../design-system/DSGenreCard';
import { Breadcrumb } from '../layout/Breadcrumb';
import { Container } from '../ui/container';
import { Section } from '../ui/section';
import { Heading, Text } from '../ui/typography';
import { CategoryFilter } from './CategoryFilter';
import { FilterSection } from './FilterSection';
import { MobileFilterDrawer } from './MobileFilterDrawer';
import { useShopFilters, SortOption, Book } from '../../hooks/useShopFilters';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { InfoBar } from '../layout/InfoBar';

// ✅ FIX: Mock data for books (replaces missing enhancedBooks)
const mockBooks: Book[] = [
  {
    id: '1',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300',
    title: 'Das Kapital im 21. Jahrhundert',
    author: 'Thomas Piketty',
    category: 'Sachbuch',
    subcategory: 'Wirtschaft',
    tags: ['Wirtschaft', 'Politik', 'Gesellschaft'],
    publisher: 'C.H.Beck',
    year: '2014',
    price: '24,90 €',
    followCount: 342,
    reviewCount: 89,
    awards: ['Bestseller 2014']
  },
  {
    id: '2',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
    title: 'Die Blechtrommel',
    author: 'Günter Grass',
    category: 'Belletristik',
    subcategory: 'Romane',
    tags: ['Literatur', 'Nachkriegszeit'],
    publisher: 'Luchterhand',
    year: '1959',
    price: '12,00 €',
    awards: ['Nobelpreis für Literatur'],
    followCount: 567,
    reviewCount: 234
  },
  {
    id: '3',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    category: 'Sachbuch',
    subcategory: 'Geschichte',
    tags: ['Geschichte', 'Anthropologie', 'Wissenschaft'],
    publisher: 'DVA',
    year: '2015',
    price: '24,95 €',
    followCount: 892,
    reviewCount: 456,
    awards: ['Spiegel Bestseller']
  }
];

// Genre data for "Weitere Genres" section
const genreCategories = [
  {
    label: 'Belletristik',
    image: 'https://images.unsplash.com/photo-1698954634383-eba274a1b1c7?w=800',
    onClick: (nav: any) => nav('/belletristik')
  },
  {
    label: 'Romane & Erzählungen',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800',
    onClick: (nav: any) => nav('/romane-erzaehlungen')
  },
  {
    label: 'Krimis & Thriller',
    image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800',
    onClick: (nav: any) => nav('/krimis-thriller')
  },
  {
    label: 'Sachbuch',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
    onClick: () => {}
  },
  {
    label: 'Fachbuch',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
    onClick: () => {}
  },
  {
    label: 'Kinder & Jugend',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800',
    onClick: () => {}
  },
  {
    label: 'Fremdsprachige Bücher',
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800',
    onClick: () => {}
  }
];

export function ShopPage() {
  const navigate = useSafeNavigate();
  const params = useParams<{ category?: string }>();
  const [showFilters, setShowFilters] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [hoveredSort, setHoveredSort] = useState<string | null>(null);

  // Use filter hook for all filter logic
  const filters = useShopFilters({ books: mockBooks });

  // ✅ CATEGORY URL PARAMETER: Automatically set category filter from URL
  useEffect(() => {
    if (params.category) {
      // Convert URL slug back to display name (e.g., "selfpublishing-buchpreis" -> "Selfpublishing-Buchpreis")
      const categoryName = params.category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-');
      
      // Set the category filter if not already selected
      if (!filters.selectedCategories.includes(categoryName)) {
        filters.setSelectedCategories([categoryName]);
      }
    }
  }, [params.category]);

  // Sort options for books (from CreatorCarousel)
  const sortOptions = useMemo(() => [
    { 
      id: 'popularity', 
      label: 'Beliebtheit',
      tooltip: 'Sortiert nach Saves, Interaktionen und Plattform-Engagement'
    },
    { 
      id: 'awarded', 
      label: 'Auszeichnungen',
      tooltip: 'Sortiert nach Anzahl und Bedeutung von Preisen (Awards, Shortlists, Longlists)'
    },
    { 
      id: 'critics', 
      label: 'Kritiker:innen-Lieblinge',
      tooltip: 'Sortiert nach Pressestimmen aus ONIX (Review Quotes) und Medienresonanz'
    },
    { 
      id: 'hidden-gems', 
      label: 'Hidden Gems',
      tooltip: 'Sortiert Bücher mit hohem Qualitäts-Score bei niedriger Sichtbarkeit'
    },
    { 
      id: 'trending', 
      label: 'Relevant (aktuell)',
      tooltip: 'Sortiert Neuerscheinungen nach Veröffentlichungszeitpunkt'
    },
  ], []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/bücher?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate('/bücher');
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* InfoBar - Beta Hinweis */}
      <InfoBar />
      
      {/* Header */}
      <Header />

      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: "Start", href: "/" },
          { label: "Bücher" }
        ]}
      />

      {/* Hero Section */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading 
              as="h1" 
              variant="h1" 
              className="mb-4 !text-foreground"
            >
              Bücher
            </Heading>
            
            <Text variant="large" className="max-w-3xl !text-foreground">
              Durchstöbern Sie unseren kompletten Buchkatalog – kuratiert von Expert*innen, für echte Literaturliebhaber*innen.
            </Text>
          </div>
        </Container>
      </Section>

      {/* Suche & Filter Sektion */}
      <Section variant="compact" className="!pb-4">
        <Container>
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <Text variant="base" className="mb-3 text-foreground">
              Durchsuche unseren Katalog nach Büchern, Autor*innen, Verlagen oder filtere nach Kategorien
            </Text>
            <div className="relative">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
                aria-hidden="true" 
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                placeholder="Bücher, Autor*innen, Verlage durchsuchen..."
                className="search-input"
                aria-label="Buchkatalog durchsuchen"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Main Content Section */}
      <Section className="py-8 md:py-12 px-4 md:px-8">
        <Container>
          {/* Mobile Filter Button - Fixed at bottom on mobile */}
          <div className="lg:hidden fixed bottom-6 left-0 right-0 z-50 px-4">
            <DSButton
              onClick={() => setShowMobileFilters(true)}
              variant="primary"
              size="large"
              fullWidth
              iconLeft={SlidersHorizontal}
              style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
            >
              FILTER {filters.hasActiveFilters && `(${
                filters.selectedCategories.length + 
                filters.selectedSubcategories.length + 
                filters.selectedAuthors.length + 
                filters.selectedPublishers.length + 
                filters.selectedTags.length + 
                filters.selectedSeries.length + 
                filters.selectedCurators.length
              })`}
            </DSButton>
          </div>

          {/* Mobile Filter Modal/Drawer */}
          <MobileFilterDrawer
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            hasActiveFilters={filters.hasActiveFilters}
            clearAllFilters={filters.clearAllFilters}
            resultCount={filters.sortedBooks.length}
            categorySubcategoryMap={filters.categorySubcategoryMap}
            selectedCategories={filters.selectedCategories}
            selectedSubcategories={filters.selectedSubcategories}
            onToggleCategory={(cat) => filters.toggleFilter(filters.selectedCategories, cat, filters.setSelectedCategories)}
            onToggleSubcategory={(sub) => filters.toggleFilter(filters.selectedSubcategories, sub, filters.setSelectedSubcategories)}
            tags={filters.filterOptions.tags}
            selectedTags={filters.selectedTags}
            onToggleTag={(tag) => filters.toggleFilter(filters.selectedTags, tag, filters.setSelectedTags)}
            awards={filters.filterOptions.awards}
            selectedAwards={filters.selectedAwards}
            onToggleAward={(award) => filters.toggleFilter(filters.selectedAwards, award, filters.setSelectedAwards)}
            authors={filters.filterOptions.authors}
            selectedAuthors={filters.selectedAuthors}
            onToggleAuthor={(author) => filters.toggleFilter(filters.selectedAuthors, author, filters.setSelectedAuthors)}
            publishers={filters.filterOptions.publishers}
            selectedPublishers={filters.selectedPublishers}
            onTogglePublisher={(pub) => filters.toggleFilter(filters.selectedPublishers, pub, filters.setSelectedPublishers)}
            series={filters.filterOptions.series}
            selectedSeries={filters.selectedSeries}
            onToggleSeries={(s) => filters.toggleFilter(filters.selectedSeries, s, filters.setSelectedSeries)}
            curators={filters.filterOptions.curators}
            selectedCurators={filters.selectedCurators}
            onToggleCurator={(c) => filters.toggleFilter(filters.selectedCurators, c, filters.setSelectedCurators)}
          />

          <div className="flex gap-10">
            {/* Sidebar Filters - Desktop Only */}
            <aside className="hidden lg:block flex-shrink-0">
              <div className="sticky top-24">
                {/* Toggle Button */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-left group"
                  >
                    <SlidersHorizontal className="w-5 h-5" style={{ color: 'var(--color-blue)' }} />
                    <Heading as="h2" variant="h4" className="uppercase whitespace-nowrap">
                      {showFilters ? 'Filter Ausblenden' : 'Filter Einblenden'}
                    </Heading>
                  </button>
                  {filters.hasActiveFilters && showFilters && (
                    <button
                      onClick={filters.clearAllFilters}
                      className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--color-teal)', fontFamily: 'Inter' }}
                    >
                      <X className="w-3 h-3" />
                      Zurücksetzen
                    </button>
                  )}
                </div>

                {/* Collapsible Filter Content */}
                <div className={`${showFilters ? 'w-72 opacity-100' : 'w-0 opacity-0'} transition-all duration-300 overflow-hidden`}>
                  <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    <CategoryFilter
                      categorySubcategoryMap={filters.categorySubcategoryMap}
                      selectedCategories={filters.selectedCategories}
                      selectedSubcategories={filters.selectedSubcategories}
                      onToggleCategory={(cat) => filters.toggleFilter(filters.selectedCategories, cat, filters.setSelectedCategories)}
                      onToggleSubcategory={(sub) => filters.toggleFilter(filters.selectedSubcategories, sub, filters.setSelectedSubcategories)}
                    />

                    <FilterSection
                      title="Themen"
                      items={filters.filterOptions.tags}
                      selectedItems={filters.selectedTags}
                      onToggle={(item) => filters.toggleFilter(filters.selectedTags, item, filters.setSelectedTags)}
                    />

                    <FilterSection
                      title="Auszeichnungen"
                      items={filters.filterOptions.awards}
                      selectedItems={filters.selectedAwards}
                      onToggle={(item) => filters.toggleFilter(filters.selectedAwards, item, filters.setSelectedAwards)}
                    />

                    <FilterSection
                      title="Autor*innen"
                      items={filters.filterOptions.authors}
                      selectedItems={filters.selectedAuthors}
                      onToggle={(item) => filters.toggleFilter(filters.selectedAuthors, item, filters.setSelectedAuthors)}
                    />

                    <FilterSection
                      title="Verlage"
                      items={filters.filterOptions.publishers}
                      selectedItems={filters.selectedPublishers}
                      onToggle={(item) => filters.toggleFilter(filters.selectedPublishers, item, filters.setSelectedPublishers)}
                    />

                    <FilterSection
                      title="Buchreihen"
                      items={filters.filterOptions.series}
                      selectedItems={filters.selectedSeries}
                      onToggle={(item) => filters.toggleFilter(filters.selectedSeries, item, filters.setSelectedSeries)}
                    />

                    <FilterSection
                      title="Kurator*innen"
                      items={filters.filterOptions.curators}
                      selectedItems={filters.selectedCurators}
                      onToggle={(item) => filters.toggleFilter(filters.selectedCurators, item, filters.setSelectedCurators)}
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* Controls Bar */}
              <div className="mb-6 flex justify-end">
                <div 
                  className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full lg:flex-wrap lg:overflow-visible"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {sortOptions.map((option) => {
                    const isActive = filters.sortBy === option.id;
                    
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => filters.setSortBy(option.id as SortOption)}
                        onMouseEnter={() => setHoveredSort(option.id)}
                        onMouseLeave={() => setHoveredSort(null)}
                        className="sort-chip"
                        aria-pressed={isActive}
                        aria-label={`Nach ${option.label} sortieren`}
                      >
                        <Text 
                          as="span" 
                          variant="xs" 
                          className="whitespace-nowrap !normal-case !tracking-normal !font-semibold"
                        >
                          {option.label}
                        </Text>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Filters Display */}
              {filters.hasActiveFilters && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {filters.selectedCategories.map(cat => (
                    <span key={cat} className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-teal)', color: 'white' }}>
                      <Text variant="small">{cat}</Text>
                      <button onClick={() => filters.toggleFilter(filters.selectedCategories, cat, filters.setSelectedCategories)} className="hover:opacity-70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {filters.selectedSubcategories.map(sub => (
                    <span key={sub} className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-teal)', color: 'white' }}>
                      <Text variant="small">{sub}</Text>
                      <button onClick={() => filters.toggleFilter(filters.selectedSubcategories, sub, filters.setSelectedSubcategories)} className="hover:opacity-70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {filters.selectedAuthors.map(author => (
                    <span key={author} className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-teal)', color: 'white' }}>
                      <Text variant="small">{author}</Text>
                      <button onClick={() => filters.toggleFilter(filters.selectedAuthors, author, filters.setSelectedAuthors)} className="hover:opacity-70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {filters.selectedPublishers.map(pub => (
                    <span key={pub} className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-teal)', color: 'white' }}>
                      <Text variant="small">{pub}</Text>
                      <button onClick={() => filters.toggleFilter(filters.selectedPublishers, pub, filters.setSelectedPublishers)} className="hover:opacity-70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {filters.selectedTags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-teal)', color: 'white' }}>
                      <Text variant="small">#{tag}</Text>
                      <button onClick={() => filters.toggleFilter(filters.selectedTags, tag, filters.setSelectedTags)} className="hover:opacity-70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {filters.selectedAwards.map(award => (
                    <span key={award} className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-saffron)', color: 'white' }}>
                      <Text variant="small">🏆 {award}</Text>
                      <button onClick={() => filters.toggleFilter(filters.selectedAwards, award, filters.setSelectedAwards)} className="hover:opacity-70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {filters.selectedSeries.map(s => (
                    <span key={s} className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-teal)', color: 'white' }}>
                      <Text variant="small">{s}</Text>
                      <button onClick={() => filters.toggleFilter(filters.selectedSeries, s, filters.setSelectedSeries)} className="hover:opacity-70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {filters.selectedCurators.map(c => (
                    <span key={c} className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-teal)', color: 'white' }}>
                      <Text variant="small">{c}</Text>
                      <button onClick={() => filters.toggleFilter(filters.selectedCurators, c, filters.setSelectedCurators)} className="hover:opacity-70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Books Grid/List */}
              {filters.sortedBooks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {filters.sortedBooks.map(book => (
                    <BookCard key={book.id} book={book as any} viewMode="compact" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 pb-16 md:pb-24 lg:pb-12">
                  <Heading as="h2" variant="h2" className="mb-3 px-4">
                    {filters.searchQuery ? `Suchergebnisse für "${filters.searchQuery.toUpperCase()}"` : 'Keine Bücher gefunden'}
                  </Heading>
                  <Text variant="large" className="mb-6 px-4 text-foreground-muted">
                    {filters.searchQuery ? '0 Bücher gefunden' : 'Versuchen Sie, einige Filter zu entfernen'}
                  </Text>
                  {filters.hasActiveFilters && (
                    <DSButton
                      onClick={filters.clearAllFilters}
                      variant="primary"
                      size="large"
                      style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
                    >
                      ALLE FILTER ZURÜCKSETZEN
                    </DSButton>
                  )}
                </div>
              )}
            </main>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <Footer />
    </div>
  );
}