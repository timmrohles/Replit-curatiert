import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, RefreshCw, BookOpen } from 'lucide-react';

const API_BASE = '/api';

interface AuthorRequestItem {
  id: number;
  user_id: string;
  requested_name: string;
  onix_match_name: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  decision_by: string | null;
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
}

export function AdminAuthorRequests() {
  const [requests, setRequests] = useState<AuthorRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});

  const getAdminToken = () => {
    return localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '';
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/author-requests?status=${statusFilter}`, {
            credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok) {
        setRequests(data.data || []);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/admin/author-requests/${id}/approve`, {
            credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteInputs[id] || '' }),
      });
      const data = await res.json();
      if (data.ok) {
        loadRequests();
      }
    } catch { /* ignore */ } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/admin/author-requests/${id}/reject`, {
            credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteInputs[id] || '' }),
      });
      const data = await res.json();
      if (data.ok) {
        loadRequests();
      }
    } catch { /* ignore */ } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Autoren-Anträge
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRequests}
            className="p-2 rounded-lg border transition-colors"
            style={{ borderColor: '#D1D5DB' }}
            data-testid="button-refresh-author-requests"
          >
            <RefreshCw className="w-4 h-4" style={{ color: '#6B7280' }} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['pending', 'approved', 'rejected'] as const).map((status) => {
          const labels = { pending: 'Offen', approved: 'Genehmigt', rejected: 'Abgelehnt' };
          const colors = {
            pending: { active: '#F59E0B', bg: '#FFFBEB' },
            approved: { active: '#16A34A', bg: '#F0FDF4' },
            rejected: { active: '#DC2626', bg: '#FEF2F2' },
          };
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? colors[status].bg : '#F9FAFB',
                color: isActive ? colors[status].active : '#6B7280',
                border: `1px solid ${isActive ? colors[status].active : '#E5E7EB'}`,
              }}
              data-testid={`filter-author-${status}`}
            >
              {labels[status]}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Keine Anträge mit Status "{statusFilter === 'pending' ? 'offen' : statusFilter === 'approved' ? 'genehmigt' : 'abgelehnt'}"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-lg border p-5"
              style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
              data-testid={`author-request-${req.id}`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: '#1F2937' }}>
                      {req.requested_name}
                    </span>
                    {req.onix_match_name && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}
                      >
                        ONIX: {req.onix_match_name}
                      </span>
                    )}
                    {!req.onix_match_name && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}
                      >
                        Kein ONIX-Match
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: '#9CA3AF' }}>
                    <span>User: {req.user_id}</span>
                    <span>Eingereicht: {formatDate(req.created_at)}</span>
                  </div>

                  {req.message && (
                    <p className="text-sm mt-2 p-2 rounded" style={{ backgroundColor: '#F9FAFB', color: '#4B5563' }}>
                      {req.message}
                    </p>
                  )}

                  {req.decision_note && (
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                      Anmerkung: {req.decision_note}
                    </p>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <input
                      type="text"
                      placeholder="Notiz (optional)"
                      value={noteInputs[req.id] || ''}
                      onChange={(e) => setNoteInputs((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      className="px-3 py-1.5 rounded border text-xs w-48"
                      style={{ borderColor: '#D1D5DB' }}
                      data-testid={`input-note-${req.id}`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoading === req.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                        style={{ backgroundColor: actionLoading === req.id ? '#9CA3AF' : '#16A34A' }}
                        data-testid={`button-approve-${req.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Genehmigen
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={actionLoading === req.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                        style={{ backgroundColor: actionLoading === req.id ? '#9CA3AF' : '#DC2626' }}
                        data-testid={`button-reject-${req.id}`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Ablehnen
                      </button>
                    </div>
                  </div>
                )}

                {req.status !== 'pending' && (
                  <div className="flex-shrink-0">
                    {req.status === 'approved' ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#16A34A' }}>
                        <CheckCircle className="w-4 h-4" />
                        Genehmigt
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#DC2626' }}>
                        <XCircle className="w-4 h-4" />
                        Abgelehnt
                      </span>
                    )}
                    {req.decided_at && (
                      <span className="text-xs block mt-1" style={{ color: '#9CA3AF' }}>
                        {formatDate(req.decided_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}