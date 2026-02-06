import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { DSText } from './DSTypography';

interface DSToastProps {
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  duration?: number;
}

export function DSToast({
  type = 'info',
  title,
  message,
  onClose,
}: DSToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const styles = {
    success: 'bg-[var(--ds-success-light)] border-[var(--ds-success)] text-[var(--ds-success-dark)]',
    error: 'bg-[var(--ds-error-light)] border-[var(--ds-error)] text-[var(--ds-error-dark)]',
    info: 'bg-[var(--ds-info-light)] border-[var(--ds-info)] text-[var(--ds-info-dark)]',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-[var(--ds-radius-md)] border shadow-[var(--ds-shadow-lg)] max-w-md ${styles[type]}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      
      <div className="flex-1 min-w-0">
        <DSText variant="label" as="div" className="mb-0.5">
          {title}
        </DSText>
        {message && (
          <DSText variant="caption" as="div">
            {message}
          </DSText>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity"
          aria-label="Toast schließen"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Toast Container for positioning
export function DSToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-[var(--ds-z-tooltip)] space-y-3">
      {children}
    </div>
  );
}
