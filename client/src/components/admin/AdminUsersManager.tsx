import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Shield, ShieldCheck, User, UserX, Trash2, Eye, Users, ArrowUpDown, ArrowUp, ArrowDown, UserCheck, UserMinus } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';

interface UserRecord {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  isActive: boolean;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  superAdmins: number;
}

interface UsersResponse {
  users: UserRecord[];
  total: number;
  page: number;
  totalPages: number;
  stats?: UserStats;
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Benutzer',
  admin: 'Admin',
  super_admin: 'Super-Admin',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  user: { bg: '#f3f4f6', text: '#374151' },
  admin: { bg: '#dbeafe', text: '#1e40af' },
  super_admin: { bg: '#fce7f3', text: '#9d174d' },
};

type SortField = 'created_at' | 'name' | 'email' | 'role';
type SortOrder = 'asc' | 'desc';

export function AdminUsersManager() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25', sort: sortField, order: sortOrder });
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, sortField, sortOrder]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'created_at' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const updateRole = async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) await fetchUsers();
      else {
        const err = await res.json();
        alert(err.message || 'Fehler beim Aktualisieren der Rolle');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) await fetchUsers();
      else {
        const err = await res.json();
        alert(err.message || 'Fehler beim Statuswechsel');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Benutzer unwiderruflich löschen?')) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) await fetchUsers();
      else {
        const err = await res.json();
        alert(err.message || 'Fehler beim Löschen');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const startImpersonation = async (userId: string) => {
    if (!confirm('Möchtest du diesen Benutzer wirklich impersonieren? Sensible Daten (IBAN, Steuer etc.) werden maskiert.')) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/impersonate/${userId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const err = await res.json();
        alert(err.message || 'Impersonation fehlgeschlagen');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const stats = data?.stats;

  return (
    <div data-testid="admin-users-manager">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg p-4" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" style={{ color: '#0284c7' }} />
              <span className="text-xs font-medium" style={{ color: '#0369a1' }}>Gesamt</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#0c4a6e', fontFamily: 'Fjalla One' }} data-testid="text-stat-total">{stats.total}</span>
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4" style={{ color: '#16a34a' }} />
              <span className="text-xs font-medium" style={{ color: '#15803d' }}>Aktiv</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#14532d', fontFamily: 'Fjalla One' }} data-testid="text-stat-active">{stats.active}</span>
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <div className="flex items-center gap-2 mb-1">
              <UserMinus className="w-4 h-4" style={{ color: '#dc2626' }} />
              <span className="text-xs font-medium" style={{ color: '#b91c1c' }}>Deaktiviert</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#7f1d1d', fontFamily: 'Fjalla One' }} data-testid="text-stat-inactive">{stats.inactive}</span>
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: '#fdf4ff', border: '1px solid #e9d5ff' }}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4" style={{ color: '#9333ea' }} />
              <span className="text-xs font-medium" style={{ color: '#7e22ce' }}>Admins</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#581c87', fontFamily: 'Fjalla One' }} data-testid="text-stat-admins">{stats.admins + stats.superAdmins}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Name oder E-Mail suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            style={{ borderColor: '#d1d5db' }}
            data-testid="input-user-search"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: '#d1d5db' }}
          data-testid="select-role-filter"
        >
          <option value="all">Alle Rollen</option>
          <option value="user">Benutzer</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super-Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: '#d1d5db' }}
          data-testid="select-status-filter"
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Deaktiviert</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Lädt Benutzer...</div>
      ) : !data || data.users.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Keine Benutzer gefunden.</div>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-2" data-testid="text-users-count">
            {data.total} Benutzer gefunden
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-users">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: '#e5e7eb' }}>
                  <th className="pb-2 pr-4">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide" style={{ color: '#6b7280' }} data-testid="button-sort-name">
                      Benutzer <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="pb-2 pr-4">
                    <button onClick={() => toggleSort('email')} className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide" style={{ color: '#6b7280' }} data-testid="button-sort-email">
                      E-Mail <SortIcon field="email" />
                    </button>
                  </th>
                  <th className="pb-2 pr-4">
                    <button onClick={() => toggleSort('role')} className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide" style={{ color: '#6b7280' }} data-testid="button-sort-role">
                      Rolle <SortIcon field="role" />
                    </button>
                  </th>
                  <th className="pb-2 pr-4 font-semibold text-xs uppercase tracking-wide" style={{ color: '#6b7280' }}>Status</th>
                  <th className="pb-2 pr-4">
                    <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide" style={{ color: '#6b7280' }} data-testid="button-sort-date">
                      Erstellt <SortIcon field="created_at" />
                    </button>
                  </th>
                  <th className="pb-2 font-semibold text-xs uppercase tracking-wide" style={{ color: '#6b7280' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-b" style={{ borderColor: '#f3f4f6' }} data-testid={`row-user-${u.id}`}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        {u.profileImageUrl ? (
                          <img src={u.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#e5e7eb', color: '#6b7280' }}>
                            {(u.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate" style={{ color: '#1f2937' }}>
                            {u.displayName || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unbenannt'}
                          </div>
                          <div className="text-xs truncate" style={{ color: '#9ca3af' }}>ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4" style={{ color: '#6b7280' }}>{u.email || '-'}</td>
                    <td className="py-3 pr-4">
                      {isSuperAdmin && u.id !== currentUser?.id ? (
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          disabled={actionLoading === u.id}
                          className="border rounded-md px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: ROLE_COLORS[u.role]?.bg || '#f3f4f6',
                            color: ROLE_COLORS[u.role]?.text || '#374151',
                            borderColor: 'transparent',
                          }}
                          data-testid={`select-role-${u.id}`}
                        >
                          <option value="user">Benutzer</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super-Admin</option>
                        </select>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                          style={{
                            backgroundColor: ROLE_COLORS[u.role]?.bg || '#f3f4f6',
                            color: ROLE_COLORS[u.role]?.text || '#374151',
                          }}
                        >
                          {u.role === 'super_admin' && <ShieldCheck className="w-3 h-3" />}
                          {u.role === 'admin' && <Shield className="w-3 h-3" />}
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => toggleStatus(u.id, !u.isActive)}
                        disabled={actionLoading === u.id || u.id === currentUser?.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: u.isActive ? '#dcfce7' : '#fee2e2',
                          color: u.isActive ? '#166534' : '#991b1b',
                          opacity: u.id === currentUser?.id ? 0.5 : 1,
                          cursor: u.id === currentUser?.id ? 'default' : 'pointer',
                        }}
                        data-testid={`button-toggle-status-${u.id}`}
                      >
                        {u.isActive ? 'Aktiv' : 'Deaktiviert'}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: '#9ca3af' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {isSuperAdmin && u.id !== currentUser?.id && (
                          <button
                            onClick={() => startImpersonation(u.id)}
                            disabled={actionLoading === u.id}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: '#3b82f6' }}
                            title="Als Benutzer anmelden (Impersonieren)"
                            data-testid={`button-impersonate-user-${u.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {isSuperAdmin && u.id !== currentUser?.id && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: '#ef4444' }}
                            title="Benutzer löschen"
                            data-testid={`button-delete-user-${u.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>
                Seite {data.page} von {data.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-md text-sm border disabled:opacity-30"
                  style={{ borderColor: '#d1d5db', color: '#374151' }}
                  data-testid="button-users-prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="px-3 py-1.5 rounded-md text-sm border disabled:opacity-30"
                  style={{ borderColor: '#d1d5db', color: '#374151' }}
                  data-testid="button-users-next-page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
