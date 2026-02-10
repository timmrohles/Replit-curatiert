/**
 * Typography Components - Font Size Chaos Prevention System (HARDENED VERSION)
 * 
 * Provides consistent, semantic typography components that use
 * coratiert.de's fluid typography system (--fluid-h1, --fluid-body, etc.)
 * 
 * KEY PRINCIPLE: Separates semantic HTML (h1, h2) from visual styling.
 * Use the 'as' prop to maintain SEO structure while controlling appearance.
 * 
 * Example:
 * <Heading as="h1" variant="h2">Visually h2, semantically h1</Heading>
 * 
 * HARDENED: Uses !important to guarantee font sizes are never overridden
 * by external CSS or parent containers.
 */

import React from 'react';
import { cn } from './utils';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'li' | 'a';
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'base' | 'body' | 'large' | 'default' | 'small' | 'xs' | 'price-label';
  style?: React.CSSProperties;
  id?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Heading Component
 * Uses Fjalla One font family and fluid typography
 * HARDENED with !important flags
 */
export const Heading = ({ 
  children, 
  className = "", 
  as: Tag = 'h2', 
  variant,
  style,
  id,
  href,
  onClick
}: TypographyProps) => {
  const v = variant || (Tag as string);
  const styles: Record<string, string> = {
    h1: "!text-[length:var(--fluid-h1)] !font-headline !leading-tight !uppercase",
    h2: "!text-[length:var(--fluid-h2)] !font-headline !leading-snug !uppercase",
    h3: "!text-[length:var(--fluid-h3)] !font-headline !leading-snug !uppercase",
    h4: "!text-[length:var(--fluid-h4)] !font-headline !uppercase",
    h5: "!text-[length:var(--fluid-h5)] !font-headline !uppercase",
    h6: "!text-[length:var(--fluid-h6)] !font-headline !uppercase",
  };
  return <Tag style={style} id={id} href={href as any} onClick={onClick as any} className={cn(styles[v] || styles.h2, className)}>{children}</Tag>;
};

/**
 * Text Component
 * Uses Inter font family and fluid typography
 * HARDENED with !important flags
 * Supports ref forwarding for scroll/animation use cases
 */
export const Text = React.forwardRef<HTMLElement, TypographyProps>(function Text({ 
  children, 
  className = "", 
  variant = 'default', 
  as: Tag = 'p',
  style,
  id,
  href,
  onClick
}, ref) {
  const styles: Record<string, string> = {
    xs:      "!text-[length:var(--fluid-body-xs)] !leading-tight !font-sans !font-bold !uppercase !tracking-widest",      // ~12px (Labels)
    small:   "!text-[length:var(--fluid-body-small)] !leading-snug !font-sans",   // ~14px (Meta)
    base:    "!text-[length:var(--fluid-body)] !leading-relaxed !font-sans",         // ~16-18px (Standard)
    default: "!text-[length:var(--fluid-body)] !leading-relaxed !font-sans",         // Alias für base
    body:    "!text-[length:var(--fluid-body)] !leading-relaxed !font-sans",         // Alias für base
    large:   "!text-[length:var(--fluid-h5)] !leading-snug !font-sans",           // ~18-20px (Hervorgehoben)
    'price-label': "!text-[length:var(--fluid-price-label)] !leading-snug !font-sans",  // 📱 Mobil 14px → 💻 Desktop 18px
  };
  return <Tag ref={ref as any} style={style} id={id} href={href as any} onClick={onClick as any} className={cn(styles[variant] || styles.default, className)}>{children}</Tag>;
});

/**
 * Price Component
 * Special typography for prices (larger, bold)
 * HARDENED with !important flags
 */
export function Price({ 
  children, 
  className = '',
  currency = '€'
}: { 
  children: React.ReactNode; 
  className?: string;
  currency?: string;
}) {
  return (
    <div className={cn("!text-[length:var(--fluid-price)] !font-headline !font-bold text-foreground", className)}>
      {currency} {children}
    </div>
  );
}

/**
 * Label Component
 * Small, uppercase labels (for categories, tags, etc.)
 * HARDENED with !important flags
 */
export function Label({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <span className={cn("!text-[length:var(--fluid-body-xs)] !uppercase !tracking-widest !font-semibold text-foreground-muted", className)}>
      {children}
    </span>
  );
}