import { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle, Clock, XCircle, BookOpen, Send, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';

const API_BASE = '/api';

interface OnixAuthor {
  name: string;
  book_count: number;
}

interface AuthorRequestData {
  id: number;
  user_id: string;
  requested_name: string;
  onix_match_name: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
}

interface AuthorRequestProps {
  userId?: string;
}

export function AuthorRequest({ userId: userIdProp }: AuthorRequestProps) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const userId = userIdProp || authUser?.id || 'demo-user-123';
  const [step, setStep] = useState<'loading' | 'check-status' | 'search' | 'form' | 'submitted'>('loading');
  const [existingRequest, setExistingRequest] = useState<AuthorRequestData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OnixAuthor[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<OnixAuthor | null>(null);
  const [notInDatabase, setNotInDatabase] = useState(false);
  const [requestedName, setRequestedName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    checkExistingRequest();
  }, [userId]);

  const checkExistingRequest = async () => {
    try {
      const res = await fetch(`${API_BASE}/author-requests/status?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.ok && data.data) {
        setExistingRequest(data.data);
        setStep('check-status');
      } else {
        setStep('search');
      }
    } catch {
      setStep('search');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedAuthor(null);
    setNotInDatabase(false);
    setError('');

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/authors/search-onix?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.ok) {
          setSearchResults(data.data || []);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectAuthor = (author: OnixAuthor) => {
    setSelectedAuthor(author);
    setRequestedName(author.name);
    setNotInDatabase(false);
    setStep('form');
  };

  const handleNotInDatabase = () => {
    setNotInDatabase(true);
    setSelectedAuthor(null);
    setRequestedName(searchQuery.trim());
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!requestedName.trim()) {
      setError('Bitte gib deinen Autorennamen ein.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/author-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          requestedName: requestedName.trim(),
          onixMatchName: selectedAuthor ? selectedAuthor.name : null,
          message: message.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setExistingRequest(data.data);
        setStep('submitted');
      } else {
        setError(data.error || 'Antrag konnte nicht erstellt werden.');
      }
    } catch {
      setError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewRequest = () => {
    setExistingRequest(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedAuthor(null);
    setNotInDatabase(false);
    setRequestedName('');
    setMessage('');
    setError('');
    setStep('search');
  };

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'check-status' && existingRequest) {
    return <RequestStatusView request={existingRequest} onNewRequest={handleNewRequest} />;
  }

  if (step === 'submitted') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-lg border p-6 text-center" style={{ borderColor: '#E5E7EB', backgroundColor: '#F0FDF4' }}>
          <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#16A34A' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#15803D' }}>Antrag eingereicht</h3>
          <p className="text-sm" style={{ color: '#166534' }}>
            Dein Antrag auf Autoren-Zugang wurde erfolgreich eingereicht.
            Wir prüfen deinen Antrag und melden uns bei dir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.authorRequestTitle', 'Autor:in werden')}
        description={t('dashboardPages.authorRequestDesc', 'Suche deinen Namen in unserer Buchdatenbank. Falls du dort gelistet bist, können wir dein Profil mit deinen Büchern verknüpfen.')}
      />

      {step === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Autorenname eingeben..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}
              data-testid="input-author-search"
              autoFocus
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <div className="px-4 py-2 text-xs uppercase tracking-wider" style={{ backgroundColor: '#F9FAFB', color: '#6B7280' }}>
                Gefundene Autoren in der Datenbank
              </div>
              <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
                {searchResults.map((author) => (
                  <button
                    key={author.name}
                    onClick={() => selectAuthor(author)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                    style={{ backgroundColor: '#FFFFFF' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    data-testid={`button-select-author-${author.name}`}
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#247ba0' }} />
                      <div>
                        <span className="text-sm font-medium" style={{ color: '#1F2937' }}>{author.name}</span>
                        <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>
                          {author.book_count} {Number(author.book_count) === 1 ? 'Buch' : 'Bücher'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                      Auswählen
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <div className="rounded-lg border p-4" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFBEB' }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#92400E' }}>
                    Kein Eintrag gefunden
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#A16207' }}>
                    Kein Autor mit diesem Namen in unserer Datenbank. Du kannst trotzdem einen Antrag stellen – 
                    das Matching erfolgt dann automatisch, sobald ein Buch von dir veröffentlicht wird.
                  </p>
                </div>
              </div>
            </div>
          )}

          {searchQuery.trim().length >= 2 && !searching && (
            <button
              onClick={handleNotInDatabase}
              className="w-full py-3 rounded-lg border text-sm font-medium transition-colors"
              style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              data-testid="button-not-in-database"
            >
              Ich bin noch nicht in der Datenbank gelistet
            </button>
          )}
        </div>
      )}

      {step === 'form' && (
        <div className="space-y-4">
          {selectedAuthor && (
            <div className="rounded-lg border p-4 flex items-center gap-3" style={{ borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }}>
              <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#16A34A' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#15803D' }}>
                  Match gefunden: {selectedAuthor.name}
                </p>
                <p className="text-xs" style={{ color: '#166534' }}>
                  {selectedAuthor.book_count} {Number(selectedAuthor.book_count) === 1 ? 'Buch' : 'Bücher'} in der Datenbank.
                  Nach Freischaltung kannst du dein Autorenprofil bearbeiten.
                </p>
              </div>
            </div>
          )}

          {notInDatabase && (
            <div className="rounded-lg border p-4 flex items-center gap-3" style={{ borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#D97706' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#92400E' }}>
                  Neuer Autor
                </p>
                <p className="text-xs" style={{ color: '#A16207' }}>
                  Dein Profil wird neu angelegt. Ein automatisches Matching erfolgt, sobald ein Buch von dir über ONIX veröffentlicht wird.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
              Autorenname *
            </label>
            <input
              type="text"
              value={requestedName}
              onChange={(e) => setRequestedName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}
              placeholder="Dein Autorenname"
              data-testid="input-author-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
              Nachricht (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}
              placeholder="z.B. Verlag, Genre, oder weitere Informationen..."
              data-testid="input-author-message"
            />
          </div>

          {error && (
            <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: '#FEF2F2' }}>
              <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#DC2626' }} />
              <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStep('search'); setSelectedAuthor(null); setNotInDatabase(false); }}
              className="px-4 py-2.5 rounded-lg border text-sm font-medium"
              style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
              data-testid="button-back-to-search"
            >
              Zurück
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !requestedName.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{
                backgroundColor: submitting || !requestedName.trim() ? '#9CA3AF' : '#247ba0',
                cursor: submitting || !requestedName.trim() ? 'not-allowed' : 'pointer',
              }}
              data-testid="button-submit-author-request"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Antrag einreichen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestStatusView({ request, onNewRequest }: { request: AuthorRequestData; onNewRequest: () => void }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      title: 'Antrag wird geprüft',
      description: 'Dein Antrag auf Autoren-Zugang wird gerade von unserem Team bearbeitet. Wir melden uns bei dir.',
    },
    approved: {
      icon: CheckCircle,
      color: '#16A34A',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      title: 'Zugang freigeschaltet',
      description: 'Dein Autoren-Zugang wurde freigeschaltet. Du findest deine Autoren-Funktionen im Menü unter "Autor".',
    },
    rejected: {
      icon: XCircle,
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      title: 'Antrag abgelehnt',
      description: 'Dein Antrag auf Autoren-Zugang wurde leider abgelehnt.',
    },
  };

  const config = statusConfig[request.status];
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: '#1F2937' }} data-testid="text-author-status-title">
        Autoren-Zugang
      </h2>

      <div className="rounded-lg border p-6" style={{ borderColor: config.border, backgroundColor: config.bg }}>
        <div className="flex items-start gap-4">
          <StatusIcon className="w-8 h-8 flex-shrink-0" style={{ color: config.color }} />
          <div>
            <h3 className="font-semibold mb-1" style={{ color: config.color }}>{config.title}</h3>
            <p className="text-sm" style={{ color: '#4B5563' }}>{config.description}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Autorenname</span>
          <span className="text-sm font-medium" style={{ color: '#1F2937' }}>{request.requested_name}</span>
        </div>
        {request.onix_match_name && (
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>ONIX-Match</span>
            <span className="text-sm" style={{ color: '#247ba0' }}>{request.onix_match_name}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Eingereicht am</span>
          <span className="text-sm" style={{ color: '#6B7280' }}>{formatDate(request.created_at)}</span>
        </div>
        {request.decided_at && (
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Entschieden am</span>
            <span className="text-sm" style={{ color: '#6B7280' }}>{formatDate(request.decided_at)}</span>
          </div>
        )}
        {request.decision_note && (
          <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
            <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: '#9CA3AF' }}>Anmerkung</span>
            <p className="text-sm" style={{ color: '#4B5563' }}>{request.decision_note}</p>
          </div>
        )}
      </div>

      {request.status === 'rejected' && (
        <button
          onClick={onNewRequest}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: '#247ba0' }}
          data-testid="button-new-author-request"
        >
          Neuen Antrag stellen
        </button>
      )}
    </div>
  );
}