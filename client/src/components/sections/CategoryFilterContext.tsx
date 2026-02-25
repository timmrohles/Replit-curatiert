import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type CategoryFilterMode = string;

export interface CategoryTab {
  id: string;
  label: string;
  sectionTypes: string[];
}

export const DEFAULT_TABS: CategoryTab[] = [
  { id: 'empfehlungen', label: 'Empfehlungen', sectionTypes: ['user_curations'] },
  { id: 'redaktion', label: 'Redaktion', sectionTypes: ['book_carousel', 'book_grid_filtered', 'category_grid', 'recipient_category_grid'] },
];

interface CategoryFilterContextType {
  activeFilter: CategoryFilterMode;
  setActiveFilter: (filter: CategoryFilterMode) => void;
  tabs: CategoryTab[];
  setTabs: (tabs: CategoryTab[]) => void;
}

const CategoryFilterContext = createContext<CategoryFilterContextType>({
  activeFilter: 'all',
  setActiveFilter: () => {},
  tabs: DEFAULT_TABS,
  setTabs: () => {},
});

export function CategoryFilterProvider({ children }: { children: ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<CategoryFilterMode>('all');
  const [tabs, setTabsState] = useState<CategoryTab[]>(DEFAULT_TABS);

  const setTabs = useCallback((newTabs: CategoryTab[]) => {
    setTabsState(newTabs.length > 0 ? newTabs : DEFAULT_TABS);
  }, []);

  return (
    <CategoryFilterContext.Provider value={{ activeFilter, setActiveFilter, tabs, setTabs }}>
      {children}
    </CategoryFilterContext.Provider>
  );
}

export function useCategoryFilter() {
  return useContext(CategoryFilterContext);
}

const HERO_TYPES = ['category_hero', 'hero'];

export function isSectionVisibleForFilter(sectionType: string, filter: CategoryFilterMode, tabs?: CategoryTab[]): boolean {
  if (filter === 'all') return true;
  if (HERO_TYPES.includes(sectionType)) return true;

  const resolvedTabs = tabs && tabs.length > 0 ? tabs : DEFAULT_TABS;
  const activeTab = resolvedTabs.find(t => t.id === filter);
  if (!activeTab) return true;

  return activeTab.sectionTypes.includes(sectionType);
}
