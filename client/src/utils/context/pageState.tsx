/**
 * PAGE STATE MANAGEMENT
 * =======================
 * 4-State Pattern für alle Pages: Loading | Error | Empty | Success
 * 
 * REGELN:
 * 1. Jede Page mit Daten-Fetching MUSS alle 4 Zustände handhaben
 * 2. Kein "Loading forever" - immer Timeout
 * 3. Alle Property-Access muss gesichert sein
 */

import * as React from 'react';
import { AlertCircle, Loader2, BookOpen, Home } from 'lucide-react';
import { useSafeNavigate } from '../routing';

// ============================================
// LOADING STATE
// ============================================

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Lädt...' }: LoadingStateProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
      </div>
    </div>
  );
}

// ============================================
// ERROR STATE
// ============================================

interface ErrorStateProps {
  message?: string;
  details?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function ErrorState({ 
  message = 'Ein Fehler ist aufgetreten', 
  details,
  onRetry,
  showHomeButton = true 
}: ErrorStateProps) {
  const navigate = useSafeNavigate();

  return (
    <div className="min-h-[400px] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-error)' }} />
        <h2 className="text-2xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {message}
        </h2>
        {details && (
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {details}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 rounded-lg transition-all"
              style={{ 
                backgroundColor: 'var(--color-primary)', 
                color: 'white',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Erneut versuchen
            </button>
          )}
          {showHomeButton && (
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-lg transition-all flex items-center gap-2"
              style={{ 
                backgroundColor: 'var(--color-secondary)', 
                color: 'white',
                fontFamily: 'var(--font-heading)'
              }}
            >
              <Home className="w-5 h-5" />
              Zur Startseite
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  icon: Icon = BookOpen,
  title = 'Keine Daten gefunden',
  message = 'Es wurden keine Einträge gefunden.',
  action
}: EmptyStateProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Icon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
        <h2 className="text-2xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h2>
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-6 py-3 rounded-lg transition-all"
            style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'white',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// NOT FOUND (404)
// ============================================

interface NotFoundStateProps {
  resourceType?: string;
  message?: string;
}

export function NotFoundState({ 
  resourceType = 'Seite',
  message
}: NotFoundStateProps) {
  const navigate = useSafeNavigate();
  
  return (
    <div className="min-h-[400px] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div 
          className="text-8xl mb-4"
          style={{ 
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-text-tertiary)'
          }}
        >
          404
        </div>
        <h2 className="text-2xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {resourceType} nicht gefunden
        </h2>
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {message || `Die gesuchte ${resourceType.toLowerCase()} existiert nicht oder wurde entfernt.`}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg transition-all flex items-center gap-2 mx-auto"
          style={{ 
            backgroundColor: 'var(--color-primary)', 
            color: 'white',
            fontFamily: 'var(--font-heading)'
          }}
        >
          <Home className="w-5 h-5" />
          Zur Startseite
        </button>
      </div>
    </div>
  );
}

// ============================================
// PAGE STATE HOOK
// ============================================

export type PageState = 'loading' | 'error' | 'empty' | 'success';

export interface UsePageStateOptions {
  initialState?: PageState;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
}

/**
 * Hook for managing page state (4-State Pattern)
 * 
 * @example
 * const { state, setState, renderState } = usePageState();
 * 
 * useEffect(() => {
 *   fetchData()
 *     .then(data => {
 *       if (data.length === 0) {
 *         setState('empty');
 *       } else {
 *         setState('success');
 *       }
 *     })
 *     .catch(() => setState('error'));
 * }, []);
 * 
 * if (state !== 'success') {
 *   return renderState();
 * }
 * 
 * return <div>Success content...</div>;
 */
export function usePageState(options: UsePageStateOptions = {}) {
  const {
    initialState = 'loading',
    loadingMessage,
    errorMessage,
    emptyMessage
  } = options;

  const [state, setState] = React.useState<PageState>(initialState);
  const [error, setError] = React.useState<string | undefined>();

  const renderState = React.useCallback((props?: {
    onRetry?: () => void;
    action?: { label: string; onClick: () => void };
  }) => {
    switch (state) {
      case 'loading':
        return <LoadingState message={loadingMessage} />;
      case 'error':
        return <ErrorState message={errorMessage} details={error} onRetry={props?.onRetry} />;
      case 'empty':
        return <EmptyState message={emptyMessage} action={props?.action} />;
      default:
        return null;
    }
  }, [state, error, loadingMessage, errorMessage, emptyMessage]);

  return {
    state,
    setState,
    setError: (err: string) => {
      setError(err);
      setState('error');
    },
    renderState,
    isLoading: state === 'loading',
    isError: state === 'error',
    isEmpty: state === 'empty',
    isSuccess: state === 'success',
  };
}