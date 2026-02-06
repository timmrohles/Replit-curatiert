/**
 * Section Component - Vertical Rhythm Guardian
 * 
 * Ensures consistent spacing between major content blocks.
 * Based on coratiert.de design system with 8px grid system.
 * 
 * Usage:
 * <Section>
 *   <Container>
 *     Your content here
 *   </Container>
 * </Section>
 */

import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /**
   * Variant controls vertical padding
   * - default: py-12 md:py-16 lg:py-20 (Standard sections)
   * - compact: py-8 md:py-10 lg:py-12 (Tighter sections)
   * - hero: py-16 md:py-20 lg:py-24 (Hero/featured sections)
   * - none: py-0 (No padding, full control)
   */
  variant?: 'default' | 'compact' | 'hero' | 'none';
  /**
   * Whether to include bottom border (for visual separation)
   */
  withBorder?: boolean;
  /**
   * Background color variant
   */
  background?: 'transparent' | 'surface' | 'elevated' | 'charcoal';
  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

const variantStyles = {
  default: 'py-12 md:py-16 lg:py-20',
  compact: 'py-8 md:py-10 lg:py-12',
  hero: 'py-16 md:py-20 lg:py-24',
  none: 'py-0',
};

const backgroundStyles = {
  transparent: 'bg-transparent',
  surface: 'bg-surface',
  elevated: 'bg-surface-elevated',
  charcoal: 'bg-charcoal',
};

export function Section({ 
  children, 
  className = '', 
  id, 
  variant = 'default',
  withBorder = false,
  background = 'transparent',
  ariaLabel 
}: SectionProps) {
  return (
    <section
      id={id}
      className={`
        ${variantStyles[variant]}
        ${backgroundStyles[background]}
        ${withBorder ? 'border-b border-border/10 last:border-b-0' : ''}
        ${className}
      `}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
}