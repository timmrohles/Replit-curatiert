import React, { ReactNode, memo } from 'react';
import { DSText } from './DSTypography';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface DSFormFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  successText?: string;
  children: ReactNode;
  htmlFor?: string;
}

const DSFormFieldComponent = function DSFormField({
  label,
  required = false,
  helperText,
  errorText,
  successText,
  children,
  htmlFor,
}: DSFormFieldProps) {
  const hasError = !!errorText;
  const hasSuccess = !!successText && !hasError;
  
  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label htmlFor={htmlFor} className="block">
          <DSText variant="label" color="primary" as="span">
            {label}
            {required && (
              <span className="text-[var(--ds-error)] ml-1">*</span>
            )}
          </DSText>
        </label>
      )}

      {/* Input Component */}
      {children}

      {/* Helper Text / Error / Success */}
      {(helperText || errorText || successText) && (
        <div className="flex items-start gap-1.5">
          {hasError && (
            <AlertCircle className="w-4 h-4 text-[var(--ds-error)] flex-shrink-0 mt-0.5" />
          )}
          {hasSuccess && (
            <CheckCircle className="w-4 h-4 text-[var(--ds-success)] flex-shrink-0 mt-0.5" />
          )}
          <DSText 
            variant="caption" 
            as="span"
            className={
              hasError 
                ? 'text-[var(--ds-error)]' 
                : hasSuccess 
                ? 'text-[var(--ds-success)]'
                : 'text-[var(--ds-text-tertiary)]'
            }
          >
            {errorText || successText || helperText}
          </DSText>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const DSFormField = memo(DSFormFieldComponent);