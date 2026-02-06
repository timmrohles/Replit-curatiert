import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { DSHeading, DSText } from './DSTypography';

interface DSDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'left' | 'right';
}

export function DSDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  side = 'right',
}: DSDrawerProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  const slideDirection = side === 'right' 
    ? 'translate-x-0' 
    : '-translate-x-0';

  return (
    <div className="fixed inset-0 z-[var(--ds-z-modal)] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`relative ml-auto bg-[var(--ds-bg-primary)] w-full max-w-lg h-full shadow-[var(--ds-shadow-xl)] flex flex-col ${
          side === 'left' ? 'mr-auto ml-0' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--ds-border-default)]">
          <div className="flex-1">
            <DSHeading level="h3" id="drawer-title">
              {title}
            </DSHeading>
            {subtitle && (
              <DSText variant="body" color="secondary" className="mt-1">
                {subtitle}
              </DSText>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-8 h-8 flex items-center justify-center rounded-[var(--ds-radius-md)] hover:bg-[var(--ds-hover-overlay)] transition-colors"
            aria-label="Drawer schließen"
          >
            <X className="w-5 h-5 text-[var(--ds-text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--ds-border-default)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
