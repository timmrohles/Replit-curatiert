import { useState, useEffect } from 'react';
import { Plus, Save, Edit2, Trash2, ArrowUp, ArrowDown, Box, AlertCircle, Link as LinkIcon, BookOpen, Search, X, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiClient';

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  author: string;
  authorUrl: string;
}

interface NavItem {
  id: number;
  label: string;
  href: string;
  children?: NavItem[];
}

// ISBN13 VALIDATION
// ============================================================================

/**
 * Validates ISBN-13 format and check digit
 */
function validateISBN13(isbn: string): { valid: boolean; message?: string } {
  // Remove any dashes or spaces
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  // Check length
  if (cleanISBN.length !== 13) {
    return { valid: false, message: 'ISBN13 muss exakt 13 Ziffern haben' };
  }
  
  // Check if all characters are digits
  if (!/^\d{13}$/.test(cleanISBN)) {
    return { valid: false, message: 'ISBN13 darf nur Ziffern enthalten' };
  }
  
  // Validate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleanISBN[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  const providedCheckDigit = parseInt(cleanISBN[12]);
  
  if (checkDigit !== providedCheckDigit) {
    return { valid: false, message: 'Ungültige ISBN13 Check-Ziffer' };
  }
  
  return { valid: true };
}

// ============================================================================
// TYPES
// ============================================================================

export interface SectionItem {
  id: number;
  section_id: number;
  item_type: string;
  sort_order: number;
  status: 'draft' | 'published';
  data: Record<string, any>;
  target_type?: 'page' | 'category' | 'tag' | 'template' | 'url' | null;
  target_page_id?: number | null;
  target_category_id?: number | null;
  target_tag_id?: number | null;
  target_template_key?: string | null;
  target_params?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

interface SectionItemsManagerProps {
  sectionId: number;
  sectionType?: string; // Optional: For section-specific behavior
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SectionItemsManager({ sectionId, sectionType }: SectionItemsManagerProps) {
  // ✅ CRASH-SAFE: Initial state always []
  const [items, setItems] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<SectionItem> | null>(null);

  // For Target Picker: Pages list
  const [pages, setPages] = useState<Array<{ id: number; slug: string; seo_title?: string }>>([]);
  const [pagesLoading, setPagesLoading] = useState(false);

  // For Target Picker: Tags list
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // ISBN13 Input Mode
  const [isbnInputMode, setIsbnInputMode] = useState(false);
  const [isbn13Input, setIsbn13Input] = useState('');
  const [isbnError, setIsbnError] = useState<string | null>(null);

  // Unsplash Image Search (for category_grid)
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<UnsplashImage[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);
  const [showUnsplashSearch, setShowUnsplashSearch] = useState(false);

  // Navigation items (for category linking)
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [navLoading, setNavLoading] = useState(false);

  const isCategoryGrid = sectionType === 'category_grid' || sectionType === 'recipient_category_grid' || sectionType === 'topic_tags_grid';

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/sections/${sectionId}/items`, {
            credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to load items: ${response.status}`);
      }

      const result = await response.json();
      
