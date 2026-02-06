import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { DSHeading, DSText } from './DSTypography';
import { DSButton } from './DSButton';

interface DSModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
}

export function DSModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'medium',
  showCloseButton = true,
}: DSModalProps) {
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

  const sizeStyles = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[var(--ds-z-modal)] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative bg-[var(--ds-bg-primary)] rounded-[var(--ds-radius-lg)] shadow-[var(--ds-shadow-xl)] w-full ${sizeStyles[size]} max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--ds-border-default)]">
          <div className="flex-1">
            <DSHeading level="h3" id="modal-title">
              {title}
            </DSHeading>
            {subtitle && (
              <DSText variant="body" color="secondary" className="mt-1">
                {subtitle}
              </DSText>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="ml-4 w-8 h-8 flex items-center justify-center rounded-[var(--ds-radius-md)] hover:bg-[var(--ds-hover-overlay)] transition-colors"
              aria-label="Modal schließen"
            >
              <X className="w-5 h-5 text-[var(--ds-text-secondary)]" />
            </button>
          )}
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
