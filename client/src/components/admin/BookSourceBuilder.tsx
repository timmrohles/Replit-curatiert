import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Filter,
  Target,
  Ban,
  Eye,
  EyeOff,
  SlidersHorizontal,
  ArrowUpDown,
  Users,
  Heart,
  BookMarked,
  Sparkles,
  GripVertical,
  Trash2,
  Check,
  Mic,
  Radio,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { API_BASE_URL } from '../../config/apiClient';

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
    userContext?: {
      followedBy?: 'any_user' | 'specific_users';
      followTargetType?: 'curator' | 'author' | 'user';
      readingStatus?: ('reading' | 'read' | 'want_to_read')[];
      readingStatusMode?: 'popular' | 'trending';
      inMedia?: { enabled: boolean; period?: 'week' | 'month' | 'quarter' | 'year' | 'all' };
    };
    operator?: 'any' | 'all';
    sort?: 'newest' | 'award_date' | 'popularity' | 'relevance' | 'hidden_gems';
    limit?: number;
  };
}

interface BookSourceBuilderProps {
  sectionId: number;
  config: BookSourceConfig;
  onChange: (config: BookSourceConfig) => void;
}

const MODE_OPTIONS = [
  { value: 'manual', label: 'Manuell', desc: 'Nur handverlesene Bücher', icon: BookMarked, color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { value: 'query', label: 'Dynamisch', desc: 'Automatisch nach Regeln', icon: Sparkles, color: 'bg-violet-50 border-violet-200 text-violet-800' },
  { value: 'hybrid', label: 'Hybrid', desc: 'Manuell + dynamisch ergänzt', icon: SlidersHorizontal, color: 'bg-sky-50 border-sky-200 text-sky-800' },
] as const;

function SectionCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white">
      {count}
    </span>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  count = 0,
  accentColor = 'blue',
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  count?: number;
  accentColor?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-gray-50/80 transition-colors"
      >
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
        <Icon className={`w-4 h-4 text-${accentColor}-600`} />
        <span className="text-sm font-medium flex-1">{title}</span>
        <SectionCount count={count} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t bg-gray-50/30">
          {children}
        </div>
      )}
    </div>
  );
}

export function BookSourceBuilder({ sectionId, config, onChange }: BookSourceBuilderProps) {
  const handleModeChange = (mode: 'manual' | 'query' | 'hybrid') => {
    onChange({
      ...config,
      mode,
      query: (mode === 'query' || mode === 'hybrid') && !config.query
        ? { operator: 'any', sort: 'newest', limit: 20 }
        : config.query,
    });
  };

  const showManualSection = config.mode === 'manual' || config.mode === 'hybrid';
  const showQuerySection = config.mode === 'query' || config.mode === 'hybrid';

  const includeCount = (config.query?.include?.categoryIds?.length || 0)
    + (config.query?.include?.tagIds?.length || 0)
    + (config.query?.include?.awardDefinitionIds?.length || 0)
    + (config.query?.include?.awardInstanceIds?.length || 0);

  const excludeCount = (config.query?.exclude?.categoryIds?.length || 0)
    + (config.query?.exclude?.tagIds?.length || 0)
    + (config.query?.exclude?.awardDefinitionIds?.length || 0)
    + (config.query?.exclude?.awardInstanceIds?.length || 0)
    + (config.query?.exclude?.bookIds?.length || 0);

  const filterCount = (config.query?.filters?.yearFrom ? 1 : 0)
    + (config.query?.filters?.yearTo ? 1 : 0)
    + (config.query?.filters?.languageCodes?.length || 0)
    + (config.query?.filters?.publisherIds?.length || 0);

  const userContextCount = (config.query?.userContext?.followedBy ? 1 : 0)
    + (config.query?.userContext?.readingStatus?.length || 0)
    + (config.query?.userContext?.inMedia?.enabled ? 1 : 0);
  const userContextActive = userContextCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">Inhaltsquelle</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MODE_OPTIONS.map((opt) => {
          const isActive = config.mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleModeChange(opt.value as any)}
              className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all ${
                isActive
                  ? opt.color + ' ring-2 ring-offset-1 ring-blue-400'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <opt.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{opt.label}</span>
              <span className="text-[10px] opacity-70 leading-tight">{opt.desc}</span>
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {showManualSection && (
        <ManualBooksEditor sectionId={sectionId} />
      )}

      {showQuerySection && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pt-2">
            <Filter className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-gray-700">Dynamische Regeln</span>
          </div>

          <CollapsibleSection title="Quellen einschließen" icon={Target} defaultOpen={true} count={includeCount} accentColor="green">
            <IncludeSourcesEditor config={config} onChange={onChange} />
          </CollapsibleSection>

          <CollapsibleSection title="Ausschließen" icon={Ban} count={excludeCount} accentColor="red">
            <ExcludeSourcesEditor config={config} onChange={onChange} />
          </CollapsibleSection>

          <CollapsibleSection title="Erweiterte Filter" icon={Filter} count={filterCount} accentColor="blue">
            <FiltersEditor config={config} onChange={onChange} />
          </CollapsibleSection>

          <CollapsibleSection title="User-Merkmale" icon={Users} count={userContextCount} accentColor="purple">
            <UserContextEditor config={config} onChange={onChange} />
          </CollapsibleSection>

          <CollapsibleSection title="Sortierung & Limit" icon={ArrowUpDown} accentColor="gray">
            <SortAndLimitEditor config={config} onChange={onChange} />
          </CollapsibleSection>
        </div>
      )}

      {showQuerySection && includeCount === 0 && !userContextActive && (
        <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Mindestens eine Quelle oder ein User-Merkmal muss definiert sein.</span>
        </div>
      )}
    </div>
  );
}

