import { useState, useEffect } from 'react';
import { Check, X, Clock, UserCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ModuleRequest {
  userId: string;
  moduleKey: string;
  requestedAt: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ModuleInfo {
  label: string;
  description: string;
  category: 'creator' | 'author';
  requiresApproval: boolean;
}

const API_BASE = '/api';

export function UserModulesManager() {
  const [requests, setRequests] = useState<ModuleRequest[]>([]);
  const [catalog, setCatalog] = useState<Record<string, ModuleInfo>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load pending requests
      const reqRes = await fetch(`${API_BASE}/admin/modules/requests`, {
        headers: { }
      });
      const reqData = await reqRes.json();
      
      // Load module catalog
      const catRes = await fetch(`${API_BASE}/modules/catalog`, {
        headers: { }
      });
      const catData = await catRes.json();
      
      if (reqData.success) setRequests(reqData.data);
      if (catData.success) setCatalog(catData.data);
    } catch (error) {
      console.error('Error loading module data:', error);
      toast.error('Fehler beim Laden der Modul-Anfragen');
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (request: ModuleRequest) => {
    setProcessingId(`${request.userId}-${request.moduleKey}`);
    try {
      const res = await fetch(`${API_BASE}/admin/modules/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: request.userId,
          moduleKey: request.moduleKey,
          approvedBy: 'admin', // TODO: Get from auth context
          notes: 'Approved via Admin UI'
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Modul "${catalog[request.moduleKey]?.label || request.moduleKey}" wurde freigeschaltet`);
        loadData();
      } else {
        toast.error(data.error || 'Fehler beim Freischalten');
      }
    } catch (error) {
      console.error('Error approving module:', error);
      toast.error('Fehler beim Freischalten des Moduls');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (request: ModuleRequest) => {
    const reason = prompt('Grund für Ablehnung (optional):');
    if (reason === null) return; // User cancelled
    
    setProcessingId(`${request.userId}-${request.moduleKey}`);
    try {
      const res = await fetch(`${API_BASE}/admin/modules/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: request.userId,
          moduleKey: request.moduleKey,
          rejectedBy: 'admin', // TODO: Get from auth context
          reason
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Anfrage wurde abgelehnt');
        loadData();
      } else {
        toast.error(data.error || 'Fehler beim Ablehnen');
      }
    } catch (error) {
      console.error('Error rejecting module:', error);
      toast.error('Fehler beim Ablehnen der Anfrage');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryBadge = (category: 'creator' | 'author') => {
    if (category === 'creator') {
      return (
        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
          Creator
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
        Autor
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#247ba0' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Modul-Anfragen
          </h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Verwalte Anfragen für Creator- und Autoren-Module
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
          <Clock className="w-5 h-5" style={{ color: '#6B7280' }} />
          <span className="text-sm" style={{ color: '#3A3A3A' }}>
            {requests.length} {requests.length === 1 ? 'Anfrage' : 'Anfragen'}
          </span>
        </div>
      </div>

      {/* Module Catalog Overview */}
      <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: '#E5E7EB' }}>
        <div className="p-6">
          <h3 className="mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Verfügbare Module
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(catalog).map(([key, info]) => (
              <div 
                key={key}
                className="p-4 rounded-lg border"
                style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" style={{ color: '#247ba0' }} />
                    <span className="font-medium" style={{ color: '#3A3A3A' }}>
                      {info.label}
                    </span>
                  </div>
                  {getCategoryBadge(info.category)}
                </div>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border text-center py-12" style={{ borderColor: '#E5E7EB' }}>
          <UserCheck className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
          <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Keine offenen Anfragen
          </h3>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Aktuell gibt es keine ausstehenden Modul-Anfragen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const moduleInfo = catalog[request.moduleKey];
            const isProcessing = processingId === `${request.userId}-${request.moduleKey}`;
            
            return (
              <div 
                key={`${request.userId}-${request.moduleKey}`}
                className="bg-white rounded-lg shadow-sm border p-6"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                        {moduleInfo?.label || request.moduleKey}
                      </h3>
                      {moduleInfo && getCategoryBadge(moduleInfo.category)}
                    </div>
                    <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                      User ID: <span className="font-mono">{request.userId}</span>
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      Angefragt am {formatDate(request.requestedAt)}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                  <p className="text-sm mb-1" style={{ color: '#6B7280', fontWeight: 500 }}>
                    Begründung:
                  </p>
                  <p className="text-sm" style={{ color: '#3A3A3A' }}>
                    {request.reason}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => approveRequest(request)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                  >
                    <Check className="w-4 h-4" />
                    {isProcessing ? 'Wird verarbeitet...' : 'Freischalten'}
                  </button>
                  <button
                    onClick={() => rejectRequest(request)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                  >
                    <X className="w-4 h-4" />
                    Ablehnen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}