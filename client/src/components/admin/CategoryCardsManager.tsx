import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, ExternalLink, X, Save } from 'lucide-react';
import { toast } from 'sonner';
const API_BASE = '/api';

interface CategoryCard {
  id: string;
  name: string;
  color: string;
  link: string;
  image_url: string;
  display_order: number;
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
  const [unsplashSearch, setUnsplashSearch] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<UnsplashImage[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/category-cards`, {
        headers: {
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch category cards: ${response.status} ${response.statusText}`);
        setCards([]);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setCards(data.data.sort((a: CategoryCard, b: CategoryCard) => a.display_order - b.display_order));
      } else {
        console.error('API error:', data);
        setCards([]);
      }
    } catch (error) {
      console.error('Error loading category cards:', error);
      alert('Fehler beim Laden der Kategorie-Karten. Bitte Server-Logs prüfen.');
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
        {
          headers: {
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setUnsplashResults(data.data);
      }
    } catch (error) {
      console.error('Error searching Unsplash:', error);
    } finally {
      setSearchingUnsplash(false);
    }
  };

  const selectUnsplashImage = (image: UnsplashImage) => {
    if (editingCard) {
      setEditingCard({
        ...editingCard,
        image_url: image.url,
      });
      setUnsplashResults([]);
      setUnsplashSearch('');
    }
  };

  const saveCard = async () => {
    if (!editingCard || !editingCard.name || !editingCard.image_url) {
      alert('Bitte Titel und Bild angeben');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/category-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCard)
      });

      const data = await response.json();
      if (data.success) {
        setEditingCard(null);
        loadCards();
      }
    } catch (error) {
      console.error('Error saving category card:', error);
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm('Kategorie-Karte wirklich löschen?')) return;

    try {
      const response = await fetch(`${API_BASE}/category-cards/${id}`, {
        method: 'DELETE',
        headers: {
        }
      });

      if (response.ok) {
        loadCards();
      }
    } catch (error) {
      console.error('Error deleting category card:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Kategorie-Karten ({cards.length})
        </h2>
        <button
          onClick={() => setEditingCard({
            name: '',
            color: '',
            link: '',
            image_url: '',
            display_order: cards.length,
          })}
          className="px-4 py-2 rounded-lg flex items-center gap-2"
          style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
        >
          <Plus className="w-4 h-4" />
          Neue Karte
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8" style={{ color: '#666666' }}>Lade Kategorie-Karten...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: '#E5E7EB' }}
            >
              <img
                src={card.image_url}
                alt={card.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold" style={{ color: '#3A3A3A' }}>{card.name}</h3>
                    <p className="text-sm" style={{ color: '#666666' }}>{card.link}</p>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: '#70c1b3',
                      color: '#FFFFFF'
                    }}
                  >
                    Aktiv
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setEditingCard(card)}
                    className="flex-1 px-3 py-1 rounded text-sm flex items-center justify-center gap-1"
                    style={{ backgroundColor: '#F7F4EF', color: '#3A3A3A' }}
                  >
                    <Edit2 className="w-3 h-3" />
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="px-3 py-1 rounded text-sm flex items-center gap-1"
                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {editingCard.id ? 'Karte bearbeiten' : 'Neue Karte'}
                </h3>
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setUnsplashResults([]);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#666666' }}>Titel *</label>
                  <input
                    type="text"
                    value={editingCard.name || ''}
                    onChange={(e) => setEditingCard({
                      ...editingCard,
                      name: e.target.value,
                      link: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    })}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="z.B. Krimis & Thriller"
                  />
                </div>

                {/* Slug (auto-generated) */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#666666' }}>Slug (URL)</label>
                  <input
                    type="text"
                    value={editingCard.link || ''}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                </div>

                {/* Image Selection */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#666666' }}>Bild *</label>
                  
                  {/* Unsplash Search */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={unsplashSearch}
                      onChange={(e) => setUnsplashSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                      placeholder="Unsplash durchsuchen..."
                      className="flex-1 px-4 py-2 border rounded-lg"
                      style={{ borderColor: '#E5E7EB' }}
                    />
                    <button
                      onClick={searchUnsplash}
                      disabled={searchingUnsplash}
                      className="px-4 py-2 rounded-lg flex items-center gap-2"
                      style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                    >
                      <Search className="w-4 h-4" />
                      {searchingUnsplash ? 'Suche...' : 'Suchen'}
                    </button>
                  </div>

                  {/* Unsplash Results */}
                  {unsplashResults.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto p-2 border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
                      {unsplashResults.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => selectUnsplashImage(img)}
                          className="cursor-pointer rounded overflow-hidden hover:ring-2 hover:ring-blue-500"
                        >
                          <img src={img.thumb} alt={img.alt} className="w-full h-24 object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Current Image */}
                  {editingCard.image_url && (
                    <div className="relative">
                      <img
                        src={editingCard.image_url}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setEditingCard({ ...editingCard, image_url: '' })}
                        className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Manual URL Input */}
                  <input
                    type="text"
                    value={editingCard.image_url || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, image_url: e.target.value })}
                    placeholder="Oder Bild-URL direkt eingeben"
                    className="w-full px-4 py-2 border rounded-lg mt-2"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                </div>

                {/* Display Locations */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#666666' }}>Anzeige-Orte</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingCard.display_order !== undefined}
                        onChange={(e) => {
                          const locs = editingCard.display_order || 0;
                          setEditingCard({
                            ...editingCard,
                            display_order: e.target.checked
                              ? locs
                              : 0
                          });
                        }}
                      />
                      <span className="text-sm">Homepage</span>
                    </label>
                    
                    {pages.filter(p => p.enabled).map(page => (
                      <label key={page.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingCard.display_order !== undefined}
                          onChange={(e) => {
                            const locs = editingCard.display_order || 0;
                            const pageLocation = `page:${page.slug}`;
                            setEditingCard({
                              ...editingCard,
                              display_order: e.target.checked
                                ? locs
                                : 0
                            });
                          }}
                        />
                        <span className="text-sm">Seite: {page.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Linked Page */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#666666' }}>Verlinkung (optional)</label>
                  <select
                    value={editingCard.link || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, link: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <option value="">Keine Verlinkung</option>
                    {pages.filter(p => p.enabled).map(page => (
                      <option key={page.id} value={page.slug}>{page.name}</option>
                    ))}
                  </select>
                </div>

                {/* Enabled */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingCard.display_order !== undefined}
                      onChange={(e) => setEditingCard({ ...editingCard, display_order: e.target.checked ? 1 : 0 })}
                    />
                    <span className="text-sm">Aktiviert</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveCard}
                  className="flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
                >
                  <Save className="w-4 h-4" />
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setUnsplashResults([]);
                  }}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F7F4EF', color: '#3A3A3A' }}
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