import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { DSModal } from './DSModal';
import { DSButton } from './DSButton';
import { DSText } from './DSTypography';

interface DSConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export function DSConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
}: DSConfirmDialogProps) {
  const { t } = useTranslation();
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <DSModal
      open={open}
      onClose={onClose}
      title={title}
      size="small"
      footer={
        <>
          <DSButton variant="secondary" onClick={onClose}>
            {resolvedCancelLabel}
          </DSButton>
          <DSButton
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={handleConfirm}
          >
            {resolvedConfirmLabel}
          </DSButton>
        </>
      }
    >
      <div className="flex gap-4">
        {variant === 'destructive' && (
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-[var(--ds-error-light)] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[var(--ds-error)]" />
            </div>
          </div>
        )}
        <DSText variant="body" color="secondary">
          {message}
        </DSText>
      </div>
    </DSModal>
  );
}