function ManualBooksEditor({ sectionId }: { sectionId: number }) {
  const [manualBooks, setManualBooks] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadManualBooks();
  }, [sectionId]);

  const loadManualBooks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sections/${sectionId}/items`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const result = await response.json();
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
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data || []);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (bookId: number) => {
    if (manualBooks.some(item => item.target_book_id === bookId)) {
      alert('Dieses Buch ist bereits hinzugefügt.');
      return;
    }
    const maxSortOrder = manualBooks.reduce((max, item) => Math.max(max, item.sort_order || 0), 0);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sections/${sectionId}/items`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_section_id: sectionId,
          item_type: 'book',
          target_type: 'book',
          target_book_id: bookId,
          sort_order: maxSortOrder + 10,
          status: 'draft',
          visibility: 'visible',
        }),
      });
      if (response.ok) {
        setSearchMode(false);
        setSearchQuery('');
        setSearchResults([]);
        await loadManualBooks();
      }
    } catch {
      alert('Fehler beim Hinzufügen.');
    }
  };

  const handleRemoveBook = async (itemId: number) => {
    if (!confirm('Buch wirklich entfernen?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) await loadManualBooks();
    } catch {
      alert('Fehler beim Entfernen.');
    }
  };

  const handleReorder = async (itemId: number, direction: 'up' | 'down') => {
    const idx = manualBooks.findIndex(item => item.id === itemId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= manualBooks.length) return;
    try {
      const cur = manualBooks[idx];
      const tgt = manualBooks[targetIdx];
      await fetch(`${API_BASE_URL}/admin/items/${cur.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: tgt.sort_order }),
      });
      await fetch(`${API_BASE_URL}/admin/items/${tgt.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: cur.sort_order }),
      });
      await loadManualBooks();
    } catch {
      alert('Fehler beim Umsortieren.');
    }
  };

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50/60 border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-900">Manuell gepinnte Bücher</span>
          <SectionCount count={manualBooks.length} />
        </div>
        <Button
          size="sm"
          variant={searchMode ? 'secondary' : 'outline'}
          className="h-7 text-xs"
          onClick={() => setSearchMode(!searchMode)}
        >
          {searchMode ? <><X className="w-3 h-3 mr-1" /> Schließen</> : <><Plus className="w-3 h-3 mr-1" /> Buch hinzufügen</>}
        </Button>
      </div>

      {searchMode && (
        <div className="p-3 border-b bg-gray-50/80">
          <div className="flex gap-2">
            <Input
              placeholder="Titel, Autor oder ISBN suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-9 text-sm"
            />
            <Button onClick={handleSearch} disabled={loading} size="sm" className="h-9 px-3">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-2 rounded-md bg-white border hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleAddBook(book.id)}
                >
                  {book.cover_url && (
                    <img src={book.cover_url} alt="" className="w-8 h-12 rounded object-cover flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{book.title}</div>
                    <div className="text-xs text-gray-500 truncate">{book.author}</div>
                  </div>
                  <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
          {searchResults.length === 0 && searchQuery && !loading && (
            <p className="text-xs text-gray-500 text-center py-3">Keine Ergebnisse für "{searchQuery}"</p>
          )}
        </div>
      )}

      {manualBooks.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Noch keine Bücher gepinnt.
        </div>
      ) : (
        <div className="divide-y">
          {manualBooks.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50/60 group">
              <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              {item.book?.cover_url && (
                <img src={item.book.cover_url} alt="" className="w-7 h-10 rounded object-cover flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.book?.title || 'Unbekannt'}</div>
                <div className="text-xs text-gray-500 truncate">{item.book?.author}</div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleReorder(item.id, 'up')} disabled={index === 0}>
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleReorder(item.id, 'down')} disabled={index === manualBooks.length - 1}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleRemoveBook(item.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IncludeSourcesEditor({ config, onChange }: { config: BookSourceConfig; onChange: (config: BookSourceConfig) => void }) {
  return (
    <div className="space-y-4 pt-3">
      <p className="text-xs text-gray-500">Bücher, die mindestens eine der Quellen erfüllen, werden eingeschlossen.</p>

      <FilterGroup label="Kategorien">
        <MultiSelectCategories
          selectedIds={config.query?.include?.categoryIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, include: { ...config.query?.include, categoryIds: ids } },
          })}
        />
      </FilterGroup>

      <FilterGroup label="Themen / Tags">
        <MultiSelectTags
          selectedIds={config.query?.include?.tagIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, include: { ...config.query?.include, tagIds: ids } },
          })}
        />
      </FilterGroup>

      <FilterGroup label="Auszeichnungen (Preise)">
        <MultiSelectAwardDefinitions
          selectedIds={config.query?.include?.awardDefinitionIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, include: { ...config.query?.include, awardDefinitionIds: ids } },
          })}
        />
      </FilterGroup>

      <FilterGroup label="Auszeichnungen (Jahrgänge)" hint="z.B. Deutscher Buchpreis 2025">
        <MultiSelectAwardInstances
          selectedIds={config.query?.include?.awardInstanceIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, include: { ...config.query?.include, awardInstanceIds: ids } },
          })}
        />
      </FilterGroup>
    </div>
  );
}

