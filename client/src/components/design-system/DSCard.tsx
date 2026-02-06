import React, { ReactNode, memo } from 'react';
import { Card } from '../ui/card';
import { cn } from '../ui/utils';

interface DSCardProps {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

/**
 * DSCard - Design System Card
 * Wrapper around ui/card.tsx with Design System styling
 * 
 * ✅ Uses ui/card.tsx as primitive (Single Source of Truth)
 * ✅ Adds coratiert.de specific styling (CSS custom properties)
 * ✅ Simplified padding & hover states
 */
const DSCardComponent = function DSCard({
  children,
  hover = false,
  padding = 'medium',
  className = '',
  onClick,
}: DSCardProps) {
  const paddingStyles = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const hoverStyles = hover
    ? 'transition-all duration-200 hover:shadow-[var(--ds-shadow-md)] hover:border-[var(--ds-border-strong)] cursor-pointer'
    : '';

  return (
    <Card
      className={cn(
        // Design System specific styles
        'shadow-[var(--ds-shadow-sm)] border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)]',
        hoverStyles,
        paddingStyles[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const DSCard = memo(DSCardComponent);