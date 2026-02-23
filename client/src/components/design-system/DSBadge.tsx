import { ReactNode } from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';

export type DSBadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'new'
  | 'beta'
  | 'live'
  | 'award'
  | 'media'
  | 'curator'
  | 'status-active'
  | 'status-draft'
  | 'status-pending'
  | 'series';

interface DSBadgeProps {
  children: ReactNode;
  variant?: DSBadgeVariant;
  size?: 'small' | 'medium';
  className?: string;
  'data-testid'?: string;
}

const variantStyles: Record<DSBadgeVariant, string> = {
  new: 'bg-[var(--badge-curator-bg)] text-[var(--badge-curator-text)] border-[var(--badge-curator-border)]',
  beta: 'bg-[var(--badge-status-draft-bg)] text-[var(--badge-status-draft-text)] border-[var(--badge-status-draft-border)]',
  live: 'bg-[var(--badge-media-bg)] text-[var(--badge-media-text)] border-[var(--badge-media-border)]',
  neutral: 'bg-[var(--badge-status-pending-bg)] text-[var(--badge-status-pending-text)] border-[var(--badge-status-pending-border)]',
  success: 'bg-[var(--badge-status-active-bg)] text-[var(--badge-status-active-text)] border-[var(--badge-status-active-border)]',
  warning: 'bg-[var(--badge-status-draft-bg)] text-[var(--badge-status-draft-text)] border-[var(--badge-status-draft-border)]',
  error: 'bg-[var(--badge-media-bg)] text-[var(--badge-media-text)] border-[var(--badge-media-border)]',
  award: 'bg-[var(--badge-award-bg)] text-[var(--badge-award-text)] border-[var(--badge-award-border)]',
  media: 'bg-[var(--badge-media-bg)] text-[var(--badge-media-text)] border-[var(--badge-media-border)]',
  curator: 'bg-[var(--badge-curator-bg)] text-[var(--badge-curator-text)] border-[var(--badge-curator-border)]',
  'status-active': 'bg-[var(--badge-status-active-bg)] text-[var(--badge-status-active-text)] border-[var(--badge-status-active-border)]',
  'status-draft': 'bg-[var(--badge-status-draft-bg)] text-[var(--badge-status-draft-text)] border-[var(--badge-status-draft-border)]',
  'status-pending': 'bg-[var(--badge-status-pending-bg)] text-[var(--badge-status-pending-text)] border-[var(--badge-status-pending-border)]',
  series: 'bg-[var(--badge-series-bg)] text-[var(--badge-series-text)] border-[var(--badge-series-border)]',
};

const sizeStyles = {
  small: 'h-5 px-2 text-xs',
  medium: 'h-6 px-3 text-sm',
};

export function DSBadge({ children, variant = 'neutral', size = 'small', className, 'data-testid': testId }: DSBadgeProps) {
  return (
    <Badge
      className={cn(
        'rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      data-testid={testId}
    >
      {children}
    </Badge>
  );
}
