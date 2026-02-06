import React, { InputHTMLAttributes, forwardRef, memo, useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface DSInputUncontrolledProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const DSInputUncontrolledComponent = forwardRef<HTMLInputElement, DSInputUncontrolledProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      iconLeft: IconLeft,
      iconRight: IconRight,
      className = '',
      disabled,
      defaultValue,
      onValueChange,
      onBlur,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as any) || internalRef;

    const hasError = !!error;
    const hasSuccess = success && !hasError;

    const inputBaseStyles =
      'w-full h-10 px-3 text-base font-normal text-[var(--ds-text-primary)] bg-white border rounded-[var(--ds-radius-sm)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ds-focus-ring)] focus:border-[var(--ds-focus-ring)] disabled:bg-[var(--ds-neutral-200)] disabled:cursor-not-allowed disabled:text-[var(--ds-text-tertiary)]';

    const borderStyles = hasError
      ? 'border-[var(--ds-error)]'
      : hasSuccess
      ? 'border-[var(--ds-success)]'
      : 'border-[var(--ds-border-default)] hover:border-[var(--ds-border-strong)]';

    const paddingStyles = IconLeft ? 'pl-10' : IconRight ? 'pr-10' : '';

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value);
      }
      if (onBlur) {
        onBlur(e);
      }
    };

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
          <input
            ref={inputRef}
            className={`${inputBaseStyles} ${borderStyles} ${paddingStyles} ${className}`}
            disabled={disabled}
            defaultValue={defaultValue}
            onBlur={handleBlur}
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
            className={`mt-1.5 text-sm ${
              hasError
                ? 'text-[var(--ds-error)]'
                : hasSuccess
                ? 'text-[var(--ds-success)]'
                : 'text-[var(--ds-text-secondary)]'
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

DSInputUncontrolledComponent.displayName = 'DSInputUncontrolled';

// Memoize the component to prevent unnecessary re-renders
export const DSInputUncontrolled = memo(DSInputUncontrolledComponent);