import { InputHTMLAttributes, forwardRef } from 'react';

interface DSRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const DSRadio = forwardRef<HTMLInputElement, DSRadioProps>(
  ({ label, className = '', disabled, checked, ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="relative">
          <input
            ref={ref}
            type="radio"
            className="sr-only peer"
            disabled={disabled}
            checked={checked}
            {...props}
          />
          <div className="w-5 h-5 border-2 border-[var(--ds-border-strong)] rounded-full bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ds-focus-ring)] peer-focus-visible:ring-offset-2 transition-all duration-200 flex items-center justify-center">
            {checked && (
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--ds-accent-slate-blue)]"></div>
            )}
          </div>
        </div>
        {label && <span className="text-sm font-medium text-[var(--ds-text-primary)] select-none">{label}</span>}
      </label>
    );
  }
);

DSRadio.displayName = 'DSRadio';