/**
 * ==================================================================
 * ADMIN PERSONS - Personen-Verwaltung für Autorenpreise
 * ==================================================================
 * 
 * Features:
 * - CRUD für Persons (Autoren, Übersetzer, etc.)
 * - Liste der Awards pro Person
 * - Search & Filter
 * - Delete Protection (wenn in Awards verwendet)
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
  User,
  Award as AwardIcon,
  AlertCircle,
  Check
} from 'lucide-react';
// TYPES
// ==================================================================

interface Person {
  id: string;
  name: string;
  slug: string;
  awards_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface PersonAward {
  award_id: number;
  award_name: string;
  edition_year: number;
  outcome_name: string;
  notes?: string;
  created_at: string;
}

// ==================================================================
// COMPONENT
// ==================================================================

export function AdminPersons() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);

  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [personAwards, setPersonAwards] = useState<PersonAward[]>([]);
  const [loadingAwards, setLoadingAwards] = useState(false);

  // ==================================================================
  // API HELPERS
  // ==================================================================

  const API_BASE = '/api';

  const getHeaders = () => ({ 'Content-Type': 'application/json' });

  // ==================================================================
  // LOAD DATA
  // ==================================================================

  useEffect(() => {
    loadPersons();
  }, [searchQuery, offset]);

  async function loadPersons() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      const response = await fetch(`${API_BASE}/persons?${params}`, { credentials: 'include', headers: getHeaders() });
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`Load persons failed: HTTP ${response.status}`, text.substring(0, 200));
        setError(`Failed to load persons (HTTP ${response.status})`);
        return;
      }
      
      const data = await response.json();
      if (data.ok) {
        setPersons(Array.isArray(data.data) ? data.data : []);
        setTotal(data.data?.length || 0);
      } else {
        setError(data.error?.message || 'Failed to load persons');
      }
    } catch (err) {
      console.error('Load persons error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadPersonAwards(personId: string) {
    setLoadingAwards(true);
    try {
      const response = await fetch(`${API_BASE}/persons/${personId}`, { credentials: 'include', headers: getHeaders() });
      
      if (!response.ok) {
        console.error(`Load person awards failed: HTTP ${response.status}`);
        setPersonAwards([]);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setPersonAwards(Array.isArray(data.data.awards) ? data.data.awards : []);
      }
    } catch (err) {
      console.error('Failed to load person awards:', err);
      setPersonAwards([]);
    } finally {
      setLoadingAwards(false);
    }
  }

  // ==================================================================
  // SAVE/DELETE
  // ==================================================================

  async function savePerson() {
    if (!editingPerson?.name) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/persons`, {
          method: 'POST',
          credentials: 'include',
          headers: getHeaders(),
        body: JSON.stringify({ name: editingPerson.name })
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`Save person failed: HTTP ${response.status}`, text.substring(0, 300));
        setError(`Failed to save person (HTTP ${response.status})`);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Person saved successfully');
        setEditingPerson(null);
        loadPersons();
      } else {
        setError(data.error || 'Failed to save person');
      }
    } catch (err) {
      console.error('Save person error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function deletePerson(id: string) {
    if (!confirm('Delete this person? This will fail if the person is used in any awards.')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/persons/${id}`, { method: 'DELETE', credentials: 'include', headers: getHeaders() });
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`Delete person failed: HTTP ${response.status}`, text.substring(0, 200));
        setError(`Failed to delete person (HTTP ${response.status})`);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Person deleted');
        loadPersons();
      } else {
        setError(data.error || 'Failed to delete person');
      }
    } catch (err) {
      console.error('Delete person error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // ==================================================================
  // PAGINATION
  // ==================================================================

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  function goToPage(page: number) {
    setOffset((page - 1) * limit);
  }

  // ==================================================================
  // RENDER
  // ==================================================================

  const safePersons = Array.isArray(persons) ? persons : [];
  const filteredPersons = safePersons;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-7 h-7" />
            Personen-Verwaltung
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Autoren, Übersetzer und Preisträger verwalten
          </p>
        </div>
        <button
          onClick={() => setEditingPerson({ name: '', slug: '' })}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          data-testid="button-new-person"
        >
          <Plus className="w-4 h-4" />
          Neue Person
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-800">Fehler</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-green-800">Erfolg</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1 hover:bg-green-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Person suchen..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            data-testid="input-search-persons"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 p-4 bg-blue-50 rounded-md flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-2xl font-bold text-blue-900">{total}</div>
          <div className="text-sm text-blue-700">Personen gesamt</div>
        </div>
        <div className="text-sm text-blue-600">
          Zeige {offset + 1}-{Math.min(offset + limit, total)} von {total}
        </div>
      </div>

      {/* Persons List */}
      {loading && <div className="text-center py-8">Laden...</div>}

      {!loading && filteredPersons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Keine Personen gefunden.
        </div>
      )}

      <div className="grid gap-3">
        {filteredPersons.map((person) => (
          <div
            key={person.id}
            className="border rounded-md p-4 hover:shadow-sm transition-shadow"
            data-testid={`card-person-${person.id}`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">{person.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <AwardIcon className="w-3.5 h-3.5" />
                    {person.awards_count || 0} Preise
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {(person.awards_count ?? 0) > 0 && (
                  <button
                    onClick={() => {
                      setViewingPerson(person);
                      loadPersonAwards(person.id);
                    }}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 text-sm"
                    data-testid={`button-view-awards-${person.id}`}
                  >
                    Preise anzeigen
                  </button>
                )}
                <button
                  onClick={() => setEditingPerson(person)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                  title="Bearbeiten"
                  data-testid={`button-edit-person-${person.id}`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deletePerson(person.id)}
                  className="p-2 hover:bg-red-50 rounded-md text-red-600"
                  title="Löschen"
                  data-testid={`button-delete-person-${person.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zurück
          </button>
          <span className="text-sm text-gray-600">
            Seite {currentPage} von {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Weiter
          </button>
        </div>
      )}

      {/* ==================================================================
          EDIT PERSON MODAL - Only Name field
          ================================================================== */}
      {editingPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingPerson.id ? 'Person bearbeiten' : 'Neue Person'}
              </h3>
              <button
                onClick={() => setEditingPerson(null)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={editingPerson.name || ''}
                  onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="z.B. Jenny Erpenbeck"
                  data-testid="input-person-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">
                  Slug <span className="text-xs">(automatisch generiert)</span>
                </label>
                <input
                  type="text"
                  value={(() => {
                    const slugifiedName = (editingPerson.name || '')
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
                    return slugifiedName || 'wird-automatisch-generiert';
                  })()}
                  disabled
                  className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-600 font-mono text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={savePerson}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="button-save-person"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
              <button
                onClick={() => setEditingPerson(null)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          VIEW AWARDS MODAL
          ================================================================== */}
      {viewingPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                Preise: {viewingPerson.name}
              </h3>
              <button
                onClick={() => setViewingPerson(null)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAwards && <div className="text-center py-4">Laden...</div>}

            {!loadingAwards && personAwards.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Keine Preise zugeordnet.
              </div>
            )}

            <div className="space-y-3">
              {personAwards.map((award, idx) => (
                <div key={idx} className="border rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AwardIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{award.award_name}</p>
                      <p className="text-sm text-gray-600">
                        {award.edition_year} &middot; {award.outcome_name}
                      </p>
                      {award.notes && (
                        <p className="text-sm text-gray-500 mt-1">{award.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setViewingPerson(null)}
                className="w-full px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
