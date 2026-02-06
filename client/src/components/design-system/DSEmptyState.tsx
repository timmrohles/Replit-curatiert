import { LucideIcon } from 'lucide-react';
import { DSHeading, DSText } from './DSTypography';
import { DSButton } from './DSButton';

interface DSEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: string;
}

export function DSEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
}: DSEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon or Illustration */}
      {illustration ? (
        <img
          src={illustration}
          alt=""
          className="w-64 h-64 object-contain mb-6 opacity-50"
        />
      ) : Icon ? (
        <div className="w-24 h-24 rounded-full bg-[var(--ds-bg-secondary)] flex items-center justify-center mb-6">
          <Icon className="w-12 h-12 text-[var(--ds-text-tertiary)]" />
        </div>
      ) : null}

      {/* Title */}
      <DSHeading level="h3" className="mb-2">
        {title}
      </DSHeading>

      {/* Description */}
      <DSText variant="body" color="secondary" className="max-w-md mb-6">
        {description}
      </DSText>

      {/* Action Button */}
      {actionLabel && onAction && (
        <DSButton variant="primary" onClick={onAction}>
          {actionLabel}
        </DSButton>
      )}
    </div>
  );
}
