import React, { TextareaHTMLAttributes, forwardRef, memo, useRef } from 'react';

interface DSTextareaUncontrolledProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const DSTextareaUncontrolledComponent = forwardRef<HTMLTextAreaElement, DSTextareaUncontrolledProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      className = '',
      disabled,
      defaultValue,
      onValueChange,
      onBlur,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as any) || internalRef;

    const hasError = !!error;
    const hasSuccess = success && !hasError;

    const textareaBaseStyles =
      'w-full px-3 py-2 text-base font-normal text-[var(--ds-text-primary)] bg-white border rounded-[var(--ds-radius-sm)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ds-focus-ring)] focus:border-[var(--ds-focus-ring)] disabled:bg-[var(--ds-neutral-200)] disabled:cursor-not-allowed disabled:text-[var(--ds-text-tertiary)] resize-y';

    const borderStyles = hasError
      ? 'border-[var(--ds-error)]'
      : hasSuccess
      ? 'border-[var(--ds-success)]'
      : 'border-[var(--ds-border-default)] hover:border-[var(--ds-border-strong)]';

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
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
        <textarea
          ref={textareaRef}
          className={`${textareaBaseStyles} ${borderStyles} ${className}`}
          disabled={disabled}
          defaultValue={defaultValue}
          onBlur={handleBlur}
          {...props}
        />
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

DSTextareaUncontrolledComponent.displayName = 'DSTextareaUncontrolled';

// Memoize the component to prevent unnecessary re-renders
export const DSTextareaUncontrolled = memo(DSTextareaUncontrolledComponent);