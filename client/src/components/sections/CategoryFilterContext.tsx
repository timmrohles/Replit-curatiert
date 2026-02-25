import { createContext, useContext, useState, type ReactNode } from 'react';

export type CategoryFilterMode = 'all' | 'empfehlungen' | 'redaktion';

interface CategoryFilterContextType {
  activeFilter: CategoryFilterMode;
  setActiveFilter: (filter: CategoryFilterMode) => void;
}

const CategoryFilterContext = createContext<CategoryFilterContextType>({
  activeFilter: 'all',
  setActiveFilter: () => {},
});

export function CategoryFilterProvider({ children }: { children: ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<CategoryFilterMode>('all');
  return (
    <CategoryFilterContext.Provider value={{ activeFilter, setActiveFilter }}>
      {children}
    </CategoryFilterContext.Provider>
  );
}

export function useCategoryFilter() {
  return useContext(CategoryFilterContext);
}

const EMPFEHLUNGEN_SECTIONS = ['user_curations'];
const REDAKTION_SECTIONS = ['book_carousel', 'book_grid_filtered', 'category_grid', 'recipient_category_grid'];

export function isSectionVisibleForFilter(sectionType: string, filter: CategoryFilterMode): boolean {
  if (filter === 'all') return true;
  const heroTypes = ['category_hero', 'hero'];
  if (heroTypes.includes(sectionType)) return true;
  if (filter === 'empfehlungen') return EMPFEHLUNGEN_SECTIONS.includes(sectionType);
  if (filter === 'redaktion') return REDAKTION_SECTIONS.includes(sectionType);
  return true;
}
