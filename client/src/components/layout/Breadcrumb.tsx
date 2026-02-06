import { ChevronRight } from "lucide-react";
import { useSafeNavigate } from "../utils/routing";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({
  items,
}: BreadcrumbProps) {
  const navigate = useSafeNavigate();

  const handleClick = (item: BreadcrumbItem) => {
    if (item.onClick) {
      item.onClick();
      return;
    } else if (item.href) {
      navigate(item.href);
    }
  };

  // Generiere BreadcrumbList Schema für SEO
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      // Nur URL hinzufügen, wenn href vorhanden ist UND es nicht das letzte Element ist
      ...(item.href && index < items.length - 1 && { "item": item.href })
    }))
  };

  return (
    <>
      {/* JSON-LD Schema für Suchmaschinen */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <nav 
        aria-label="Breadcrumb" 
        className="w-full pt-12 md:pt-16 pb-3 md:pb-4 relative z-10 bg-hero-blue breadcrumb-on-blue" 
        style={{ pointerEvents: 'auto' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <ol className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm overflow-x-auto scrollbar-hide relative list-none p-0" style={{ pointerEvents: 'auto' }}>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              
              return (
                <li 
                  key={index} 
                  className="flex items-center gap-2 flex-shrink-0" 
                  style={{ pointerEvents: 'auto' }}
                >
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--breadcrumb-separator)' }} />
                  )}
                  
                  {isLast ? (
                    // Aktuelle Seite: Nur Text, NICHT klickbar
                    <span 
                      aria-current="page"
                      className="whitespace-nowrap max-w-[200px] md:max-w-none truncate font-semibold"
                      style={{ 
                        color: 'var(--breadcrumb-text-muted)', 
                        fontFamily: 'Inter', 
                        fontSize: '14px' 
                      }}
                    >
                      {item.label}
                    </span>
                  ) : (
                    // Klickbarer Pfad für alle vorherigen Elemente
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClick(item);
                      }}
                      className="hover:underline transition-colors whitespace-nowrap max-w-[200px] md:max-w-none truncate cursor-pointer relative breadcrumb-link"
                      style={{ 
                        fontFamily: 'Inter', 
                        fontSize: '14px',
                        pointerEvents: 'auto'
                      }}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}