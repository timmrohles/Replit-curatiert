/**
 * ==================================================================
 * ADMIN PERSONS - Personen-Verwaltung für Autorenpreise
 * ==================================================================
 * 
 * Features:
 * - CRUD für Persons (Autoren, Übersetzer, etc.)
 * - Inline-Anzeige aller Preise pro Person (Name, Jahr, Matching-Status)
 * - Klick auf Preis navigiert zum Preis-Tab
 * - Bearbeitung der Preis-Zuordnungen (entfernen)
 * - Search, Pagination
 * ==================================================================
 */

import { useState, useEffect, useCallback } from 'react';
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
  Check,
  BookOpen,
  BookX,
  ExternalLink,
  Unlink
} from 'lucide-react';

// TYPES
// ==================================================================

interface PersonAwardInline {
  recipient_id: number;
  award_id: number;
  award_name: string;
  year: number;
  outcome: string;
  outcome_type: string;
  book_id: number | null;
  notes: string | null;
}

interface Person {
  id: string;
  name: string;
  slug: string;
  awards: PersonAwardInline[] | null;
  created_at?: string;
  updated_at?: string;
}

interface AdminPersonsProps {
  onNavigateToAward?: (awardId: number) => void;
}

// ==================================================================
// COMPONENT
// ==================================================================

export function AdminPersons({ onNavigateToAward }: AdminPersonsProps) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);

  // ==================================================================
  // API HELPERS
  // ==================================================================

  const API_BASE = '/api';
  const getHeaders = () => ({ 'Content-Type': 'application/json' });

  // ==================================================================
  // LOAD DATA
  // ==================================================================

  const loadPersons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      const response = await fetch(`${API_BASE}/persons?${params}`, { credentials: 'include', headers: getHeaders() });

      if (!response.ok) {
        setError(`Laden fehlgeschlagen (HTTP ${response.status})`);
        return;
      }

      const data = await response.json();
      if (data.ok) {
        const list = Array.isArray(data.data) ? data.data : [];
        setPersons(list);
        setTotal(data.total ?? list.length);
      } else {
        setError(data.error?.message || 'Laden fehlgeschlagen');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, offset, limit]);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  // ==================================================================
  // SAVE/DELETE
  // ==================================================================

  async function savePerson() {
    if (!editingPerson?.name) {
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
        body: JSON.stringify({ name: editingPerson.name, id: editingPerson.id })
      });

      if (!response.ok) {
        setError(`Speichern fehlgeschlagen (HTTP ${response.status})`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Person gespeichert');
        setEditingPerson(null);
        loadPersons();
      } else {
        setError(data.error || 'Speichern fehlgeschlagen');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function deletePerson(id: string) {
    if (!confirm('Person löschen? Fehlschlag wenn in Preisen verwendet.')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/persons/${id}`, { method: 'DELETE', credentials: 'include', headers: getHeaders() });

      if (!response.ok) {
        setError(`Löschen fehlgeschlagen (HTTP ${response.status})`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Person gelöscht');
        loadPersons();
      } else {
        setError(data.error || 'Löschen fehlgeschlagen');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function removeRecipient(recipientId: number) {
    if (!confirm('Preis-Zuordnung entfernen?')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/award-recipients/${recipientId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getHeaders()
      });

      if (!response.ok) {
        setError(`Entfernen fehlgeschlagen (HTTP ${response.status})`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Preis-Zuordnung entfernt');
        loadPersons();
      } else {
        setError(data.error || 'Entfernen fehlgeschlagen');
      }
    } catch (err) {
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
            Autoren, Übersetzer und Preisträger verwalten &middot; {total} Personen
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

      {/* Persons List */}
      {loading && <div className="text-center py-8">Laden...</div>}

      {!loading && safePersons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Keine Personen gefunden.
        </div>
      )}

      <div className="grid gap-3">
        {safePersons.map((person) => {
          const awards = person.awards || [];
          const matchedCount = awards.filter(a => a.book_id !== null).length;
          const unmatchedCount = awards.filter(a => a.book_id === null).length;

          return (
            <div
              key={person.id}
              className="border rounded-md p-4 hover:shadow-sm transition-shadow"
              data-testid={`card-person-${person.id}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-semibold">{person.name}</h3>
                    {awards.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {awards.length} {awards.length === 1 ? 'Preis' : 'Preise'}
                        </span>
                        {matchedCount > 0 && (
                          <span className="flex items-center gap-0.5 text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                            <BookOpen className="w-3 h-3" />
                            {matchedCount}
                          </span>
                        )}
                        {unmatchedCount > 0 && (
                          <span className="flex items-center gap-0.5 text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                            <BookX className="w-3 h-3" />
                            {unmatchedCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Awards inline */}
                  {awards.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {awards.map((award) => (
                        <div key={award.recipient_id} className="flex items-center gap-2 text-sm text-gray-600 group">
                          <AwardIcon className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                          <button
                            onClick={() => onNavigateToAward?.(award.award_id)}
                            className="font-medium text-gray-800 hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                            title={`Zum Preis "${award.award_name}" wechseln`}
                            data-testid={`link-award-${award.award_id}`}
                          >
                            {award.award_name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-gray-400">{award.year}</span>
                          <span className="text-gray-500">&middot; {award.outcome}</span>
                          {award.book_id ? (
                            <span className="text-green-600 flex items-center gap-0.5" title="Buch gematcht">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-orange-500 text-xs" title="Kein Buch-Match">
                              (kein Match)
                            </span>
                          )}
                          {award.notes && (
                            <span className="text-gray-400 text-xs truncate max-w-[200px]" title={award.notes}>
                              {award.notes}
                            </span>
                          )}
                          <button
                            onClick={() => removeRecipient(award.recipient_id)}
                            className="p-0.5 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                            title="Preis-Zuordnung entfernen"
                            data-testid={`button-unlink-recipient-${award.recipient_id}`}
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {awards.length === 0 && (
                    <p className="text-sm text-gray-400 mt-1">Keine Preise zugeordnet</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingPerson(person)}
                    className="p-2 hover:bg-gray-100 rounded-md"
                    title="Name bearbeiten"
                    data-testid={`button-edit-person-${person.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePerson(person.id)}
                    className="p-2 hover:bg-red-50 rounded-md text-red-600"
                    title="Person löschen"
                    data-testid={`button-delete-person-${person.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
          EDIT PERSON MODAL - Name editing
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

              {/* Show existing awards in edit mode */}
              {editingPerson.id && editingPerson.awards && editingPerson.awards.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Zugeordnete Preise</label>
                  <div className="space-y-1 text-sm border rounded-md p-3 bg-gray-50 max-h-48 overflow-y-auto">
                    {editingPerson.awards.map((award) => (
                      <div key={award.recipient_id} className="flex items-center justify-between gap-2 py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <AwardIcon className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                          <span className="truncate">{award.award_name}</span>
                          <span className="text-gray-400 flex-shrink-0">{award.year}</span>
                          <span className="text-gray-500 flex-shrink-0">{award.outcome}</span>
                        </div>
                        <button
                          onClick={() => {
                            removeRecipient(award.recipient_id);
                            if (editingPerson.awards) {
                              setEditingPerson({
                                ...editingPerson,
                                awards: editingPerson.awards.filter(a => a.recipient_id !== award.recipient_id)
                              });
                            }
                          }}
                          className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 flex-shrink-0"
                          title="Zuordnung entfernen"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Preis-Zuordnungen werden über den Preise-Tab verwaltet.
                  </p>
                </div>
              )}
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
    </div>
  );
}