      // ✅ CRASH-SAFE: Ensure data is array
      const itemsData = Array.isArray(result.data) ? result.data : [];
      setItems(itemsData);
    } catch (err) {
      console.error('Error loading items:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPages = async () => {
    setPagesLoading(true);
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/pages`, {
            credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        setPages(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      console.error('Error loading pages:', err);
    } finally {
      setPagesLoading(false);
    }
  };

  const loadTags = async () => {
    setTagsLoading(true);
    try {
      // ✅ Use public Tags API (no auth required)
      const response = await fetch(`${API_BASE_URL}/tags`, { credentials: 'include' });

      console.log('📦 Tags API Response:', response.status, response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('📦 Tags Data:', result);
        setTags(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      console.error('Error loading tags:', err);
    } finally {
      setTagsLoading(false);
    }
  };

  const searchUnsplash = async (query: string) => {
    if (!query.trim()) return;
    setSearchingUnsplash(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/unsplash/search?query=${encodeURIComponent(query)}`,
        { credentials: 'include', headers: { 'Content-Type': 'application/json' } }
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

  const loadNavigation = async () => {
    setNavLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/navigation`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        const flat: NavItem[] = [];
        const flatten = (list: any[], depth = 0) => {
          for (const item of list) {
            flat.push({ id: item.id, label: (depth > 0 ? '  └ ' : '') + item.label, href: item.href });
            if (item.children?.length) flatten(item.children, depth + 1);
          }
        };
        flatten(items);
        setNavItems(flat);
      }
    } catch {
      /* ignore */
    } finally {
      setNavLoading(false);
    }
  };

  useEffect(() => {
    if (sectionId) {
      loadItems();
      loadPages();
      loadTags();
      if (isCategoryGrid) {
        loadNavigation();
      }
    }
  }, [sectionId]);

  // ============================================================================
  // SAVE ITEM
  // ============================================================================

  const handleSaveItem = async () => {
    if (!editingItem) return;

    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      
      const payload = {
        id: editingItem.id || undefined,
        section_id: sectionId,
        item_type: editingItem.item_type || 'generic',
        sort_order: editingItem.sort_order || 0,
        status: editingItem.status || 'published',
        data: editingItem.data || {},
        target_type: editingItem.target_type || null,
        target_page_id: editingItem.target_page_id || null,
        target_category_id: editingItem.target_category_id || null,
        target_tag_id: editingItem.target_tag_id || null,
        target_template_key: editingItem.target_template_key || null,
        target_params: editingItem.target_params || null,
      };

      const url = editingItem.id
        ? `${API_BASE_URL}/admin/items/${editingItem.id}`
        : `${API_BASE_URL}/admin/sections/${sectionId}/items`;
      const method = editingItem.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save item: ${response.status}`);
      }

      alert('✅ Item gespeichert!');
      setEditingItem(null);
      loadItems();
    } catch (err) {
      console.error('Error saving item:', err);
      alert(`❌ Fehler beim Speichern: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // ============================================================================
  // DELETE ITEM
  // ============================================================================

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Item wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/items/${id}`, {
            credentials: 'include',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.status}`);
      }

      alert('✅ Item gelöscht!');
      loadItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(`❌ Fehler beim Löschen: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // ============================================================================
  // MOVE ITEM (Simple Up/Down)
  // ============================================================================

  const moveItem = async (item: SectionItem, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    // Swap sort_order
    const updatedItems = [...items];
    const temp = updatedItems[currentIndex].sort_order;
    updatedItems[currentIndex].sort_order = updatedItems[newIndex].sort_order;
    updatedItems[newIndex].sort_order = temp;

    // Update both items
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      
      await Promise.all([
        fetch(`${API_BASE_URL}/admin/items/${updatedItems[currentIndex].id}`, {
          method: 'PATCH',
          credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sort_order: updatedItems[currentIndex].sort_order,
          }),
        }),
        fetch(`${API_BASE_URL}/admin/items/${updatedItems[newIndex].id}`, {
          method: 'PATCH',
          credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sort_order: updatedItems[newIndex].sort_order,
          }),
        }),
      ]);

      loadItems();
    } catch (err) {
      console.error('Error moving item:', err);
      alert(`❌ Fehler beim Verschieben: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // ============================================================================
  // TARGET DISPLAY HELPER
  // ============================================================================

  const getTargetDisplay = (item: SectionItem): string => {
    if (item.target_type === 'page' && item.target_page_id) {
      const page = pages.find(p => p.id === item.target_page_id);
      return page ? `Page: ${page.seo_title || page.slug}` : `Page ID: ${item.target_page_id}`;
    }
    if (item.target_type === 'category' && item.target_category_id) {
      return `Category ID: ${item.target_category_id}`;
    }
    if (item.target_type === 'tag' && item.target_tag_id) {
      const tag = tags.find(t => t.id === item.target_tag_id);
      return tag ? `Tag: ${tag.name}` : `Tag ID: ${item.target_tag_id}`;
    }
    if (item.target_type === 'template' && item.target_template_key) {
      return `Template: ${item.target_template_key}`;
    }
    if (item.target_type === 'url') {
      return `URL: ${item.data?.url || '(nicht gesetzt)'}`;
    }
    return 'Kein Target';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="mt-8 pt-8 border-t" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          <Box className="w-5 h-5 inline mr-2" />
          Items ({items.length})
        </h4>
        <div className="flex gap-2">
          {(sectionType === 'book_carousel' || sectionType === 'book_grid' || sectionType === 'book_list_row' || sectionType === 'book_featured') && (
            <button
              onClick={() => {
                setIsbnInputMode(true);
                setIsbn13Input('');
                setIsbnError(null);
              }}
              className="px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
            >
              <BookOpen className="w-4 h-4" />
              Buch via ISBN13
            </button>
          )}
          {isCategoryGrid ? (
            <button
              onClick={() => {
                setEditingItem({
                  section_id: sectionId,
                  item_type: 'category_card',
                  sort_order: items.length,
                  status: 'published',
                  data: { title: '', image_url: '' },
                  target_type: null,
                });
                setShowUnsplashSearch(false);
                setUnsplashResults([]);
                setUnsplashQuery('');
              }}
              className="px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
            >
              <ImageIcon className="w-4 h-4" />
              Neue Kategorie-Karte
            </button>
          ) : (
            <button
              onClick={() => setEditingItem({
                section_id: sectionId,
                item_type: 'generic',
                sort_order: items.length,
                status: 'published',
                data: {},
                target_type: null,
              })}
              className="px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
            >
              <Plus className="w-4 h-4" />
              Neues Item
            </button>
          )}
        </div>
      </div>

      {/* ISBN13 INPUT MODE */}
      {isbnInputMode && (
        <div className="mb-6 p-4 border-2 rounded-lg" style={{ borderColor: '#247ba0', backgroundColor: '#247ba010' }}>
          <h5 className="text-md mb-4 font-medium flex items-center gap-2" style={{ color: '#3A3A3A' }}>
            <BookOpen className="w-5 h-5" style={{ color: '#247ba0' }} />
            Buch via ISBN13 hinzufügen
          </h5>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: '#666666' }}>
                ISBN13 (13 Ziffern) *
              </label>
              <input
                type="text"
                placeholder="9783123456789"
                value={isbn13Input}
                onChange={(e) => {
                  // Allow only digits and limit to 13
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 13);
                  setIsbn13Input(cleaned);
                  setIsbnError(null);
                }}
                className="w-full px-3 py-2 border rounded text-sm font-mono"
                style={{ borderColor: isbnError ? '#f25f5c' : '#E5E7EB' }}
                maxLength={13}
              />
              <p className="text-xs mt-1" style={{ color: '#999' }}>
                {isbn13Input.length}/13 Ziffern
              </p>
            </div>

            {isbnError && (
              <div className="p-2 rounded flex items-center gap-2 text-xs" style={{ backgroundColor: '#f25f5c20', color: '#f25f5c' }}>
                <AlertCircle className="w-4 h-4" />
                <span>{isbnError}</span>
              </div>
            )}

            {/* Show existing books with same ISBN */}
            {isbn13Input.length === 13 && items.some(item => 
              item.data?.isbn13 === isbn13Input || item.target_params?.isbn13 === isbn13Input
            ) && (
              <div className="p-2 rounded flex items-center gap-2 text-xs" style={{ backgroundColor: '#FFB70020', color: '#FFB700' }}>
                <AlertCircle className="w-4 h-4" />
                <span>⚠️ Diese ISBN13 existiert bereits in dieser Sektion!</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={async () => {
                // Validate ISBN13
                const validation = validateISBN13(isbn13Input);
                if (!validation.valid) {
                  setIsbnError(validation.message || 'Ungültige ISBN13');
                  return;
                }

                // Check for duplicates
                const duplicate = items.find(item => 
                  item.data?.isbn13 === isbn13Input || item.target_params?.isbn13 === isbn13Input
                );
                if (duplicate) {
                  setIsbnError('Diese ISBN13 existiert bereits in dieser Sektion!');
                  return;
                }

                // Create book item
                try {
                  const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
                  
                  // ✅ Differentiate between book_carousel (template target) and creator_carousel (no target)
                  const isBookCarousel = sectionType === 'book_carousel';
                  
                  const payload = {
                    section_id: sectionId,
                    item_type: 'book',
                    sort_order: items.length,
                    status: 'published',
                    data: isBookCarousel ? {} : { isbn13: isbn13Input },
                    target_type: isBookCarousel ? 'template' : null,
                    target_page_id: null,
                    target_category_id: null,
                    target_tag_id: null,
                    target_template_key: isBookCarousel ? 'book' : null,
                    target_params: isBookCarousel ? { isbn13: isbn13Input } : null,
                  };

                  const response = await fetch(`${API_BASE_URL}/admin/sections/${sectionId}/items`, {
                    method: 'POST',
                    credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });

                  if (!response.ok) {
                    throw new Error(`Failed to save book: ${response.status}`);
                  }

                  alert(`✅ Buch mit ISBN13 ${isbn13Input} hinzugefügt!`);
                  setIsbnInputMode(false);
                  setIsbn13Input('');
                  setIsbnError(null);
                  loadItems();
                } catch (err) {
                  console.error('Error saving book:', err);
                  setIsbnError(err instanceof Error ? err.message : 'Fehler beim Speichern');
                }
              }}
              disabled={isbn13Input.length !== 13}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm disabled:opacity-50"
              style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
            >
              <Plus className="w-4 h-4" />
              Buch hinzufügen
            </button>
            <button
              onClick={() => {
                setIsbnInputMode(false);
                setIsbn13Input('');
                setIsbnError(null);
              }}
              className="px-4 py-2 rounded-lg transition-colors text-sm"
              style={{ backgroundColor: '#E5E7EB', color: '#3A3A3A' }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* EDITING FORM */}
      {editingItem && (
        <div className="mb-6 p-4 border-2 rounded-lg" style={{ borderColor: isCategoryGrid ? '#247ba0' : '#70c1b3' }}>
          <h5 className="text-md mb-4 font-medium" style={{ color: '#3A3A3A' }}>
            {editingItem.id 
              ? (isCategoryGrid ? 'Kategorie-Karte bearbeiten' : 'Item bearbeiten')
              : (isCategoryGrid ? 'Neue Kategorie-Karte' : 'Neues Item erstellen')
            }
          </h5>

          <div className="space-y-3">
            {isCategoryGrid && (
              <>
                {/* Category Card Title */}
                <div>
                  <label className="block text-xs mb-1 font-medium" style={{ color: '#666666' }}>
                    Kategoriename *
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Belletristik, Sachbuch, Fantasy..."
                    value={editingItem.data?.title || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      data: { ...editingItem.data, title: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                </div>

                {/* Category Card Image */}
                <div>
                  <label className="block text-xs mb-1 font-medium" style={{ color: '#666666' }}>
                    Bild
                  </label>
                  
                  {/* Current Image Preview */}
                  {editingItem.data?.image_url && (
                    <div className="relative mb-2 inline-block">
                      <img 
                        src={editingItem.data.image_url} 
                        alt="Vorschau" 
                        className="h-24 w-36 object-cover rounded border"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditingItem({ 
                          ...editingItem, 
                          data: { ...editingItem.data, image_url: '' }
                        })}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#f25f5c', color: '#fff' }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Manual URL Input */}
                  <input
                    type="url"
                    placeholder="Bild-URL eingeben oder Unsplash-Suche nutzen"
                    value={editingItem.data?.image_url || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      data: { ...editingItem.data, image_url: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                  />

                  {/* Unsplash Search Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowUnsplashSearch(!showUnsplashSearch)}
                    className="mt-2 px-3 py-1.5 rounded flex items-center gap-2 text-xs transition-colors"
                    style={{ 
                      backgroundColor: showUnsplashSearch ? '#247ba020' : '#f0f0f0', 
                      color: showUnsplashSearch ? '#247ba0' : '#666' 
                    }}
                  >
                    <Search className="w-3 h-3" />
                    {showUnsplashSearch ? 'Unsplash-Suche ausblenden' : 'Unsplash-Suche'}
                  </button>

                  {/* Unsplash Search Panel */}
                  {showUnsplashSearch && (
                    <div className="mt-2 p-3 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#fafafa' }}>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Suchbegriff eingeben... (z.B. books, reading, library)"
                          value={unsplashQuery}
                          onChange={(e) => setUnsplashQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') searchUnsplash(unsplashQuery); }}
                          className="flex-1 px-3 py-2 border rounded text-sm"
                          style={{ borderColor: '#E5E7EB' }}
                        />
                        <button
                          type="button"
                          onClick={() => searchUnsplash(unsplashQuery)}
                          disabled={searchingUnsplash || !unsplashQuery.trim()}
                          className="px-3 py-2 rounded text-sm disabled:opacity-50"
                          style={{ backgroundColor: '#247ba0', color: '#fff' }}
                        >
                          {searchingUnsplash ? '...' : 'Suchen'}
                        </button>
                      </div>

                      {/* Results Grid */}
                      {unsplashResults.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {unsplashResults.map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => {
                                setEditingItem({ 
                                  ...editingItem, 
                                  data: { ...editingItem.data, image_url: img.url }
                                });
                                setUnsplashResults([]);
                                setShowUnsplashSearch(false);
                                setUnsplashQuery('');
                              }}
                              className="relative aspect-video rounded overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors"
                            >
                              <img 
                                src={img.thumb} 
                                alt={img.alt} 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                                {img.author}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchingUnsplash && (
                        <p className="text-xs text-center py-4" style={{ color: '#999' }}>Suche läuft...</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Link to Category/Page via Navigation */}
                <div>
                  <label className="block text-xs mb-1 font-medium" style={{ color: '#666666' }}>
                    Ziel-Link
                  </label>
                  <select
                    value={editingItem.data?.link_href || ''}
                    onChange={(e) => {
                      const selectedNav = navItems.find(n => n.href === e.target.value);
                      setEditingItem({ 
                        ...editingItem, 
                        data: { 
                          ...editingItem.data, 
                          link_href: e.target.value,
                          title: editingItem.data?.title || (selectedNav?.label?.replace(/^\s+└\s/, '') || '')
                        },
                        target_type: 'url' as any,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    disabled={navLoading}
                  >
                    <option value="">-- Aus Navigation wählen --</option>
                    {navItems.map((nav) => (
                      <option key={nav.id} value={nav.href}>
                        {nav.label} → {nav.href}
                      </option>
                    ))}
                  </select>
                  {navLoading && <p className="text-xs mt-1" style={{ color: '#999' }}>Navigation laden...</p>}

                  <div className="mt-2">
                    <label className="block text-xs mb-1" style={{ color: '#999999' }}>
                      Oder eigene URL
                    </label>
                    <input
                      type="text"
                      placeholder="/belletristik oder https://..."
                      value={editingItem.data?.link_href || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        data: { ...editingItem.data, link_href: e.target.value },
                        target_type: 'url' as any,
                      })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: '#E5E7EB' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Item Type - hidden for category_grid, shown for other section types */}
            {!isCategoryGrid && (
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: '#666666' }}>
                Item Type *
              </label>
              <input
                type="text"
                placeholder="book, creator, category, etc."
                value={editingItem.item_type || ''}
                onChange={(e) => setEditingItem({ ...editingItem, item_type: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: '#666666' }}>
                Status
              </label>
              <select
                value={editingItem.status || 'draft'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as 'draft' | 'published' })}
                className="w-full px-3 py-2 border rounded text-sm"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: '#666666' }}>
                Sort Order
              </label>
              <input
                type="number"
                value={editingItem.sort_order || 0}
                onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded text-sm"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>

            {/* ============== TARGET PICKER ============== */}
            <div className="pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
              <label className="block text-xs mb-2 font-medium flex items-center gap-2" style={{ color: '#666666' }}>
                <LinkIcon className="w-4 h-4" />
                Link Target
              </label>

              {/* Target Type */}
              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ color: '#999999' }}>
                  Target Type
                </label>
                <select
                  value={editingItem.target_type || ''}
                  onChange={(e) => setEditingItem({ 
                    ...editingItem, 
                    target_type: e.target.value as any,
                    // Reset target fields when changing type
                    target_page_id: null,
                    target_category_id: null,
                    target_tag_id: null,
                    target_template_key: null,
                  })}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <option value="">-- Kein Target --</option>
                  <option value="page">Page</option>
                  <option value="category">Category</option>
                  <option value="tag">Tag</option>
                  <option value="template">Template</option>
                  <option value="url">URL</option>
                </select>
              </div>

              {/* Page Picker */}
              {editingItem.target_type === 'page' && (
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#999999' }}>
                    Select Page
                  </label>
                  <select
                    value={editingItem.target_page_id || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, target_page_id: parseInt(e.target.value) || null })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    disabled={pagesLoading}
                  >
                    <option value="">-- Select Page --</option>
                    {pages.map(page => (
                      <option key={page.id} value={page.id}>
                        {page.seo_title || page.slug} (ID: {page.id})
                      </option>
                    ))}
                  </select>
                  {pagesLoading && <p className="text-xs mt-1" style={{ color: '#999' }}>Loading pages...</p>}
                </div>
              )}

              {/* Category Picker */}
              {editingItem.target_type === 'category' && (
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#999999' }}>
                    Category ID
                  </label>
                  <input
                    type="number"
                    placeholder="Category ID"
                    value={editingItem.target_category_id || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, target_category_id: parseInt(e.target.value) || null })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#999' }}>
                    Hinweis: Category-Liste wird später integriert
                  </p>
                </div>
              )}

              {/* Tag Picker */}
              {editingItem.target_type === 'tag' && (
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#999999' }}>
                    Tag
                  </label>
                  <select
                    value={editingItem.target_tag_id || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, target_tag_id: parseInt(e.target.value) || null })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                    disabled={tagsLoading}
                  >
                    <option value="">-- Select Tag --</option>
                    {tags.map(tag => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name} (ID: {tag.id})
                      </option>
                    ))}
                  </select>
                  {tagsLoading && <p className="text-xs mt-1" style={{ color: '#999' }}>Loading tags...</p>}
                </div>
              )}

              {/* Template Picker */}
              {editingItem.target_type === 'template' && (
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#999999' }}>
                    Template Key
                  </label>
                  <input
                    type="text"
                    placeholder="awards-overview"
                    value={editingItem.target_template_key || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, target_template_key: e.target.value || null })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                </div>
              )}

              {/* URL Target */}
              {editingItem.target_type === 'url' && (
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#999999' }}>
                    URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editingItem.data?.url || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      data: { ...editingItem.data, url: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveItem}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
            >
              <Save className="w-4 h-4" />
              Speichern
            </button>
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 rounded-lg transition-colors text-sm"
              style={{ backgroundColor: '#E5E7EB', color: '#3A3A3A' }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <p className="text-sm" style={{ color: '#666666' }}>Lade Items...</p>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="p-3 rounded-lg flex items-center gap-2 text-sm" style={{ backgroundColor: '#f25f5c20', color: '#f25f5c' }}>
          <AlertCircle className="w-4 h-4" />
          <p>Fehler: {error}</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-6 text-sm" style={{ color: '#666666' }}>
          <Box className="w-10 h-10 mx-auto mb-2" style={{ color: '#E5E7EB' }} />
          <p>Noch keine Items vorhanden.</p>
        </div>
      )}

      {/* ITEMS LIST */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="p-3 border rounded-lg text-sm"
              style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Thumbnail for category cards */}
                  {isCategoryGrid && item.data?.image_url && (
                    <img 
                      src={item.data.image_url} 
                      alt={item.data?.title || ''} 
                      className="w-16 h-12 object-cover rounded border flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  {isCategoryGrid && !item.data?.image_url && (
                    <div className="w-16 h-12 rounded border flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f0f0' }}>
                      <ImageIcon className="w-5 h-5" style={{ color: '#ccc' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isCategoryGrid && item.data?.title && (
                      <span className="text-sm font-medium truncate" style={{ color: '#3A3A3A' }}>
                        {item.data.title}
                      </span>
                    )}
                    {!isCategoryGrid && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#70c1b320', color: '#70c1b3' }}>
                      {item.item_type}
                    </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs" style={{
                      backgroundColor: item.status === 'published' ? '#247ba020' : '#f0f0f0',
                      color: item.status === 'published' ? '#247ba0' : '#999'
                    }}>
                      {item.status}
                    </span>
                    {item.item_type === 'book' && (item.data?.isbn13 || item.target_params?.isbn13) && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1" style={{ backgroundColor: '#247ba020', color: '#247ba0' }}>
                        <BookOpen className="w-3 h-3" />
                        {item.data?.isbn13 || item.target_params?.isbn13}
                      </span>
                    )}
                  </div>
                  {isCategoryGrid && item.data?.link_href && (
                    <p className="text-xs mb-1 flex items-center gap-1" style={{ color: '#247ba0' }}>
                      <LinkIcon className="w-3 h-3" />
                      {item.data.link_href}
                    </p>
                  )}
                  <p className="text-xs mb-1" style={{ color: '#666666' }}>
                    <strong>ID:</strong> {item.id} | <strong>Order:</strong> {item.sort_order}
                  </p>
                  {!isCategoryGrid && (
                  <p className="text-xs flex items-center gap-1" style={{ color: '#999999' }}>
                    <LinkIcon className="w-3 h-3" />
                    {getTargetDisplay(item)}
                  </p>
                  )}
                </div>
                </div>
                <div className="flex gap-1 ml-3">
                  <button
                    onClick={() => moveItem(item, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded transition-colors disabled:opacity-30"
                    style={{ backgroundColor: '#E5E7EB', color: '#3A3A3A' }}
                    title="Nach oben"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveItem(item, 'down')}
                    disabled={index === items.length - 1}
                    className="p-1.5 rounded transition-colors disabled:opacity-30"
                    style={{ backgroundColor: '#E5E7EB', color: '#3A3A3A' }}
                    title="Nach unten"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 rounded transition-colors"
                    style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded transition-colors"
                    style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
                    title="Löschen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}