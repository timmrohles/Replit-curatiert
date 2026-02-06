import { InputHTMLAttributes, forwardRef } from 'react';
import { Check } from 'lucide-react';

interface DSCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const DSCheckbox = forwardRef<HTMLInputElement, DSCheckboxProps>(
  ({ label, className = '', disabled, checked, ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            disabled={disabled}
            checked={checked}
            {...props}
          />
          <div className="w-5 h-5 border-2 border-[var(--ds-border-strong)] rounded-[var(--ds-radius-sm)] bg-white peer-checked:bg-[var(--ds-accent-slate-blue)] peer-checked:border-[var(--ds-accent-slate-blue)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ds-focus-ring)] peer-focus-visible:ring-offset-2 transition-all duration-200 flex items-center justify-center">
            {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        </div>
        {label && <span className="text-sm font-medium text-[var(--ds-text-primary)] select-none">{label}</span>}
      </label>
    );
  }
);

DSCheckbox.displayName = 'DSCheckbox';