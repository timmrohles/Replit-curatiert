import { ReactNode } from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';

interface DSBadgeProps {
  children: ReactNode;
  variant?: 'new' | 'beta' | 'live' | 'neutral' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium';
}

/**
 * DSBadge - Design System Badge
 * Wrapper around ui/badge.tsx with Design System variants
 * 
 * ✅ Uses ui/badge.tsx as primitive (Single Source of Truth)
 * ✅ Maps Design System variants to custom colors
 * ✅ Uses CSS custom properties for colors
 */
export function DSBadge({ children, variant = 'neutral', size = 'small' }: DSBadgeProps) {
  // Map Design System variants to custom styles
  const variantStyles = {
    new: 'bg-[var(--ds-info-light)] text-[var(--ds-info)] border-[var(--ds-info)]',
    beta: 'bg-[var(--ds-warning-light)] text-[var(--ds-warning)] border-[var(--ds-warning)]',
    live: 'bg-[var(--ds-error-light)] text-[var(--ds-error)] border-[var(--ds-error)]',
    neutral: 'bg-[var(--ds-neutral-300)] text-[var(--ds-text-secondary)] border-[var(--ds-border-default)]',
    success: 'bg-[var(--ds-success-light)] text-[var(--ds-success)] border-[var(--ds-success)]',
    warning: 'bg-[var(--ds-warning-light)] text-[var(--ds-warning)] border-[var(--ds-warning)]',
    error: 'bg-[var(--ds-error-light)] text-[var(--ds-error)] border-[var(--ds-error)]',
  };

  const sizeStyles = {
    small: 'h-5 px-2 text-xs',
    medium: 'h-6 px-3 text-sm',
  };

  return (
    <Badge
      className={cn(
        'rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size]
      )}
    >
      {children}
    </Badge>
  );
}