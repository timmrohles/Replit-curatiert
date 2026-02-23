import { HTMLAttributes, forwardRef } from 'react';
import { Heading, Text } from '../ui/typography';
import { cn } from '../ui/utils';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type TextVariant = 'body-large' | 'body' | 'caption' | 'label' | 'subtitle';

interface DSHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  as?: HeadingLevel;
}

interface DSTextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
  as?: 'p' | 'span' | 'div';
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse';
}

/**
 * DSHeading - Design System Heading
 * Wrapper around ui/typography.tsx Heading component
 * 
 * ✅ Uses ui/typography.tsx as primitive (Single Source of Truth)
 * ✅ Maps Design System levels to ui/typography variants
 * ✅ Uses fluid typography (--fluid-h1, --fluid-h2, etc.)
 */
export const DSHeading = forwardRef<HTMLHeadingElement, DSHeadingProps>(
  ({ level, as, className = '', children, ...props }, ref) => {
    const variantMap = {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
    } as const;

    return (
      <Heading
        as={as || level}
        variant={variantMap[level]}
        className={cn('text-[var(--ds-text-primary)]', className)}
        style={props.style}
        id={props.id}
        onClick={props.onClick as any}
      >
        {children}
      </Heading>
    );
  }
);

DSHeading.displayName = 'DSHeading';

/**
 * DSText - Design System Text
 * Wrapper around ui/typography.tsx Text component
 * 
 * ✅ Uses ui/typography.tsx as primitive (Single Source of Truth)
 * ✅ Maps Design System variants to ui/typography variants
 * ✅ Uses fluid typography (--fluid-body, --fluid-body-small, etc.)
 */
export const DSText = forwardRef<HTMLParagraphElement, DSTextProps>(
  ({ variant = 'body', as = 'p', color = 'primary', className = '', children, ...props }, ref) => {
    const variantMap = {
      'subtitle': 'large',
      'body-large': 'large',
      'body': 'default',
      'caption': 'small',
      'label': 'xs',
    } as const;

    const colorStyles = {
      primary: 'text-[var(--ds-text-primary)]',
      secondary: 'text-[var(--ds-text-secondary)]',
      tertiary: 'text-[var(--ds-text-tertiary)]',
      inverse: 'text-[var(--ds-text-inverse)]',
    };

    return (
      <Text
        as={as}
        variant={variantMap[variant]}
        className={cn(colorStyles[color], className)}
        style={props.style}
        id={props.id}
        onClick={props.onClick as any}
      >
        {children}
      </Text>
    );
  }
);

DSText.displayName = 'DSText';