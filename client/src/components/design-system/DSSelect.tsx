import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../ui/utils';

interface DSSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: { value: string; label: string }[];
  children?: ReactNode;
}

/**
 * DSSelect - Design System Select (Native)
 * 
 * ⚠️ Note: Uses native <select> element
 * ui/select.tsx uses Radix UI which is more complex
 * 
 * Supports two usage patterns:
 * 1. With options prop: <DSSelect options={[...]} />
 * 2. With children: <DSSelect><option>...</option></DSSelect>
 * 
 * TODO Phase B+: Migrate to Radix-based select from ui/
 * For now: Keep native implementation with consistent styling
 */
export const DSSelect = forwardRef<HTMLSelectElement, DSSelectProps>(
  ({ label, helperText, error, options, children, className = '', disabled, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-[var(--ds-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              // Base styles
              'w-full h-10 pl-3 pr-10 text-base font-normal',
              'text-[var(--ds-text-primary)] bg-white border rounded-[var(--ds-radius-sm)]',
              'appearance-none transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[var(--ds-focus-ring)] focus:border-[var(--ds-focus-ring)]',
              'disabled:bg-[var(--ds-neutral-200)] disabled:cursor-not-allowed disabled:text-[var(--ds-text-tertiary)]',
              // Border styles
              hasError
                ? 'border-[var(--ds-error)]'
                : 'border-[var(--ds-border-default)] hover:border-[var(--ds-border-strong)]',
              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            {...props}
          >
            {options ? (
              options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              children
            )}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ds-text-tertiary)]">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
        {(helperText || error) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              hasError ? 'text-[var(--ds-error)]' : 'text-[var(--ds-text-secondary)]'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

DSSelect.displayName = 'DSSelect';
