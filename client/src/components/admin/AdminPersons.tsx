/**
 * ==================================================================
 * ADMIN PERSONS - Personen-Verwaltung für Autorenpreise
 * ==================================================================
 * 
 * Features:
 * - CRUD für Persons (Autoren, Übersetzer, etc.)
 * - Photo Upload/URL
 * - Bio Editor
 * - Born/Died Years
 * - Nationality
 * - Website
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
  Calendar,
  Globe,
  Award as AwardIcon,
  ExternalLink,
  AlertCircle,
  Check,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
// TYPES
// ==================================================================

interface Person {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  born_year?: number;
  died_year?: number;
  nationality?: string;
  photo_url?: string;
  website_url?: string;
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

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Edit Modal
  const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);

  // View Awards Modal
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
        console.error(`❌ Load persons failed: HTTP ${response.status}`, text.substring(0, 200));
        setError(`Failed to load persons (HTTP ${response.status})`);
        return;
      }
      
      const data = await response.json();
      if (data.ok) {
        // Backend returns {ok: true, data: [...]} (array directly in data)
        setPersons(Array.isArray(data.data) ? data.data : []);
        setTotal(data.data?.length || 0);
      } else {
        setError(data.error?.message || 'Failed to load persons');
      }
    } catch (err) {
      console.error('❌ Load persons error:', err);
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
        console.error(`❌ Load person awards failed: HTTP ${response.status}`);
        setPersonAwards([]);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        // ✅ CRASH-SAFE: Ensure awards is always an array
        setPersonAwards(Array.isArray(data.data.awards) ? data.data.awards : []);
      }
    } catch (err) {
      console.error('❌ Failed to load person awards:', err);
      setPersonAwards([]); // ✅ CRASH-SAFE: Set empty array on error
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
        body: JSON.stringify(editingPerson)
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`❌ Save person failed: HTTP ${response.status}`, text.substring(0, 300));
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
      console.error('❌ Save person error:', err);
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
        console.error(`❌ Delete person failed: HTTP ${response.status}`, text.substring(0, 200));
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
      console.error('❌ Delete person error:', err);
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

  // ✅ CRASH-SAFE: Ensure persons is always an array
  const safePersons = Array.isArray(persons) ? persons : [];
  const filteredPersons = safePersons;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-7 h-7" />
            Persons Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage persons (authors, translators, etc.) for awards
          </p>
        </div>
        <button
          onClick={() => setEditingPerson({ name: '', slug: '' })}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Person
        </button>
      </div>

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

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search persons..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-blue-900">{total}</div>
          <div className="text-sm text-blue-700">Total Persons</div>
        </div>
        <div className="text-sm text-blue-600">
          Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
        </div>
      </div>

      {/* Persons List */}
      {loading && <div className="text-center py-8">Loading...</div>}

      {!loading && filteredPersons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No persons found. Create your first person!
        </div>
      )}

      <div className="grid gap-4">
        {filteredPersons.map((person) => (
          <div
            key={person.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Photo */}
              <div className="flex-shrink-0">
                {person.photo_url ? (
                  <img
                    src={person.photo_url}
                    alt={person.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{person.name}</h3>
                <p className="text-sm text-gray-600">Slug: {person.slug}</p>

                {person.nationality && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Globe className="w-3 h-3" />
                    {person.nationality}
                  </p>
                )}

                {(person.born_year || person.died_year) && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {person.born_year || '?'} - {person.died_year || 'present'}
                  </p>
                )}

                {person.bio && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{person.bio}</p>
                )}

                {person.website_url && (
                  <a
                    href={person.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Website
                  </a>
                )}

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <AwardIcon className="w-4 h-4" />
                    {person.awards_count || 0} awards
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {person.awards_count && person.awards_count > 0 && (
                  <button
                    onClick={() => {
                      setViewingPerson(person);
                      loadPersonAwards(person.id);
                    }}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 text-sm"
                  >
                    View Awards
                  </button>
                )}
                <button
                  onClick={() => setEditingPerson(person)}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deletePerson(person.id)}
                  className="p-2 hover:bg-red-50 rounded text-red-600"
                  title="Delete"
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
            className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* ==================================================================
          EDIT PERSON MODAL
          ================================================================== */}
      {editingPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingPerson.id ? 'Edit Person' : 'New Person'}
              </h3>
              <button
                onClick={() => setEditingPerson(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={editingPerson.name || ''}
                  onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Jenny Erpenbeck"
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
                    return slugifiedName || 'will-be-auto-generated';
                  })()}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 font-mono text-sm cursor-not-allowed"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-1">Biography</label>
                <textarea
                  value={editingPerson.bio || ''}
                  onChange={(e) => setEditingPerson({ ...editingPerson, bio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Short biography..."
                />
              </div>

              {/* Years */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Born Year</label>
                  <input
                    type="number"
                    value={editingPerson.born_year || ''}
                    onChange={(e) => setEditingPerson({ 
                      ...editingPerson, 
                      born_year: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 1967"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Died Year</label>
                  <input
                    type="number"
                    value={editingPerson.died_year || ''}
                    onChange={(e) => setEditingPerson({ 
                      ...editingPerson, 
                      died_year: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 2023"
                  />
                </div>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-medium mb-1">Nationality</label>
                <input
                  type="text"
                  value={editingPerson.nationality || ''}
                  onChange={(e) => setEditingPerson({ ...editingPerson, nationality: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., German"
                />
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Photo URL
                </label>
                <input
                  type="url"
                  value={editingPerson.photo_url || ''}
                  onChange={(e) => setEditingPerson({ ...editingPerson, photo_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://..."
                />
                {editingPerson.photo_url && (
                  <div className="mt-2">
                    <img
                      src={editingPerson.photo_url}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium mb-1">Website URL</label>
                <input
                  type="url"
                  value={editingPerson.website_url || ''}
                  onChange={(e) => setEditingPerson({ ...editingPerson, website_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={savePerson}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Person
              </button>
              <button
                onClick={() => setEditingPerson(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
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
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                Awards for {viewingPerson.name}
              </h3>
              <button
                onClick={() => {
                  setViewingPerson(null);
                  setPersonAwards([]);
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAwards && <div className="text-center py-8">Loading awards...</div>}

            {!loadingAwards && personAwards.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No awards found for this person.
              </div>
            )}

            <div className="space-y-4">
              {personAwards.map((award, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AwardIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{award.award_name}</h4>
                      <p className="text-sm text-gray-600">
                        {award.edition_year} - {award.outcome_name}
                      </p>
                      {award.notes && (
                        <p className="text-sm text-gray-700 mt-2">{award.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Added {new Date(award.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setViewingPerson(null);
                  setPersonAwards([]);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}