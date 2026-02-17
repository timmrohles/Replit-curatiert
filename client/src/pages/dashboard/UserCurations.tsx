import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Trash2, X, Search, GripVertical, BookOpen, ChevronRight, ChevronLeft, ChevronDown, Sparkles, Hand, Tag, Minus, Check, Info, BadgeCheck, Heart } from 'lucide-react';
import { Text } from '@/components/ui/typography';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

const API_BASE = '/api';
const USER_ID = 'demo-user-123';

interface BookstoreProfileData {
  id: number;
  user_id: string;
  display_name: string;
  tagline: string | null;
  description: string | null;
  slug: string | null;
  avatar_url: string | null;
  hero_image_url: string | null;
  social_links: any;
  is_published: boolean;
}

interface Curation {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[];
  is_published: boolean;
  display_order: number;
  curation_type: 'manual' | 'dynamic';
  category_id: number | null;
  category_label: string | null;
  tag_rules: TagRules;
  created_at: string;
  updated_at: string;
}

interface TagRules {
  includeAll?: string[];
  includeAny?: string[];
  exclude?: string[];
}

interface BookResult {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  isbn13: string | null;
}

interface CurationCategory {
  id: number;
  name: string;
  label: string;
}

interface TagSuggestion {
  id: number;
  name: string;
  tag_type: string;
  displayName?: string;
  type?: string;
}

type WizardStep = 'type' | 'category' | 'details' | 'content' | 'review';

const WIZARD_STEPS: WizardStep[] = ['type', 'category', 'details', 'content', 'review'];

const STEP_INFO: Record<WizardStep, { title: string; subtitle: string }> = {
  type: {
    title: 'Kurationstyp wählen',
    subtitle: 'Entscheide, wie du deine Buchsammlung zusammenstellen möchtest.',
  },
  category: {
    title: 'Kategorie zuordnen',
    subtitle: 'Wähle eine Buchkategorie, zu der deine Kuration gehört. Bücher können nur aus dieser Kategorie gewählt werden.',
  },
  details: {
    title: 'Titel & Beschreibung',
    subtitle: 'Gib deiner Kuration einen aussagekräftigen Titel und eine Begründung, warum du diese Bücher empfiehlst.',
  },
  content: {
    title: 'Bücher auswählen',
    subtitle: '',
  },
  review: {
    title: 'Zusammenfassung',
    subtitle: 'Prüfe deine Kuration, bevor du sie speicherst.',
  },
};

