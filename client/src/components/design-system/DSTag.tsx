import { X } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface DSTagProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'active'> {
  label?: string;
  children?: ReactNode;
  selected?: boolean;
  active?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function DSTag({
  label,
  children,
  selected = false,
  active = false,
  removable = false,
  onRemove,
  variant = 'default',
  className = '',
  ...props
}: DSTagProps) {
  const isSelected = selected || active;
  const displayContent = children || label;
  
  const getStyles = () => {
    if (variant !== 'default') {
      return {
        className: `text-white border-[var(--ds-${variant})]`,
        style: { backgroundColor: 'var(--creator-dark-bg)' }
      };
    }
    
    if (isSelected) {
      return {
        className: 'border-coral bg-coral',
        style: { color: '#ffffff' }
      };
    }
    
    return {
      className: 'border-[var(--charcoal)] hover:border-teal hover:bg-teal hover:text-white text-[var(--charcoal)]',
      style: { backgroundColor: '#ffffff' }
    };
  };
  
  const { className: variantClassName, style } = getStyles();

  return (
    <button
      className={`inline-flex items-center gap-1.5 px-3 h-7 border rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg active:shadow-sm ${variantClassName} ${className}`}
      style={style}
      {...props}
    >
      <span>{displayContent}</span>
      {removable && (
        <X
          className="w-3.5 h-3.5 cursor-pointer hover:opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        />
      )}
    </button>
  );
}