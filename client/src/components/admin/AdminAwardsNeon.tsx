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
  Check
} from 'lucide-react';
// TYPES
// ==================================================================

interface Award {
  id: number;
  name: string;
  slug: string;
  issuer_name?: string;
  website_url?: string;
  description?: string;
  logo_url?: string;
  country?: string;
  editions_count?: number;
  created_at?: string;
  updated_at?: string;
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
  const [view, setView] = useState<'awards' | 'editions' | 'outcomes' | 'recipients'>('awards');
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

  // ==================================================================
  // API HELPERS
  // ==================================================================

  const API_BASE = '/api';

  const getHeaders = () => ({ 'Content-Type': 'application/json' });

  // ==================================================================
  // LOAD DATA
  // ==================================================================

  useEffect(() => {
    if (view === 'awards') loadAwards();
  }, [view]);

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

  async function loadAwards() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/awards`, { credentials: 'include', headers: getHeaders() });
      const data = await response.json();
      // ✅ FIX: Backend gibt "ok" zurück, nicht "success"
      if (data.ok || data.success) {
        setAwards(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.error || 'Failed to load awards');
      }
    } catch (err) {
      setError(String(err));
      setAwards([]); // ✅ CRASH-SAFE: Set empty array on error
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
        setError(data.error || 'Failed to load editions');
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
        setError(data.error || 'Failed to load outcomes');
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
        setError(data.error || 'Failed to load recipients');
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
      const response = await fetch(`${API_BASE}/awards`, {
          method: 'POST',
          credentials: 'include',
          headers: getHeaders(),
        body: JSON.stringify(editingAward)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Award saved successfully');
        setEditingAward(null);
        loadAwards();
      } else {
        setError(data.error || 'Failed to save award');
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
        setError(data.error || 'Failed to save edition');
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
        setError(data.error || 'Failed to save outcome');
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
        setError(data.error || 'Failed to save recipient');
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
        setError(data.error || 'Failed to delete award');
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
        setError(data.error || 'Failed to delete edition');
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
        setError(data.error || 'Failed to delete outcome');
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
        setError(data.error || 'Failed to delete recipient');
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
    // ✅ CRASH-SAFE: Ensure awards is always an array before filtering
    const safeAwards = Array.isArray(awards) ? awards : [];
    const filteredAwards = safeAwards.filter(a =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Awards Management</h2>
          <button
            onClick={() => setEditingAward({ name: '', slug: '' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Award
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search awards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}

        {!loading && filteredAwards.length === 0 && (
          <div className="text-center py-8 text-gray-500">No awards found</div>
        )}

        <div className="grid gap-4">
          {filteredAwards.map((award) => (
            <div key={award.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {award.logo_url && (
                      <img src={award.logo_url} alt="" className="h-8 w-8 object-contain rounded" />
                    )}
                    <h3 className="text-lg font-semibold">{award.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">Slug: {award.slug}</p>
                  {award.issuer_name && (
                    <p className="text-sm text-gray-600">Issuer: {award.issuer_name}</p>
                  )}
                  {award.website_url && (
                    <a
                      href={award.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    {award.editions_count || 0} editions
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedAward(award);
                      setView('editions');
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                  >
                    View Editions
                  </button>
                  <button
                    onClick={() => setEditingAward(award)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAward(award.id)}
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
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={saveAward}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Award
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
                {personSearchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                    {personSearchResults.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => {
                          setEditingRecipient({ ...editingRecipient, person_id: person.id });
                          setPersonSearchQuery(person.name);
                          setPersonSearchResults([]);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{person.name}</div>
                        {person.bio && (
                          <div className="text-sm text-gray-600 line-clamp-1">{person.bio}</div>
                        )}
                      </button>
                    ))}
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

      {/* Modals */}
      {renderAwardModal()}
      {renderEditionModal()}
      {renderOutcomeModal()}
      {renderRecipientModal()}
    </div>
  );
}