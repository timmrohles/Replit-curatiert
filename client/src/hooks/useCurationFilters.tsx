import { useState, useMemo } from 'react';

export type SortOption = 'newest' | 'popular' | 'mostBooks';

export interface Curation {
  id: string;
  title: string;
  curator: string;
  curatorAvatar: string;
  curatorFocus: string;
  description: string;
  bookCount: number;
  category: string;
  likes: number;
  views: number;
  coverImages: string[];
  featured: boolean;
  createdDate: string;
  books: any[];
  hasVideo: boolean;
  videoThumbnail?: string;
}

export function useCurationFilters(allCurations: Curation[]) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Extract unique categories
  const categories = useMemo(() => 
    Array.from(new Set(allCurations.map(c => c.category))),
    [allCurations]
  );

  // Filter and sort curations
  const filteredAndSortedCurations = useMemo(() => {
    let filtered = allCurations.filter(curation => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(curation.category);
      const matchesSearch = searchQuery === '' || 
        curation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        curation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        curation.curator.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'popular') return b.likes - a.likes;
      if (sortBy === 'mostBooks') return b.bookCount - a.bookCount;
      return 0; // newest (already in correct order)
    });

    return filtered;
  }, [allCurations, selectedCategories, searchQuery, sortBy]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  return {
    selectedCategories,
    searchQuery,
    sortBy,
    categories,
    filteredAndSortedCurations,
    setSearchQuery,
    setSortBy,
    toggleCategory,
  };
}
