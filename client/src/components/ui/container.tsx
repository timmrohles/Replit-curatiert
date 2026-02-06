/**
 * Container Component - Width Constraint Guardian
 * 
 * Prevents content from touching viewport edges and ensures
 * consistent max-width across all pages.
 * 
 * Based on coratiert.de's max-w-7xl (1280px) standard.
 * 
 * Usage:
 * <Container>
 *   <h1>My Content</h1>
 * </Container>
 * 
 * IMPORTANT: Container should NOT have font-size classes!
 * Font sizes are applied to children elements only.
 */

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Width variant
   * - default: max-w-7xl (1280px) - Standard page width
   * - narrow: max-w-4xl (896px) - For text-heavy content
   * - wide: max-w-screen-2xl (1536px) - For wide layouts
   * - full: No max-width constraint
   */
  width?: 'default' | 'narrow' | 'wide' | 'full';
  /**
   * Padding variant
   * - default: px-4 sm:px-6 lg:px-8
   * - tight: px-4
   * - none: No padding
   */
  padding?: 'default' | 'tight' | 'none';
}

const widthStyles = {
  default: 'max-w-7xl',
  narrow: 'max-w-4xl',
  wide: 'max-w-screen-2xl',
  full: 'max-w-full',
};

const paddingStyles = {
  default: 'px-4 sm:px-6 lg:px-8',
  tight: 'px-4',
  none: 'px-0',
};

export function Container({ 
  children, 
  className = '', 
  width = 'default',
  padding = 'default'
}: ContainerProps) {
  return (
    <div 
      className={`
        ${widthStyles[width]}
        ${paddingStyles[padding]}
        mx-auto 
        w-full
        ${className}
      `}
    >
      {children}
    </div>
  );
}
