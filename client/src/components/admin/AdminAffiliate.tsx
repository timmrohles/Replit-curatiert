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
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  RefreshCw
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
  show_in_carousel: boolean;
  notes?: string | null;
  cookie_duration_days?: number;
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
  return {
    'Content-Type': 'application/json',
  };
}

// ==================================================================
// COMPONENT
// ==================================================================

export function AdminAffiliate() {
  const [view, setView] = useState<'partners' | 'assignments' | 'creator-tracking' | 'creator-orders' | 'commissions'>('partners');
  
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
  
  // Creator Tracking State
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [trackingSummary, setTrackingSummary] = useState<any>(null);
  const [trackingPagination, setTrackingPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [creatorsList, setCreatorsList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [newOrder, setNewOrder] = useState({ creatorId: '', bookId: '', isbn13: '', merchant: '', merchantCommission: '', creatorShare: '', platformShare: '', status: 'pending', notes: '' });
  
  // Commission State
  const [commissionsData, setCommissionsData] = useState<any[]>([]);
  const [commissionsSummary, setCommissionsSummary] = useState<any>(null);
  const [commissionsPagination, setCommissionsPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [commissionsFilter, setCommissionsFilter] = useState({ status: '', attribution_type: '', creator_id: '', date_from: '', date_to: '' });
  const [editingShareRate, setEditingShareRate] = useState<{ id: number; rate: string } | null>(null);
  const [referralSessions, setReferralSessions] = useState<any[]>([]);
  const [showReferralSessions, setShowReferralSessions] = useState(false);
  const [referralSessionsPagination, setReferralSessionsPagination] = useState({ page: 1, limit: 20, total: 0 });

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
    } else if (view === 'assignments') {
      fetchBookAffiliates();
      fetchAffiliates();
    } else if (view === 'creator-tracking') {
      fetchTrackingData();
      fetchCreatorsList();
    } else if (view === 'creator-orders') {
      fetchOrdersData();
      fetchCreatorsList();
    } else if (view === 'commissions') {
      fetchCommissionsData();
    }
  }, [view]);

  async function fetchAffiliates() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/admin/affiliates`, {
            credentials: 'include',
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
            credentials: 'include',
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
        { credentials: 'include', headers: getAdminHeaders() }
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

  async function fetchCommissionsData(page = 1) {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (commissionsFilter.status) params.set('status', commissionsFilter.status);
      if (commissionsFilter.attribution_type) params.set('attribution_type', commissionsFilter.attribution_type);
      if (commissionsFilter.creator_id) params.set('creator_id', commissionsFilter.creator_id);
      if (commissionsFilter.date_from) params.set('date_from', commissionsFilter.date_from);
      if (commissionsFilter.date_to) params.set('date_to', commissionsFilter.date_to);

      const response = await fetch(`${API_BASE}/admin/commissions?${params.toString()}`, { credentials: 'include', headers: getAdminHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to load commissions');
      setCommissionsData(Array.isArray(result.data) ? result.data : []);
      setCommissionsSummary(result.summary || null);
      setCommissionsPagination(result.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch (err) {
      setError(String(err));
      setCommissionsData([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReferralSessions(page = 1) {
    try {
      const response = await fetch(`${API_BASE}/admin/referral-sessions?page=${page}&limit=20`, { credentials: 'include', headers: getAdminHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to load referral sessions');
      setReferralSessions(Array.isArray(result.data) ? result.data : []);
      setReferralSessionsPagination(result.pagination || { page: 1, limit: 20, total: 0 });
    } catch (err) {
      console.error('Failed to load referral sessions:', err);
      setReferralSessions([]);
    }
  }

  async function confirmCommission(id: number) {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/commissions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: 'confirmed' }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Update failed');
      setSuccess('Provision bestaetigt');
      fetchCommissionsData(commissionsPagination.page);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function cancelCommission(id: number) {
    if (!confirm('Provision wirklich stornieren? Die Creator-Auszahlung wird auf 0 gesetzt.')) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/commissions/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: getAdminHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Stornierung fehlgeschlagen');
      setSuccess('Provision storniert');
      fetchCommissionsData(commissionsPagination.page);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function updateShareRate(id: number, newRate: number) {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/commissions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: getAdminHeaders(),
        body: JSON.stringify({ share_rate: newRate }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Update fehlgeschlagen');
      setSuccess('Share Rate aktualisiert');
      setEditingShareRate(null);
      fetchCommissionsData(commissionsPagination.page);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
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
          credentials: 'include',
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
            credentials: 'include',
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
          credentials: 'include',
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
          credentials: 'include',
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
            credentials: 'include',
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
              is_active: true,
              show_in_carousel: false
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
                  <div className="mt-2 flex items-center gap-3 text-sm flex-wrap">
                    <span className="text-gray-600">Order: {affiliate.display_order}</span>
                    <span className={affiliate.is_active ? 'text-green-600' : 'text-gray-400'}>
                      {affiliate.is_active ? '✓ Active' : '○ Inactive'}
                    </span>
                    {affiliate.show_in_carousel && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Karussell
                      </span>
                    )}
                    {!affiliate.show_in_carousel && affiliate.is_active && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                        Nur Detailseite
                      </span>
                    )}
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

            {/* Show in Carousel */}
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingAffiliate.show_in_carousel === true}
                  onChange={(e) => setEditingAffiliate({ ...editingAffiliate, show_in_carousel: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">In Buchkarussells anzeigen</label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Wenn aktiviert, erscheint dieser Partner auch in den kompakten Buchkarten und Karussells. 
                Auf der Produktdetailseite erscheinen immer alle aktiven Partner.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cookie-Laufzeit (Tage)
                <span className="text-xs text-gray-500 ml-1">(Attributionsfenster des Haendlers)</span>
              </label>
              <input
                data-testid="input-cookie-duration"
                type="number"
                min={0}
                value={editingAffiliate.cookie_duration_days ?? 30}
                onChange={(e) => setEditingAffiliate({ ...editingAffiliate, cookie_duration_days: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="30"
              />
              <p className="text-xs text-gray-500 mt-1">
                z.B. Amazon 1 Tag (24h), Thalia 30 Tage. Bestimmt, wie lange ein Klick dem Haendler zugeordnet wird.
              </p>
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
  // RENDER: COMMISSIONS VIEW
  // ==================================================================

  function renderCommissionsView() {
    return (
      <div className="space-y-6">
        {commissionsSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="commissions-summary">
            {[
              { label: 'Ausstehend', value: `${parseFloat(commissionsSummary.total_pending || 0).toFixed(2)} EUR`, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
              { label: 'Bestaetigt', value: `${parseFloat(commissionsSummary.total_confirmed || 0).toFixed(2)} EUR`, color: 'bg-green-50 border-green-200 text-green-800' },
              { label: 'Storniert', value: `${parseFloat(commissionsSummary.total_cancelled || 0).toFixed(2)} EUR`, color: 'bg-red-50 border-red-200 text-red-800' },
              { label: 'Aktive Referrals', value: String(commissionsSummary.active_referral_count || 0), color: 'bg-blue-50 border-blue-200 text-blue-800' },
            ].map((item, idx) => (
              <div key={idx} className={`p-4 rounded-lg border text-center ${item.color}`} data-testid={`summary-card-${idx}`}>
                <div className="text-xl font-bold">{item.value}</div>
                <div className="text-xs mt-1 opacity-80">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4" data-testid="commissions-filter-bar">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select
              data-testid="filter-status"
              value={commissionsFilter.status}
              onChange={(e) => setCommissionsFilter({ ...commissionsFilter, status: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="confirmed">Bestaetigt</option>
              <option value="cancelled">Storniert</option>
            </select>
            <select
              data-testid="filter-attribution-type"
              value={commissionsFilter.attribution_type}
              onChange={(e) => setCommissionsFilter({ ...commissionsFilter, attribution_type: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Alle Typen</option>
              <option value="REFERRAL">Referral</option>
              <option value="CURATION">Curation</option>
            </select>
            <input
              data-testid="filter-creator"
              type="text"
              value={commissionsFilter.creator_id}
              onChange={(e) => setCommissionsFilter({ ...commissionsFilter, creator_id: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
              placeholder="Creator ID..."
            />
            <input
              data-testid="filter-date-from"
              type="date"
              value={commissionsFilter.date_from}
              onChange={(e) => setCommissionsFilter({ ...commissionsFilter, date_from: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                data-testid="filter-date-to"
                type="date"
                value={commissionsFilter.date_to}
                onChange={(e) => setCommissionsFilter({ ...commissionsFilter, date_to: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm flex-1"
              />
              <button
                data-testid="button-apply-filters"
                onClick={() => fetchCommissionsData(1)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}

        {!loading && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="commissions-table">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-800">Provisionen ({commissionsPagination.total})</h3>
            </div>
            {commissionsData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-2">Datum</th>
                      <th className="text-left px-4 py-2">Creator</th>
                      <th className="text-left px-4 py-2">Buch</th>
                      <th className="text-center px-4 py-2">Typ</th>
                      <th className="text-right px-4 py-2">Brutto-Provision</th>
                      <th className="text-center px-4 py-2">Share Rate</th>
                      <th className="text-right px-4 py-2">Creator-Auszahlung</th>
                      <th className="text-center px-4 py-2">Status</th>
                      <th className="text-center px-4 py-2">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commissionsData.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50" data-testid={`commission-row-${c.id}`}>
                        <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                          {c.occurred_at ? new Date(c.occurred_at).toLocaleDateString('de-DE') : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-gray-800 font-medium text-xs">{c.creator_display_name || c.attributed_creator_id}</div>
                          {c.creator_slug && <div className="text-gray-400 text-xs">@{c.creator_slug}</div>}
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs font-mono">
                          {c.isbn || c.book_id || '-'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.attribution_type === 'REFERRAL'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`} data-testid={`badge-type-${c.id}`}>
                            {c.attribution_type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {parseFloat(c.commission_amount_net || 0).toFixed(2)} EUR
                        </td>
                        <td className="px-4 py-2 text-center">
                          {editingShareRate && editingShareRate.id === c.id ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                data-testid={`input-share-rate-${c.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={editingShareRate.rate}
                                onChange={(e) => setEditingShareRate({ id: editingShareRate.id, rate: e.target.value })}
                                className="w-16 px-1 py-0.5 border rounded text-xs text-center"
                              />
                              <button
                                data-testid={`button-save-share-rate-${c.id}`}
                                onClick={() => updateShareRate(c.id, parseFloat(editingShareRate.rate))}
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingShareRate(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              data-testid={`button-edit-share-rate-${c.id}`}
                              onClick={() => setEditingShareRate({ id: c.id, rate: String(parseFloat(c.share_rate || 0.5)) })}
                              className="text-xs text-gray-600 hover:text-blue-600 cursor-pointer"
                            >
                              {(parseFloat(c.share_rate || 0.5) * 100).toFixed(0)}%
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-800">
                          {parseFloat(c.creator_payout_amount || 0).toFixed(2)} EUR
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            c.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            c.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`} data-testid={`badge-status-${c.id}`}>
                            {c.status === 'confirmed' ? 'Bestaetigt' :
                             c.status === 'pending' ? 'Ausstehend' :
                             c.status === 'cancelled' ? 'Storniert' : c.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {c.status === 'pending' && (
                              <>
                                <button
                                  data-testid={`button-confirm-${c.id}`}
                                  onClick={() => confirmCommission(c.id)}
                                  className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                                  title="Bestaetigen"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  data-testid={`button-cancel-${c.id}`}
                                  onClick={() => cancelCommission(c.id)}
                                  className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                                  title="Stornieren"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {c.status === 'confirmed' && (
                              <button
                                data-testid={`button-cancel-confirmed-${c.id}`}
                                onClick={() => cancelCommission(c.id)}
                                className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                                title="Stornieren"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">Keine Provisionen vorhanden</div>
            )}
            {commissionsPagination.total > commissionsPagination.limit && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <button
                  data-testid="button-commissions-prev"
                  onClick={() => fetchCommissionsData(commissionsPagination.page - 1)}
                  disabled={commissionsPagination.page <= 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-30"
                >
                  Zurueck
                </button>
                <span className="text-sm text-gray-500">
                  Seite {commissionsPagination.page} von {commissionsPagination.totalPages || Math.ceil(commissionsPagination.total / commissionsPagination.limit)}
                </span>
                <button
                  data-testid="button-commissions-next"
                  onClick={() => fetchCommissionsData(commissionsPagination.page + 1)}
                  disabled={commissionsPagination.page * commissionsPagination.limit >= commissionsPagination.total}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-30"
                >
                  Weiter
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="referral-sessions-section">
          <button
            data-testid="button-toggle-referral-sessions"
            onClick={() => {
              const next = !showReferralSessions;
              setShowReferralSessions(next);
              if (next && referralSessions.length === 0) fetchReferralSessions();
            }}
            className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between gap-2 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Referral-Sessions</h3>
            </div>
            {showReferralSessions ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {showReferralSessions && (
            <div>
              {referralSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-2">Session ID</th>
                        <th className="text-left px-4 py-2">Creator</th>
                        <th className="text-left px-4 py-2">Erstellt</th>
                        <th className="text-left px-4 py-2">Laeuft ab</th>
                        <th className="text-center px-4 py-2">Status</th>
                        <th className="text-left px-4 py-2">Landing URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {referralSessions.map((rs: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50" data-testid={`referral-session-row-${idx}`}>
                          <td className="px-4 py-2 text-gray-400 font-mono text-xs">{rs.session_id?.substring(0, 16)}...</td>
                          <td className="px-4 py-2">
                            <div className="text-gray-800 text-xs font-medium">{rs.creator_display_name || rs.ref_creator_id}</div>
                            {rs.creator_slug && <div className="text-gray-400 text-xs">@{rs.creator_slug}</div>}
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                            {rs.first_seen_at ? new Date(rs.first_seen_at).toLocaleString('de-DE') : '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                            {rs.expires_at ? new Date(rs.expires_at).toLocaleString('de-DE') : '-'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              rs.session_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {rs.session_status === 'active' ? 'Aktiv' : 'Abgelaufen'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-400 text-xs truncate max-w-[200px]">
                            {rs.landing_url || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 text-sm">Keine Referral-Sessions vorhanden</div>
              )}
              {referralSessionsPagination.total > referralSessionsPagination.limit && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => fetchReferralSessions(referralSessionsPagination.page - 1)}
                    disabled={referralSessionsPagination.page <= 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-30"
                  >
                    Zurueck
                  </button>
                  <span className="text-sm text-gray-500">
                    Seite {referralSessionsPagination.page}
                  </span>
                  <button
                    onClick={() => fetchReferralSessions(referralSessionsPagination.page + 1)}
                    disabled={referralSessionsPagination.page * referralSessionsPagination.limit >= referralSessionsPagination.total}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-30"
                  >
                    Weiter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================================================================
  // CREATOR TRACKING FUNCTIONS
  // ==================================================================

  async function fetchTrackingData(page = 1) {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/admin/affiliate-tracking?view=clicks&page=${page}&limit=50`, { credentials: 'include', headers: getAdminHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to load tracking data');
      setTrackingData(Array.isArray(result.data) ? result.data : []);
      setTrackingSummary(result.summary || null);
      setTrackingPagination(result.pagination || { page: 1, limit: 50, total: 0 });
    } catch (err) {
      setError(String(err));
      setTrackingData([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrdersData(page = 1) {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/admin/affiliate-tracking?view=orders&page=${page}&limit=50`, { credentials: 'include', headers: getAdminHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to load orders');
      setOrdersData(Array.isArray(result.data) ? result.data : []);
      setOrdersPagination(result.pagination || { page: 1, limit: 50, total: 0 });
    } catch (err) {
      setError(String(err));
      setOrdersData([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCreatorsList() {
    try {
      const response = await fetch(`${API_BASE}/admin/affiliate-creators`, { credentials: 'include', headers: getAdminHeaders() });
      if (!response.ok) return;
      const result = await response.json();
      if (result.ok) setCreatorsList(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Failed to load creators list:', err);
    }
  }

  async function createOrder() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/admin/affiliate-orders`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify({
          creatorId: newOrder.creatorId,
          bookId: newOrder.bookId || null,
          isbn13: newOrder.isbn13 || null,
          merchant: newOrder.merchant || null,
          merchantCommission: parseFloat(newOrder.merchantCommission) || 0,
          creatorShare: parseFloat(newOrder.creatorShare) || 0,
          platformShare: parseFloat(newOrder.platformShare) || 0,
          status: newOrder.status,
          notes: newOrder.notes || null,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to create order');
      setSuccess('Bestellung erstellt');
      setShowOrderModal(false);
      setNewOrder({ creatorId: '', bookId: '', isbn13: '', merchant: '', merchantCommission: '', creatorShare: '', platformShare: '', status: 'pending', notes: '' });
      fetchOrdersData();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: number, status: string) {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/affiliate-orders/${orderId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Update failed');
      setSuccess(`Status auf "${status}" geaendert`);
      fetchOrdersData();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function renderCreatorTrackingView() {
    return (
      <div className="space-y-6">
        {trackingSummary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Klicks gesamt', value: trackingSummary.total_clicks },
              { label: 'Bestellungen', value: trackingSummary.total_orders },
              { label: 'Bestaetigt', value: trackingSummary.confirmed_orders },
              { label: 'Aktive Creator', value: trackingSummary.active_creators },
              { label: 'Provision gesamt', value: `${parseFloat(trackingSummary.total_commission || 0).toFixed(2)} EUR` },
              { label: 'Creator-Anteil', value: `${parseFloat(trackingSummary.total_creator_share || 0).toFixed(2)} EUR` },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-xl font-bold text-gray-800">{item.value}</div>
                <div className="text-xs text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {creatorsList.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Registrierte Creator ({creatorsList.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2">Creator</th>
                    <th className="text-left px-4 py-2">Slug</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-right px-4 py-2">Klicks</th>
                    <th className="text-right px-4 py-2">Bestellungen</th>
                    <th className="text-right px-4 py-2">Einnahmen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {creatorsList.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-800">
                        {c.display_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.user_id}
                      </td>
                      <td className="px-4 py-2 text-gray-500">@{c.slug || '-'}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${c.profile_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {c.profile_status || 'draft'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">{c.total_clicks}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{c.total_orders}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">{parseFloat(c.total_earnings || 0).toFixed(2)} EUR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Klick-Verlauf ({trackingPagination.total})</h3>
          </div>
          {trackingData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2">Zeitpunkt</th>
                    <th className="text-left px-4 py-2">Creator</th>
                    <th className="text-left px-4 py-2">Buch-ID</th>
                    <th className="text-left px-4 py-2">ISBN</th>
                    <th className="text-left px-4 py-2">Haendler</th>
                    <th className="text-left px-4 py-2">Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trackingData.map((click: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(click.click_timestamp).toLocaleString('de-DE')}
                      </td>
                      <td className="px-4 py-2 text-gray-800">{click.creator_name || click.creator_id}</td>
                      <td className="px-4 py-2 text-gray-500 font-mono text-xs">{click.book_id}</td>
                      <td className="px-4 py-2 text-gray-500">{click.isbn13 || '-'}</td>
                      <td className="px-4 py-2 text-gray-500">{click.merchant || '-'}</td>
                      <td className="px-4 py-2 text-gray-400 font-mono text-xs">{click.session_id?.substring(0, 12)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">Keine Klicks erfasst</div>
          )}
          {trackingPagination.total > trackingPagination.limit && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => fetchTrackingData(trackingPagination.page - 1)}
                disabled={trackingPagination.page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-30"
              >
                Zurueck
              </button>
              <span className="text-sm text-gray-500">
                Seite {trackingPagination.page} von {Math.ceil(trackingPagination.total / trackingPagination.limit)}
              </span>
              <button
                onClick={() => fetchTrackingData(trackingPagination.page + 1)}
                disabled={trackingPagination.page * trackingPagination.limit >= trackingPagination.total}
                className="px-3 py-1 text-sm border rounded disabled:opacity-30"
              >
                Weiter
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderCreatorOrdersView() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Bestellungen verwalten</h3>
          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Neue Bestellung
          </button>
        </div>

        {ordersData.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2">ID</th>
                    <th className="text-left px-4 py-2">Creator</th>
                    <th className="text-left px-4 py-2">Buch</th>
                    <th className="text-left px-4 py-2">Haendler</th>
                    <th className="text-right px-4 py-2">Provision</th>
                    <th className="text-right px-4 py-2">Creator-Anteil</th>
                    <th className="text-center px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Datum</th>
                    <th className="text-center px-4 py-2">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ordersData.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">#{order.id}</td>
                      <td className="px-4 py-2 text-gray-800">{order.creator_name || order.creator_id}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{order.isbn13 || order.book_id || '-'}</td>
                      <td className="px-4 py-2 text-gray-500">{order.merchant || '-'}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{parseFloat(order.merchant_commission || 0).toFixed(2)} EUR</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">{parseFloat(order.creator_share || 0).toFixed(2)} EUR</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(order.purchase_timestamp || order.created_at).toLocaleString('de-DE')}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                                title="Bestaetigen"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                                title="Stornieren"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {order.status === 'cancelled' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'pending')}
                              className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
                              title="Zuruecksetzen"
                            >
                              Reaktivieren
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
            Keine Bestellungen vorhanden
          </div>
        )}

        {showOrderModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Neue Bestellung erfassen</h3>
                <button onClick={() => setShowOrderModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Creator *</label>
                  <select
                    value={newOrder.creatorId}
                    onChange={(e) => setNewOrder({ ...newOrder, creatorId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Creator waehlen...</option>
                    {creatorsList.map((c: any, idx: number) => (
                      <option key={idx} value={c.user_id}>
                        {c.display_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.user_id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                    <input
                      type="text"
                      value={newOrder.isbn13}
                      onChange={(e) => setNewOrder({ ...newOrder, isbn13: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="9783518420002"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Haendler</label>
                    <input
                      type="text"
                      value={newOrder.merchant}
                      onChange={(e) => setNewOrder({ ...newOrder, merchant: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="z.B. thalia"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provision (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newOrder.merchantCommission}
                      onChange={(e) => setNewOrder({ ...newOrder, merchantCommission: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Creator-Anteil</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newOrder.creatorShare}
                      onChange={(e) => setNewOrder({ ...newOrder, creatorShare: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plattform-Anteil</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newOrder.platformShare}
                      onChange={(e) => setNewOrder({ ...newOrder, platformShare: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="pending">Ausstehend</option>
                    <option value="confirmed">Bestaetigt</option>
                    <option value="cancelled">Storniert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
                  <textarea
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Optionale Notizen..."
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={createOrder}
                    disabled={loading || !newOrder.creatorId}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Erstellen
                  </button>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
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
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
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
        <button
          onClick={() => setView('creator-tracking')}
          className={`px-4 py-2 rounded-lg ${
            view === 'creator-tracking'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Creator-Tracking
        </button>
        <button
          onClick={() => setView('creator-orders')}
          className={`px-4 py-2 rounded-lg ${
            view === 'creator-orders'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Bestellungen
        </button>
        <button
          data-testid="tab-commissions"
          onClick={() => setView('commissions')}
          className={`px-4 py-2 rounded-lg ${
            view === 'commissions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Provisionen
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
      {view === 'creator-tracking' && renderCreatorTrackingView()}
      {view === 'creator-orders' && renderCreatorOrdersView()}
      {view === 'commissions' && renderCommissionsView()}

      {/* Modals */}
      {renderAffiliateModal()}
      {renderAssignmentModal()}
      {renderEditAssignmentModal()}
    </div>
  );
}

export default AdminAffiliate;