function ExcludeSourcesEditor({ config, onChange }: { config: BookSourceConfig; onChange: (config: BookSourceConfig) => void }) {
  return (
    <div className="space-y-4 pt-3">
      <p className="text-xs text-gray-500">Bücher mit diesen Merkmalen werden ausgeschlossen.</p>

      <FilterGroup label="Kategorien">
        <MultiSelectCategories
          selectedIds={config.query?.exclude?.categoryIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, exclude: { ...config.query?.exclude, categoryIds: ids } },
          })}
        />
      </FilterGroup>

      <FilterGroup label="Themen / Tags">
        <MultiSelectTags
          selectedIds={config.query?.exclude?.tagIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, exclude: { ...config.query?.exclude, tagIds: ids } },
          })}
        />
      </FilterGroup>

      <FilterGroup label="Auszeichnungen (Preise)">
        <MultiSelectAwardDefinitions
          selectedIds={config.query?.exclude?.awardDefinitionIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, exclude: { ...config.query?.exclude, awardDefinitionIds: ids } },
          })}
        />
      </FilterGroup>

      <FilterGroup label="Auszeichnungen (Jahrgänge)">
        <MultiSelectAwardInstances
          selectedIds={config.query?.exclude?.awardInstanceIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, exclude: { ...config.query?.exclude, awardInstanceIds: ids } },
          })}
        />
      </FilterGroup>

      <FilterGroup label="Einzelne Bücher">
        <ExcludeBooksPicker
          selectedIds={config.query?.exclude?.bookIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, exclude: { ...config.query?.exclude, bookIds: ids } },
          })}
        />
      </FilterGroup>
    </div>
  );
}

