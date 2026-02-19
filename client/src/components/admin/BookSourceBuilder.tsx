/**
 * ==================================================================
 * BOOK SOURCE BUILDER - Hybrid Manual + Query Builder
 * ==================================================================
 * 
 * Für Book Sections: book_carousel, book_grid, book_list_row, book_featured
 * 
 * Modi:
 * - Manual: Nur manuell gepinnte Bücher
 * - Query: Nur dynamische Buchabfrage
 * - Hybrid: Kombination (Manual first, dann Query, de-duped)
 * 
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  ChevronUp, 
  ChevronDown, 
  AlertCircle,
  BookOpen,
  Filter,
  Target,
  Ban,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Heading } from '../ui/typography';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { API_BASE_URL } from '../../config/apiClient';  // ✅ FIXED: Use canonical import
// TYPES
// ============================================================================

export interface BookSourceConfig {
  mode: 'manual' | 'query' | 'hybrid';
  query?: {
    include?: {
      categoryIds?: number[];
      tagIds?: number[];
      awardDefinitionIds?: number[];
      awardInstanceIds?: number[];
    };
    exclude?: {
      categoryIds?: number[];
      tagIds?: number[];
      awardDefinitionIds?: number[];
      awardInstanceIds?: number[];
      bookIds?: number[];
    };
    filters?: {
      yearFrom?: number;
      yearTo?: number;
      languageCodes?: string[];
      publisherIds?: number[];
    };
    operator?: 'any' | 'all';
    sort?: 'newest' | 'award_date' | 'popularity';
    limit?: number;
  };
}

interface BookSourceBuilderProps {
  sectionId: number;
  config: BookSourceConfig;
  onChange: (config: BookSourceConfig) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BookSourceBuilder({ sectionId, config, onChange }: BookSourceBuilderProps) {
  const [activeTab, setActiveTab] = useState<'include' | 'exclude' | 'filter' | 'sort'>('include');

  // ============================================================================
  // MODE SWITCH
  // ============================================================================

  const handleModeChange = (mode: 'manual' | 'query' | 'hybrid') => {
    onChange({
      ...config,
      mode,
      // Initialize query if switching to query/hybrid
      query: (mode === 'query' || mode === 'hybrid') && !config.query
        ? {
            operator: 'any',
            sort: 'newest',
            limit: 20,
          }
        : config.query,
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const showManualSection = config.mode === 'manual' || config.mode === 'hybrid';
  const showQuerySection = config.mode === 'query' || config.mode === 'hybrid';

  return (
    <div className="space-y-6">
      {/* ========================================== */}
      {/* MODE SELECTOR (Always Visible) */}
      {/* ========================================== */}
      
      <Card className="p-4 bg-blue-50 border-blue-200">
        <Heading variant="h5" className="mb-3 text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" />
          Book Source Mode
        </Heading>
        
        <Select value={config.mode} onValueChange={handleModeChange}>
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">
              <div className="flex flex-col items-start">
                <span className="font-medium">Manual</span>
                <span className="text-xs text-gray-500">Nur manuell gepinnte Bücher</span>
              </div>
            </SelectItem>
            <SelectItem value="query">
              <div className="flex flex-col items-start">
                <span className="font-medium">Query</span>
                <span className="text-xs text-gray-500">Nur dynamische Buchabfrage</span>
              </div>
            </SelectItem>
            <SelectItem value="hybrid">
              <div className="flex flex-col items-start">
                <span className="font-medium">Hybrid</span>
                <span className="text-xs text-gray-500">Manual first, dann Query (de-duped)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="mt-3 p-3 bg-white rounded text-xs text-gray-600 border">
          💡 <strong>Info:</strong> Diese Section zeigt Bücher dynamisch basierend auf den ausgewählten Regeln.
          Manuell gepinnte Bücher werden – je nach Modus – ergänzt oder priorisiert.
        </div>
      </Card>

      {/* ========================================== */}
      {/* MANUAL BOOKS SECTION */}
      {/* ========================================== */}
      
      {showManualSection && (
        <ManualBooksEditor sectionId={sectionId} />
      )}

      {/* ========================================== */}
      {/* QUERY BUILDER SECTION */}
      {/* ========================================== */}
      
      {showQuerySection && (
        <QueryBuilderEditor
          config={config}
          onChange={onChange}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* ========================================== */}
      {/* VALIDATION WARNINGS */}
      {/* ========================================== */}
      
      {showQuerySection && (!config.query?.include || Object.keys(config.query.include).length === 0) && (
        <div className="p-3 rounded flex items-center gap-2 text-sm" style={{ backgroundColor: '#FFB70020', color: '#FFB700' }}>
          <AlertCircle className="w-4 h-4" />
          <span>⚠️ Query-Modus erfordert mindestens eine Include-Quelle</span>
        </div>
      )}

      {config.query?.filters?.yearFrom && config.query?.filters?.yearTo && 
       config.query.filters.yearFrom > config.query.filters.yearTo && (
        <div className="p-3 rounded flex items-center gap-2 text-sm" style={{ backgroundColor: '#FF000020', color: '#FF0000' }}>
          <AlertCircle className="w-4 h-4" />
          <span>❌ yearFrom muss kleiner oder gleich yearTo sein</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MANUAL BOOKS EDITOR (Separate Component)
// ============================================================================

interface ManualBooksEditorProps {
  sectionId: number;
}

function ManualBooksEditor({ sectionId }: ManualBooksEditorProps) {
  const [manualBooks, setManualBooks] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load manual books from section_items
  useEffect(() => {
    loadManualBooks();
  }, [sectionId]);

  const loadManualBooks = async () => {
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/sections/${sectionId}/items`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        // Filter nur book items
        const bookItems = (result.data || []).filter((item: any) => item.item_type === 'book');
        setManualBooks(bookItems);
      }
    } catch (err) {
      console.error('Error loading manual books:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/books/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
            credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📚 Book Search Response:', {
          ok: result.ok,
          dataLength: result.data?.length || 0,
          data: result.data,
          searchQuery: searchQuery,
        });
        // Server returns { ok: true, data: [...] } format
        const books = result.data || [];
        setSearchResults(books);
        if (books.length === 0) {
          console.warn('⚠️ Search returned 0 results for query:', searchQuery);
        }
      } else {
        console.error('❌ Book Search Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        setSearchResults([]);
      }
    } catch (err) {
      console.error('❌ Error searching books:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (bookId: number) => {
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      
      // Check for duplicates
      if (manualBooks.some(item => item.target_book_id === bookId)) {
        alert('❌ Dieses Buch ist bereits in der Section');
        return;
      }
      
      // Determine next sort_order
      const maxSortOrder = manualBooks.reduce((max, item) => Math.max(max, item.sort_order || 0), 0);
      
      const payload = {
        page_section_id: sectionId,
        item_type: 'book',
        target_type: 'book',
        target_book_id: bookId,
        sort_order: maxSortOrder + 10,
        status: 'draft',
        visibility: 'visible',
      };
      
      const response = await fetch(`${API_BASE_URL}/admin/sections/${sectionId}/items`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        setSearchMode(false);
        setSearchQuery('');
        setSearchResults([]);
        await loadManualBooks();
      } else {
        alert('❌ Fehler beim Hinzufügen des Buchs');
      }
    } catch (err) {
      console.error('Error adding book:', err);
      alert('❌ Fehler beim Hinzufügen des Buchs');
    }
  };

  const handleRemoveBook = async (itemId: number) => {
    if (!confirm('Buch wirklich entfernen?')) return;
    
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        await loadManualBooks();
      } else {
        alert('❌ Fehler beim Löschen');
      }
    } catch (err) {
      console.error('Error removing book:', err);
      alert('❌ Fehler beim Löschen');
    }
  };

  const handleReorder = async (itemId: number, direction: 'up' | 'down') => {
    const currentIndex = manualBooks.findIndex(item => item.id === itemId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= manualBooks.length) return;
    
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      
      // Swap sort_orders
      const currentItem = manualBooks[currentIndex];
      const targetItem = manualBooks[targetIndex];
      
      await fetch(`${API_BASE_URL}/admin/items/${currentItem.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: targetItem.sort_order }),
      });
      
      await fetch(`${API_BASE_URL}/admin/items/${targetItem.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: currentItem.sort_order }),
      });
      
      await loadManualBooks();
    } catch (err) {
      console.error('Error reordering:', err);
      alert('❌ Fehler beim Umsortieren');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Heading variant="h5" className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Manual Books (Pinned)
        </Heading>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setSearchMode(!searchMode)}
        >
          {searchMode ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </>
          )}
        </Button>
      </div>

      {/* Search UI */}
      {searchMode && (
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <div className="flex gap-2">
            <Input
              placeholder="Suche nach Titel, Autor oder ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className="p-2 bg-white rounded border flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-sm">{book.title}</div>
                    <div className="text-xs text-gray-500">
                      {book.author} • ISBN: {book.isbn13}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddBook(book.id)}>
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !loading && (
            <div className="mt-3 text-center text-sm text-gray-500 py-4 border-2 border-dashed rounded">
              <p className="font-medium mb-1">Keine Ergebnisse gefunden</p>
              <p className="text-xs">Suchbegriff: "{searchQuery}"</p>
              <p className="text-xs text-gray-400 mt-2">
                💡 Tipp: Öffne die Browser-Console für Details
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Books List */}
      {manualBooks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          Keine manuell gepinnten Bücher.
          <br />
          Klicke auf "Add Book" um Bücher hinzuzufügen.
        </div>
      ) : (
        <div className="space-y-2">
          {manualBooks.map((item, index) => (
            <div
              key={item.id}
              className="p-3 bg-gray-50 rounded border flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{item.book?.title || 'Unknown'}</div>
                <div className="text-xs text-gray-500">
                  {item.book?.author} • ISBN: {item.book?.isbn13}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleReorder(item.id, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleReorder(item.id, 'down')}
                  disabled={index === manualBooks.length - 1}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveBook(item.id)}
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// QUERY BUILDER EDITOR (Separate Component)
// ============================================================================

interface QueryBuilderEditorProps {
  config: BookSourceConfig;
  onChange: (config: BookSourceConfig) => void;
  activeTab: 'include' | 'exclude' | 'filter' | 'sort';
  onTabChange: (tab: 'include' | 'exclude' | 'filter' | 'sort') => void;
}

function QueryBuilderEditor({ config, onChange, activeTab, onTabChange }: QueryBuilderEditorProps) {
  return (
    <Card className="p-4">
      <Heading variant="h5" className="mb-4 text-sm font-semibold flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Query Builder
      </Heading>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b">
        {[
          { key: 'include', label: 'Include', icon: Target },
          { key: 'exclude', label: 'Exclude', icon: Ban },
          { key: 'filter', label: 'Filter', icon: Filter },
          { key: 'sort', label: 'Sort & Limit', icon: Filter },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'include' && (
          <IncludeSourcesEditor config={config} onChange={onChange} />
        )}
        {activeTab === 'exclude' && (
          <ExcludeSourcesEditor config={config} onChange={onChange} />
        )}
        {activeTab === 'filter' && (
          <FiltersEditor config={config} onChange={onChange} />
        )}
        {activeTab === 'sort' && (
          <SortAndLimitEditor config={config} onChange={onChange} />
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// INCLUDE SOURCES EDITOR
// ============================================================================

function IncludeSourcesEditor({ config, onChange }: { config: BookSourceConfig; onChange: (config: BookSourceConfig) => void }) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 rounded text-sm text-blue-900">
        💡 Bücher, die <strong>mindestens eine</strong> der ausgewählten Quellen erfüllen (je nach Operator)
      </div>

      {/* Categories */}
      <div>
        <label className="text-sm font-medium mb-2 block">Kategorien</label>
        <MultiSelectCategories
          selectedIds={config.query?.include?.categoryIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              include: {
                ...config.query?.include,
                categoryIds: ids,
              },
            },
          })}
        />
      </div>

      {/* Themen */}
      <div>
        <label className="text-sm font-medium mb-2 block">Themen</label>
        <MultiSelectTags
          selectedIds={config.query?.include?.tagIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              include: {
                ...config.query?.include,
                tagIds: ids,
              },
            },
          })}
        />
      </div>

      <Separator />

      {/* Award Definitions */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Auszeichnungen (Definitions)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Preis allgemein (z.B. "Deutscher Buchpreis")
        </p>
        <MultiSelectAwardDefinitions
          selectedIds={config.query?.include?.awardDefinitionIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              include: {
                ...config.query?.include,
                awardDefinitionIds: ids,
              },
            },
          })}
        />
      </div>

      {/* Award Instances */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Auszeichnungen (Jahrgänge)
        </label>
        <p className="text-xs text-gray-500 mb-1">Konkrete Preis-Jahrgänge, z.B. "Deutscher Buchpreis 2024"</p>
        <MultiSelectAwardInstances
          selectedIds={config.query?.include?.awardInstanceIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              include: {
                ...config.query?.include,
                awardInstanceIds: ids,
              },
            },
          })}
        />
      </div>
    </div>
  );
}

// ============================================================================
// EXCLUDE SOURCES EDITOR
// ============================================================================

function ExcludeSourcesEditor({ config, onChange }: { config: BookSourceConfig; onChange: (config: BookSourceConfig) => void }) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-red-50 rounded text-sm text-red-900">
        🚫 Bücher, die diese Kriterien erfüllen, werden <strong>ausgeschlossen</strong>
      </div>

      {/* Categories */}
      <div>
        <label className="text-sm font-medium mb-2 block">Kategorien</label>
        <MultiSelectCategories
          selectedIds={config.query?.exclude?.categoryIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              exclude: {
                ...config.query?.exclude,
                categoryIds: ids,
              },
            },
          })}
        />
      </div>

      {/* Themen */}
      <div>
        <label className="text-sm font-medium mb-2 block">Themen</label>
        <MultiSelectTags
          selectedIds={config.query?.exclude?.tagIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              exclude: {
                ...config.query?.exclude,
                tagIds: ids,
              },
            },
          })}
        />
      </div>

      <Separator />

      {/* Award Definitions */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Auszeichnungen (Definitions)
        </label>
        <MultiSelectAwardDefinitions
          selectedIds={config.query?.exclude?.awardDefinitionIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              exclude: {
                ...config.query?.exclude,
                awardDefinitionIds: ids,
              },
            },
          })}
        />
      </div>

      {/* Award Instances */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Auszeichnungen (Jahrgänge)
        </label>
        <MultiSelectAwardInstances
          selectedIds={config.query?.exclude?.awardInstanceIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              exclude: {
                ...config.query?.exclude,
                awardInstanceIds: ids,
              },
            },
          })}
        />
      </div>

      <Separator />

      {/* Exclude Specific Books */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Spezifische Bücher ausschließen
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Suche nach Titel, Autor oder ISBN
        </p>
        <ExcludeBooksPicker
          selectedIds={config.query?.exclude?.bookIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              exclude: {
                ...config.query?.exclude,
                bookIds: ids,
              },
            },
          })}
        />
      </div>
    </div>
  );
}

// ============================================================================
// FILTERS EDITOR
// ============================================================================

function FiltersEditor({ config, onChange }: { config: BookSourceConfig; onChange: (config: BookSourceConfig) => void }) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-gray-50 rounded text-sm text-gray-900">
        🔍 Weitere Filter für die Ergebnisse
      </div>

      {/* Year Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Erscheinungsjahr (von)</label>
          <Input
            type="number"
            placeholder="z.B. 2020"
            value={config.query?.filters?.yearFrom || ''}
            onChange={(e) => onChange({
              ...config,
              query: {
                ...config.query,
                filters: {
                  ...config.query?.filters,
                  yearFrom: e.target.value ? parseInt(e.target.value) : undefined,
                },
              },
            })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Erscheinungsjahr (bis)</label>
          <Input
            type="number"
            placeholder="z.B. 2024"
            value={config.query?.filters?.yearTo || ''}
            onChange={(e) => onChange({
              ...config,
              query: {
                ...config.query,
                filters: {
                  ...config.query?.filters,
                  yearTo: e.target.value ? parseInt(e.target.value) : undefined,
                },
              },
            })}
          />
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="text-sm font-medium mb-2 block">Sprache</label>
        <p className="text-xs text-gray-500 mb-2">Multi-Select (z.B. de, en, fr)</p>
        {/* TODO: Multi-Select for Languages */}
        <Input
          placeholder="Komma-getrennt: de,en,fr"
          value={config.query?.filters?.languageCodes?.join(',') || ''}
          onChange={(e) => onChange({
            ...config,
            query: {
              ...config.query,
              filters: {
                ...config.query?.filters,
                languageCodes: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined,
              },
            },
          })}
        />
      </div>

      {/* Publisher */}
      <div>
        <label className="text-sm font-medium mb-2 block">Verlag</label>
        <p className="text-xs text-gray-500 mb-2">Multi-Select</p>
        <MultiSelectPublishers
          selectedIds={config.query?.filters?.publisherIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: {
              ...config.query,
              filters: {
                ...config.query?.filters,
                publisherIds: ids,
              },
            },
          })}
        />
      </div>
    </div>
  );
}

// ============================================================================
// SORT AND LIMIT EDITOR
// ============================================================================

function SortAndLimitEditor({ config, onChange }: { config: BookSourceConfig; onChange: (config: BookSourceConfig) => void }) {
  return (
    <div className="space-y-4">
      {/* Operator */}
      <div>
        <label className="text-sm font-medium mb-2 block">Operator (Include-Logik)</label>
        <Select
          value={config.query?.operator || 'any'}
          onValueChange={(value) => onChange({
            ...config,
            query: {
              ...config.query,
              operator: value as 'any' | 'all',
            },
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">
              <div className="flex flex-col items-start">
                <span className="font-medium">ANY (ODER)</span>
                <span className="text-xs text-gray-500">Mindestens eine Bedingung muss erfüllt sein</span>
              </div>
            </SelectItem>
            <SelectItem value="all">
              <div className="flex flex-col items-start">
                <span className="font-medium">ALL (UND)</span>
                <span className="text-xs text-gray-500">Alle Bedingungen müssen erfüllt sein</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Sort */}
      <div>
        <label className="text-sm font-medium mb-2 block">Sortierung</label>
        <Select
          value={config.query?.sort || 'newest'}
          onValueChange={(value) => onChange({
            ...config,
            query: {
              ...config.query,
              sort: value as 'newest' | 'award_date' | 'popularity',
            },
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Neueste zuerst</SelectItem>
            <SelectItem value="award_date">Nach Auszeichnungsdatum</SelectItem>
            <SelectItem value="popularity">Nach Popularität</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Limit */}
      <div>
        <label className="text-sm font-medium mb-2 block">Limit (Anzahl Bücher)</label>
        <Input
          type="number"
          placeholder="20"
          value={config.query?.limit || 20}
          onChange={(e) => onChange({
            ...config,
            query: {
              ...config.query,
              limit: e.target.value ? parseInt(e.target.value) : 20,
            },
          })}
        />
        <p className="text-xs text-gray-500 mt-1">Standard: 20</p>
      </div>
    </div>
  );
}

// ============================================================================
// MULTI-SELECT COMPONENTS (Placeholder - Implement proper pickers)
// ============================================================================

function MultiSelectCategories({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      setCategories(result.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading categories:', err);
      setLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-3 border rounded text-sm text-gray-500">Lade Kategorien...</div>;
  }

  return (
    <div className="border rounded">
      <div className="p-2 border-b bg-gray-50">
        <Input
          placeholder="Kategorie suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            {categories.length === 0 ? 'Keine Kategorien verfügbar (API-Endpoint fehlt noch)' : 'Keine Ergebnisse'}
          </div>
        ) : (
          filteredCategories.map(cat => (
            <div
              key={cat.id}
              className="p-2 border-b hover:bg-gray-50 cursor-pointer flex items-center gap-2"
              onClick={() => handleToggle(cat.id)}
            >
              <Checkbox checked={selectedIds.includes(cat.id)} />
              <span className="text-sm">{cat.name}</span>
            </div>
          ))
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="p-2 border-t bg-blue-50 text-xs text-blue-900">
          {selectedIds.length} ausgewählt
        </div>
      )}
    </div>
  );
}

function MultiSelectTags({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/onix-tags`, {
            credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      setTags(result.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading tags:', err);
      setLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleVisibilityToggle = async (e: React.MouseEvent, tag: any) => {
    e.stopPropagation();
    setTogglingId(tag.id);
    try {
      const adminToken = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '';
      const newVisible = !tag.visible;
      const resp = await fetch(`${API_BASE_URL}/onix-tags/${tag.id}/visibility`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: newVisible }),
      });
      if (resp.ok) {
        setTags(prev => prev.map(t => t.id === tag.id ? { ...t, visible: newVisible } : t));
      } else {
        console.error('Tag visibility toggle failed:', resp.status);
      }
    } catch (err) {
      console.error('Error toggling tag visibility:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-3 border rounded text-sm text-gray-500">Lade Tags...</div>;
  }

  return (
    <div className="border rounded">
      <div className="p-2 border-b bg-gray-50">
        <Input
          placeholder="Tag suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filteredTags.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            {tags.length === 0 ? 'Keine Tags verfügbar' : 'Keine Ergebnisse'}
          </div>
        ) : (
          filteredTags.map(tag => (
            <div
              key={tag.id}
              className={`p-2 border-b cursor-pointer flex items-center gap-2 ${
                tag.visible === false ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleToggle(tag.id)}
            >
              <Checkbox checked={selectedIds.includes(tag.id)} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${tag.visible === false ? 'line-through text-gray-400' : ''}`}>
                  {tag.displayName || tag.name}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {tag.type || tag.tag_type || ''}
                  {tag.visible === false && (
                    <span className="text-red-400 font-medium ml-1">versteckt</span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={tag.visible === false ? 'text-red-400' : 'text-green-600'}
                onClick={(e) => handleVisibilityToggle(e, tag)}
                disabled={togglingId === tag.id}
                title={tag.visible === false ? 'Tag sichtbar machen' : 'Tag verstecken'}
              >
                {togglingId === tag.id ? (
                  <span className="w-4 h-4 block animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : tag.visible === false ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="p-2 border-t bg-blue-50 text-xs text-blue-900">
          {selectedIds.length} ausgewählt
        </div>
      )}
    </div>
  );
}

function MultiSelectAwardDefinitions({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    loadDefinitions();
  }, []);

  const loadDefinitions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/awards`, {
            credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      setDefinitions(result.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading award definitions:', err);
      setLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleVisibilityToggle = async (e: React.MouseEvent, def: any) => {
    e.stopPropagation();
    setTogglingId(def.id);
    try {
      const adminToken = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '';
      const newVisible = !def.visible;
      const resp = await fetch(`${API_BASE_URL}/awards/${def.id}/visibility`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: newVisible }),
      });
      if (resp.ok) {
        setDefinitions(prev => prev.map(d => d.id === def.id ? { ...d, visible: newVisible } : d));
      } else {
        console.error('Award visibility toggle failed:', resp.status);
      }
    } catch (err) {
      console.error('Error toggling award visibility:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredDefinitions = definitions.filter(def =>
    def.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-3 border rounded text-sm text-gray-500">Lade Auszeichnungen...</div>;
  }

  return (
    <div className="border rounded">
      <div className="p-2 border-b bg-gray-50">
        <Input
          placeholder="Award suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filteredDefinitions.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            {definitions.length === 0 ? 'Keine Auszeichnungen verfügbar' : 'Keine Ergebnisse'}
          </div>
        ) : (
          filteredDefinitions.map(def => (
            <div
              key={def.id}
              className={`p-2 border-b cursor-pointer flex items-center gap-2 ${
                def.visible === false ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleToggle(def.id)}
            >
              <Checkbox checked={selectedIds.includes(def.id)} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${def.visible === false ? 'line-through text-gray-400' : ''}`}>
                  {def.name}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {def.description && <span className="truncate">{def.description}</span>}
                  {def.visible === false && (
                    <span className="text-red-400 font-medium ml-1">versteckt</span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={def.visible === false ? 'text-red-400' : 'text-green-600'}
                onClick={(e) => handleVisibilityToggle(e, def)}
                disabled={togglingId === def.id}
                title={def.visible === false ? 'Auszeichnung sichtbar machen' : 'Auszeichnung verstecken'}
              >
                {togglingId === def.id ? (
                  <span className="w-4 h-4 block animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : def.visible === false ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="p-2 border-t bg-blue-50 text-xs text-blue-900">
          {selectedIds.length} ausgewählt
        </div>
      )}
    </div>
  );
}

function MultiSelectAwardInstances({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/award_editions`, {
            credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success === false) {
        console.error('Award editions API error:', result.error);
      }
      setInstances(result.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading award instances:', err);
      setLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const filteredInstances = instances.filter(inst =>
    `${inst.award_name} ${inst.year} ${inst.status}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-3 border rounded text-sm text-gray-500">Lade Award Instances...</div>;
  }

  return (
    <div className="border rounded">
      <div className="p-2 border-b bg-gray-50">
        <Input
          placeholder="Award Instance suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filteredInstances.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            {instances.length === 0 ? 'Noch keine Auszeichnungs-Jahrgänge angelegt. Erstelle sie unter Auszeichnungen → Editionen.' : 'Keine Ergebnisse'}
          </div>
        ) : (
          filteredInstances.map(inst => (
            <div
              key={inst.id}
              className="p-2 border-b hover:bg-gray-50 cursor-pointer flex items-center gap-2"
              onClick={() => handleToggle(inst.id)}
            >
              <Checkbox checked={selectedIds.includes(inst.id)} />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {inst.award_name} {inst.year}
                </div>
                <div className="text-xs text-gray-500">{inst.status}</div>
              </div>
            </div>
          ))
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="p-2 border-t bg-blue-50 text-xs text-blue-900">
          {selectedIds.length} ausgewählt
        </div>
      )}
    </div>
  );
}

function MultiSelectPublishers({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPublishers();
  }, []);

  const loadPublishers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/publishers`, {
            credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      setPublishers(result.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading publishers:', err);
      setLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const filteredPublishers = publishers.filter(pub =>
    pub.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-3 border rounded text-sm text-gray-500">Lade Verlage...</div>;
  }

  return (
    <div className="border rounded">
      <div className="p-2 border-b bg-gray-50">
        <Input
          placeholder="Verlag suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filteredPublishers.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            {publishers.length === 0 ? 'Keine Verlage verfügbar' : 'Keine Ergebnisse'}
          </div>
        ) : (
          filteredPublishers.map(pub => (
            <div
              key={pub.id}
              className="p-2 border-b hover:bg-gray-50 cursor-pointer flex items-center gap-2"
              onClick={() => handleToggle(pub.id)}
            >
              <Checkbox checked={selectedIds.includes(pub.id)} />
              <div className="flex-1">
                <div className="text-sm font-medium">{pub.name}</div>
                {pub.description && (
                  <div className="text-xs text-gray-500 truncate">{pub.description}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="p-2 border-t bg-blue-50 text-xs text-blue-900">
          {selectedIds.length} ausgewählt
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXCLUDE BOOKS PICKER
// ============================================================================

interface ExcludeBooksPickerProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

function ExcludeBooksPicker({ selectedIds, onChange }: ExcludeBooksPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/books/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
            credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data || []);
      }
    } catch (err) {
      console.error('Error searching books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = (bookId: number) => {
    if (selectedIds.includes(bookId)) {
      alert('❌ Dieses Buch ist bereits ausgeschlossen');
      return;
    }
    onChange([...selectedIds, bookId]);
  };

  const handleRemoveBook = (bookId: number) => {
    onChange(selectedIds.filter(id => id !== bookId));
  };

  return (
    <div className="border rounded">
      <div className="p-2 border-b bg-gray-50">
        <Input
          placeholder="Buch suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="text-sm"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            Lade Bücher...
          </div>
        ) : (
          <>
            {searchResults.length > 0 ? (
              searchResults.map(book => (
                <div
                  key={book.id}
                  className="p-2 border-b hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                >
                  <Checkbox checked={selectedIds.includes(book.id)} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{book.title}</div>
                    <div className="text-xs text-gray-500">
                      {book.author} • ISBN: {book.isbn13}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddBook(book.id)}>
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchQuery ? 'Keine Ergebnisse' : 'Suche nach Titel, Autor oder ISBN'}
              </div>
            )}
          </>
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="p-2 border-t bg-blue-50 text-xs text-blue-900">
          {selectedIds.length} ausgewählt
        </div>
      )}
    </div>
  );
}