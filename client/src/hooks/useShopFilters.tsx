import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface Book {
  id: string;
  cover: string;
  title: string;
  author: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  publisher: string;
  year: string;
  price: string;
  series?: string;
  curator?: string;
  awards?: string[];
  criticQuote?: string;
  criticSource?: string;
  isHiddenGem?: boolean;
  // New fields for sorting
  followCount?: number;
  reviewCount?: number;
  shortlists?: number;
  longlists?: number;
  releaseDate?: string;
}

export type SortOption = 'popularity' | 'awarded' | 'critics' | 'hidden-gems' | 'trending';

interface UseShopFiltersProps {
  books: Book[];
}

export function useShopFilters({ books }: UseShopFiltersProps) {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedCurators, setSelectedCurators] = useState<string[]>([]);
  const [selectedAwards, setSelectedAwards] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');

  // ✅ FIX: Ensure books is always an array (prevent undefined.forEach error)
  const safeBooks = books || [];

  // Build category -> subcategories map (memoized)
  const categorySubcategoryMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    safeBooks.forEach(book => {
      if (!map[book.category]) {
        map[book.category] = [];
      }
      if (book.subcategory && !map[book.category].includes(book.subcategory)) {
        map[book.category].push(book.subcategory);
      }
    });
    // Sort subcategories
    Object.keys(map).forEach(cat => {
      map[cat].sort();
    });
    return map;
  }, [safeBooks]);

  // Extract unique filter options (memoized)
  const filterOptions = useMemo(() => ({
    categories: Object.keys(categorySubcategoryMap).sort(),
    publishers: Array.from(new Set(safeBooks.map(b => b.publisher))).sort(),
    authors: Array.from(new Set(safeBooks.map(b => b.author))).sort(),
    tags: Array.from(new Set(safeBooks.flatMap(b => b.tags || []))).sort(),
    series: Array.from(new Set(safeBooks.map(b => b.series).filter(Boolean))).sort() as string[],
    curators: Array.from(new Set(safeBooks.map(b => b.curator).filter(Boolean))).sort() as string[],
    awards: Array.from(new Set(safeBooks.flatMap(b => b.awards || []))).sort() as string[]
  }), [safeBooks, categorySubcategoryMap]);

  // Filter books (memoized)
  const filteredBooks = useMemo(() => {
    return safeBooks.filter(book => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.publisher.toLowerCase().includes(query) ||
          book.category.toLowerCase().includes(query) ||
          (book.tags || []).some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // Category filters
      if (selectedCategories.length > 0 && !selectedCategories.includes(book.category)) {
        return false;
      }

      if (selectedSubcategories.length > 0 && (!book.subcategory || !selectedSubcategories.includes(book.subcategory))) {
        return false;
      }

      // Publisher filter
      if (selectedPublishers.length > 0 && !selectedPublishers.includes(book.publisher)) {
        return false;
      }

      // Author filter
      if (selectedAuthors.length > 0 && !selectedAuthors.includes(book.author)) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0 && !selectedTags.some(tag => (book.tags || []).includes(tag))) {
        return false;
      }

      // Series filter
      if (selectedSeries.length > 0 && (!book.series || !selectedSeries.includes(book.series))) {
        return false;
      }

      // Curator filter
      if (selectedCurators.length > 0 && (!book.curator || !selectedCurators.includes(book.curator))) {
        return false;
      }

      // Awards filter
      if (selectedAwards.length > 0 && (!book.awards || !selectedAwards.some(award => book.awards.includes(award)))) {
        return false;
      }

      return true;
    });
  }, [safeBooks, searchQuery, selectedCategories, selectedSubcategories, selectedPublishers, selectedAuthors, selectedTags, selectedSeries, selectedCurators, selectedAwards]);

  // Sort books (memoized)
  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          // Beliebtheit = Anzahl der Follows
          const followsA = a.followCount ?? 0;
          const followsB = b.followCount ?? 0;
          return followsB - followsA;
        
        case 'awarded':
          // Auszeichnungen = Anzahl der Preise
          const awardsA = (a.awards?.length ?? 0);
          const awardsB = (b.awards?.length ?? 0);
          return awardsB - awardsA;
        
        case 'critics':
          // Kritiker-Lieblinge = Anzahl der Rezensionen
          const reviewsA = a.reviewCount ?? 0;
          const reviewsB = b.reviewCount ?? 0;
          return reviewsB - reviewsA;
        
        case 'hidden-gems':
          // Hidden Gems = (Shortlists + Longlists) - Awards
          const shortlistsA = a.shortlists ?? 0;
          const longlistsA = a.longlists ?? 0;
          const awardsCountA = (a.awards?.length ?? 0);
          const hiddenGemScoreA = (shortlistsA + longlistsA) - awardsCountA;
          
          const shortlistsB = b.shortlists ?? 0;
          const longlistsB = b.longlists ?? 0;
          const awardsCountB = (b.awards?.length ?? 0);
          const hiddenGemScoreB = (shortlistsB + longlistsB) - awardsCountB;
          
          return hiddenGemScoreB - hiddenGemScoreA;
        
        case 'trending':
          // Relevant = Erscheinungsdatum (neueste zuerst)
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA;
        
        default:
          return 0; // Keep original order
      }
    });
  }, [filteredBooks, sortBy]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => 
    selectedCategories.length > 0 ||
    selectedSubcategories.length > 0 ||
    selectedPublishers.length > 0 ||
    selectedAuthors.length > 0 ||
    selectedTags.length > 0 ||
    selectedSeries.length > 0 ||
    selectedCurators.length > 0 ||
    selectedAwards.length > 0
  , [selectedCategories, selectedSubcategories, selectedPublishers, selectedAuthors, selectedTags, selectedSeries, selectedCurators, selectedAwards]);

  // Toggle filter helper
  const toggleFilter = (filter: string[], item: string, setter: (value: string[]) => void) => {
    if (filter.includes(item)) {
      setter(filter.filter(i => i !== item));
    } else {
      setter([...filter, item]);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedPublishers([]);
    setSelectedAuthors([]);
    setSelectedTags([]);
    setSelectedSeries([]);
    setSelectedCurators([]);
    setSelectedAwards([]);
  };

  return {
    // Filter states
    selectedCategories,
    selectedSubcategories,
    selectedPublishers,
    selectedAuthors,
    selectedTags,
    selectedSeries,
    selectedCurators,
    selectedAwards,
    setSelectedCategories,
    setSelectedSubcategories,
    setSelectedPublishers,
    setSelectedAuthors,
    setSelectedTags,
    setSelectedSeries,
    setSelectedCurators,
    setSelectedAwards,

    // Sort
    sortBy,
    setSortBy,

    // Filter options
    categorySubcategoryMap,
    filterOptions,

    // Filtered results
    sortedBooks,
    hasActiveFilters,
    searchQuery,

    // Actions
    toggleFilter,
    clearAllFilters
  };
}