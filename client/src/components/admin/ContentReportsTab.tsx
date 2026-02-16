import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader } from 'lucide-react';

interface ContentReport {
  id: number;
  content_type: string;
  content_id: number;
  reason: string;
  details: string | null;
  status: 'open' | 'reviewed' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  reporter_id: string | null;
}

export function ContentReportsTab() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('admin_neon_token');
      if (!token) {
        setError('Authentifizierung erforderlich');
        return;
      }

      const response = await fetch('/api/admin/content-reports', {
        headers: {
          'X-Admin-Token': token,
        },
      });

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }

      const data = await response.json();
      setReports(data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Laden der Meldungen';
      setError(message);
      console.error('Error loading content reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const updateReportStatus = async (reportId: number, newStatus: 'reviewed' | 'dismissed') => {
    setUpdating(reportId);
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('admin_neon_token');
      if (!token) {
        setError('Authentifizierung erforderlich');
        return;
      }

      const response = await fetch(`/api/admin/content-reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          reviewedBy: 'admin',
        }),
      });

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }

      // Update local state optimistically
      setReports(reports.map(r =>
        r.id === reportId
          ? { ...r, status: newStatus, reviewed_by: 'admin', reviewed_at: new Date().toISOString() }
          : r
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren';
      setError(message);
      console.error('Error updating report:', err);
      // Reload to sync with server
      await loadReports();
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'reviewed':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Offen';
      case 'reviewed':
        return 'Geprüft';
      case 'dismissed':
        return 'Abgelehnt';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#3A3A3A' }}>
          Inhaltsmeldungen
        </h2>
        <button
          onClick={loadReports}
          disabled={loading}
          className="px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            color: '#3A3A3A',
            border: '1px solid rgba(255, 193, 7, 0.5)',
          }}
          data-testid="button-refresh-reports"
        >
          <RefreshCw className="w-4 h-4" />
          Aktualisieren
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex items-start gap-3"
          style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}
          data-testid="alert-error"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Fehler</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin" style={{ color: '#FFC107' }} />
          <span className="ml-3" style={{ color: '#666666' }}>
            Lade Meldungen...
          </span>
        </div>
      ) : (
        <>
          {/* Reports Count */}
          <div className="mb-4 text-sm" style={{ color: '#666666' }}>
            {reports.length === 0 ? (
              <p>Keine Meldungen vorhanden</p>
            ) : (
              <p>
                {reports.length} Meldung{reports.length !== 1 ? 'en' : ''}
                {' · '}
                {reports.filter(r => r.status === 'open').length} offen
                {' · '}
                {reports.filter(r => r.status === 'reviewed').length} geprüft
                {' · '}
                {reports.filter(r => r.status === 'dismissed').length} abgelehnt
              </p>
            )}
          </div>

          {/* Reports Table */}
          {reports.length > 0 && (
            <div className="overflow-x-auto border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      ID
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Typ
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Inhalt-ID
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Grund
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Details
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Eingereicht am
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: '#3A3A3A' }}>
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr
                      key={report.id}
                      style={{
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                      }}
                      data-testid={`row-report-${report.id}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#666666' }}>
                        {report.id}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#3A3A3A' }}>
                        {report.content_type}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#666666' }}>
                        {report.content_id}
                      </td>
                      <td className="px-4 py-3 max-w-xs" style={{ color: '#3A3A3A' }}>
                        {report.reason}
                      </td>
                      <td
                        className="px-4 py-3 max-w-xs text-xs"
                        style={{ color: '#666666' }}
                        title={report.details || ''}
                      >
                        {report.details ? report.details.substring(0, 50) + (report.details.length > 50 ? '...' : '') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            report.status
                          )}`}
                          data-testid={`status-${report.id}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#666666' }}>
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {report.status === 'open' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateReportStatus(report.id, 'reviewed')}
                              disabled={updating === report.id}
                              className="px-3 py-1 rounded transition-colors text-xs font-medium inline-flex items-center gap-1"
                              style={{
                                backgroundColor: updating === report.id ? '#E5E7EB' : '#D1FAE5',
                                color: updating === report.id ? '#9CA3AF' : '#065F46',
                                border: '1px solid #A7F3D0',
                              }}
                              data-testid={`button-review-${report.id}`}
                            >
                              {updating === report.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Geprüft
                            </button>
                            <button
                              onClick={() => updateReportStatus(report.id, 'dismissed')}
                              disabled={updating === report.id}
                              className="px-3 py-1 rounded transition-colors text-xs font-medium inline-flex items-center gap-1"
                              style={{
                                backgroundColor: updating === report.id ? '#E5E7EB' : '#FEE2E2',
                                color: updating === report.id ? '#9CA3AF' : '#991B1B',
                                border: '1px solid #FECACA',
                              }}
                              data-testid={`button-dismiss-${report.id}`}
                            >
                              {updating === report.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              Ablehnen
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: '#9CA3AF' }}>
                            {report.reviewed_by ? `von ${report.reviewed_by}` : 'Verarbeitet'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ContentReportsTab;
