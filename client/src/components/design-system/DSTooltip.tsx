import { ReactNode, useState } from 'react';
import { DSText } from './DSTypography';

interface DSTooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function DSTooltip({
  content,
  children,
  position = 'top',
}: DSTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div
          className={`absolute z-[var(--ds-z-tooltip)] ${positionStyles[position]}`}
          role="tooltip"
        >
          <div className="bg-[var(--ds-brand-deep-blue)] text-white px-3 py-2 rounded-[var(--ds-radius-md)] shadow-[var(--ds-shadow-lg)] whitespace-nowrap">
            <DSText variant="caption" color="inverse" as="span">
              {content}
            </DSText>
          </div>
        </div>
      )}
    </div>
  );
}