function FiltersEditor({ config, onChange }: { config: BookSourceConfig; onChange: (config: BookSourceConfig) => void }) {
  return (
    <div className="space-y-4 pt-3">
      <p className="text-xs text-gray-500">Zusätzliche Einschränkungen auf die Ergebnisse.</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block text-gray-600">Erscheinungsjahr ab</label>
          <Input
            type="number"
            placeholder="z.B. 2020"
            value={config.query?.filters?.yearFrom || ''}
            onChange={(e) => onChange({
              ...config,
              query: { ...config.query, filters: { ...config.query?.filters, yearFrom: e.target.value ? parseInt(e.target.value) : undefined } },
            })}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block text-gray-600">Erscheinungsjahr bis</label>
          <Input
            type="number"
            placeholder="z.B. 2025"
            value={config.query?.filters?.yearTo || ''}
            onChange={(e) => onChange({
              ...config,
              query: { ...config.query, filters: { ...config.query?.filters, yearTo: e.target.value ? parseInt(e.target.value) : undefined } },
            })}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-1 block text-gray-600">Sprache (kommagetrennt)</label>
        <Input
          placeholder="de, en, fr"
          value={config.query?.filters?.languageCodes?.join(', ') || ''}
          onChange={(e) => onChange({
            ...config,
            query: { ...config.query, filters: { ...config.query?.filters, languageCodes: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : undefined } },
          })}
          className="h-9 text-sm"
        />
      </div>

      <FilterGroup label="Verlag">
        <MultiSelectPublishers
          selectedIds={config.query?.filters?.publisherIds || []}
          onChange={(ids) => onChange({
            ...config,
            query: { ...config.query, filters: { ...config.query?.filters, publisherIds: ids } },
          })}
        />
      </FilterGroup>
    </div>
  );
}

function UserContextEditor({ config, onChange }: { config: BookSourceConfig; onChange: (config: BookSourceConfig) => void }) {
  const uc = config.query?.userContext || {};

  const updateUC = (patch: Partial<BookSourceConfig['query']['userContext']>) => {
    onChange({
      ...config,
      query: {
        ...config.query,
        userContext: { ...uc, ...patch },
      },
    });
  };

  const clearUC = () => {
    const q = { ...config.query };
    delete q.userContext;
    onChange({ ...config, query: q });
  };

  return (
    <div className="space-y-5 pt-3">
      <p className="text-xs text-gray-500">
        Zeige Bücher basierend auf dem Verhalten der Community: wem sie folgen und was sie lesen.
      </p>

      <div className="rounded-lg border p-4 space-y-3 bg-purple-50/40">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-800">Follows</span>
        </div>
        <p className="text-xs text-gray-500">
          Bücher von Profilen, denen Nutzer:innen folgen.
        </p>

        <div>
          <label className="text-xs font-medium mb-1 block text-gray-600">Follow-Quelle</label>
          <Select
            value={uc.followedBy || 'none'}
            onValueChange={(v) => {
              if (v === 'none') {
                updateUC({ followedBy: undefined, followTargetType: undefined });
              } else {
                updateUC({ followedBy: v as any });
              }
            }}
          >
            <SelectTrigger className="h-9 text-sm bg-white">
              <SelectValue placeholder="Nicht aktiv" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nicht aktiv</SelectItem>
              <SelectItem value="any_user">Alle Nutzer:innen (beliebteste)</SelectItem>
              <SelectItem value="specific_users">Aktuelle:r Nutzer:in (personalisiert)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {uc.followedBy && (
          <div>
            <label className="text-xs font-medium mb-1 block text-gray-600">Profil-Typ</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'curator', label: 'Kurator:innen', icon: Users },
                { value: 'author', label: 'Autor:innen', icon: BookOpen },
                { value: 'user', label: 'Nutzer:innen', icon: Users },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateUC({ followTargetType: opt.value as any })}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-md border text-xs font-medium transition-all ${
                    uc.followTargetType === opt.value
                      ? 'bg-purple-100 border-purple-400 text-purple-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3 bg-sky-50/40">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-sky-600" />
          <span className="text-sm font-medium text-gray-800">Lesestatus</span>
        </div>
        <p className="text-xs text-gray-500">
          Bücher, die viele Nutzer:innen auf einer bestimmten Leseliste haben. Mehrfachauswahl möglich.
        </p>

        <div>
          <label className="text-xs font-medium mb-1.5 block text-gray-600">Status (Mehrfachauswahl)</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'reading', label: 'Lese ich', icon: BookOpen },
              { value: 'read', label: 'Gelesen', icon: Check },
              { value: 'want_to_read', label: 'Werde lesen', icon: BookMarked },
            ] as const).map((opt) => {
              const selected = (uc.readingStatus || []).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const current = uc.readingStatus || [];
                    const next = selected
                      ? current.filter(s => s !== opt.value)
                      : [...current, opt.value];
                    updateUC({
                      readingStatus: next.length > 0 ? next : undefined,
                      readingStatusMode: next.length > 0 ? (uc.readingStatusMode || 'popular') : undefined,
                    });
                  }}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-md border text-xs font-medium transition-all ${
                    selected
                      ? 'bg-sky-100 border-sky-400 text-sky-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {(uc.readingStatus?.length || 0) > 0 && (
          <div>
            <label className="text-xs font-medium mb-1 block text-gray-600">Modus</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'popular', label: 'Beliebteste', desc: 'Am häufigsten gelistet' },
                { value: 'trending', label: 'Trending', desc: 'Kürzlich hinzugefügt' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateUC({ readingStatusMode: opt.value as any })}
                  className={`flex flex-col items-start p-2.5 rounded-md border text-xs transition-all ${
                    uc.readingStatusMode === opt.value
                      ? 'bg-sky-100 border-sky-400 text-sky-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="opacity-70 text-[10px]">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3 bg-emerald-50/40">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-gray-800">In den Medien / Podcasts</span>
        </div>
        <p className="text-xs text-gray-500">
          Bücher, die in Podcasts oder Medien erwähnt wurden.
        </p>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={uc.inMedia?.enabled || false}
            onCheckedChange={(checked) => {
              if (checked) {
                updateUC({ inMedia: { enabled: true, period: 'all' } });
              } else {
                updateUC({ inMedia: undefined });
              }
            }}
          />
          <span className="text-sm">Nur Bücher mit Medien-Erwähnungen</span>
        </label>

        {uc.inMedia?.enabled && (
          <div>
            <label className="text-xs font-medium mb-1.5 block text-gray-600">Zeitraum</label>
            <div className="grid grid-cols-5 gap-1.5">
              {([
                { value: 'week', label: 'Woche' },
                { value: 'month', label: 'Monat' },
                { value: 'quarter', label: 'Quartal' },
                { value: 'year', label: 'Jahr' },
                { value: 'all', label: 'Gesamt' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateUC({ inMedia: { enabled: true, period: opt.value } })}
                  className={`p-2 rounded-md border text-xs font-medium text-center transition-all ${
                    (uc.inMedia?.period || 'all') === opt.value
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">Filtert nach Veröffentlichungsdatum der Podcast-Episode</p>
          </div>
        )}
      </div>

      {(uc.followedBy || (uc.readingStatus?.length || 0) > 0 || uc.inMedia?.enabled) && (
        <button
          type="button"
          onClick={clearUC}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
        >
          <X className="w-3 h-3" />
          User-Merkmale zurücksetzen
        </button>
      )}
    </div>
  );
}

