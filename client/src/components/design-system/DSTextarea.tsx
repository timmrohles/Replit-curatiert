import React, { TextareaHTMLAttributes, forwardRef, memo } from 'react';
import { Textarea } from '../ui/textarea';
import { cn } from '../ui/utils';

interface DSTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
}

/**
 * DSTextarea - Design System Textarea
 * Wrapper around ui/textarea.tsx with Design System features
 * 
 * ✅ Uses ui/textarea.tsx as primitive (Single Source of Truth)
 * ✅ Adds label, helperText, error states
 * ✅ Uses CSS custom properties for colors
 */
const DSTextareaComponent = forwardRef<HTMLTextAreaElement, DSTextareaProps>(
  ({ label, helperText, error, success, className = '', ...props }, ref) => {
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-[var(--ds-text-primary)]">
            {label}
          </label>
        )}
        <Textarea
          ref={ref}
          className={cn(
            // Design System specific styles
            'min-h-[100px] rounded-[var(--ds-radius-md)]',
            // Error state
            hasError && 'border-[var(--ds-error)] focus-visible:ring-[var(--ds-error)]/20',
            // Success state
            hasSuccess && 'border-[var(--ds-success)] focus-visible:ring-[var(--ds-success)]/20',
            className
          )}
          aria-invalid={hasError}
          {...props}
        />
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

DSTextareaComponent.displayName = 'DSTextarea';

// Memoize the component to prevent unnecessary re-renders
export const DSTextarea = memo(DSTextareaComponent);