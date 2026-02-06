import { InputHTMLAttributes, forwardRef } from 'react';
import { Calendar } from 'lucide-react';

interface DSDatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
  success?: boolean;
}

export const DSDatePicker = forwardRef<HTMLInputElement, DSDatePickerProps>(
  ({ className = '', error = false, success = false, ...props }, ref) => {
    const baseStyles = 'w-full h-10 pl-3 pr-10 bg-[var(--ds-bg-primary)] border rounded-[var(--ds-radius-sm)] text-[var(--ds-text-base)] placeholder:text-[var(--ds-text-tertiary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    
    const stateStyles = error
      ? 'border-[var(--ds-error)] focus:ring-[var(--ds-error)]'
      : success
      ? 'border-[var(--ds-success)] focus:ring-[var(--ds-success)]'
      : 'border-[var(--ds-border-default)] focus:border-transparent focus:ring-[var(--ds-focus-ring)]';

    return (
      <div className="relative">
        <input
          ref={ref}
          type="date"
          className={`${baseStyles} ${stateStyles} focus:outline-none focus:ring-2 ${className}`}
          {...props}
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--ds-text-tertiary)] pointer-events-none" />
      </div>
    );
  }
);

DSDatePicker.displayName = 'DSDatePicker';
