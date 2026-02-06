/**
 * Shared types for Dashboard components
 * Ensures type safety across all dashboard implementations
 */

import { ComponentType } from 'react';

/**
 * React Error Boundary ErrorInfo type
 * Used by componentDidCatch lifecycle method
 */
export interface ErrorInfo {
  componentStack: string;
  digest?: string;
}

/**
 * Dashboard type identifier
 */
export type DashboardType = 'creator' | 'author' | 'publisher' | 'customer';

/**
 * Dashboard color theme mapping
 */
export const DASHBOARD_COLORS: Record<DashboardType, string> = {
  creator: 'var(--color-gold)',
  author: 'var(--color-blue)',
  publisher: 'var(--color-coral)',
  customer: 'var(--color-teal)',
};

/**
 * Icon type from lucide-react
 */
export type LucideIcon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

/**
 * Menu item structure for dashboard navigation
 */
export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  premium?: boolean;
  path?: string;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
