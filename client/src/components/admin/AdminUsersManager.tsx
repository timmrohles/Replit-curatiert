import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Shield, ShieldCheck, User, UserX, Trash2, Eye } from 'lucide-react';
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

interface UsersResponse {
  users: UserRecord[];
  total: number;
  page: number;
  totalPages: number;
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Benutzer',
  admin: 'Admin',
  super_admin: 'Super-Admin',
};

const ROLE_COLORS: Record<string, string> = {
  user: '#6b7280',
  admin: '#2563eb',
  super_admin: '#dc2626',
};

export function AdminUsersManager() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
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
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
    if (!confirm('Benutzer unwiderruflich loschen?')) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) await fetchUsers();
      else {
        const err = await res.json();
        alert(err.message || 'Fehler beim Loschen');
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <ShieldCheck className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div data-testid="admin-users-manager">
      <h2 className="text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
        Benutzerverwaltung
      </h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Name oder E-Mail suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            data-testid="input-user-search"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4">Benutzer</th>
                  <th className="pb-2 pr-4">E-Mail</th>
                  <th className="pb-2 pr-4">Rolle</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Erstellt</th>
                  <th className="pb-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50" data-testid={`row-user-${u.id}`}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {u.profileImageUrl ? (
                          <img src={u.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            {(u.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">
                          {u.displayName || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unbenannt'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{u.email || '-'}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        disabled={actionLoading === u.id}
                        className="border rounded px-2 py-1 text-xs font-medium"
                        style={{ color: ROLE_COLORS[u.role] || '#6b7280' }}
                        data-testid={`select-role-${u.id}`}
                      >
                        <option value="user">Benutzer</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super-Admin</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => toggleStatus(u.id, !u.isActive)}
                        disabled={actionLoading === u.id}
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: u.isActive ? '#dcfce7' : '#fee2e2',
                          color: u.isActive ? '#166534' : '#991b1b',
                        }}
                        data-testid={`button-toggle-status-${u.id}`}
                      >
                        {u.isActive ? 'Aktiv' : 'Deaktiviert'}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('de-DE') : '-'}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {isSuperAdmin && u.id !== currentUser?.id && (
                          <button
                            onClick={() => startImpersonation(u.id)}
                            disabled={actionLoading === u.id}
                            className="p-1 rounded hover:bg-blue-50 text-blue-500"
                            title="Als Benutzer anmelden (Impersonieren)"
                            data-testid={`button-impersonate-user-${u.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={actionLoading === u.id}
                          className="p-1 rounded hover:bg-red-50 text-red-500"
                          title="Benutzer loschen"
                          data-testid={`button-delete-user-${u.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"
                data-testid="button-users-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Seite {data.page} von {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"
                data-testid="button-users-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
