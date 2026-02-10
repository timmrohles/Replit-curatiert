/**
 * ==================================================================
 * ADMIN AFFILIATE MANAGEMENT - v2
 * ==================================================================
 * 
 * Verwalte Affiliate-Partner und deren Buch-Zuordnungen
 * ✅ CRUD für Affiliate-Partner (affiliates Tabelle)
 * ✅ CRUD für Buch-Affiliate-Zuordnungen (book_affiliates Tabelle)
 * ✅ View-basierte URL-Generierung (v_book_affiliate_links)
 * ✅ Auto-Slug für Partner
 * ✅ Link-Template mit {isbn13} Placeholder
 * 
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import {
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  Link as LinkIcon,
  BookOpen,
  Search
} from 'lucide-react';
import { getAdminToken } from '../../utils/adminToken';

// ==================================================================
// TYPES
// ==================================================================

interface Affiliate {
  id: number;
  name: string;
  slug: string;
  network?: string;
  merchant_id?: string | null;
  program_id?: string | null;
  website_url?: string | null;
  link_template: string;
  product_url_template?: string | null;
  icon_url?: string | null;
  favicon_url?: string | null;
  display_order: number;
  is_active: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface BookAffiliate {
  id: number;
  book_id: string;
  affiliate_id: number;
  merchant_product_id?: string | null;
  external_id?: string | null;
  link_override?: string | null;
  display_order: number;
  is_active: boolean;
  book_title?: string;
  book_author?: string;
  book_isbn13?: string;
  affiliate_name?: string;
  affiliate_slug?: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn13?: string;
}

// ==================================================================
// API BASE
// ==================================================================

const API_BASE = '/api';

function getAdminHeaders(): HeadersInit {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    'X-Admin-Token': token || '',
  };
}

// ==================================================================
// COMPONENT
// ==================================================================

export function AdminAffiliate() {
  const [view, setView] = useState<'partners' | 'assignments'>('partners');
  
  // Affiliate Partners
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [editingAffiliate, setEditingAffiliate] = useState<Partial<Affiliate> | null>(null);
  
  // Book Assignments
  const [bookAffiliates, setBookAffiliates] = useState<BookAffiliate[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<BookAffiliate | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<number | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ==================================================================
  // FETCH DATA
  // ==================================================================

  useEffect(() => {
    if (view === 'partners') {
      fetchAffiliates();
    } else {
      fetchBookAffiliates();
      fetchAffiliates(); // Needed for dropdown
    }
  }, [view]);

  async function fetchAffiliates() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/admin/affiliates`, {
        headers: getAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || 'Failed to load affiliates');
      }

      setAffiliates(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('❌ Affiliates fetch error:', err);
      setError(String(err));
      setAffiliates([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookAffiliates() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/admin/book-affiliates`, {
        headers: getAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || 'Failed to load book affiliates');
      }

      setBookAffiliates(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('❌ Book affiliates fetch error:', err);
      setError(String(err));
      setBookAffiliates([]);
    } finally {
      setLoading(false);
    }
  }

  async function searchBooks(query: string) {
    if (query.length < 2) {
      setBookSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/books/search?q=${encodeURIComponent(query)}&limit=20`,
        { headers: getAdminHeaders() }
      );
      const data = await response.json();
      if (data.ok) {
        setBookSearchResults(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error('Book search error:', err);
      setBookSearchResults([]);
    }
  }

  // ==================================================================
  // SAVE/DELETE AFFILIATES
  // ==================================================================

  async function saveAffiliate() {
    if (!editingAffiliate?.name) {
      setError('Name is required');
      return;
    }
    
    if (!editingAffiliate?.link_template) {
      setError('Link template is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/admin/affiliates`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(editingAffiliate)
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`❌ Save affiliate failed: HTTP ${response.status}`, text.substring(0, 300));
        setError(`Failed to save affiliate (HTTP ${response.status})`);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Affiliate saved successfully');
        setEditingAffiliate(null);
        fetchAffiliates();
      } else {
        setError(data.error || 'Failed to save affiliate');
      }
    } catch (err) {
      console.error('❌ Save affiliate error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteAffiliate(id: number) {
    if (!confirm('Delete this affiliate partner?')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/admin/affiliates/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Affiliate deleted');
        fetchAffiliates();
      } else {
        setError(data.error || 'Failed to delete affiliate');
      }
    } catch (err) {
      console.error('❌ Delete affiliate error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // ==================================================================
  // SAVE/DELETE BOOK ASSIGNMENTS
  // ==================================================================

  async function createAssignment() {
    if (!selectedBook || !selectedAffiliateId) {
      setError('Please select a book and affiliate');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/admin/book-affiliates`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          book_id: selectedBook.id,
          affiliate_id: selectedAffiliateId,
          merchant_product_id: '',
          external_id: '',
          link_override: '',
          display_order: 0,
          is_active: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Assignment created - you can now edit it to add IDs');
        setShowAssignmentModal(false);
        setSelectedBook(null);
        setSelectedAffiliateId(null);
        setBookSearchQuery('');
        fetchBookAffiliates();
      } else {
        setError(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      console.error('❌ Create assignment error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function updateAssignment() {
    if (!editingAssignment) return;

    // Validate: At least one ID field must be set
    if (!editingAssignment.merchant_product_id && !editingAssignment.external_id && !editingAssignment.link_override) {
      setError('At least one of Merchant Product ID, External ID, or Link Override must be set');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/admin/book-affiliates/${editingAssignment.id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          merchant_product_id: editingAssignment.merchant_product_id || null,
          external_id: editingAssignment.external_id || null,
          link_override: editingAssignment.link_override || null,
          display_order: editingAssignment.display_order || 0,
          is_active: editingAssignment.is_active !== false
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Assignment updated successfully');
        setEditingAssignment(null);
        fetchBookAffiliates();
      } else {
        setError(data.error || 'Failed to update assignment');
      }
    } catch (err) {
      console.error('❌ Update assignment error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteAssignment(id: number) {
    if (!confirm('Delete this assignment?')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/admin/book-affiliates/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Assignment deleted');
        fetchBookAffiliates();
      } else {
        setError(data.error || 'Failed to delete assignment');
      }
    } catch (err) {
      console.error('❌ Delete assignment error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // ==================================================================
  // RENDER: PARTNERS VIEW
  // ==================================================================

  function renderPartnersView() {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Affiliate Partners</h2>
          <button
            onClick={() => setEditingAffiliate({ 
              name: '', 
              link_template: 'https://www.example.com/search?isbn={isbn13}',
              display_order: 0,
              is_active: true
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neuer Partner
          </button>
        </div>

        {loading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}

        {!loading && affiliates.length === 0 && (
          <div className="text-center py-8 text-gray-500">Keine Affiliates vorhanden</div>
        )}

        <div className="grid gap-4">
          {affiliates.map((affiliate) => (
            <div key={affiliate.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 flex items-start gap-3">
                  {(affiliate.icon_url || affiliate.favicon_url) && (
                    <img
                      src={affiliate.icon_url || affiliate.favicon_url || ''}
                      alt={affiliate.name}
                      className="w-8 h-8 rounded mt-0.5"
                    />
                  )}
                  <div>
                  <h3 className="text-lg font-semibold">{affiliate.name}</h3>
                  <p className="text-sm text-gray-600 font-mono">Slug: {affiliate.slug}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{affiliate.link_template}</code>
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="text-gray-600">Order: {affiliate.display_order}</span>
                    <span className={affiliate.is_active ? 'text-green-600' : 'text-gray-400'}>
                      {affiliate.is_active ? '✓ Active' : '○ Inactive'}
                    </span>
                  </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingAffiliate(affiliate)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAffiliate(affiliate.id)}
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
  // RENDER: ASSIGNMENTS VIEW
  // ==================================================================

  function renderAssignmentsView() {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Buch-Affiliate-Zuordnungen</h2>
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neue Zuordnung
          </button>
        </div>

        {loading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}

        {!loading && bookAffiliates.length === 0 && (
          <div className="text-center py-8 text-gray-500">Keine Zuordnungen vorhanden</div>
        )}

        <div className="grid gap-4">
          {bookAffiliates.map((ba) => (
            <div key={ba.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">{ba.book_title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{ba.book_author}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    {ba.affiliate_name}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="text-gray-600">Order: {ba.display_order}</span>
                    <span className={ba.is_active ? 'text-green-600' : 'text-gray-400'}>
                      {ba.is_active ? '✓ Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingAssignment(ba)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAssignment(ba.id)}
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
  // RENDER: AFFILIATE EDIT MODAL
  // ==================================================================

  function renderAffiliateModal() {
    if (!editingAffiliate) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">
              {editingAffiliate.id ? 'Affiliate bearbeiten' : 'Neuer Affiliate'}
            </h3>
            <button
              onClick={() => setEditingAffiliate(null)}
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
                value={editingAffiliate.name || ''}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="z.B. Thalia.de"
              />
            </div>

            {/* Slug Preview */}
            {editingAffiliate.name && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">
                  Slug Preview <span className="text-xs">(auto-generiert)</span>
                </label>
                <input
                  type="text"
                  value={(() => {
                    const slug = (editingAffiliate.name || '')
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
                    return slug || 'will-be-auto-generated';
                  })()}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 font-mono text-sm cursor-not-allowed"
                />
              </div>
            )}

            {/* Network */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Network * <span className="text-xs text-gray-500">(awin, manual, other)</span>
              </label>
              <select
                value={editingAffiliate.network || 'manual'}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, network: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="manual">Manual</option>
                <option value="awin">AWIN</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Merchant ID */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Merchant ID {editingAffiliate.network === 'awin' && '(AWIN Advertiser ID)'}
              </label>
              <input
                type="text"
                value={editingAffiliate.merchant_id || ''}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, merchant_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="z.B. coratiert-21 (Amazon) oder 12345 (AWIN)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird in Link-Templates verwendet (z.B. Amazon Tracking-Tag)
              </p>
            </div>

            {/* Program ID */}
            {editingAffiliate.network === 'awin' && (
              <div>
                <label className="block text-sm font-medium mb-1">Program ID (Optional)</label>
                <input
                  type="text"
                  value={editingAffiliate.program_id || ''}
                  onChange={(e) => setEditingAffiliate({ ...editingAffiliate, program_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="AWIN Program ID"
                />
              </div>
            )}

            {/* Website URL */}
            <div>
              <label className="block text-sm font-medium mb-1">Website URL (Optional)</label>
              <input
                type="text"
                value={editingAffiliate.website_url || ''}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, website_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://www.thalia.de"
              />
            </div>

            {/* Icon URL */}
            <div>
              <label className="block text-sm font-medium mb-1">Icon URL (Optional)</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editingAffiliate.icon_url || ''}
                  onChange={(e) => setEditingAffiliate({ ...editingAffiliate, icon_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://example.com/icon.png"
                />
                {editingAffiliate.icon_url && (
                  <img src={editingAffiliate.icon_url} alt="Icon" className="w-8 h-8 rounded" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Eigenes Icon (z.B. 64x64px PNG). Falls leer, wird das Favicon verwendet.
              </p>
            </div>

            {/* Favicon URL */}
            <div>
              <label className="block text-sm font-medium mb-1">Favicon URL (Optional)</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editingAffiliate.favicon_url || ''}
                  onChange={(e) => setEditingAffiliate({ ...editingAffiliate, favicon_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://www.google.com/s2/favicons?domain=thalia.de&sz=64"
                />
                {editingAffiliate.favicon_url && (
                  <img src={editingAffiliate.favicon_url} alt="Favicon" className="w-6 h-6" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Falls kein Icon angegeben, wird dieses Favicon als Fallback verwendet.
                Auto-URL: https://www.google.com/s2/favicons?domain=DOMAIN&sz=64
              </p>
            </div>

            {/* Link Template */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Link Template * <span className="text-xs text-gray-500">(verwende {'{isbn13}'}, {'{merchant_id}'} als Platzhalter)</span>
              </label>
              <textarea
                value={editingAffiliate.link_template || ''}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, link_template: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                placeholder="https://www.amazon.de/dp/{isbn13}?tag={merchant_id}"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Beispiele:<br />
                • Amazon: https://www.amazon.de/dp/{'{isbn13}'}?tag={'{merchant_id}'}<br />
                • Thalia: https://www.thalia.de/suche?sq={'{isbn13}'}
              </p>
              {editingAffiliate.link_template && !editingAffiliate.link_template.includes('{isbn13}') && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Warnung: Link-Template sollte {'{isbn13}'} enthalten
                </p>
              )}
            </div>

            {/* Product URL Template */}
            <div>
              <label className="block text-sm font-medium mb-1">Product URL Template (Optional)</label>
              <textarea
                value={editingAffiliate.product_url_template || ''}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, product_url_template: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                placeholder="https://www.awin1.com/cread.php?awinmid={merchant_id}&awinaffid=123&p={product_id}"
                rows={2}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
              <textarea
                value={editingAffiliate.notes || ''}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Interne Notizen..."
                rows={2}
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={editingAffiliate.display_order || 0}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingAffiliate.is_active !== false}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={saveAffiliate}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Speichern
            </button>
            <button
              onClick={() => setEditingAffiliate(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================================
  // RENDER: ASSIGNMENT CREATE MODAL
  // ==================================================================

  function renderAssignmentModal() {
    if (!showAssignmentModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Neue Buch-Affiliate-Zuordnung</h3>
            <button
              onClick={() => {
                setShowAssignmentModal(false);
                setSelectedBook(null);
                setSelectedAffiliateId(null);
                setBookSearchQuery('');
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Book Search */}
            <div>
              <label className="block text-sm font-medium mb-1">Buch *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={selectedBook ? `${selectedBook.title} by ${selectedBook.author}` : bookSearchQuery}
                  onChange={(e) => {
                    setBookSearchQuery(e.target.value);
                    searchBooks(e.target.value);
                    if (selectedBook) setSelectedBook(null);
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  placeholder="Suche nach Titel, Autor oder ISBN..."
                />
              </div>
              {bookSearchResults.length > 0 && !selectedBook && (
                <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                  {bookSearchResults.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setSelectedBook(book);
                        setBookSearchQuery('');
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
              {selectedBook && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Buch ausgewählt: {selectedBook.title}</span>
                </div>
              )}
            </div>

            {/* Affiliate Select */}
            <div>
              <label className="block text-sm font-medium mb-1">Affiliate Partner *</label>
              <select
                value={selectedAffiliateId || ''}
                onChange={(e) => setSelectedAffiliateId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Bitte wählen...</option>
                {affiliates.map((aff) => (
                  <option key={aff.id} value={aff.id}>
                    {aff.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={createAssignment}
              disabled={loading || !selectedBook || !selectedAffiliateId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Zuordnung erstellen
            </button>
            <button
              onClick={() => {
                setShowAssignmentModal(false);
                setSelectedBook(null);
                setSelectedAffiliateId(null);
                setBookSearchQuery('');
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================================
  // RENDER: ASSIGNMENT EDIT MODAL
  // ==================================================================

  function renderEditAssignmentModal() {
    if (!editingAssignment) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Buch-Affiliate-Zuordnung bearbeiten</h3>
            <button
              onClick={() => setEditingAssignment(null)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Book Info */}
            <div>
              <label className="block text-sm font-medium mb-1">Buch</label>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold">{editingAssignment.book_title}</h3>
                  <p className="text-sm text-gray-600">{editingAssignment.book_author}</p>
                </div>
              </div>
            </div>

            {/* Affiliate Info */}
            <div>
              <label className="block text-sm font-medium mb-1">Affiliate Partner</label>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                <p className="text-sm text-gray-600">{editingAssignment.affiliate_name}</p>
              </div>
            </div>

            {/* Merchant Product ID */}
            <div>
              <label className="block text-sm font-medium mb-1">Merchant Product ID</label>
              <input
                type="text"
                value={editingAssignment.merchant_product_id || ''}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, merchant_product_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="z.B. 1234567890"
              />
            </div>

            {/* External ID */}
            <div>
              <label className="block text-sm font-medium mb-1">External ID</label>
              <input
                type="text"
                value={editingAssignment.external_id || ''}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, external_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="z.B. 1234567890"
              />
            </div>

            {/* Link Override */}
            <div>
              <label className="block text-sm font-medium mb-1">Link Override</label>
              <input
                type="text"
                value={editingAssignment.link_override || ''}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, link_override: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="z.B. https://www.example.com/product/1234567890"
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={editingAssignment.display_order || 0}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingAssignment.is_active !== false}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={updateAssignment}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Speichern
            </button>
            <button
              onClick={() => setEditingAssignment(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Abbrechen
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
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('partners')}
          className={`px-4 py-2 rounded-lg ${
            view === 'partners' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <LinkIcon className="w-4 h-4 inline mr-2" />
          Affiliate-Partner
        </button>
        <button
          onClick={() => setView('assignments')}
          className={`px-4 py-2 rounded-lg ${
            view === 'assignments' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Buch-Zuordnungen
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-800">Fehler</p>
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
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-green-800">Erfolg</p>
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

      {/* Content */}
      {view === 'partners' && renderPartnersView()}
      {view === 'assignments' && renderAssignmentsView()}

      {/* Modals */}
      {renderAffiliateModal()}
      {renderAssignmentModal()}
      {renderEditAssignmentModal()}
    </div>
  );
}

export default AdminAffiliate;