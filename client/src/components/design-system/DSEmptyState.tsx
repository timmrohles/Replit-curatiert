import { LucideIcon } from 'lucide-react';
import { DSHeading, DSText } from './DSTypography';
import { DSButton } from './DSButton';

type EmptyStateVariant = 'default' | 'compact' | 'inline';

interface DSEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  illustration?: string;
  variant?: EmptyStateVariant;
  'data-testid'?: string;
}

export function DSEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration,
  variant = 'default',
  'data-testid': testId,
}: DSEmptyStateProps) {
  const isCompact = variant === 'compact';
  const isInline = variant === 'inline';

  if (isInline) {
    return (
      <div
        className="flex items-center gap-3 py-4 px-4"
        data-testid={testId ?? 'empty-state-inline'}
      >
        {Icon && (
          <Icon className="w-5 h-5 text-[var(--ds-text-tertiary)] shrink-0" />
        )}
        <DSText variant="caption" color="secondary">
          {description}
        </DSText>
        {actionLabel && onAction && (
          <DSButton variant="tertiary" size="small" onClick={onAction}>
            {actionLabel}
          </DSButton>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${isCompact ? 'py-8 px-4' : 'py-16 px-6'}`}
      data-testid={testId ?? 'empty-state'}
    >
      {illustration ? (
        <img
          src={illustration}
          alt=""
          className={`object-contain opacity-50 ${isCompact ? 'w-32 h-32 mb-4' : 'w-64 h-64 mb-6'}`}
        />
      ) : Icon ? (
        <div className={`rounded-full bg-[var(--ds-bg-secondary)] flex items-center justify-center ${isCompact ? 'w-16 h-16 mb-4' : 'w-24 h-24 mb-6'}`}>
          <Icon className={`text-[var(--ds-text-tertiary)] ${isCompact ? 'w-8 h-8' : 'w-12 h-12'}`} />
        </div>
      ) : null}

      <DSHeading level={isCompact ? 'h4' : 'h3'} className="mb-2">
        {title}
      </DSHeading>

      <DSText variant="body" color="secondary" className="max-w-md mb-6">
        {description}
      </DSText>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        {actionLabel && onAction && (
          <DSButton variant="primary" onClick={onAction} data-testid="button-empty-action">
            {actionLabel}
          </DSButton>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <DSButton variant="secondary" onClick={onSecondaryAction} data-testid="button-empty-secondary">
            {secondaryActionLabel}
          </DSButton>
        )}
      </div>
    </div>
  );
}
