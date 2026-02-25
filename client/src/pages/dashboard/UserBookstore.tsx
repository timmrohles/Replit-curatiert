import { useState, useEffect, useCallback } from 'react';
import {
  GripVertical, BookOpen,
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';

const API_BASE = '/api';

interface Curation {
  id: number;
  title: string;
  description: string | null;
  tags: string[];
  is_published: boolean;
}

interface BookstoreSection {
  id: number;
  curationId: number;
}

export function UserBookstore() {
  const { user: authUser } = useAuth();
  const USER_ID = authUser?.id || 'demo-user-123';
  const [curationsLoading, setCurationsLoading] = useState(true);
  const [curations, setCurations] = useState<Curation[]>([]);
  const [linkedSections, setLinkedSections] = useState<BookstoreSection[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fetchCurations = useCallback(async () => {
    try {
      setCurationsLoading(true);
      const [curRes, secRes] = await Promise.all([
        fetch(`${API_BASE}/user-curations?userId=${encodeURIComponent(USER_ID)}`),
        fetch(`${API_BASE}/bookstore/sections?userId=${encodeURIComponent(USER_ID)}`),
      ]);
      const curData = await curRes.json();
      const secData = await secRes.json();
      if (curData.ok) setCurations(curData.data || []);
      if (secData.ok) {
        setLinkedSections(
          (secData.data || []).map((s: any) => ({
            id: s.id,
            curationId: s.curationId ?? s.curation_id,
          }))
        );
      }
    } catch {
      console.error('Failed to load curations');
    } finally {
      setCurationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurations();
  }, [fetchCurations]);

  const isCurationLinked = (curationId: number) => linkedSections.some(s => s.curationId === curationId);

  const toggleCurationLink = async (curation: Curation) => {
    const existing = linkedSections.find(s => s.curationId === curation.id);
    if (existing) {
      try {
        await fetch(`${API_BASE}/bookstore/sections/${existing.id}`, { method: 'DELETE' });
        setLinkedSections(prev => prev.filter(s => s.id !== existing.id));
      } catch {
        console.error('Failed to unlink curation');
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/bookstore/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: USER_ID, curationId: curation.id }),
        });
        const data = await res.json();
        if (data.ok && data.data) {
          setLinkedSections(prev => [
            ...prev,
            { id: data.data.id, curationId: curation.id },
          ]);
        }
      } catch {
        console.error('Failed to link curation');
      }
    }
  };

  const linkedCurations = linkedSections
    .map(s => {
      const cur = curations.find(c => c.id === s.curationId);
      return cur ? { ...cur, linkId: s.id } : null;
    })
    .filter(Boolean) as (Curation & { linkId: number })[];

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newSections = [...linkedSections];
    const [moved] = newSections.splice(dragIndex, 1);
    newSections.splice(index, 0, moved);
    setLinkedSections(newSections);
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    try {
      await fetch(`${API_BASE}/bookstore/sections/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds: linkedSections.map(s => s.id) }),
      });
    } catch {
      console.error('Failed to reorder sections');
    }
  };

  return (
    <div>
      <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
        <BookOpen className="w-5 h-5 inline-block mr-2 -mt-0.5" style={{ color: '#247ba0' }} />
        Kurationen im Bookstore
      </h2>
      <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
        Wähle aus, welche deiner Kurationen in deinem Bookstore angezeigt werden sollen.
      </p>

      {curationsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: '#247ba0' }} />
        </div>
      ) : curations.length === 0 ? (
        <div className="py-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Du hast noch keine Kurationen erstellt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {curations.map(curation => {
            const linked = isCurationLinked(curation.id);
            return (
              <div
                key={curation.id}
                className="flex items-center gap-3 p-3 rounded-lg border transition-colors"
                style={{
                  borderColor: linked ? '#247ba0' : '#E5E7EB',
                  backgroundColor: linked ? '#F0F9FF' : '#FFFFFF',
                }}
                data-testid={`curation-link-${curation.id}`}
              >
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={linked}
                    onChange={() => toggleCurationLink(curation)}
                    className="sr-only peer"
                    data-testid={`toggle-curation-${curation.id}`}
                  />
                  <div
                    className="w-9 h-5 rounded-full transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"
                    style={{ backgroundColor: linked ? '#247ba0' : '#D1D5DB' }}
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>{curation.title}</span>
                  {curation.description && (
                    <p className="text-xs truncate" style={{ color: '#6B7280' }}>{curation.description}</p>
                  )}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={curation.is_published
                    ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                    : { backgroundColor: '#FEF3C7', color: '#92400E' }
                  }
                >
                  {curation.is_published ? 'Veröffentlicht' : 'Entwurf'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {linkedCurations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3" style={{ color: '#3A3A3A' }}>
            Reihenfolge im Bookstore (per Drag & Drop ändern)
          </h3>
          <div className="space-y-1">
            {linkedCurations.map((curation, index) => (
              <div
                key={curation.linkId}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: dragIndex === index ? '#F0F9FF' : '#FFFFFF',
                }}
                data-testid={`sortable-curation-${curation.id}`}
              >
                <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                <span className="text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}>
                  {index + 1}
                </span>
                <span className="text-sm flex-1 min-w-0 truncate" style={{ color: '#3A3A3A' }}>{curation.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
