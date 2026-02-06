import { ButtonHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

interface DSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
}

/**
 * DSButton - Design System Button
 * Wrapper around ui/button.tsx with Design System branding
 * 
 * ✅ Uses ui/button.tsx as primitive (Single Source of Truth)
 * ✅ Adds coratiert.de specific styling (Fjalla One, custom colors)
 * ✅ Maps Design System variants to ui/button variants
 */
export const DSButton = forwardRef<HTMLButtonElement, DSButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      iconLeft: IconLeft,
      iconRight: IconRight,
      fullWidth = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Map Design System variants to ui/button variants
    const uiVariantMap = {
      primary: 'default',
      secondary: 'outline',
      tertiary: 'ghost',
      destructive: 'destructive',
    } as const;

    // Map Design System sizes to ui/button sizes
    const uiSizeMap = {
      small: 'sm',
      medium: 'default',
      large: 'lg',
    } as const;

    const iconSizes = {
      small: 'w-3 h-3 md:w-4 md:h-4',
      medium: 'w-4 h-4 md:w-5 md:h-5',
      large: 'w-5 h-5 md:w-6 md:h-6',
    };

    // Design System specific styles
    const dsStyles = cn(
      // Fjalla One font for all buttons
      'font-headline tracking-wide uppercase',
      // Custom primary button colors
      variant === 'primary' && 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-bg)]/90',
      // Custom secondary button colors
      variant === 'secondary' && 'border-2 border-[var(--creator-dark-bg)] text-[var(--creator-text-dark)] hover:text-white hover:bg-[var(--creator-dark-bg)]',
      // Custom tertiary button colors
      variant === 'tertiary' && 'text-[var(--creator-text-dark)] hover:bg-[var(--ds-hover-overlay)]',
      // Full width
      fullWidth && 'w-full'
    );

    return (
      <Button
        ref={ref}
        variant={uiVariantMap[variant]}
        size={uiSizeMap[size]}
        className={cn(dsStyles, className)}
        {...props}
      >
        {IconLeft && <IconLeft className={iconSizes[size]} />}
        {children}
        {IconRight && <IconRight className={iconSizes[size]} />}
      </Button>
    );
  }
);

DSButton.displayName = 'DSButton';