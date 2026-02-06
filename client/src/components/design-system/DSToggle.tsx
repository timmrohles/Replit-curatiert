import { InputHTMLAttributes, forwardRef } from 'react';

interface DSToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const DSToggle = forwardRef<HTMLInputElement, DSToggleProps>(
  ({ label, className = '', disabled, checked, ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            disabled={disabled}
            checked={checked}
            {...props}
          />
          <div className="w-11 h-6 bg-[var(--ds-neutral-400)] rounded-full peer-checked:bg-[var(--ds-accent-slate-blue)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ds-focus-ring)] peer-focus-visible:ring-offset-2 transition-all duration-200"></div>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
        {label && <span className="text-sm font-medium text-[var(--ds-text-primary)] select-none">{label}</span>}
      </label>
    );
  }
);

DSToggle.displayName = 'DSToggle';