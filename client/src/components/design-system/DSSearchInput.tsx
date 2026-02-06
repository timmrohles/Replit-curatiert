import { InputHTMLAttributes, forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface DSSearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  showClear?: boolean;
}

export const DSSearchInput = forwardRef<HTMLInputElement, DSSearchInputProps>(
  ({ className = '', onClear, showClear = true, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== '';

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--ds-text-tertiary)] pointer-events-none" />
        <input
          ref={ref}
          type="search"
          value={value}
          className={`w-full h-10 pl-10 pr-10 bg-[var(--ds-bg-primary)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-sm)] text-[var(--ds-text-base)] placeholder:text-[var(--ds-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-focus-ring)] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {showClear && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-primary)] transition-colors"
            aria-label="Suche löschen"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

DSSearchInput.displayName = 'DSSearchInput';
