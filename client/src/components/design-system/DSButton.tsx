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
    const uiVariantMap = {
      primary: 'default',
      secondary: 'outline',
      tertiary: 'ghost',
      destructive: 'destructive',
    } as const;

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

    const dsStyles = cn(
      'font-headline tracking-wide uppercase',
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