function SortAndLimitEditor({ config, onChange }: { config: BookSourceConfig; onChange: (config: BookSourceConfig) => void }) {
  return (
    <div className="space-y-4 pt-3">
      <div>
        <label className="text-xs font-medium mb-1.5 block text-gray-600">Verknüpfungslogik (Include)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'any', label: 'ODER', desc: 'Mindestens eine Bedingung' },
            { value: 'all', label: 'UND', desc: 'Alle Bedingungen' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...config, query: { ...config.query, operator: opt.value as any } })}
              className={`flex flex-col items-start p-2.5 rounded-md border text-xs transition-all ${
                (config.query?.operator || 'any') === opt.value
                  ? 'bg-blue-50 border-blue-400 text-blue-800'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="font-bold">{opt.label}</span>
              <span className="opacity-70 text-[10px]">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block text-gray-600">Sortierung</label>
        <Select
          value={config.query?.sort || 'newest'}
          onValueChange={(value) => onChange({ ...config, query: { ...config.query, sort: value as any } })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Neueste zuerst</SelectItem>
            <SelectItem value="award_date">Nach Auszeichnungsdatum</SelectItem>
            <SelectItem value="popularity">Nach Popularität</SelectItem>
            <SelectItem value="relevance">Relevanz (Score)</SelectItem>
            <SelectItem value="hidden_gems">Hidden Gems</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block text-gray-600">Maximale Anzahl</label>
        <Input
          type="number"
          placeholder="20"
          value={config.query?.limit || 20}
          onChange={(e) => onChange({ ...config, query: { ...config.query, limit: e.target.value ? parseInt(e.target.value) : 20 } })}
          className="h-9 text-sm"
        />
      </div>
    </div>
  );
}

function FilterGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block text-gray-600">
        {label}
        {hint && <span className="font-normal text-gray-400 ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function PickerList({
  items,
  selectedIds,
  onToggle,
  searchPlaceholder,
  emptyText,
  renderItem,
  extraAction,
}: {
  items: any[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  searchPlaceholder: string;
  emptyText: string;
  renderItem: (item: any) => React.ReactNode;
  extraAction?: (item: any) => React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const name = (item.displayName || item.name || item.award_name || '').toLowerCase();
    const extra = (item.description || item.year?.toString() || item.tag_type || '').toLowerCase();
    return name.includes(q) || extra.includes(q);
  });

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="p-2 bg-gray-50/80">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8"
          />
        </div>
      </div>
      <div className="max-h-44 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-400 text-center">{items.length === 0 ? emptyText : 'Keine Treffer'}</div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-sm ${
                selectedIds.includes(item.id)
                  ? 'bg-blue-50/70'
                  : 'hover:bg-gray-50/80'
              }`}
              onClick={() => onToggle(item.id)}
            >
              <Checkbox checked={selectedIds.includes(item.id)} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">{renderItem(item)}</div>
              {extraAction?.(item)}
            </div>
          ))
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="px-3 py-1.5 bg-blue-50 text-[11px] text-blue-700 font-medium border-t">
          {selectedIds.length} ausgewählt
        </div>
      )}
    </div>
  );
}

