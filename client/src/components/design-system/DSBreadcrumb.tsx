import { ChevronRight, Home } from 'lucide-react';
import { DSText } from './DSTypography';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface DSBreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function DSBreadcrumb({ items, showHome = true }: DSBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2">
      {showHome && (
        <>
          <a
            href="/"
            className="flex items-center text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-primary)] transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </a>
          <ChevronRight className="w-4 h-4 text-[var(--ds-text-tertiary)]" />
        </>
      )}
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <a
                href={item.href}
                className="text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-primary)] transition-colors"
              >
                <DSText variant="caption" as="span">
                  {item.label}
                </DSText>
              </a>
            ) : (
              <DSText 
                variant="caption" 
                color={isLast ? 'primary' : 'tertiary'}
                as="span"
                className={isLast ? 'font-medium' : ''}
              >
                {item.label}
              </DSText>
            )}
            
            {!isLast && (
              <ChevronRight className="w-4 h-4 text-[var(--ds-text-tertiary)]" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
