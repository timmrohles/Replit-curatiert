/**
 * ==================================================================
 * ADMIN AWARDS (NEON) - 4-Tier Hierarchy Manager
 * ==================================================================
 * 
 * Vollständige CRUD-Verwaltung für Awards-System:
 * - Awards (z.B. "Deutscher Buchpreis")
 * - Editions (z.B. 2025)
 * - Outcomes (z.B. Winner, Shortlist, Longlist)
 * - Recipients (Book oder Person)
 * 
 * Features:
 * - Verschachtelte Navigation (Awards → Editions → Outcomes → Recipients)
 * - Search & Filter
 * - Recipient Type Selector (book/person)
 * - Book/Person Autocomplete
 * - Robust gegen große Datenmengen
 * 
 * UI: PROJECT_STANDARDS.md konform
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import { getAdminToken } from '../../utils/adminToken';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  ChevronRight,
  Award as AwardIcon,
  Calendar,
  Trophy,
  BookOpen,
  User,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Check,
  ArrowUpDown,
  Filter,
  Clock,
  Globe
} from 'lucide-react';
// TYPES
// ==================================================================

interface TagOption {
  id: number;
  name: string;
  slug: string;
}

interface Award {
  id: number;
  name: string;
  slug: string;
  issuer_name?: string;
  website_url?: string;
  description?: string;
  logo_url?: string;
  country?: string;
  award_type?: string;
  genre?: string;
  linked_award_types?: TagOption[];
  linked_award_genres?: TagOption[];
  editions_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface AwardFacets {
  countries: string[];
}

interface Edition {
  id: number;
  award_id: number;
  year: number;
  theme?: string;
  notes?: string;
  outcomes_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface Outcome {
  id: number;
  award_edition_id: number;
  name: string;
  display_order: number;
  result_status: string;
  announced_at?: string;
  notes?: string;
  recipients_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface Recipient {
  id: number;
  award_outcome_id: number;
  recipient_kind: 'book' | 'person';
  book_id?: string;
  person_id?: string;
  notes?: string;
  book_title?: string;
  book_author?: string;
  person_name?: string;
  created_at?: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn13?: string;
}

interface Person {
  id: string;
  name: string;
  bio?: string;
}

// ==================================================================
// COMPONENT
// ==================================================================

interface AdminAwardsNeonProps {
  initialAwardId?: number | null;
}

export function AdminAwardsNeon({ initialAwardId }: AdminAwardsNeonProps = {}) {
  const [view, setView] = useState<'awards' | 'editions' | 'outcomes' | 'recipients' | 'persons'>('awards');
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [pendingAwardId, setPendingAwardId] = useState<number | null>(initialAwardId || null);
  const [selectedEdition, setSelectedEdition] = useState<Edition | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);

  // Data
  const [awards, setAwards] = useState<Award[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Awards Filter/Sort
  const [sortBy, setSortBy] = useState<string>('name');
  const [filterTypeTagId, setFilterTypeTagId] = useState<string>('');
  const [filterGenreTagId, setFilterGenreTagId] = useState<string>('');
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [facets, setFacets] = useState<AwardFacets>({ countries: [] });

  // Tag options for multi-select
  const [availableTypes, setAvailableTypes] = useState<TagOption[]>([]);
  const [availableGenres, setAvailableGenres] = useState<TagOption[]>([]);

  // Editing tag selections
  const [editingTypeTagIds, setEditingTypeTagIds] = useState<number[]>([]);
  const [editingGenreTagIds, setEditingGenreTagIds] = useState<number[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newGenreName, setNewGenreName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  // Edit Modals
  const [editingAward, setEditingAward] = useState<Partial<Award> | null>(null);
  const [editingEdition, setEditingEdition] = useState<Partial<Edition> | null>(null);
  const [editingOutcome, setEditingOutcome] = useState<Partial<Outcome> | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<Partial<Recipient> | null>(null);

  // Book/Person Search
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<Book[]>([]);
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [personSearchResults, setPersonSearchResults] = useState<Person[]>([]);
  const [recipientType, setRecipientType] = useState<'book' | 'person'>('book');

  // Persons Management
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [personsTotal, setPersonsTotal] = useState(0);
  const [personsOffset, setPersonsOffset] = useState(0);
  const [personsSearch, setPersonsSearch] = useState('');
  const [editingPerson, setEditingPerson] = useState<{ name: string; bio?: string; id?: string } | null>(null);
  const [creatingPersonInline, setCreatingPersonInline] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  // ==================================================================
  // API HELPERS
  // ==================================================================

  const API_BASE = '/api';

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getAdminToken();
    if (token) headers['x-admin-token'] = token;
    return headers;
  };

  const extractError = (err: unknown): string => {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      if ('message' in err && typeof (err as any).message === 'string') return (err as any).message;
      if ('code' in err && typeof (err as any).code === 'string') return (err as any).code;
      return JSON.stringify(err);
    }
    return String(err);
  };

  // ==================================================================
  // LOAD DATA
  // ==================================================================

  useEffect(() => {
    if (view === 'awards') loadAwards();
  }, [view, searchQuery, sortBy, filterTypeTagId, filterGenreTagId, filterCountry]);

  useEffect(() => {
    loadTagOptions();
  }, []);

  useEffect(() => {
    if (pendingAwardId && awards.length > 0) {
      const found = awards.find(a => a.id === pendingAwardId);
      if (found) {
        setSelectedAward(found);
        setView('editions');
        setPendingAwardId(null);
      }
    }
  }, [pendingAwardId, awards]);

  useEffect(() => {
    if (initialAwardId && initialAwardId !== pendingAwardId) {
      setPendingAwardId(initialAwardId);
      if (view !== 'awards') {
        setView('awards');
      }
    }
  }, [initialAwardId]);

  useEffect(() => {
    if (view === 'editions' && selectedAward) loadEditions(selectedAward.id);
  }, [view, selectedAward]);

  useEffect(() => {
    if (view === 'outcomes' && selectedEdition) loadOutcomes(selectedEdition.id);
  }, [view, selectedEdition]);

  useEffect(() => {
    if (view === 'recipients' && selectedOutcome) loadRecipients(selectedOutcome.id);
  }, [view, selectedOutcome]);

  async function loadTagOptions() {
    try {
      const response = await fetch(`${API_BASE}/awards/tag-options`, { credentials: 'include', headers: getHeaders() });
      const data = await response.json();
      if (data.ok) {
        setAvailableTypes(data.award_types || []);
        setAvailableGenres(data.award_genres || []);
      }
    } catch (err) {
      // silent fail
    }
  }

  async function createTag(name: string, linkType: 'award_type' | 'award_genre'): Promise<TagOption | null> {
    setCreatingTag(true);
    try {
      const response = await fetch(`${API_BASE}/awards/ensure-tag`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify({ name, link_type: linkType }),
      });
      const data = await response.json();
      if (data.success && data.tag) {
        await loadTagOptions();
        return data.tag;
      }
      return null;
    } catch (err) {
      setError(String(err));
      return null;
    } finally {
      setCreatingTag(false);
    }
  }

  async function loadAwards() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);
      if (filterTypeTagId) params.append('award_type_tag_id', filterTypeTagId);
      if (filterGenreTagId) params.append('genre_tag_id', filterGenreTagId);
      if (filterCountry) params.append('country', filterCountry);
      const response = await fetch(`${API_BASE}/awards?${params}`, { credentials: 'include', headers: getHeaders() });
      const data = await response.json();
      if (data.ok || data.success) {
        setAwards(Array.isArray(data.data) ? data.data : []);
        if (data.facets) setFacets(data.facets);
      } else {
        setError(extractError(data.error) || 'Failed to load awards');
      }
    } catch (err) {
      setError(String(err));
      setAwards([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadEditions(awardId: number) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/awards/${awardId}/editions`, { credentials: 'include', headers: getHeaders() });
      const data = await response.json();
      if (data.success) {
        // ✅ CRASH-SAFE: Ensure editions is always an array
        setEditions(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(extractError(data.error) || 'Failed to load editions');
      }
    } catch (err) {
      setError(String(err));
      setEditions([]); // ✅ CRASH-SAFE: Set empty array on error
    } finally {
      setLoading(false);
    }
  }

  async function loadOutcomes(editionId: number) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/awards/${selectedAward!.id}/editions/${editionId}/outcomes`,
        { credentials: 'include', headers: getHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        // ✅ CRASH-SAFE: Ensure outcomes is always an array
        setOutcomes(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(extractError(data.error) || 'Failed to load outcomes');
      }
    } catch (err) {
      setError(String(err));
      setOutcomes([]); // ✅ CRASH-SAFE: Set empty array on error
    } finally {
      setLoading(false);
    }
  }

  async function loadRecipients(outcomeId: number) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/awards/${selectedAward!.id}/editions/${selectedEdition!.id}/outcomes/${outcomeId}/recipients`,
        { credentials: 'include', headers: getHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        // ✅ CRASH-SAFE: Ensure recipients is always an array
        setRecipients(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(extractError(data.error) || 'Failed to load recipients');
      }
    } catch (err) {
      setError(String(err));
      setRecipients([]); // ✅ CRASH-SAFE: Set empty array on error
    } finally {
      setLoading(false);
    }
  }

  // ==================================================================
  // SAVE FUNCTIONS
  // ==================================================================

  async function saveAward() {
    // ✅ FIX: Only name is required - backend auto-generates slug
    if (!editingAward?.name || !editingAward.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...editingAward,
        award_type_tag_ids: editingTypeTagIds,
        award_genre_tag_ids: editingGenreTagIds,
      };
      const response = await fetch(`${API_BASE}/awards`, {
          method: 'POST',
          credentials: 'include',
          headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Auszeichnung gespeichert');
        setEditingAward(null);
        setEditingTypeTagIds([]);
        setEditingGenreTagIds([]);
        loadAwards();
      } else {
        setError(extractError(data.error) || 'Failed to save award');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveEdition() {
    if (!editingEdition?.year) {
      setError('Year is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/awards/${selectedAward!.id}/editions`,
        {
          method: 'POST',
          credentials: 'include',
          headers: getHeaders(),
          body: JSON.stringify(editingEdition)
        }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess('Edition saved successfully');
        setEditingEdition(null);
        loadEditions(selectedAward!.id);
      } else {
        setError(extractError(data.error) || 'Failed to save edition');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveOutcome() {
    if (!editingOutcome?.name) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/awards/${selectedAward!.id}/editions/${selectedEdition!.id}/outcomes`,
        {
          method: 'POST',
          credentials: 'include',
          headers: getHeaders(),
          body: JSON.stringify(editingOutcome)
        }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess('Outcome saved successfully');
        setEditingOutcome(null);
        loadOutcomes(selectedEdition!.id);
      } else {
        setError(extractError(data.error) || 'Failed to save outcome');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveRecipient() {
    if (!editingRecipient?.recipient_kind) {
      setError('Recipient type is required');
      return;
    }

    if (editingRecipient.recipient_kind === 'book' && !editingRecipient.book_id) {
      setError('Please select a book');
      return;
    }

    if (editingRecipient.recipient_kind === 'person' && !editingRecipient.person_id) {
      setError('Please select a person');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/awards/${selectedAward!.id}/editions/${selectedEdition!.id}/outcomes/${selectedOutcome!.id}/recipients`,
        {
          method: 'POST',
          credentials: 'include',
          headers: getHeaders(),
          body: JSON.stringify(editingRecipient)
        }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess('Recipient saved successfully');
        setEditingRecipient(null);
        loadRecipients(selectedOutcome!.id);
      } else {
        setError(extractError(data.error) || 'Failed to save recipient');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // ==================================================================
  // DELETE FUNCTIONS
  // ==================================================================

  async function deleteAward(id: number) {
    if (!confirm('Delete this award? All editions, outcomes, and recipients will be deleted.')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/awards/${id}`, { method: 'DELETE', credentials: 'include', headers: getHeaders() });
      const data = await response.json();
      if (data.success) {
        setSuccess('Award deleted');
        loadAwards();
      } else {
        setError(extractError(data.error) || 'Failed to delete award');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteEdition(id: number) {
    if (!confirm('Delete this edition? All outcomes and recipients will be deleted.')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/awards/${selectedAward!.id}/editions/${id}`,
        { method: 'DELETE', credentials: 'include', headers: getHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess('Edition deleted');
        loadEditions(selectedAward!.id);
      } else {
        setError(extractError(data.error) || 'Failed to delete edition');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteOutcome(id: number) {
    if (!confirm('Delete this outcome? All recipients will be deleted.')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/awards/${selectedAward!.id}/editions/${selectedEdition!.id}/outcomes/${id}`,
        { method: 'DELETE', credentials: 'include', headers: getHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess('Outcome deleted');
        loadOutcomes(selectedEdition!.id);
      } else {
        setError(extractError(data.error) || 'Failed to delete outcome');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecipient(id: number) {
    if (!confirm('Delete this recipient?')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/awards/${selectedAward!.id}/editions/${selectedEdition!.id}/outcomes/${selectedOutcome!.id}/recipients/${id}`,
        { method: 'DELETE', credentials: 'include', headers: getHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess('Recipient deleted');
        loadRecipients(selectedOutcome!.id);
      } else {
        setError(extractError(data.error) || 'Failed to delete recipient');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // ==================================================================
  // SEARCH BOOKS/PERSONS
  // ==================================================================

  async function searchBooks(query: string) {
    if (query.length < 2) {
      setBookSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/books?search=${encodeURIComponent(query)}&limit=10`,
        { credentials: 'include', headers: getHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        // ✅ CRASH-SAFE: Ensure search results is always an array
        setBookSearchResults(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error('Book search error:', err);
      setBookSearchResults([]); // ✅ CRASH-SAFE: Set empty array on error
    }
  }

  async function searchPersons(query: string) {
    if (query.length < 2) {
      setPersonSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/persons/search`,
        {
          method: 'POST',
          credentials: 'include',
          headers: getHeaders(),
          body: JSON.stringify({ query, limit: 10 })
        }
      );
      const data = await response.json();
      if (data.success) {
        // ✅ CRASH-SAFE: Ensure search results is always an array
        setPersonSearchResults(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error('Person search error:', err);
      setPersonSearchResults([]); // ✅ CRASH-SAFE: Set empty array on error
    }
  }

  // ==================================================================
  // PERSONS MANAGEMENT
  // ==================================================================

  async function loadPersons() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (personsSearch) params.append('search', personsSearch);
      params.append('limit', '50');
      params.append('offset', String(personsOffset));
      const response = await fetch(`${API_BASE}/persons?${params}`, { credentials: 'include', headers: getHeaders() });
      const data = await response.json();
      if (data.success || data.ok) {
        setAllPersons(Array.isArray(data.data) ? data.data : []);
        setPersonsTotal(data.total || data.data?.length || 0);
      } else {
        setError(extractError(data.error) || 'Fehler beim Laden der Personen');
      }
    } catch (err) {
      setError(String(err));
      setAllPersons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (view === 'persons') {
      setPersonsOffset(0);
      loadPersons();
    }
  }, [view]);

  useEffect(() => {
    if (view === 'persons') loadPersons();
  }, [personsOffset, personsSearch]);

  async function savePerson() {
    if (!editingPerson?.name?.trim()) {
      setError('Name ist erforderlich');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/persons`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(editingPerson)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(editingPerson.id ? 'Person aktualisiert' : 'Person erstellt');
        setEditingPerson(null);
        loadPersons();
      } else {
        setError(extractError(data.error) || 'Fehler beim Speichern');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function deletePerson(id: string) {
    if (!confirm('Person wirklich löschen? Zugehörige Preiszuordnungen werden ebenfalls entfernt.')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/persons/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Person gelöscht');
        loadPersons();
      } else {
        setError(extractError(data.error) || 'Fehler beim Löschen');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function createPersonInline(name: string): Promise<Person | null> {
    try {
      const response = await fetch(`${API_BASE}/persons`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ==================================================================
  // BREADCRUMB NAVIGATION
  // ==================================================================

  function renderBreadcrumb() {
    return (
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button
          onClick={() => {
            setView('awards');
            setSelectedAward(null);
            setSelectedEdition(null);
            setSelectedOutcome(null);
          }}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <AwardIcon className="w-4 h-4" />
          Awards
        </button>

        {selectedAward && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => {
                setView('editions');
                setSelectedEdition(null);
                setSelectedOutcome(null);
              }}
              className={view === 'editions' ? 'font-semibold' : 'text-blue-600 hover:text-blue-800'}
            >
              {selectedAward.name}
            </button>
          </>
        )}

        {selectedEdition && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => {
                setView('outcomes');
                setSelectedOutcome(null);
              }}
              className={view === 'outcomes' ? 'font-semibold' : 'text-blue-600 hover:text-blue-800'}
            >
              {selectedEdition.year}
            </button>
          </>
        )}

        {selectedOutcome && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">{selectedOutcome.name}</span>
          </>
        )}
      </div>
    );
  }

  // ==================================================================
  // RENDER VIEWS
  // ==================================================================

  function renderAwards() {
    const safeAwards = Array.isArray(awards) ? awards : [];
    const activeFilterCount = [filterTypeTagId, filterGenreTagId, filterCountry].filter(Boolean).length;

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Auszeichnungen</h2>
            <p className="text-sm text-gray-500 mt-1">{safeAwards.length} Ergebnisse</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('persons')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              data-testid="button-manage-persons"
            >
              <User className="w-4 h-4" />
              Personen
            </button>
            <button
              onClick={() => {
                setEditingAward({ name: '', slug: '' });
                setEditingTypeTagIds([]);
                setEditingGenreTagIds([]);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              data-testid="button-new-award"
            >
              <Plus className="w-4 h-4" />
              Neue Auszeichnung
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Auszeichnung suchen (Name, Slug, Herausgeber)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              data-testid="input-search-awards"
            />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              data-testid="select-sort-awards"
            >
              <option value="name">Name A–Z</option>
              <option value="updated">Zuletzt aktualisiert</option>
              <option value="created">Zuletzt erstellt</option>
              <option value="country">Land</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />

          <select
            value={filterTypeTagId}
            onChange={(e) => setFilterTypeTagId(e.target.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filterTypeTagId ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            data-testid="filter-award-type"
          >
            <option value="">Alle Preistypen</option>
            {availableTypes.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
          </select>

          <select
            value={filterGenreTagId}
            onChange={(e) => setFilterGenreTagId(e.target.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filterGenreTagId ? 'bg-green-100 border-green-300 text-green-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            data-testid="filter-genre"
          >
            <option value="">Alle Genres</option>
            {availableGenres.map(g => (
              <option key={g.id} value={String(g.id)}>{g.name}</option>
            ))}
          </select>

          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filterCountry ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            data-testid="filter-country"
          >
            <option value="">Alle Länder</option>
            {facets.countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilterTypeTagId(''); setFilterGenreTagId(''); setFilterCountry(''); }}
              className="px-3 py-1.5 rounded-full text-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1"
              data-testid="button-reset-filters"
            >
              <X className="w-3 h-3" />
              Filter zurücksetzen ({activeFilterCount})
            </button>
          )}
        </div>

        {loading && <div className="text-center py-8 text-gray-500">Laden...</div>}

        {!loading && safeAwards.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {(searchQuery || activeFilterCount > 0) ? 'Keine Auszeichnungen gefunden. Versuche andere Suchbegriffe oder Filter.' : 'Noch keine Auszeichnungen vorhanden.'}
          </div>
        )}

        <div className="grid gap-3">
          {safeAwards.map((award) => (
            <div key={award.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`award-card-${award.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {award.logo_url && (
                      <img src={award.logo_url} alt="" className="h-8 w-8 object-contain rounded" />
                    )}
                    <h3 className="text-lg font-semibold">{award.name}</h3>
                    {(award.linked_award_types || []).map(t => (
                      <span key={t.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                        {t.name}
                      </span>
                    ))}
                    {(award.linked_award_genres || []).map(g => (
                      <span key={g.id} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                        {g.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 flex-wrap">
                    {award.issuer_name && (
                      <span>{award.issuer_name}</span>
                    )}
                    {award.country && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {award.country}
                      </span>
                    )}
                    {award.website_url && (
                      <a
                        href={award.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Website
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {award.editions_count || 0} Editionen
                    </span>
                    {award.updated_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(award.updated_at).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedAward(award);
                      setView('editions');
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                    data-testid={`button-view-editions-${award.id}`}
                  >
                    Editionen
                  </button>
                  <button
                    onClick={() => {
                      setEditingAward(award);
                      setEditingTypeTagIds((award.linked_award_types || []).map(t => t.id));
                      setEditingGenreTagIds((award.linked_award_genres || []).map(g => g.id));
                    }}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAward(award.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderEditions() {
    return (
      <div>
        {renderBreadcrumb()}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Editions for {selectedAward?.name}</h2>
          <button
            onClick={() => setEditingEdition({ year: new Date().getFullYear() })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Edition
          </button>
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}

        {!loading && editions.length === 0 && (
          <div className="text-center py-8 text-gray-500">No editions found</div>
        )}

        <div className="grid gap-4">
          {editions.map((edition) => (
            <div key={edition.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {edition.year}
                  </h3>
                  {edition.theme && (
                    <p className="text-sm text-gray-600 mt-1">Theme: {edition.theme}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    {edition.outcomes_count || 0} outcomes
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedEdition(edition);
                      setView('outcomes');
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                  >
                    View Outcomes
                  </button>
                  <button
                    onClick={() => setEditingEdition(edition)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteEdition(edition.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderOutcomes() {
    return (
      <div>
        {renderBreadcrumb()}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Outcomes for {selectedEdition?.year}</h2>
          <button
            onClick={() => setEditingOutcome({ name: '', display_order: 0, result_status: 'confirmed' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Outcome
          </button>
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}

        {!loading && outcomes.length === 0 && (
          <div className="text-center py-8 text-gray-500">No outcomes found</div>
        )}

        <div className="grid gap-4">
          {outcomes.map((outcome) => (
            <div key={outcome.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {outcome.name}
                  </h3>
                  <p className="text-sm text-gray-600">Status: {outcome.result_status}</p>
                  {outcome.announced_at && (
                    <p className="text-sm text-gray-600">Announced: {outcome.announced_at}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    {outcome.recipients_count || 0} recipients
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedOutcome(outcome);
                      setView('recipients');
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                  >
                    View Recipients
                  </button>
                  <button
                    onClick={() => setEditingOutcome(outcome)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteOutcome(outcome.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderRecipients() {
    return (
      <div>
        {renderBreadcrumb()}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recipients for {selectedOutcome?.name}</h2>
          <button
            onClick={() => setEditingRecipient({ recipient_kind: 'book' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Recipient
          </button>
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}

        {!loading && recipients.length === 0 && (
          <div className="text-center py-8 text-gray-500">No recipients found</div>
        )}

        <div className="grid gap-4">
          {recipients.map((recipient) => (
            <div key={recipient.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {recipient.recipient_kind === 'book' ? (
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">{recipient.book_title}</h3>
                        <p className="text-sm text-gray-600">{recipient.book_author}</p>
                        <span className="text-xs text-gray-500">Book</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">{recipient.person_name}</h3>
                        <span className="text-xs text-gray-500">Person</span>
                      </div>
                    </div>
                  )}
                  {recipient.notes && (
                    <p className="text-sm text-gray-600 mt-2">{recipient.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteRecipient(recipient.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================================================================
  // EDIT MODALS
  // ==================================================================

  function renderAwardModal() {
    if (!editingAward) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">
              {editingAward.id ? 'Edit Award' : 'New Award'}
            </h3>
            <button
              onClick={() => setEditingAward(null)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={editingAward.name || ''}
                onChange={(e) => setEditingAward({ ...editingAward, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Deutscher Buchpreis"
              />
            </div>

            {/* Slug Preview - Always shown, calculated from name */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">
                Slug Preview <span className="text-xs">(auto-generated from name)</span>
              </label>
              <input
                type="text"
                value={(() => {
                  const slugifiedName = (editingAward.name || '')
                    .trim()
                    .toLowerCase()
                    .normalize('NFKD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/ä/g, 'ae')
                    .replace(/ö/g, 'oe')
                    .replace(/ü/g, 'ue')
                    .replace(/ß/g, 'ss')
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                  return slugifiedName || 'will-be-auto-generated';
                })()}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 font-mono text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Issuer Name</label>
              <input
                type="text"
                value={editingAward.issuer_name || ''}
                onChange={(e) => setEditingAward({ ...editingAward, issuer_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website URL</label>
              <input
                type="url"
                value={editingAward.website_url || ''}
                onChange={(e) => setEditingAward({ ...editingAward, website_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input
                type="url"
                value={editingAward.logo_url || ''}
                onChange={(e) => setEditingAward({ ...editingAward, logo_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://example.com/logo.png"
                data-testid="input-award-logo-url"
              />
              {editingAward.logo_url && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={editingAward.logo_url}
                    alt="Logo Vorschau"
                    className="h-10 w-auto object-contain rounded border bg-white p-1"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="text-xs text-muted-foreground">Vorschau</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editingAward.description || ''}
                onChange={(e) => setEditingAward({ ...editingAward, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Land</label>
              <select
                value={editingAward.country || ''}
                onChange={(e) => setEditingAward({ ...editingAward, country: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white"
                data-testid="select-award-country"
              >
                <option value="">-- Land wählen --</option>
                <option value="Deutschland">Deutschland</option>
                <option value="Österreich">Österreich</option>
                <option value="Schweiz">Schweiz</option>
                <option value="USA">USA</option>
                <option value="Großbritannien">Großbritannien</option>
                <option value="Frankreich">Frankreich</option>
                <option value="Spanien">Spanien</option>
                <option value="Italien">Italien</option>
                <option value="Niederlande">Niederlande</option>
                <option value="Belgien">Belgien</option>
                <option value="Schweden">Schweden</option>
                <option value="Norwegen">Norwegen</option>
                <option value="Dänemark">Dänemark</option>
                <option value="Finnland">Finnland</option>
                <option value="Island">Island</option>
                <option value="Polen">Polen</option>
                <option value="Tschechien">Tschechien</option>
                <option value="Ungarn">Ungarn</option>
                <option value="Russland">Russland</option>
                <option value="Japan">Japan</option>
                <option value="China">China</option>
                <option value="Indien">Indien</option>
                <option value="Kanada">Kanada</option>
                <option value="Australien">Australien</option>
                <option value="Neuseeland">Neuseeland</option>
                <option value="Irland">Irland</option>
                <option value="Portugal">Portugal</option>
                <option value="Brasilien">Brasilien</option>
                <option value="Argentinien">Argentinien</option>
                <option value="Mexiko">Mexiko</option>
                <option value="Israel">Israel</option>
                <option value="Türkei">Türkei</option>
                <option value="Südafrika">Südafrika</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Ägypten">Ägypten</option>
                <option value="International">International</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Preistypen (Mehrfachauswahl)</label>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                {editingTypeTagIds.map(tagId => {
                  const tag = availableTypes.find(t => t.id === tagId);
                  return tag ? (
                    <span key={tag.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200">
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => setEditingTypeTagIds(prev => prev.filter(id => id !== tagId))}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    if (id && !editingTypeTagIds.includes(id)) {
                      setEditingTypeTagIds(prev => [...prev, id]);
                    }
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm"
                  data-testid="select-award-type"
                >
                  <option value="">Preistyp hinzufügen...</option>
                  {availableTypes.filter(t => !editingTypeTagIds.includes(t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Neuer Typ..."
                    className="w-32 px-2 py-2 border rounded-lg text-sm"
                    data-testid="input-new-type"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newTypeName.trim()) {
                        e.preventDefault();
                        const tag = await createTag(newTypeName.trim(), 'award_type');
                        if (tag && !editingTypeTagIds.includes(tag.id)) {
                          setEditingTypeTagIds(prev => [...prev, tag.id]);
                        }
                        setNewTypeName('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!newTypeName.trim() || creatingTag}
                    onClick={async () => {
                      if (newTypeName.trim()) {
                        const tag = await createTag(newTypeName.trim(), 'award_type');
                        if (tag && !editingTypeTagIds.includes(tag.id)) {
                          setEditingTypeTagIds(prev => [...prev, tag.id]);
                        }
                        setNewTypeName('');
                      }
                    }}
                    className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    data-testid="button-add-type"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Genres (Mehrfachauswahl)</label>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                {editingGenreTagIds.map(tagId => {
                  const tag = availableGenres.find(t => t.id === tagId);
                  return tag ? (
                    <span key={tag.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-200">
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => setEditingGenreTagIds(prev => prev.filter(id => id !== tagId))}
                        className="hover:text-green-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    if (id && !editingGenreTagIds.includes(id)) {
                      setEditingGenreTagIds(prev => [...prev, id]);
                    }
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm"
                  data-testid="select-award-genre"
                >
                  <option value="">Genre hinzufügen...</option>
                  {availableGenres.filter(g => !editingGenreTagIds.includes(g.id)).map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newGenreName}
                    onChange={(e) => setNewGenreName(e.target.value)}
                    placeholder="Neues Genre..."
                    className="w-32 px-2 py-2 border rounded-lg text-sm"
                    data-testid="input-new-genre"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newGenreName.trim()) {
                        e.preventDefault();
                        const tag = await createTag(newGenreName.trim(), 'award_genre');
                        if (tag && !editingGenreTagIds.includes(tag.id)) {
                          setEditingGenreTagIds(prev => [...prev, tag.id]);
                        }
                        setNewGenreName('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!newGenreName.trim() || creatingTag}
                    onClick={async () => {
                      if (newGenreName.trim()) {
                        const tag = await createTag(newGenreName.trim(), 'award_genre');
                        if (tag && !editingGenreTagIds.includes(tag.id)) {
                          setEditingGenreTagIds(prev => [...prev, tag.id]);
                        }
                        setNewGenreName('');
                      }
                    }}
                    className="px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                    data-testid="button-add-genre"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={saveAward}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Speichern
            </button>
            <button
              onClick={() => setEditingAward(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderEditionModal() {
    if (!editingEdition) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">
              {editingEdition.id ? 'Edit Edition' : 'New Edition'}
            </h3>
            <button
              onClick={() => setEditingEdition(null)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Year *</label>
              <input
                type="number"
                value={editingEdition.year || ''}
                onChange={(e) => setEditingEdition({ ...editingEdition, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Theme <span className="text-xs text-gray-500">(optional - Jahresmotto/Schwerpunkt)</span>
              </label>
              <input
                type="text"
                value={editingEdition.theme || ''}
                onChange={(e) => setEditingEdition({ ...editingEdition, theme: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder='z.B. "Nordischer Noir Spezial" oder "20 Jahre Jubiläum"'
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={editingEdition.notes || ''}
                onChange={(e) => setEditingEdition({ ...editingEdition, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={saveEdition}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Edition
            </button>
            <button
              onClick={() => setEditingEdition(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderOutcomeModal() {
    if (!editingOutcome) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">
              {editingOutcome.id ? 'Edit Outcome' : 'New Outcome'}
            </h3>
            <button
              onClick={() => setEditingOutcome(null)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={editingOutcome.name || ''}
                onChange={(e) => setEditingOutcome({ ...editingOutcome, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Winner, Shortlist, Longlist"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={editingOutcome.display_order || 0}
                onChange={(e) => setEditingOutcome({ ...editingOutcome, display_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Result Status</label>
              <select
                value={editingOutcome.result_status || 'confirmed'}
                onChange={(e) => setEditingOutcome({ ...editingOutcome, result_status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="confirmed">Confirmed</option>
                <option value="rumored">Rumored</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Announced At</label>
              <input
                type="date"
                value={editingOutcome.announced_at || ''}
                onChange={(e) => setEditingOutcome({ ...editingOutcome, announced_at: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={editingOutcome.notes || ''}
                onChange={(e) => setEditingOutcome({ ...editingOutcome, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={saveOutcome}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Outcome
            </button>
            <button
              onClick={() => setEditingOutcome(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderRecipientModal() {
    if (!editingRecipient) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Add Recipient</h3>
            <button
              onClick={() => {
                setEditingRecipient(null);
                setBookSearchResults([]);
                setPersonSearchResults([]);
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Type *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={editingRecipient.recipient_kind === 'book'}
                    onChange={() => {
                      setEditingRecipient({ recipient_kind: 'book', book_id: undefined, person_id: undefined });
                      setRecipientType('book');
                    }}
                    className="w-4 h-4"
                  />
                  <BookOpen className="w-5 h-5" />
                  Book
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={editingRecipient.recipient_kind === 'person'}
                    onChange={() => {
                      setEditingRecipient({ recipient_kind: 'person', book_id: undefined, person_id: undefined });
                      setRecipientType('person');
                    }}
                    className="w-4 h-4"
                  />
                  <User className="w-5 h-5" />
                  Person
                </label>
              </div>
            </div>

            {editingRecipient.recipient_kind === 'book' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Search Book *</label>
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => {
                    setBookSearchQuery(e.target.value);
                    searchBooks(e.target.value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Type title, author, or ISBN..."
                />
                {bookSearchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                    {bookSearchResults.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          setEditingRecipient({ ...editingRecipient, book_id: book.id });
                          setBookSearchQuery(`${book.title} by ${book.author}`);
                          setBookSearchResults([]);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{book.title}</div>
                        <div className="text-sm text-gray-600">{book.author}</div>
                        {book.isbn13 && (
                          <div className="text-xs text-gray-500">ISBN: {book.isbn13}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {editingRecipient.book_id && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Book selected</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Search Person *</label>
                <input
                  type="text"
                  value={personSearchQuery}
                  onChange={(e) => {
                    setPersonSearchQuery(e.target.value);
                    searchPersons(e.target.value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Type person name..."
                />
                {personSearchQuery.length >= 2 && (
                  <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                    {personSearchResults.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => {
                          setEditingRecipient({ ...editingRecipient, person_id: person.id });
                          setPersonSearchQuery(person.name);
                          setPersonSearchResults([]);
                          setCreatingPersonInline(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{person.name}</div>
                        {person.bio && (
                          <div className="text-sm text-gray-600 line-clamp-1">{person.bio}</div>
                        )}
                      </button>
                    ))}
                    {personSearchResults.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">Keine Person gefunden</div>
                    )}
                    {!creatingPersonInline && (
                      <button
                        onClick={() => {
                          setCreatingPersonInline(true);
                          setNewPersonName(personSearchQuery);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-purple-50 border-t flex items-center gap-2 text-purple-700"
                        data-testid="button-create-person-inline"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Person „{personSearchQuery}" neu anlegen</span>
                      </button>
                    )}
                    {creatingPersonInline && (
                      <div className="px-4 py-3 border-t bg-purple-50">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newPersonName}
                            onChange={(e) => setNewPersonName(e.target.value)}
                            className="flex-1 px-3 py-1.5 border rounded text-sm"
                            placeholder="Name der neuen Person"
                            data-testid="input-new-person-inline"
                          />
                          <button
                            onClick={async () => {
                              if (!newPersonName.trim()) return;
                              const person = await createPersonInline(newPersonName.trim());
                              if (person) {
                                setEditingRecipient({ ...editingRecipient, person_id: person.id });
                                setPersonSearchQuery(person.name);
                                setPersonSearchResults([]);
                                setCreatingPersonInline(false);
                                setNewPersonName('');
                                setSuccess(`Person „${person.name}" erstellt`);
                              } else {
                                setError('Person konnte nicht erstellt werden');
                              }
                            }}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                            data-testid="button-confirm-create-person"
                          >
                            Erstellen
                          </button>
                          <button
                            onClick={() => { setCreatingPersonInline(false); setNewPersonName(''); }}
                            className="p-1.5 hover:bg-gray-200 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {editingRecipient.person_id && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Person selected</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={editingRecipient.notes || ''}
                onChange={(e) => setEditingRecipient({ ...editingRecipient, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={saveRecipient}
              disabled={loading || !editingRecipient.book_id && !editingRecipient.person_id}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Recipient
            </button>
            <button
              onClick={() => {
                setEditingRecipient(null);
                setBookSearchResults([]);
                setPersonSearchResults([]);
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================================
  // PERSONS VIEW
  // ==================================================================

  function renderPersons() {
    const filteredPersons = Array.isArray(allPersons) ? allPersons : [];
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('awards')}
              className="p-2 hover:bg-gray-100 rounded-lg"
              data-testid="button-back-awards"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">Personen verwalten</h2>
            <span className="text-sm text-gray-500">({personsTotal} gesamt)</span>
          </div>
          <button
            onClick={() => setEditingPerson({ name: '' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            data-testid="button-new-person"
          >
            <Plus className="w-4 h-4" />
            Neue Person
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Person suchen..."
              value={personsSearch}
              onChange={(e) => { setPersonsSearch(e.target.value); setPersonsOffset(0); }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              data-testid="input-search-persons"
            />
          </div>
        </div>

        {editingPerson && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-3">{editingPerson.id ? 'Person bearbeiten' : 'Neue Person'}</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={editingPerson.name}
                onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                data-testid="input-person-name"
              />
              <textarea
                placeholder="Biografie (optional)"
                value={editingPerson.bio || ''}
                onChange={(e) => setEditingPerson({ ...editingPerson, bio: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
                data-testid="input-person-bio"
              />
              <div className="flex gap-2">
                <button
                  onClick={savePerson}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  data-testid="button-save-person"
                >
                  <Save className="w-4 h-4" />
                  Speichern
                </button>
                <button
                  onClick={() => setEditingPerson(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                  data-testid="button-cancel-person"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-sm font-semibold">Biografie</th>
                <th className="px-4 py-3 text-sm font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersons.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Laden...' : 'Keine Personen gefunden'}
                  </td>
                </tr>
              ) : (
                filteredPersons.map((person) => (
                  <tr key={person.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{person.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                      {person.bio || '–'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingPerson({ id: String(person.id), name: person.name, bio: person.bio })}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Bearbeiten"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => deletePerson(String(person.id))}
                          className="p-1.5 hover:bg-red-50 rounded"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {personsTotal > 50 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPersonsOffset(Math.max(0, personsOffset - 50))}
              disabled={personsOffset === 0}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Zurück
            </button>
            <span className="text-sm text-gray-600">
              {personsOffset + 1}–{Math.min(personsOffset + 50, personsTotal)} von {personsTotal}
            </span>
            <button
              onClick={() => setPersonsOffset(personsOffset + 50)}
              disabled={personsOffset + 50 >= personsTotal}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Weiter
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==================================================================
  // MAIN RENDER
  // ==================================================================

  return (
    <div className="p-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-green-800">Success</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="p-1 hover:bg-green-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Views */}
      {view === 'awards' && renderAwards()}
      {view === 'editions' && renderEditions()}
      {view === 'outcomes' && renderOutcomes()}
      {view === 'recipients' && renderRecipients()}
      {view === 'persons' && renderPersons()}

      {/* Modals */}
      {renderAwardModal()}
      {renderEditionModal()}
      {renderOutcomeModal()}
      {renderRecipientModal()}
    </div>
  );
}