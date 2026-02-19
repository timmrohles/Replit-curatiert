import { useAuth } from '../hooks/use-auth';
import { Eye, X } from 'lucide-react';

export function ImpersonationBanner() {
  const { user, isImpersonating, realAdmin, stopImpersonation } = useAuth();

  if (!isImpersonating || !realAdmin) return null;

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Unbekannt';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 py-2 px-4 text-sm"
      style={{ backgroundColor: '#fbbf24', color: '#1a1a1a' }}
      data-testid="impersonation-banner"
    >
      <Eye className="w-4 h-4 flex-shrink-0" />
      <span>
        Du siehst die Ansicht von <strong>{displayName}</strong> (Impersonation aktiv).
        Sensible Daten sind maskiert.
      </span>
      <button
        onClick={() => stopImpersonation()}
        className="ml-2 px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
        style={{ backgroundColor: '#1a1a1a', color: '#fbbf24' }}
        data-testid="button-stop-impersonation"
      >
        <X className="w-3 h-3" />
        Beenden
      </button>
    </div>
  );
}
