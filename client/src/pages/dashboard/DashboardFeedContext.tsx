import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';

export type FeedSectionType = 
  | 'sponsored'
  | 'followed_curators'
  | 'favorites' 
  | 'reading_list'
  | 'currently_reading'
  | 'already_read'
  | 'want_to_read'
  | 'followed_authors'
  | 'followed_publishers'
  | 'followed_categories'
  | 'followed_tags'
  | 'followed_media'
  | 'followed_awards'
  | 'followed_events'
  | 'recommendations';

export type ReadingStatus = 'currently_reading' | 'already_read' | 'want_to_read';

export type FeedSortOrder = 'newest' | 'oldest';

export interface FeedSectionConfig {
  id: FeedSectionType;
  label: string;
  description: string;
  visible: boolean;
  isPublic: boolean;
}

interface StoredState {
  order: FeedSectionType[];
  visibility: Record<FeedSectionType, boolean>;
  publicState: Record<FeedSectionType, boolean>;
  feedAsHomepage: boolean;
  sortOrder: FeedSortOrder;
}

interface DashboardFeedContextType {
  sections: FeedSectionConfig[];
  reorderSections: (activeId: string, overId: string) => void;
  toggleVisibility: (sectionId: FeedSectionType) => void;
  togglePublic: (sectionId: FeedSectionType) => void;
  setAllPublic: (isPublic: boolean) => void;
  resetToDefaults: () => void;
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
  feedAsHomepage: boolean;
  setFeedAsHomepage: (value: boolean) => void;
  sortOrder: FeedSortOrder;
  setSortOrder: (order: FeedSortOrder) => void;
  scrollToSection: (sectionId: FeedSectionType) => void;
}

const DEFAULT_SECTIONS: FeedSectionConfig[] = [
  {
    id: 'sponsored',
    label: 'Anzeigen',
    description: 'Unsere Empfehlungen für dich',
    visible: true,
    isPublic: true,
  },
  {
    id: 'followed_curators',
    label: 'Meine Kurationen',
    description: 'Entdecke die neuesten Empfehlungen der Kurator:innen, denen du folgst.',
    visible: true,
    isPublic: true,
  },
  {
    id: 'favorites',
    label: 'Meine Favoriten',
    description: 'Deine persönliche Sammlung von Büchern, die du besonders magst.',
    visible: true,
    isPublic: true,
  },
  {
    id: 'currently_reading',
    label: 'Lese ich zurzeit',
    description: 'Bücher, die du gerade liest und in denen du mittendrin steckst.',
    visible: true,
    isPublic: true,
  },
  {
    id: 'already_read',
    label: 'Habe ich gelesen',
    description: 'Bücher, die du bereits gelesen hast. Dein persönliches Lese-Archiv.',
    visible: true,
    isPublic: true,
  },
  {
    id: 'want_to_read',
    label: 'Möchte ich lesen',
    description: 'Bücher auf deiner Wunschliste, die du als nächstes lesen möchtest.',
    visible: true,
    isPublic: false,
  },
  {
    id: 'reading_list',
    label: 'Meine Leseliste',
    description: 'Deine kuratierte Leseliste mit Büchern, die du dir vorgemerkt hast.',
    visible: true,
    isPublic: false,
  },
  {
    id: 'followed_authors',
    label: 'Meine Autor:innen',
    description: 'Neue Veröffentlichungen und Empfehlungen der Autor:innen, denen du folgst.',
    visible: true,
    isPublic: true,
  },
  {
    id: 'followed_publishers',
    label: 'Meine Verlage',
    description: 'Aktuelle Neuerscheinungen und Highlights deiner Lieblingsverlage.',
    visible: true,
    isPublic: true,
  },
  {
    id: 'followed_categories',
    label: 'Meine Kategorien',
    description: 'Bücher aus den Kategorien und Genres, die dich am meisten interessieren.',
    visible: true,
    isPublic: false,
  },
  {
    id: 'followed_tags',
    label: 'Meine Themen & Tags',
    description: 'Empfehlungen basierend auf deinen bevorzugten Themen und Schlagwörtern.',
    visible: true,
    isPublic: false,
  },
  {
    id: 'followed_media',
    label: 'Meine Medien',
    description: 'Deine bevorzugten Medienformate – Hörbücher, E-Books, Taschenbücher und mehr.',
    visible: true,
    isPublic: false,
  },
  {
    id: 'followed_awards',
    label: 'Meine Auszeichnungen',
    description: 'Bücher mit den Literaturpreisen und Auszeichnungen, die dich interessieren.',
    visible: true,
    isPublic: false,
  },
  {
    id: 'followed_events',
    label: 'Meine Veranstaltungen',
    description: 'Lesungen, Workshops und Events, die dich interessieren oder an denen du teilnimmst.',
    visible: true,
    isPublic: false,
  },
  {
    id: 'recommendations',
    label: 'Empfehlungen für dich',
    description: 'Personalisierte Buchempfehlungen basierend auf deinem Leseverhalten.',
    visible: true,
    isPublic: false,
  },
];

