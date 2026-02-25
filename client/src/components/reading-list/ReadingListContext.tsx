import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useAuth } from '../../hooks/use-auth';

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
  const { user } = useAuth();
  const [entries, setEntries] = useState<ReadingListEntry[]>(() => loadFromStorage());
  const hasSyncedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || hasSyncedRef.current) return;

    const doSync = async (attempt = 1) => {
      try {
        const localEntries = loadFromStorage();
        let allPostsOk = true;

        if (localEntries.length > 0) {
          const results = await Promise.all(localEntries.map(entry =>
            fetch('/api/reading-list', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ bookId: entry.bookId, status: entry.status }),
            }).then(r => {
              if (!r.ok) console.warn('[ReadingList] Sync POST failed for book', entry.bookId, r.status);
              return r.ok;
            }).catch(() => false)
          ));
          allPostsOk = results.every(r => r);
          if (results.every(r => !r)) {
            throw new Error('All POSTs failed');
          }
        }

        const res = await fetch('/api/reading-list', { credentials: 'include' });
        if (!res.ok) throw new Error('GET failed');

        const data = await res.json();
        if (data.ok && Array.isArray(data.entries)) {
          if (data.entries.length > 0 || allPostsOk) {
            setEntries(data.entries);
            saveToStorage(data.entries);
          }
          hasSyncedRef.current = true;
          return;
        }
        throw new Error('Invalid response');
      } catch (err) {
        console.warn('[ReadingList] Sync attempt', attempt, 'failed:', err);
        if (attempt < 4) {
          const delay = 2000 * attempt;
          retryTimerRef.current = setTimeout(() => doSync(attempt + 1), delay);
        }
      }
    };

    doSync();

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [user]);

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

    if (user) {
      if (status === null) {
        fetch(`/api/reading-list/${bookId}`, {
          method: 'DELETE',
          credentials: 'include',
        }).catch(err => console.warn('[ReadingList] DELETE failed:', err));
      } else {
        fetch('/api/reading-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ bookId, status }),
        }).then(r => {
          if (!r.ok) console.warn('[ReadingList] POST failed:', r.status, 'bookId:', bookId);
        }).catch(err => console.warn('[ReadingList] POST error:', err));
      }
    }
  }, [user]);

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
