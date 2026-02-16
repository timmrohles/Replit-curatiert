import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';

export type FeedSectionType = 
  | 'reading_list'
  | 'favorites' 
  | 'followed_authors'
  | 'followed_curators'
  | 'followed_publishers'
  | 'followed_categories'
  | 'followed_tags'
  | 'recent_ratings'
  | 'recommendations';

export interface FeedSectionConfig {
  id: FeedSectionType;
  label: string;
  icon: string;
  visible: boolean;
  isPublic: boolean;
}

interface StoredState {
  order: FeedSectionType[];
  visibility: Record<FeedSectionType, boolean>;
  publicState: Record<FeedSectionType, boolean>;
}

interface DashboardFeedContextType {
  sections: FeedSectionConfig[];
  reorderSections: (activeId: string, overId: string) => void;
  toggleVisibility: (sectionId: FeedSectionType) => void;
  togglePublic: (sectionId: FeedSectionType) => void;
  resetToDefaults: () => void;
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
}

const DEFAULT_SECTIONS: FeedSectionConfig[] = [
  {
    id: 'reading_list',
    label: 'Meine Leseliste',
    icon: 'BookOpen',
    visible: true,
    isPublic: false,
  },
  {
    id: 'favorites',
    label: 'Meine Favoriten',
    icon: 'Heart',
    visible: true,
    isPublic: true,
  },
  {
    id: 'followed_authors',
    label: 'Autor:innen',
    icon: 'PenTool',
    visible: true,
    isPublic: true,
  },
  {
    id: 'followed_curators',
    label: 'Kurator:innen',
    icon: 'Users',
    visible: true,
    isPublic: true,
  },
  {
    id: 'followed_publishers',
    label: 'Verlage',
    icon: 'Building2',
    visible: true,
    isPublic: true,
  },
  {
    id: 'followed_categories',
    label: 'Kategorien',
    icon: 'Tag',
    visible: true,
    isPublic: false,
  },
  {
    id: 'followed_tags',
    label: 'Themen & Tags',
    icon: 'Hash',
    visible: true,
    isPublic: false,
  },
  {
    id: 'recent_ratings',
    label: 'Meine Bewertungen',
    icon: 'Star',
    visible: true,
    isPublic: true,
  },
  {
    id: 'recommendations',
    label: 'Empfehlungen für dich',
    icon: 'Sparkles',
    visible: true,
    isPublic: false,
  },
];

const STORAGE_KEY = 'coratiert-dashboard-feed';

function loadFromStorage(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    
    const parsed = JSON.parse(raw) as StoredState;
    
    const storedIds = new Set(parsed.order);
    const defaultIds = DEFAULT_SECTIONS.map(s => s.id);
    const allIds = [...parsed.order, ...defaultIds.filter(id => !storedIds.has(id))];
    
    return {
      order: allIds,
      visibility: {
        ...Object.fromEntries(DEFAULT_SECTIONS.map(s => [s.id, s.visible])),
        ...parsed.visibility,
      },
      publicState: {
        ...Object.fromEntries(DEFAULT_SECTIONS.map(s => [s.id, s.isPublic])),
        ...parsed.publicState,
      },
    };
  } catch {
    return getDefaultState();
  }
}

function getDefaultState(): StoredState {
  return {
    order: DEFAULT_SECTIONS.map(s => s.id),
    visibility: Object.fromEntries(DEFAULT_SECTIONS.map(s => [s.id, s.visible])) as Record<FeedSectionType, boolean>,
    publicState: Object.fromEntries(DEFAULT_SECTIONS.map(s => [s.id, s.isPublic])) as Record<FeedSectionType, boolean>,
  };
}

function saveToStorage(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
  }
}

function buildSections(stored: StoredState): FeedSectionConfig[] {
  return stored.order
    .map(id => {
      const defaultSection = DEFAULT_SECTIONS.find(s => s.id === id);
      if (!defaultSection) return null;
      
      return {
        ...defaultSection,
        visible: stored.visibility[id] ?? defaultSection.visible,
        isPublic: stored.publicState[id] ?? defaultSection.isPublic,
      };
    })
    .filter((s): s is FeedSectionConfig => s !== null);
}

const DashboardFeedContext = createContext<DashboardFeedContextType | undefined>(undefined);

export function DashboardFeedProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredState>(() => loadFromStorage());
  const [isEditMode, setEditMode] = useState(false);

  useEffect(() => {
    saveToStorage(stored);
  }, [stored]);

  const sections = useMemo(() => buildSections(stored), [stored]);

  const reorderSections = useCallback((activeId: string, overId: string) => {
    setStored(prev => {
      const activeIndex = prev.order.indexOf(activeId as FeedSectionType);
      const overIndex = prev.order.indexOf(overId as FeedSectionType);
      
      if (activeIndex === -1 || overIndex === -1) return prev;
      
      const newOrder = [...prev.order];
      newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, activeId as FeedSectionType);
      
      return {
        ...prev,
        order: newOrder,
      };
    });
  }, []);

  const toggleVisibility = useCallback((sectionId: FeedSectionType) => {
    setStored(prev => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [sectionId]: !prev.visibility[sectionId],
      },
    }));
  }, []);

  const togglePublic = useCallback((sectionId: FeedSectionType) => {
    setStored(prev => ({
      ...prev,
      publicState: {
        ...prev.publicState,
        [sectionId]: !prev.publicState[sectionId],
      },
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setStored(getDefaultState());
  }, []);

  const value = useMemo(
    () => ({
      sections,
      reorderSections,
      toggleVisibility,
      togglePublic,
      resetToDefaults,
      isEditMode,
      setEditMode,
    }),
    [sections, reorderSections, toggleVisibility, togglePublic, resetToDefaults, isEditMode]
  );

  return (
    <DashboardFeedContext.Provider value={value}>
      {children}
    </DashboardFeedContext.Provider>
  );
}

const defaultContext: DashboardFeedContextType = {
  sections: buildSections(getDefaultState()),
  reorderSections: () => {},
  toggleVisibility: () => {},
  togglePublic: () => {},
  resetToDefaults: () => {},
  isEditMode: false,
  setEditMode: () => {},
};

export function useDashboardFeed() {
  const context = useContext(DashboardFeedContext);
  if (context === undefined) {
    return defaultContext;
  }
  return context;
}
