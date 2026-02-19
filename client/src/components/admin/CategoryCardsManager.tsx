import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, X, Save, GripVertical, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
const API_BASE = '/api';

interface CategoryCard {
  id: number;
  name: string;
  color: string;
  link: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  location: string;
}

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  author: string;
  authorUrl: string;
}

interface Page {
  id: string;
  name: string;
  slug: string;
  enabled?: boolean;
}

interface CategoryCardsManagerProps {
  pages?: Page[];
}

export function CategoryCardsManager({ pages = [] }: CategoryCardsManagerProps) {
  const [cards, setCards] = useState<CategoryCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCard, setEditingCard] = useState<Partial<CategoryCard> | null>(null);
  const [saving, setSaving] = useState(false);
  const [unsplashSearch, setUnsplashSearch] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<UnsplashImage[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);

  const getToken = () => localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '';

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/category-cards`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        setCards([]);
        return;
      }
      const data = await response.json();
      if (data.ok) {
        setCards(data.data.sort((a: CategoryCard, b: CategoryCard) => a.display_order - b.display_order));
      } else {
        setCards([]);
      }
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUnsplash = async () => {
    if (!unsplashSearch.trim()) return;
    setSearchingUnsplash(true);
    try {
      const response = await fetch(
        `${API_BASE}/unsplash/search?query=${encodeURIComponent(unsplashSearch)}`,
        { credentials: 'include',
        headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (data.success) {
        setUnsplashResults(data.data);
      }
    } catch {
      /* ignore */
    } finally {
      setSearchingUnsplash(false);
    }
  };

  const selectUnsplashImage = (image: UnsplashImage) => {
    if (editingCard) {
      setEditingCard({ ...editingCard, image_url: image.url });
      setUnsplashResults([]);
      setUnsplashSearch('');
    }
  };

  const saveCard = async () => {
    if (!editingCard || !editingCard.name?.trim()) {
      alert('Bitte mindestens einen Titel angeben');
      return;
    }

    setSaving(true);
    try {
      const isNew = !editingCard.id;
      const url = isNew
        ? `${API_BASE}/admin/category-cards`
        : `${API_BASE}/admin/category-cards/${editingCard.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCard.name?.trim(),
          image_url: editingCard.image_url || null,
          link: editingCard.link || '',
          color: editingCard.color || '#247ba0',
          display_order: editingCard.display_order ?? cards.length,
          is_active: editingCard.is_active !== false,
          location: editingCard.location || 'homepage'
        })
      });

      const data = await response.json();
      if (data.ok) {
        setEditingCard(null);
        setUnsplashResults([]);
        loadCards();
      } else {
        alert('Fehler beim Speichern: ' + (data.error || 'Unbekannt'));
      }
    } catch (error) {
      alert('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async (id: number) => {
    if (!confirm('Kategorie-Karte wirklich löschen?')) return;
    try {
      const response = await fetch(`${API_BASE}/admin/category-cards/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        loadCards();
      }
    } catch {
      /* ignore */
    }
  };

  const toggleActive = async (card: CategoryCard) => {
    try {
      await fetch(`${API_BASE}/admin/category-cards/${card.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !card.is_active })
      });
      loadCards();
    } catch {
      /* ignore */
    }
  };

  const activeCards = cards.filter(c => c.is_active);
  const inactiveCards = cards.filter(c => !c.is_active);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Kategorie-Karten
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {activeCards.length} aktiv, {inactiveCards.length} inaktiv
          </p>
        </div>
        <button
          onClick={() => setEditingCard({
            name: '',
            color: '#247ba0',
            link: '',
            image_url: null,
            display_order: cards.length,
            is_active: true,
            location: 'homepage',
          })}
          className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
          style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
          data-testid="button-new-category-card"
        >
          <Plus className="w-4 h-4" />
          Neue Karte
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8" style={{ color: '#666666' }}>Lade Kategorie-Karten...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
          <p className="font-medium" style={{ color: '#6B7280' }}>Noch keine Kategorie-Karten</p>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
            Erstelle Karten mit Bildern und Links, die auf der Startseite angezeigt werden.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeCards.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>
                Aktive Karten ({activeCards.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    onEdit={() => setEditingCard(card)}
                    onDelete={() => deleteCard(card.id)}
                    onToggleActive={() => toggleActive(card)}
                  />
                ))}
              </div>
            </div>
          )}

          {inactiveCards.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#9CA3AF' }}>
                Inaktive Karten ({inactiveCards.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {inactiveCards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    onEdit={() => setEditingCard(card)}
                    onDelete={() => deleteCard(card.id)}
                    onToggleActive={() => toggleActive(card)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {editingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {editingCard.id ? 'Karte bearbeiten' : 'Neue Karte'}
                </h3>
                <button
                  onClick={() => { setEditingCard(null); setUnsplashResults([]); }}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  data-testid="button-close-card-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Titel *</label>
                  <input
                    type="text"
                    value={editingCard.name || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="z.B. Krimis & Thriller"
                    data-testid="input-card-name"
                  />
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    Wird auf der Karte als Überschrift angezeigt
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Link / Ziel-URL</label>
                  <input
                    type="text"
                    value={editingCard.link || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, link: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="z.B. krimis-thriller oder /seite/genre"
                    data-testid="input-card-link"
                  />
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    Wohin die Karte beim Klick führen soll (relative URL)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Bild</label>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={unsplashSearch}
                      onChange={(e) => setUnsplashSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                      placeholder="Unsplash durchsuchen..."
                      className="flex-1 px-4 py-2 border rounded-lg text-sm"
                      style={{ borderColor: '#E5E7EB' }}
                      data-testid="input-unsplash-search"
                    />
                    <button
                      onClick={searchUnsplash}
                      disabled={searchingUnsplash}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                      style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                      data-testid="button-unsplash-search"
                    >
                      <Search className="w-4 h-4" />
                      {searchingUnsplash ? 'Suche...' : 'Suchen'}
                    </button>
                  </div>

                  {unsplashResults.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto p-2 border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
                      {unsplashResults.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => selectUnsplashImage(img)}
                          className="cursor-pointer rounded overflow-hidden hover:ring-2 transition-all"
                          style={{ '--tw-ring-color': '#247ba0' } as any}
                          data-testid={`unsplash-result-${img.id}`}
                        >
                          <img src={img.thumb} alt={img.alt} className="w-full h-24 object-cover" />
                          <p className="text-xs p-1 truncate" style={{ color: '#6B7280' }}>{img.author}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {editingCard.image_url && (
                    <div className="relative mb-3">
                      <img
                        src={editingCard.image_url}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setEditingCard({ ...editingCard, image_url: '' })}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-lg"
                        data-testid="button-remove-image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={editingCard.image_url || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, image_url: e.target.value })}
                    placeholder="Oder Bild-URL direkt eingeben"
                    className="w-full px-4 py-2 border rounded-lg text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    data-testid="input-card-image-url"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Farbe</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingCard.color || '#247ba0'}
                        onChange={(e) => setEditingCard({ ...editingCard, color: e.target.value })}
                        className="w-10 h-10 rounded border cursor-pointer"
                        style={{ borderColor: '#E5E7EB' }}
                        data-testid="input-card-color"
                      />
                      <input
                        type="text"
                        value={editingCard.color || '#247ba0'}
                        onChange={(e) => setEditingCard({ ...editingCard, color: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: '#E5E7EB' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Reihenfolge</label>
                    <input
                      type="number"
                      value={editingCard.display_order ?? 0}
                      onChange={(e) => setEditingCard({ ...editingCard, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      style={{ borderColor: '#E5E7EB' }}
                      min={0}
                      data-testid="input-card-order"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCard.is_active !== false}
                      onChange={(e) => setEditingCard({ ...editingCard, is_active: e.target.checked })}
                      className="rounded"
                      data-testid="input-card-active"
                    />
                    <span className="text-sm" style={{ color: '#374151' }}>Aktiv (auf der Startseite sichtbar)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveCard}
                  disabled={saving || !editingCard.name?.trim()}
                  className="flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: '#247ba0' }}
                  data-testid="button-save-card"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Speichere...' : 'Speichern'}
                </button>
                <button
                  onClick={() => { setEditingCard(null); setUnsplashResults([]); }}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardItem({ card, onEdit, onDelete, onToggleActive }: {
  card: CategoryCard;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
      data-testid={`category-card-${card.id}`}
    >
      {card.image_url ? (
        <img src={card.image_url} alt={card.name} className="w-full h-32 object-cover" />
      ) : (
        <div
          className="w-full h-32 flex items-center justify-center"
          style={{ backgroundColor: card.color || '#F3F4F6' }}
        >
          <ImageIcon className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.6)' }} />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate" style={{ color: '#374151' }}>{card.name}</h4>
            {card.link && (
              <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>/{card.link}</p>
            )}
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{
              backgroundColor: card.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.2)',
              color: card.is_active ? '#059669' : '#6B7280'
            }}
          >
            {card.is_active ? 'Aktiv' : 'Inaktiv'}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={onEdit}
            className="flex-1 px-2 py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-colors hover:bg-gray-100"
            style={{ color: '#374151' }}
            data-testid={`button-edit-card-${card.id}`}
          >
            <Edit2 className="w-3 h-3" />
            Bearbeiten
          </button>
          <button
            onClick={onToggleActive}
            className="p-1.5 rounded transition-colors hover:bg-gray-100"
            title={card.is_active ? 'Deaktivieren' : 'Aktivieren'}
            data-testid={`button-toggle-card-${card.id}`}
          >
            {card.is_active ? <EyeOff className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} /> : <Eye className="w-3.5 h-3.5" style={{ color: '#059669' }} />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded transition-colors hover:bg-red-50"
            title="Löschen"
            data-testid={`button-delete-card-${card.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