const STORAGE_KEY = 'coratiert-dashboard-feed';
const HOMEPAGE_KEY = 'coratiert-feed-as-homepage';

function loadFromStorage(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const homepagePref = localStorage.getItem(HOMEPAGE_KEY);
    if (!raw) return { ...getDefaultState(), feedAsHomepage: homepagePref === 'true' };
    
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    
    const validIds = new Set(DEFAULT_SECTIONS.map(s => s.id));
    const filteredOrder = (parsed.order || []).filter(id => validIds.has(id));
    const missingIds = DEFAULT_SECTIONS.map(s => s.id).filter(id => !filteredOrder.includes(id));
    const allIds = [...filteredOrder, ...missingIds];
    
    return {
      order: allIds,
      visibility: {
        ...Object.fromEntries(DEFAULT_SECTIONS.map(s => [s.id, s.visible])),
        ...Object.fromEntries(Object.entries(parsed.visibility || {}).filter(([k]) => validIds.has(k as FeedSectionType))),
      } as Record<FeedSectionType, boolean>,
      publicState: {
        ...Object.fromEntries(DEFAULT_SECTIONS.map(s => [s.id, s.isPublic])),
        ...Object.fromEntries(Object.entries(parsed.publicState || {}).filter(([k]) => validIds.has(k as FeedSectionType))),
      } as Record<FeedSectionType, boolean>,
      feedAsHomepage: homepagePref === 'true',
      sortOrder: parsed.sortOrder || 'newest',
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
    feedAsHomepage: false,
    sortOrder: 'newest',
  };
}

function saveToStorage(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(HOMEPAGE_KEY, state.feedAsHomepage ? 'true' : 'false');
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

  const setAllPublic = useCallback((isPublic: boolean) => {
    setStored(prev => ({
      ...prev,
      publicState: Object.fromEntries(
        prev.order.map(id => [id, isPublic])
      ) as Record<FeedSectionType, boolean>,
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setStored(getDefaultState());
  }, []);

  const setFeedAsHomepage = useCallback((value: boolean) => {
    setStored(prev => ({ ...prev, feedAsHomepage: value }));
  }, []);

  const setSortOrder = useCallback((order: FeedSortOrder) => {
    setStored(prev => ({ ...prev, sortOrder: order }));
  }, []);

  const scrollToSection = useCallback((sectionId: FeedSectionType) => {
    const el = document.querySelector(`[data-testid="feed-section-${sectionId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const value = useMemo(
    () => ({
      sections,
      reorderSections,
      toggleVisibility,
      togglePublic,
      setAllPublic,
      resetToDefaults,
      isEditMode,
      setEditMode,
      feedAsHomepage: stored.feedAsHomepage,
      setFeedAsHomepage,
      sortOrder: stored.sortOrder,
      setSortOrder,
      scrollToSection,
    }),
    [sections, reorderSections, toggleVisibility, togglePublic, setAllPublic, resetToDefaults, isEditMode, stored.feedAsHomepage, stored.sortOrder, setFeedAsHomepage, setSortOrder, scrollToSection]
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
  setAllPublic: () => {},
  resetToDefaults: () => {},
  isEditMode: false,
  setEditMode: () => {},
  feedAsHomepage: false,
  setFeedAsHomepage: () => {},
  sortOrder: 'newest',
  setSortOrder: () => {},
  scrollToSection: () => {},
};

export function useDashboardFeed() {
  const context = useContext(DashboardFeedContext);
  if (context === undefined) {
    return defaultContext;
  }
  return context;
}
