import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';

export type ReadingListStatus = 'gelesen' | 'lese_ich' | 'möchte_lesen';

export interface ReadingListEntry {
  bookId: string;
  status: ReadingListStatus;
  title: string;
  author: string;
  coverImage?: string;
  addedAt: string;
}

interface ReadingListContextType {
  entries: ReadingListEntry[];
  getStatus: (bookId: string) => ReadingListEntry | null;
  setStatus: (bookId: string, status: ReadingListStatus | null, bookData: { title: string; author: string; coverImage?: string }) => void;
  getEntriesByStatus: (status: ReadingListStatus) => ReadingListEntry[];
}

const STORAGE_KEY = 'coratiert-reading-list';

function loadFromStorage(): ReadingListEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: ReadingListEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
  }
}

const ReadingListContext = createContext<ReadingListContextType | undefined>(undefined);

export function ReadingListProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ReadingListEntry[]>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(entries);
  }, [entries]);

  const getStatus = useCallback((bookId: string): ReadingListEntry | null => {
    return entries.find(e => e.bookId === bookId) || null;
  }, [entries]);

  const setStatus = useCallback((
    bookId: string,
    status: ReadingListStatus | null,
    bookData: { title: string; author: string; coverImage?: string }
  ) => {
    setEntries(prev => {
      if (status === null) {
        return prev.filter(e => e.bookId !== bookId);
      }
      const existing = prev.find(e => e.bookId === bookId);
      if (existing) {
        return prev.map(e => e.bookId === bookId ? { ...e, status, addedAt: new Date().toISOString() } : e);
      }
      return [...prev, {
        bookId,
        status,
        title: bookData.title,
        author: bookData.author,
        coverImage: bookData.coverImage,
        addedAt: new Date().toISOString(),
      }];
    });
  }, []);

  const getEntriesByStatus = useCallback((status: ReadingListStatus): ReadingListEntry[] => {
    return entries.filter(e => e.status === status);
  }, [entries]);

  const value = useMemo(() => ({
    entries,
    getStatus,
    setStatus,
    getEntriesByStatus,
  }), [entries, getStatus, setStatus, getEntriesByStatus]);

  return (
    <ReadingListContext.Provider value={value}>
      {children}
    </ReadingListContext.Provider>
  );
}

const defaultContext: ReadingListContextType = {
  entries: [],
  getStatus: () => null,
  setStatus: () => {},
  getEntriesByStatus: () => [],
};

export function useReadingList() {
  const context = useContext(ReadingListContext);
  if (context === undefined) {
    return defaultContext;
  }
  return context;
}