function StepIndicator({ currentStep, steps }: { currentStep: WizardStep; steps: WizardStep[] }) {
  const currentIndex = steps.indexOf(currentStep);
  return (
    <div className="flex items-center justify-center gap-2 mb-6" data-testid="step-indicator">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all"
            style={{
              backgroundColor: idx <= currentIndex ? '#247ba0' : '#E5E7EB',
              color: idx <= currentIndex ? '#FFFFFF' : '#9CA3AF',
            }}
          >
            {idx < currentIndex ? <Check className="w-4 h-4" /> : idx + 1}
          </div>
          {idx < steps.length - 1 && (
            <div
              className="w-8 h-0.5 transition-all"
              style={{ backgroundColor: idx < currentIndex ? '#247ba0' : '#E5E7EB' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg mb-4" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#0284C7' }} />
      <Text as="span" variant="small" style={{ color: '#0369A1' }}>
        {text}
      </Text>
    </div>
  );
}

function TagSearchInput({
  label,
  helperText,
  selectedTags,
  onAdd,
  onRemove,
  tagColor,
  placeholder,
  testIdPrefix,
}: {
  label: string;
  helperText: string;
  selectedTags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  tagColor: string;
  placeholder: string;
  testIdPrefix: string;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/onix-tags?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.ok) {
          const allTags: TagSuggestion[] = data.data || [];
          const filtered = allTags.filter((t: TagSuggestion) =>
            (t.name || t.displayName || '').toLowerCase().includes(query.toLowerCase()) &&
            !selectedTags.includes(t.name || t.displayName || '')
          ).slice(0, 15);
          setSuggestions(filtered);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selectedTags]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tagName: string) => {
    onAdd(tagName);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim() && !selectedTags.includes(query.trim())) {
        handleAddTag(query.trim());
      }
    }
  };

  return (
    <div ref={containerRef}>
      <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
        {label}
      </label>
      <Text as="p" variant="small" className="mb-2" style={{ color: '#6B7280' }}>
        {helperText}
      </Text>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          data-testid={`${testIdPrefix}-search`}
          className="w-full pl-10 pr-4 py-2 rounded-lg border"
          style={{ borderColor: '#E5E7EB' }}
          placeholder={placeholder}
        />
        {showSuggestions && (suggestions.length > 0 || loading) && (
          <div className="absolute left-0 right-0 top-full mt-1 border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            {loading && <div className="px-3 py-2 text-xs" style={{ color: '#6B7280' }}>Suche...</div>}
            {suggestions.map(tag => (
              <button
                key={tag.id || tag.name}
                onClick={() => handleAddTag(tag.name || tag.displayName || '')}
                className="w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
                data-testid={`${testIdPrefix}-suggestion-${tag.id}`}
              >
                <span style={{ color: '#3A3A3A' }}>{tag.name || tag.displayName}</span>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>{tag.type || tag.tag_type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: tagColor }}
            >
              {tag}
              <button onClick={() => onRemove(tag)} data-testid={`${testIdPrefix}-remove-${tag}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface UserCurationsProps {
  onNavigateToTab?: (tab: string) => void;
}

export function UserCurations({ onNavigateToTab }: UserCurationsProps) {
  const [curations, setCurations] = useState<Curation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookstoreProfile, setBookstoreProfile] = useState<BookstoreProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [showWizard, setShowWizard] = useState(false);
  const [editingCuration, setEditingCuration] = useState<Curation | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>('type');

  const [curationType, setCurationType] = useState<'manual' | 'dynamic'>('manual');
  const [selectedCategory, setSelectedCategory] = useState<CurationCategory | null>(null);
  const [categories, setCategories] = useState<CurationCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<BookResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<BookResult[]>([]);

  const [tagRulesIncludeAll, setTagRulesIncludeAll] = useState<string[]>([]);
  const [tagRulesIncludeAny, setTagRulesIncludeAny] = useState<string[]>([]);
  const [tagRulesExclude, setTagRulesExclude] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [bookCounts, setBookCounts] = useState<Record<number, number>>({});
  const [curationBooks, setCurationBooks] = useState<Record<number, BookResult[]>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [resolvedBooks, setResolvedBooks] = useState<BookResult[]>([]);
  const [resolvingBooks, setResolvingBooks] = useState(false);
  const [derivedTags, setDerivedTags] = useState<string[]>([]);

  const fetchBookstoreProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const res = await fetch(`${API_BASE}/bookstore/profile?userId=${encodeURIComponent(USER_ID)}`);
      const data = await res.json();
      if (data.ok && data.data) {
        setBookstoreProfile(data.data);
      } else {
        setBookstoreProfile(null);
      }
    } catch {
      setBookstoreProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchCurations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/user-curations?userId=${encodeURIComponent(USER_ID)}`);
      const data = await res.json();
      if (data.ok) {
        setCurations(data.data || []);
        const counts: Record<number, number> = {};
        const allBooks: Record<number, BookResult[]> = {};
        for (const c of (data.data || [])) {
          try {
            const bRes = await fetch(`${API_BASE}/user-curations/${c.id}/books`);
            const bData = await bRes.json();
            const books = bData.ok ? (bData.data || []) : [];
            counts[c.id] = books.length;
            allBooks[c.id] = books.map((b: any) => ({
              id: b.id || b.book_id,
              title: b.title || '',
              author: b.author || '',
              cover_url: b.cover_url || b.cover || null,
              isbn13: b.isbn13 || null,
            }));
          } catch {
            counts[c.id] = 0;
            allBooks[c.id] = [];
          }
        }
        setBookCounts(counts);
        setCurationBooks(allBooks);
      } else {
        setError(data.error || 'Fehler beim Laden');
      }
    } catch {
      setError('Netzwerkfehler beim Laden der Kurationen');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/curation-categories`);
      const data = await res.json();
      if (data.ok) {
        setCategories(data.data || []);
      }
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => { fetchCurations(); fetchBookstoreProfile(); }, [fetchCurations, fetchBookstoreProfile]);

  const searchBooks = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setBookSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      let url = `${API_BASE}/books/search?q=${encodeURIComponent(q)}&limit=20`;
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory.name)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setBookSearchResults(data.data || []);
      }
    } catch {
      setBookSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [selectedCategory]);

  const resolveBooksByTags = useCallback(async () => {
    if (tagRulesIncludeAll.length === 0 && tagRulesIncludeAny.length === 0) {
      setResolvedBooks([]);
      return;
    }
    setResolvingBooks(true);
    try {
      const res = await fetch(`${API_BASE}/books/resolve-by-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeAll: tagRulesIncludeAll,
          includeAny: tagRulesIncludeAny,
          exclude: tagRulesExclude,
          category: selectedCategory?.name || null,
          limit: 50,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResolvedBooks(data.data || []);
      }
    } catch {
      setResolvedBooks([]);
    } finally {
      setResolvingBooks(false);
    }
  }, [tagRulesIncludeAll, tagRulesIncludeAny, tagRulesExclude, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => { searchBooks(bookSearchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [bookSearchQuery, searchBooks]);

  useEffect(() => {
    if (curationType === 'dynamic' && (tagRulesIncludeAll.length > 0 || tagRulesIncludeAny.length > 0)) {
      const timer = setTimeout(() => { resolveBooksByTags(); }, 500);
      return () => clearTimeout(timer);
    } else {
      setResolvedBooks([]);
    }
  }, [tagRulesIncludeAll, tagRulesIncludeAny, tagRulesExclude, curationType, resolveBooksByTags]);

  useEffect(() => {
    if (curationType === 'manual' && selectedBooks.length > 0) {
      const tagSet = new Set<string>();
      for (const book of selectedBooks) {
        if ((book as any).genre) tagSet.add((book as any).genre);
        if (Array.isArray((book as any).tags)) {
          for (const t of (book as any).tags) { if (t) tagSet.add(String(t)); }
        }
      }
      if (selectedCategory?.name) tagSet.add(selectedCategory.name);
      setDerivedTags(Array.from(tagSet).filter(Boolean));
    } else {
      setDerivedTags([]);
    }
  }, [selectedBooks, curationType, selectedCategory]);

  const resetWizard = () => {
    setWizardStep('type');
    setCurationType('manual');
    setSelectedCategory(null);
    setFormTitle('');
    setFormDescription('');
    setSelectedBooks([]);
    setBookSearchQuery('');
    setBookSearchResults([]);
    setTagRulesIncludeAll([]);
    setTagRulesIncludeAny([]);
    setTagRulesExclude([]);
    setEditingCuration(null);
    setResolvedBooks([]);
    setDerivedTags([]);
  };

  const openCreateWizard = () => {
    resetWizard();
    fetchCategories();
    setShowWizard(true);
  };

  const openEditWizard = async (curation: Curation) => {
    resetWizard();
    fetchCategories();
    setEditingCuration(curation);
    setCurationType(curation.curation_type || 'manual');
    setFormTitle(curation.title);
    setFormDescription(curation.description || '');

    if (curation.category_id && curation.category_label) {
      setSelectedCategory({ id: curation.category_id, name: curation.category_label, label: curation.category_label });
    }

    if (curation.tag_rules) {
      const rules = typeof curation.tag_rules === 'string' ? JSON.parse(curation.tag_rules) : curation.tag_rules;
      setTagRulesIncludeAll(rules.includeAll || []);
      setTagRulesIncludeAny(rules.includeAny || []);
      setTagRulesExclude(rules.exclude || []);
    }

    try {
      const res = await fetch(`${API_BASE}/user-curations/${curation.id}/books`);
      const data = await res.json();
      if (data.ok && data.data) {
        setSelectedBooks(data.data.map((b: any) => ({
          id: b.book_id || b.id,
          title: b.title || '',
          author: b.author || '',
          cover_url: b.cover_url || null,
          isbn13: b.isbn13 || null,
        })));
      }
    } catch {
      setSelectedBooks([]);
    }

    setWizardStep('details');
    setShowWizard(true);
  };

  const closeWizard = () => {
    setShowWizard(false);
    resetWizard();
  };

  const goNext = () => {
    const idx = WIZARD_STEPS.indexOf(wizardStep);
    if (idx < WIZARD_STEPS.length - 1) {
      setWizardStep(WIZARD_STEPS[idx + 1]);
    }
  };

  const goBack = () => {
    const idx = WIZARD_STEPS.indexOf(wizardStep);
    if (idx > 0) {
      setWizardStep(WIZARD_STEPS[idx - 1]);
    }
  };

  const canGoNext = (): boolean => {
    switch (wizardStep) {
      case 'type': return true;
      case 'category': return selectedCategory !== null;
      case 'details': return formTitle.trim().length > 0;
      case 'content': return curationType === 'manual' ? selectedBooks.length > 0 : (tagRulesIncludeAll.length > 0 || tagRulesIncludeAny.length > 0);
      case 'review': return true;
      default: return false;
    }
  };

  const addBook = (book: BookResult) => {
    if (!selectedBooks.some(b => b.id === book.id)) {
      setSelectedBooks([...selectedBooks, book]);
    }
  };

  const removeBook = (bookId: number) => {
    setSelectedBooks(selectedBooks.filter(b => b.id !== bookId));
  };

  const handleDragStart = (index: number) => { setDragIndex(index); };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newBooks = [...selectedBooks];
    const [moved] = newBooks.splice(dragIndex, 1);
    newBooks.splice(index, 0, moved);
    setSelectedBooks(newBooks);
    setDragIndex(index);
  };
  const handleDragEnd = () => { setDragIndex(null); };

  const saveCuration = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);

    const tagRules: TagRules = {};
    if (tagRulesIncludeAll.length > 0) tagRules.includeAll = tagRulesIncludeAll;
    if (tagRulesIncludeAny.length > 0) tagRules.includeAny = tagRulesIncludeAny;
    if (tagRulesExclude.length > 0) tagRules.exclude = tagRulesExclude;

    const allTags = curationType === 'manual'
      ? derivedTags
      : [...tagRulesIncludeAll, ...tagRulesIncludeAny];

    try {
      let curationId: number;

      if (editingCuration) {
        const res = await fetch(`${API_BASE}/user-curations/${editingCuration.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            tags: allTags,
            curation_type: curationType,
            category_id: selectedCategory?.id || null,
            category_label: selectedCategory?.name || selectedCategory?.label || null,
            tag_rules: tagRules,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        curationId = editingCuration.id;

        const existingRes = await fetch(`${API_BASE}/user-curations/${curationId}/books`);
        const existingData = await existingRes.json();
        const existingBookIds = (existingData.ok && existingData.data)
          ? existingData.data.map((b: any) => b.book_id || b.id)
          : [];

        for (const oldId of existingBookIds) {
          if (!selectedBooks.some(b => b.id === oldId)) {
            await fetch(`${API_BASE}/user-curations/${curationId}/books/${oldId}`, { method: 'DELETE' });
          }
        }

        for (const book of selectedBooks) {
          if (!existingBookIds.includes(book.id)) {
            await fetch(`${API_BASE}/user-curations/${curationId}/books`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookId: book.id }),
            });
          }
        }
      } else {
        const res = await fetch(`${API_BASE}/user-curations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: USER_ID,
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            tags: allTags,
            curation_type: curationType,
            category_id: selectedCategory?.id || null,
            category_label: selectedCategory?.name || selectedCategory?.label || null,
            tag_rules: tagRules,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        curationId = data.data.id;

        for (const book of selectedBooks) {
          await fetch(`${API_BASE}/user-curations/${curationId}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId: book.id }),
          });
        }
      }

      if (selectedBooks.length > 0) {
        await fetch(`${API_BASE}/user-curations/${curationId}/books/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookIds: selectedBooks.map(b => b.id) }),
        });
      }

      closeWizard();
      fetchCurations();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const deleteCuration = async (id: number) => {
    if (!confirm('Möchtest du diese Kuration wirklich löschen?')) return;
    try {
      const res = await fetch(`${API_BASE}/user-curations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        fetchCurations();
      } else {
        setError(data.error || 'Fehler beim Löschen');
      }
    } catch {
      setError('Netzwerkfehler beim Löschen');
    }
  };

  const togglePublished = async (curation: Curation) => {
    try {
      const res = await fetch(`${API_BASE}/user-curations/${curation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !curation.is_published }),
      });
      const data = await res.json();
      if (data.ok) { fetchCurations(); }
    } catch {
      setError('Fehler beim Aktualisieren');
    }
  };

  const profileComplete = bookstoreProfile && bookstoreProfile.display_name;

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#247ba0' }} />
      </div>
    );
  }

  const creatorName = profileComplete ? bookstoreProfile!.display_name : '';
  const creatorAvatar = profileComplete ? (bookstoreProfile!.avatar_url || '') : '';
  const creatorTagline = profileComplete ? (bookstoreProfile!.tagline || '') : '';

  const contentStepSubtitle = curationType === 'manual'
    ? 'Suche Bücher und füge sie deiner Kuration hinzu. Die Tags werden automatisch aus der Datenbank übernommen.'
    : 'Wähle Tags, um Bücher automatisch zusammenzustellen. Bücher werden basierend auf deinen Tag-Regeln und der Kategorie zugeordnet.';

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl mb-2 text-center" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }} data-testid="text-curations-heading">
          Meine Kurationen
        </h1>
        <p className="text-xs md:text-sm mb-4" style={{ color: '#6B7280' }}>
          Erstelle thematische Buchsammlungen für deinen Bookstore
        </p>
        {profileComplete ? (
          <button
            onClick={openCreateWizard}
            data-testid="button-new-curation"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg touch-manipulation"
            style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
          >
            <Plus className="w-5 h-5" />
            Neue Kuration
          </button>
        ) : (
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }} data-testid="notice-profile-required">
            <Text as="p" variant="small" style={{ color: '#92400E' }}>
              Um Kurationen zu erstellen, musst du zuerst dein Kurator:innen-Profil im Tab{' '}
              <button
                type="button"
                onClick={() => onNavigateToTab?.('profile')}
                className="underline font-semibold cursor-pointer"
                style={{ color: '#92400E' }}
                data-testid="link-go-to-profile"
              >
                Profil
              </button>
              {' '}ausfüllen.
            </Text>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}>
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Schließen</button>
        </div>
      )}

      {curations.length === 0 ? (
        <div className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
          <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Keine Kurationen
          </h3>
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
            Erstelle deine erste thematische Buchsammlung
          </p>
          <button
            onClick={openCreateWizard}
            data-testid="button-empty-new-curation"
            className="px-4 py-2 rounded-lg text-sm text-white"
            style={{ backgroundColor: '#247ba0' }}
          >
            Erste Kuration erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {curations.map((curation) => {
            const books = curationBooks[curation.id] || [];
            const isDescExpanded = expandedDescriptions[curation.id] || false;
            const characterLimit = 330;
            const shouldTruncateDesc = curation.description && curation.description.length > characterLimit;

            return (
              <section
                key={curation.id}
                data-testid={`card-curation-${curation.id}`}
                className="py-1 md:py-2 w-full px-4"
              >
                <div className="max-w-7xl mx-auto w-full">
                  <div className="w-full mb-4 md:mb-6">
                    <div className="w-full text-base leading-normal text-left">
                      {/* Creator Header - matches CreatorHeader.tsx */}
                      <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
                        {creatorName && (
                          <>
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-cerulean ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)]" data-testid={`img-avatar-${curation.id}`}>
                                {creatorAvatar ? (
                                  <ImageWithFallback
                                    src={creatorAvatar}
                                    alt={creatorName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#247ba0' }}>
                                    <span className="text-white font-bold text-xl">{creatorName[0]?.toUpperCase()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 self-center">
                              <div className="flex items-center gap-2 w-fit">
                                <div className="kuratorname flex items-center gap-1.5 text-cerulean" data-testid={`text-creator-name-${curation.id}`}>
                                  {creatorName}
                                  <BadgeCheck className="w-5 h-5 flex-shrink-0" style={{ color: '#247ba0' }} />
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                                <Text as="span" variant="small" className="font-semibold text-gray-500" data-testid={`text-creator-tagline-${curation.id}`}>
                                  {creatorTagline || 'Bookstore-Kurator*in'}
                                </Text>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => togglePublished(curation)}
                            data-testid={`button-toggle-publish-${curation.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs cursor-pointer"
                            style={curation.is_published
                              ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                              : { backgroundColor: '#FEF3C7', color: '#92400E' }
                            }
                          >
                            {curation.is_published ? 'Veröffentlicht' : 'Entwurf'}
                          </button>
                          <button
                            onClick={() => openEditWizard(curation)}
                            data-testid={`button-edit-curation-${curation.id}`}
                            className="p-2 rounded-lg transition-all"
                            style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCuration(curation.id)}
                            data-testid={`button-delete-curation-${curation.id}`}
                            className="p-2 rounded-lg transition-all"
                            style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Curation Title - section-title */}
                      <div className="w-full mt-4 md:mt-6 isolate">
                        <h3 className="section-title mb-4 text-foreground" data-testid={`text-curation-title-${curation.id}`}>
                          {curation.title}
                        </h3>
                      </div>

                      {/* Tag pills with hearts - matching CreatorHeader */}
                      <div className="w-full mt-4 mb-4">
                        <div className="flex gap-2 flex-wrap items-start">
                          {creatorName && (
                            <div
                              className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg select-none"
                              style={{ backgroundColor: 'var(--color-saffron, #D4A843)' }}
                              data-testid={`badge-creator-${curation.id}`}
                            >
                              <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                                {creatorName}
                              </Text>
                              <Heart className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}

                          {curation.category_label && (
                            <div
                              className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg bg-coral select-none"
                              data-testid={`badge-category-${curation.id}`}
                            >
                              <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                                {curation.category_label}
                              </Text>
                              <Heart className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}

                          {Array.isArray(curation.tags) && curation.tags.slice(0, 2).map((tag, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg bg-coral select-none"
                              data-testid={`tag-curation-${curation.id}-${idx}`}
                            >
                              <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                                {tag}
                              </Text>
                              <Heart className="w-3.5 h-3.5 text-white" />
                            </div>
                          ))}

                          <span
                            data-testid={`badge-type-${curation.id}`}
                            className="px-3 py-1.5 rounded-full text-xs inline-flex items-center"
                            style={{
                              backgroundColor: curation.curation_type === 'dynamic' ? '#EDE9FE' : '#DBEAFE',
                              color: curation.curation_type === 'dynamic' ? '#6D28D9' : '#1E40AF',
                            }}
                          >
                            {curation.curation_type === 'dynamic' ? 'Dynamisch' : 'Manuell'}
                          </span>
                        </div>
                      </div>

                      {/* Description with fade mask - matching CreatorHeader */}
                      {curation.description && (
                        <div className="w-full mt-4">
                          <Text
                            as="div"
                            variant="base"
                            style={
                              shouldTruncateDesc && !isDescExpanded
                                ? {
                                    maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                                    WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                                  }
                                : undefined
                            }
                            className={`leading-relaxed ${shouldTruncateDesc && !isDescExpanded ? 'line-clamp-3' : ''} text-black`}
                          >
                            {curation.description}
                          </Text>
                          {shouldTruncateDesc && (
                            <button
                              onClick={() => setExpandedDescriptions(prev => ({ ...prev, [curation.id]: !isDescExpanded }))}
                              className="flex items-center gap-1 mt-2 text-cerulean hover:opacity-80 transition-colors"
                              data-testid={`button-expand-desc-${curation.id}`}
                            >
                              <Text as="span" variant="small" className="text-cerulean !normal-case !tracking-normal !font-normal">
                                {isDescExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                              </Text>
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDescExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sort Chips - right-aligned, matching CreatorCarousel */}
                  {books.length > 0 && (
                    <div className="mb-4 md:mb-6">
                      <div className="relative flex justify-end">
                        <div
                          className="flex gap-2 overflow-x-auto max-w-full select-none overscroll-x-contain pr-6 md:pr-0"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                        >
                          {['Beliebtheit', 'Auszeichnungen', 'Independent', 'Hidden Gems', 'Aktuell'].map(chip => (
                            <button
                              key={chip}
                              className="sort-chip"
                              data-testid={`chip-sort-${chip.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <Text as="span" variant="xs" className="whitespace-nowrap !normal-case !tracking-normal !font-semibold">
                                {chip}
                              </Text>
                            </button>
                          ))}
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-10 pointer-events-none bg-gradient-to-l from-[var(--color-beige)] to-transparent md:hidden" />
                      </div>
                    </div>
                  )}

                  {/* Book Carousel - matching CreatorCarousel book layout */}
                  {books.length > 0 ? (
                    <div className="mb-4">
                      <div
                        className="flex -ml-4 overflow-x-auto pb-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                        data-testid={`carousel-curation-${curation.id}`}
                      >
                        {books.map(book => (
                          <div key={book.id} className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 pl-4" data-testid={`card-book-${book.id}`}>
                            <div className="group cursor-pointer">
                              <div className="pl-2 pb-2 pt-1 pr-1 md:pl-3 md:pb-3 md:pt-2 md:pr-2 relative">
                                <div
                                  className="relative aspect-[2/3] rounded-[1px] overflow-hidden"
                                  style={{
                                    border: '1px solid var(--color-border)',
                                    boxShadow: 'var(--shadow-book-cover, 2px 4px 12px rgba(0,0,0,0.08))',
                                  }}
                                >
                                  {book.cover_url ? (
                                    <img
                                      src={book.cover_url}
                                      alt={book.title}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      data-testid={`img-cover-${book.id}`}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                                      <BookOpen className="w-8 h-8" style={{ color: '#9CA3AF' }} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <BookOpen className="w-10 h-10 mx-auto mb-2" style={{ color: '#D1D5DB' }} />
                      <Text as="p" variant="small" style={{ color: '#9CA3AF' }}>
                        Noch keine Bücher in dieser Kuration
                      </Text>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
            data-testid="curation-wizard"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingCuration ? 'Kuration bearbeiten' : 'Neue Kuration'}
              </h2>
              <button onClick={closeWizard} data-testid="button-close-wizard" className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <StepIndicator currentStep={wizardStep} steps={WIZARD_STEPS} />

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#3A3A3A' }}>
                {STEP_INFO[wizardStep].title}
              </h3>
              <Text as="p" variant="small" style={{ color: '#6B7280' }}>
                {wizardStep === 'content' ? contentStepSubtitle : STEP_INFO[wizardStep].subtitle}
              </Text>
            </div>

            {wizardStep === 'type' && (
              <div className="space-y-3" data-testid="wizard-step-type">
                <InfoBox text="Manuelle Kurationen: Du wählst jedes Buch einzeln aus. Ideal, wenn du eine bestimmte Auswahl im Kopf hast. Dynamische Kurationen: Bücher werden automatisch anhand von Tags zusammengestellt und bleiben aktuell." />
                <button
                  onClick={() => setCurationType('manual')}
                  className="w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-4"
                  style={{
                    borderColor: curationType === 'manual' ? '#247ba0' : '#E5E7EB',
                    backgroundColor: curationType === 'manual' ? '#F0F9FF' : '#FFFFFF',
                  }}
                  data-testid="button-type-manual"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: curationType === 'manual' ? '#247ba0' : '#F3F4F6' }}>
                    <Hand className="w-6 h-6" style={{ color: curationType === 'manual' ? '#FFFFFF' : '#9CA3AF' }} />
                  </div>
                  <div>
                    <div className="font-semibold mb-1" style={{ color: '#3A3A3A' }}>Manuelle Kuration</div>
                    <Text as="p" variant="small" style={{ color: '#6B7280' }}>
                      Wähle jedes Buch einzeln aus deiner Kategorie. Tags werden automatisch aus der Datenbank übernommen.
                    </Text>
                  </div>
                </button>
                <button
                  onClick={() => setCurationType('dynamic')}
                  className="w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-4"
                  style={{
                    borderColor: curationType === 'dynamic' ? '#6D28D9' : '#E5E7EB',
                    backgroundColor: curationType === 'dynamic' ? '#FAF5FF' : '#FFFFFF',
                  }}
                  data-testid="button-type-dynamic"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: curationType === 'dynamic' ? '#6D28D9' : '#F3F4F6' }}>
                    <Sparkles className="w-6 h-6" style={{ color: curationType === 'dynamic' ? '#FFFFFF' : '#9CA3AF' }} />
                  </div>
                  <div>
                    <div className="font-semibold mb-1" style={{ color: '#3A3A3A' }}>Dynamische Kuration</div>
                    <Text as="p" variant="small" style={{ color: '#6B7280' }}>
                      Wähle Tags aus (Verlage, Autoren, Themen etc.) und Bücher werden automatisch zusammengestellt. Du kannst Tags mit UND/ODER kombinieren oder ausschließen.
                    </Text>
                  </div>
                </button>
              </div>
            )}

            {wizardStep === 'category' && (
              <div data-testid="wizard-step-category">
                <InfoBox text="Die Kategorie bestimmt, aus welchem Bereich Bücher für deine Kuration gewählt werden können. So bleibt deine Sammlung thematisch passend." />
                {categoriesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#247ba0' }} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className="p-3 rounded-lg border-2 text-left transition-all"
                        style={{
                          borderColor: selectedCategory?.id === cat.id ? '#247ba0' : '#E5E7EB',
                          backgroundColor: selectedCategory?.id === cat.id ? '#F0F9FF' : '#FFFFFF',
                        }}
                        data-testid={`button-category-${cat.id}`}
                      >
                        <div className="text-sm font-medium" style={{ color: selectedCategory?.id === cat.id ? '#247ba0' : '#3A3A3A' }}>
                          {cat.label || cat.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {wizardStep === 'details' && (
              <div className="space-y-4" data-testid="wizard-step-details">
                <InfoBox text="Der Titel erscheint als Überschrift deiner Kuration. Die Begründung erklärt deinen Leser:innen, warum du diese Bücher empfiehlst." />
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    data-testid="input-curation-title"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="z.B. Neue Bücher für Leseratten"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                    Begründungstext
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    data-testid="input-curation-description"
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="Warum diese Auswahl? Was verbindet die Bücher?"
                  />
                </div>
              </div>
            )}

            {wizardStep === 'content' && curationType === 'manual' && (
              <div data-testid="wizard-step-content-manual">
                <InfoBox text="Suche nach Büchern und füge sie deiner Kuration hinzu. Du kannst die Reihenfolge per Drag & Drop anpassen. Tags werden automatisch aus der Buchdatenbank übernommen." />
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                      Bücher suchen & hinzufügen
                    </label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                      <input
                        type="text"
                        value={bookSearchQuery}
                        onChange={e => setBookSearchQuery(e.target.value)}
                        data-testid="input-book-search"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border"
                        style={{ borderColor: '#E5E7EB' }}
                        placeholder={selectedCategory ? `In "${selectedCategory.name}" suchen...` : 'Buchtitel, Autor oder ISBN suchen...'}
                      />
                    </div>

                    {searchLoading && (
                      <div className="text-xs py-2" style={{ color: '#6B7280' }}>Suche...</div>
                    )}

                    {bookSearchResults.length > 0 && (
                      <div className="border rounded-lg max-h-48 overflow-y-auto mb-3" style={{ borderColor: '#E5E7EB' }}>
                        {bookSearchResults
                          .filter(b => !selectedBooks.some(s => s.id === b.id))
                          .slice(0, 10)
                          .map(book => (
                            <button
                              key={book.id}
                              onClick={() => addBook(book)}
                              data-testid={`button-add-book-${book.id}`}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                              style={{ borderColor: '#F3F4F6' }}
                            >
                              {book.cover_url ? (
                                <img src={book.cover_url} alt="" className="w-8 h-12 object-cover rounded flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-12 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                                  <BookOpen className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate" style={{ color: '#3A3A3A' }}>{book.title}</div>
                                <div className="text-xs truncate" style={{ color: '#6B7280' }}>{book.author}</div>
                              </div>
                              <Plus className="w-4 h-4 flex-shrink-0" style={{ color: '#247ba0' }} />
                            </button>
                          ))}
                      </div>
                    )}

                    {selectedBooks.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>
                          Ausgewählt ({selectedBooks.length})
                        </div>
                        <div className="space-y-1">
                          {selectedBooks.map((book, index) => (
                            <div
                              key={book.id}
                              data-testid={`selected-book-${book.id}`}
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={e => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                              style={{
                                borderColor: '#E5E7EB',
                                backgroundColor: dragIndex === index ? '#F0F9FF' : '#FFFFFF',
                              }}
                            >
                              <GripVertical className="w-4 h-4 flex-shrink-0 cursor-grab" style={{ color: '#9CA3AF' }} />
                              {book.cover_url ? (
                                <img src={book.cover_url} alt="" className="w-6 h-9 object-cover rounded flex-shrink-0" />
                              ) : (
                                <div className="w-6 h-9 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                                  <BookOpen className="w-3 h-3" style={{ color: '#9CA3AF' }} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs truncate" style={{ color: '#3A3A3A' }}>{book.title}</div>
                                <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>{book.author}</div>
                              </div>
                              <button
                                onClick={() => removeBook(book.id)}
                                data-testid={`button-remove-book-${book.id}`}
                                className="p-1 rounded hover:bg-gray-100 flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 'content' && curationType === 'dynamic' && (
              <div className="space-y-5" data-testid="wizard-step-content-dynamic">
                <InfoBox text="Kombiniere Tags, um Bücher automatisch zusammenzustellen. UND-Tags: Alle müssen zutreffen. ODER-Tags: Mindestens einer muss zutreffen. Ausschluss-Tags: Diese Bücher werden herausgefiltert." />

                <TagSearchInput
                  label="UND-Tags (alle müssen zutreffen)"
                  helperText="Bücher müssen ALLE diese Tags haben. Z.B. 'Roman' UND 'Familiengeschichte' zeigt nur Bücher, die beides sind."
                  selectedTags={tagRulesIncludeAll}
                  onAdd={tag => setTagRulesIncludeAll([...tagRulesIncludeAll, tag])}
                  onRemove={tag => setTagRulesIncludeAll(tagRulesIncludeAll.filter(t => t !== tag))}
                  tagColor="#247ba0"
                  placeholder="Tag suchen (z.B. Verlag, Autor, Thema)..."
                  testIdPrefix="tag-and"
                />

                <TagSearchInput
                  label="ODER-Tags (mindestens einer muss zutreffen)"
                  helperText="Bücher müssen MINDESTENS EINEN dieser Tags haben. Z.B. 'Krimi' ODER 'Thriller' zeigt Bücher aus beiden Bereichen."
                  selectedTags={tagRulesIncludeAny}
                  onAdd={tag => setTagRulesIncludeAny([...tagRulesIncludeAny, tag])}
                  onRemove={tag => setTagRulesIncludeAny(tagRulesIncludeAny.filter(t => t !== tag))}
                  tagColor="#059669"
                  placeholder="Tag suchen..."
                  testIdPrefix="tag-or"
                />

                <TagSearchInput
                  label="Ausschluss-Tags (diese werden herausgefiltert)"
                  helperText="Bücher mit diesen Tags werden NICHT in der Kuration angezeigt. Nützlich, um bestimmte Themen oder Verlage auszuschließen."
                  selectedTags={tagRulesExclude}
                  onAdd={tag => setTagRulesExclude([...tagRulesExclude, tag])}
                  onRemove={tag => setTagRulesExclude(tagRulesExclude.filter(t => t !== tag))}
                  tagColor="#DC2626"
                  placeholder="Tag suchen..."
                  testIdPrefix="tag-exclude"
                />

                {(tagRulesIncludeAll.length > 0 || tagRulesIncludeAny.length > 0) && (
                  <div className="pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
                    <div className="flex items-center justify-between mb-2">
                      <Text as="span" variant="small" className="font-medium" style={{ color: '#3A3A3A' }}>
                        Vorschau: Passende Bücher
                      </Text>
                      <button
                        onClick={resolveBooksByTags}
                        disabled={resolvingBooks}
                        data-testid="button-resolve-preview"
                        className="px-3 py-1.5 rounded-lg text-xs text-white transition-all disabled:opacity-50"
                        style={{ backgroundColor: '#6D28D9' }}
                      >
                        {resolvingBooks ? 'Suche...' : 'Bücher laden'}
                      </button>
                    </div>
                    {resolvingBooks && (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#6D28D9' }} />
                      </div>
                    )}
                    {!resolvingBooks && resolvedBooks.length > 0 && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        <Text as="p" variant="small" className="mb-2" style={{ color: '#059669' }}>
                          {resolvedBooks.length} Bücher gefunden
                        </Text>
                        {resolvedBooks.slice(0, 10).map(book => (
                          <div key={book.id} className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ backgroundColor: '#FAF5FF' }}>
                            {book.cover_url ? (
                              <img src={book.cover_url} alt="" className="w-6 h-9 object-cover rounded flex-shrink-0" />
                            ) : (
                              <div className="w-6 h-9 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                                <BookOpen className="w-3 h-3" style={{ color: '#9CA3AF' }} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs truncate" style={{ color: '#3A3A3A' }}>{book.title}</div>
                              <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>{book.author}</div>
                            </div>
                          </div>
                        ))}
                        {resolvedBooks.length > 10 && (
                          <Text as="p" variant="small" style={{ color: '#6B7280' }}>+ {resolvedBooks.length - 10} weitere</Text>
                        )}
                      </div>
                    )}
                    {!resolvingBooks && resolvedBooks.length === 0 && (tagRulesIncludeAll.length > 0 || tagRulesIncludeAny.length > 0) && (
                      <Text as="p" variant="small" style={{ color: '#6B7280' }}>
                        Klicke auf "Bücher laden", um passende Bücher anzuzeigen.
                      </Text>
                    )}
                  </div>
                )}
              </div>
            )}

            {wizardStep === 'review' && (
              <div className="space-y-4" data-testid="wizard-step-review">
                <InfoBox text="Prüfe alle Angaben. Nach dem Speichern kannst du die Kuration jederzeit bearbeiten oder veröffentlichen." />

                {/* CreatorCarousel-style Preview */}
                {(() => {
                  const previewBooks = curationType === 'manual' ? selectedBooks : resolvedBooks;
                  if (previewBooks.length === 0) return null;
                  return (
                    <div className="rounded-lg overflow-hidden mb-4" style={{ backgroundColor: '#FAFAF8', border: '1px solid #E5E7EB' }}>
                      <div className="px-4 pt-4 pb-2">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#247ba0' }}>
                            {(formTitle || 'K')[0].toUpperCase()}
                          </div>
                          <div>
                            <Text as="span" variant="small" className="font-semibold" style={{ color: '#3A3A3A' }}>{formTitle || 'Meine Kuration'}</Text>
                            {selectedCategory?.name && (
                              <Text as="div" variant="xs" style={{ color: '#6B7280' }}>{selectedCategory.name}</Text>
                            )}
                          </div>
                        </div>
                        {formDescription && (
                          <Text as="p" variant="xs" className="mt-1 line-clamp-2" style={{ color: '#6B7280' }}>
                            {formDescription}
                          </Text>
                        )}
                      </div>
                      <div
                        className="flex gap-3 overflow-x-auto px-4 pb-4 pt-1"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                        data-testid="preview-carousel"
                      >
                        {previewBooks.slice(0, 10).map(book => (
                          <div key={book.id} className="flex-shrink-0" style={{ width: '100px' }}>
                            <div className="relative rounded-sm overflow-hidden" style={{ aspectRatio: '2/3', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                              {book.cover_url ? (
                                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                                  <BookOpen className="w-6 h-6" style={{ color: '#9CA3AF' }} />
                                </div>
                              )}
                            </div>
                            <Text as="div" variant="xs" className="mt-1 font-medium truncate" style={{ color: '#3A3A3A' }}>{book.title}</Text>
                            <Text as="div" variant="xs" className="truncate" style={{ color: '#6B7280' }}>{book.author}</Text>
                          </div>
                        ))}
                        {previewBooks.length > 10 && (
                          <div className="flex-shrink-0 flex items-center justify-center rounded-sm" style={{ width: '100px', aspectRatio: '2/3', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                            <Text as="span" variant="small" className="font-medium" style={{ color: '#6B7280' }}>+{previewBooks.length - 10}</Text>
                          </div>
                        )}
                      </div>
                      <div className="px-4 pb-3 flex items-center justify-between">
                        <Text as="span" variant="xs" style={{ color: '#9CA3AF' }}>Vorschau · {previewBooks.length} {previewBooks.length === 1 ? 'Buch' : 'Bücher'}</Text>
                        {(derivedTags.length > 0 || tagRulesIncludeAll.length > 0 || tagRulesIncludeAny.length > 0) && (
                          <div className="flex gap-1 flex-wrap justify-end max-w-[60%]">
                            {(curationType === 'manual' ? derivedTags.slice(0, 3) : [...tagRulesIncludeAll, ...tagRulesIncludeAny].slice(0, 3)).map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="rounded-lg p-4" style={{ backgroundColor: '#F9FAFB' }}>
                  <div className="space-y-3">
                    <div>
                      <Text as="span" variant="small" className="font-medium" style={{ color: '#6B7280' }}>Typ</Text>
                      <div className="flex items-center gap-2 mt-1">
                        {curationType === 'manual' ? <Hand className="w-4 h-4" style={{ color: '#247ba0' }} /> : <Sparkles className="w-4 h-4" style={{ color: '#6D28D9' }} />}
                        <span className="text-sm" style={{ color: '#3A3A3A' }}>{curationType === 'manual' ? 'Manuelle Kuration' : 'Dynamische Kuration'}</span>
                      </div>
                    </div>

                    <div>
                      <Text as="span" variant="small" className="font-medium" style={{ color: '#6B7280' }}>Kategorie</Text>
                      <div className="text-sm mt-1" style={{ color: '#3A3A3A' }}>{selectedCategory?.name || selectedCategory?.label || '–'}</div>
                    </div>

                    <div>
                      <Text as="span" variant="small" className="font-medium" style={{ color: '#6B7280' }}>Titel</Text>
                      <div className="text-sm font-semibold mt-1" style={{ color: '#3A3A3A' }}>{formTitle || '–'}</div>
                    </div>

                    {formDescription && (
                      <div>
                        <Text as="span" variant="small" className="font-medium" style={{ color: '#6B7280' }}>Begründung</Text>
                        <div className="text-sm mt-1" style={{ color: '#3A3A3A' }}>{formDescription}</div>
                      </div>
                    )}

                    {curationType === 'manual' && (
                      <div>
                        <Text as="span" variant="small" className="font-medium" style={{ color: '#6B7280' }}>Bücher</Text>
                        <div className="text-sm mt-1" style={{ color: '#3A3A3A' }}>{selectedBooks.length} Bücher ausgewählt</div>
                        {derivedTags.length > 0 && (
                          <div className="mt-2">
                            <Text as="span" variant="small" className="font-medium" style={{ color: '#6B7280' }}>Automatisch abgeleitete Tags</Text>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {derivedTags.map(t => (
                                <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedBooks.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {selectedBooks.slice(0, 5).map(book => (
                              <div key={book.id} className="flex items-center gap-2">
                                {book.cover_url ? (
                                  <img src={book.cover_url} alt="" className="w-5 h-7 object-cover rounded flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-7 rounded flex-shrink-0" style={{ backgroundColor: '#F3F4F6' }} />
                                )}
                                <span className="text-xs truncate" style={{ color: '#3A3A3A' }}>{book.title}</span>
                              </div>
                            ))}
                            {selectedBooks.length > 5 && (
                              <Text as="span" variant="small" style={{ color: '#6B7280' }}>+ {selectedBooks.length - 5} weitere</Text>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {curationType === 'dynamic' && (
                      <div>
                        <Text as="span" variant="small" className="font-medium" style={{ color: '#6B7280' }}>Tag-Regeln</Text>
                        {resolvedBooks.length > 0 && (
                          <div className="text-sm mt-1" style={{ color: '#059669' }}>
                            {resolvedBooks.length} Bücher werden automatisch zugeordnet
                          </div>
                        )}
                        <div className="mt-2 space-y-2">
                          {tagRulesIncludeAll.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-xs font-medium" style={{ color: '#247ba0' }}>UND:</span>
                              {tagRulesIncludeAll.map(t => (
                                <span key={t} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#247ba0' }}>{t}</span>
                              ))}
                            </div>
                          )}
                          {tagRulesIncludeAny.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-xs font-medium" style={{ color: '#059669' }}>ODER:</span>
                              {tagRulesIncludeAny.map(t => (
                                <span key={t} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#059669' }}>{t}</span>
                              ))}
                            </div>
                          )}
                          {tagRulesExclude.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-xs font-medium" style={{ color: '#DC2626' }}>Ausschluss:</span>
                              {tagRulesExclude.map(t => (
                                <span key={t} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#DC2626' }}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-6 mt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
              {wizardStep !== 'type' && (
                <button
                  onClick={goBack}
                  data-testid="button-wizard-back"
                  className="flex items-center gap-1.5 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Zurück
                </button>
              )}
              <div className="flex-1" />
              {wizardStep === 'type' && (
                <button
                  onClick={closeWizard}
                  data-testid="button-cancel"
                  className="px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                >
                  Abbrechen
                </button>
              )}
              {wizardStep !== 'review' ? (
                <button
                  onClick={goNext}
                  disabled={!canGoNext()}
                  data-testid="button-wizard-next"
                  className="flex items-center gap-1.5 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                >
                  Weiter
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={saveCuration}
                  disabled={saving}
                  data-testid="button-save-curation"
                  className="flex items-center gap-1.5 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                >
                  {saving ? 'Speichern...' : (editingCuration ? 'Aktualisieren' : 'Kuration erstellen')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