function MultiSelectCategories({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/categories`, { credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(result => { setCategories(result.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-3 border rounded text-xs text-gray-400 text-center">Lade Kategorien...</div>;

  return (
    <PickerList
      items={categories}
      selectedIds={selectedIds}
      onToggle={(id) => onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])}
      searchPlaceholder="Kategorie suchen..."
      emptyText="Keine Kategorien vorhanden"
      renderItem={(cat) => <span className="text-sm">{cat.name}</span>}
    />
  );
}

function MultiSelectTags({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/onix-tags`, { credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(result => { setTags(result.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleVisibilityToggle = async (e: React.MouseEvent, tag: any) => {
    e.stopPropagation();
    setTogglingId(tag.id);
    try {
      const resp = await fetch(`${API_BASE_URL}/onix-tags/${tag.id}/visibility`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !tag.visible }),
      });
      if (resp.ok) setTags(prev => prev.map(t => t.id === tag.id ? { ...t, visible: !tag.visible } : t));
    } catch {} finally { setTogglingId(null); }
  };

  if (loading) return <div className="p-3 border rounded text-xs text-gray-400 text-center">Lade Tags...</div>;

  return (
    <PickerList
      items={tags}
      selectedIds={selectedIds}
      onToggle={(id) => onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])}
      searchPlaceholder="Tag suchen..."
      emptyText="Keine Tags vorhanden"
      renderItem={(tag) => (
        <div className="min-w-0">
          <div className={`text-sm font-medium truncate ${tag.visible === false ? 'line-through text-gray-400' : ''}`}>
            {tag.displayName || tag.name}
          </div>
          <div className="text-[10px] text-gray-400 flex items-center gap-1 truncate">
            {tag.type || tag.tag_type || ''}
            {tag.visible === false && <span className="text-red-400 font-medium">versteckt</span>}
          </div>
        </div>
      )}
      extraAction={(tag) => (
        <Button
          type="button" size="icon" variant="ghost"
          className={`h-6 w-6 flex-shrink-0 ${tag.visible === false ? 'text-red-400' : 'text-green-600'}`}
          onClick={(e) => handleVisibilityToggle(e, tag)}
          disabled={togglingId === tag.id}
        >
          {togglingId === tag.id ? (
            <span className="w-3.5 h-3.5 block animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : tag.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
      )}
    />
  );
}

function MultiSelectAwardDefinitions({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/awards`, { credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(result => { setDefinitions(result.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleVisibilityToggle = async (e: React.MouseEvent, def: any) => {
    e.stopPropagation();
    setTogglingId(def.id);
    try {
      const resp = await fetch(`${API_BASE_URL}/awards/${def.id}/visibility`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !def.visible }),
      });
      if (resp.ok) setDefinitions(prev => prev.map(d => d.id === def.id ? { ...d, visible: !def.visible } : d));
    } catch {} finally { setTogglingId(null); }
  };

  if (loading) return <div className="p-3 border rounded text-xs text-gray-400 text-center">Lade Auszeichnungen...</div>;

  return (
    <PickerList
      items={definitions}
      selectedIds={selectedIds}
      onToggle={(id) => onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])}
      searchPlaceholder="Auszeichnung suchen..."
      emptyText="Keine Auszeichnungen vorhanden"
      renderItem={(def) => (
        <div className="min-w-0">
          <div className={`text-sm font-medium truncate ${def.visible === false ? 'line-through text-gray-400' : ''}`}>
            {def.name}
          </div>
          {(def.description || def.visible === false) && (
            <div className="text-[10px] text-gray-400 flex items-center gap-1 truncate">
              {def.description && <span className="truncate">{def.description}</span>}
              {def.visible === false && <span className="text-red-400 font-medium">versteckt</span>}
            </div>
          )}
        </div>
      )}
      extraAction={(def) => (
        <Button
          type="button" size="icon" variant="ghost"
          className={`h-6 w-6 flex-shrink-0 ${def.visible === false ? 'text-red-400' : 'text-green-600'}`}
          onClick={(e) => handleVisibilityToggle(e, def)}
          disabled={togglingId === def.id}
        >
          {togglingId === def.id ? (
            <span className="w-3.5 h-3.5 block animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : def.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
      )}
    />
  );
}

function MultiSelectAwardInstances({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/award_editions`, { credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(result => { setInstances(result.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-3 border rounded text-xs text-gray-400 text-center">Lade Jahrgänge...</div>;

  return (
    <PickerList
      items={instances}
      selectedIds={selectedIds}
      onToggle={(id) => onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])}
      searchPlaceholder="Jahrgang suchen..."
      emptyText="Noch keine Jahrgänge angelegt"
      renderItem={(inst) => (
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{inst.award_name} {inst.year}</div>
          <div className="text-[10px] text-gray-400">{inst.status}</div>
        </div>
      )}
    />
  );
}

function MultiSelectPublishers({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/publishers`, { credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(result => { setPublishers(result.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-3 border rounded text-xs text-gray-400 text-center">Lade Verlage...</div>;

  return (
    <PickerList
      items={publishers}
      selectedIds={selectedIds}
      onToggle={(id) => onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])}
      searchPlaceholder="Verlag suchen..."
      emptyText="Keine Verlage vorhanden"
      renderItem={(pub) => (
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{pub.name}</div>
          {pub.description && <div className="text-[10px] text-gray-400 truncate">{pub.description}</div>}
        </div>
      )}
    />
  );
}

function ExcludeBooksPicker({ selectedIds, onChange }: { selectedIds: number[]; onChange: (ids: number[]) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/books/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data || []);
      }
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="p-2 bg-gray-50/80">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Buch suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-8 text-xs pl-8"
            />
          </div>
          <Button size="sm" className="h-8 px-2" onClick={handleSearch} disabled={loading}>
            <Search className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="max-h-44 overflow-y-auto divide-y divide-gray-100">
        {loading ? (
          <div className="px-3 py-4 text-xs text-gray-400 text-center">Suche...</div>
        ) : searchResults.length > 0 ? (
          searchResults.map(book => (
            <div
              key={book.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-sm ${
                selectedIds.includes(book.id) ? 'bg-red-50/70' : 'hover:bg-gray-50/80'
              }`}
              onClick={() => {
                if (selectedIds.includes(book.id)) {
                  onChange(selectedIds.filter(id => id !== book.id));
                } else {
                  onChange([...selectedIds, book.id]);
                }
              }}
            >
              <Checkbox checked={selectedIds.includes(book.id)} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{book.title}</div>
                <div className="text-[10px] text-gray-400 truncate">{book.author}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-3 py-4 text-xs text-gray-400 text-center">
            {searchQuery ? 'Keine Treffer' : 'Titel oder ISBN eingeben'}
          </div>
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="px-3 py-1.5 bg-red-50 text-[11px] text-red-700 font-medium border-t flex items-center justify-between">
          <span>{selectedIds.length} ausgeschlossen</span>
          <button type="button" onClick={() => onChange([])} className="text-red-500 hover:text-red-700">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
