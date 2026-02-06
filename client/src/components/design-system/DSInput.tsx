import React, { InputHTMLAttributes, forwardRef, memo } from 'react';
import { LucideIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';

interface DSInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
}

/**
 * DSInput - Design System Input
 * Wrapper around ui/input.tsx with Design System features
 * 
 * ✅ Uses ui/input.tsx as primitive (Single Source of Truth)
 * ✅ Adds label, helperText, error states, icons
 * ✅ Uses CSS custom properties for colors
 */
const DSInputComponent = forwardRef<HTMLInputElement, DSInputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      iconLeft: IconLeft,
      iconRight: IconRight,
      className = '',
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    const paddingStyles = IconLeft ? 'pl-10' : IconRight ? 'pr-10' : '';

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-[var(--ds-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative">
          {IconLeft && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)]">
              <IconLeft className="w-5 h-5" />
            </div>
          )}
          <Input
            ref={ref}
            className={cn(
              // Design System specific styles
              'h-10 rounded-[var(--ds-radius-sm)]',
              // Error state
              hasError && 'border-[var(--ds-error)] focus-visible:ring-[var(--ds-error)]/20',
              // Success state
              hasSuccess && 'border-[var(--ds-success)] focus-visible:ring-[var(--ds-success)]/20',
              // Icon padding
              paddingStyles,
              className
            )}
            aria-invalid={hasError}
            {...props}
          />
          {IconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)]">
              <IconRight className="w-5 h-5" />
            </div>
          )}
        </div>
        {(helperText || error) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              hasError && 'text-[var(--ds-error)]',
              hasSuccess && 'text-[var(--ds-success)]',
              !hasError && !hasSuccess && 'text-[var(--ds-text-secondary)]'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

DSInputComponent.displayName = 'DSInput';

// Memoize the component to prevent unnecessary re-renders
export const DSInput = memo(DSInputComponent);