import { ChevronDown } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface MenuCategory {
  title: string;
  items: string[];
}

interface MegaMenuProps {
  title: string;
  categories: MenuCategory[];
  columns?: number;
  onItemClick?: (item: string) => void;
  onTitleClick?: () => void;
}

export function MegaMenu({ title, categories, columns = 2, onItemClick, onTitleClick }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect if device supports touch (tablets/mobile) or is pure desktop
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  // Track window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Only show desktop mega menu on non-touch devices with width >= 768px
      const isDesktopDevice = window.innerWidth >= 768 && !isTouchDevice();
      setIsDesktop(isDesktopDevice);
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Schließe das Menü wenn ein anderes MegaMenu geöffnet wird
  useEffect(() => {
    const handleOtherMenuOpen = (e: CustomEvent) => {
      if (e.detail !== title) {
        setIsOpen(false);
      }
    };

    window.addEventListener('megamenu-open' as any, handleOtherMenuOpen);
    return () => window.removeEventListener('megamenu-open' as any, handleOtherMenuOpen);
  }, [title]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleItemClick = useCallback((item: string) => {
    // Immer body overflow zurücksetzen
    document.body.style.overflow = '';
    
    if (onItemClick) {
      onItemClick(item);
    }
    
    setIsOpen(false);
  }, [onItemClick]);

  const handleMouseEnter = useCallback(() => {
    // Nur auf Desktop hover aktivieren
    if (isDesktop) {
      // Cancel any pending close
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      
      // Berechne Position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left
        });
      }
      
      setIsOpen(true);
      // Dispatch event to close other menus
      window.dispatchEvent(new CustomEvent('megamenu-open', { detail: title }));
    }
  }, [isDesktop, title]);

  const handleMouseLeave = useCallback(() => {
    // Nur auf Desktop hover aktivieren
    if (isDesktop) {
      // Verzögertes Schließen (150ms) damit User Zeit hat zum Dropdown zu hovern
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  }, [isDesktop]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Desktop: Titel-Klick navigiert zur Kategorie-Seite
    if (isDesktop && onTitleClick) {
      onTitleClick();
      setIsOpen(false);
    }
    // Mobile: Toggle des Menüs
    else if (!isDesktop) {
      const newState = !isOpen;
      setIsOpen(newState);
      
      // Event auslösen um andere Menüs zu schließen
      if (newState) {
        window.dispatchEvent(new CustomEvent('megamenu-open', { detail: title }));
        // Prevent body scroll on mobile when menu is open
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }, [isDesktop, isOpen, title, onTitleClick]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    document.body.style.overflow = '';
  }, []);

  const handleCategoryClick = useCallback(() => {
    if (onTitleClick) {
      onTitleClick();
      setIsOpen(false);
      document.body.style.overflow = '';
    }
  }, [onTitleClick]);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        onClick={handleButtonClick}
        className="px-3 md:px-4 lg:px-5 py-1.5 md:py-2 lg:py-2.5 rounded-full transition-all text-xs md:text-sm lg:text-base font-medium whitespace-nowrap hover:scale-105 flex items-center gap-1.5"
        style={{ 
          color: 'var(--nav-text)',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{title}</span>
        <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* ========================================== */}
          {/* DESKTOP VERSION - Hover Mega Dropdown mit Portal */}
          {/* ========================================== */}
          {isDesktop && createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999]"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }}
              onMouseEnter={() => {
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = null;
                }
              }}
              onMouseLeave={() => {
                closeTimeoutRef.current = setTimeout(() => {
                  setIsOpen(false);
                }, 150);
              }}
            >
              {/* Das eigentliche Dropdown */}
              <div
                className="mein-mega-menue-container rounded-xl shadow-2xl p-4 md:p-6 animate-in fade-in slide-in-from-top-2 duration-200 whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--megamenu-bg)',
                  border: '1px solid var(--megamenu-border, rgba(0, 0, 0, 0.1))'
                }}
                ref={(el) => {
                  // ✅ Dark Mode CSS variables are working correctly
                  // Debug code removed - use browser DevTools if needed
                }}
              >
                {/* Übergeordnete Kategorie als klickbares Element */}
                {onTitleClick && (
                  <button
                    onClick={handleCategoryClick}
                    className="mb-3 md:mb-4 pb-2 md:pb-3 border-b-2 text-left w-full hover:translate-x-1 transition-all text-sm md:text-base"
                    style={{ color: 'var(--megamenu-text)', fontWeight: '600', borderColor: 'var(--megamenu-border, rgba(0, 0, 0, 0.2))' }}
                  >
                    {title} – Alle anzeigen →
                  </button>
                )}

                <div className={`grid gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                  {(Array.isArray(categories) ? categories : []).map((category, idx) => (
                    <div key={idx}>
                      {category.title && (
                        <h4 className="mb-1.5 md:mb-2 pb-1 md:pb-1.5 border-b text-xs md:text-sm" style={{ color: 'var(--megamenu-text)', fontWeight: '600', borderColor: 'var(--megamenu-border, rgba(0, 0, 0, 0.2))' }}>
                          {category.title}
                        </h4>
                      )}
                      <ul className="space-y-1 md:space-y-1.5">
                        {(Array.isArray(category.items) ? category.items : []).map((item, itemIdx) => (
                          <li key={itemIdx}>
                            <button
                              onClick={() => handleItemClick(item)}
                              className="text-[11px] md:text-xs hover:translate-x-1 transition-all inline-block text-left w-full"
                              style={{ color: 'var(--megamenu-text)', fontWeight: '600' }}
                            >
                              {item}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* ========================================== */}
          {/* MOBILE VERSION - Full Screen Overlay */}
          {/* Also used for TABLETS (Touch Devices) */}
          {/* ========================================== */}
          {!isDesktop && (
            <>
              {/* Backdrop - HÖCHSTER Z-INDEX */}
              <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                onClick={handleBackdropClick}
                style={{ touchAction: 'none' }}
              />
              
              {/* Mobile Menü Panel - NOCH HÖHER */}
              {createPortal(
                <div 
                  className="fixed left-0 right-0 top-0 bottom-0 z-[9999] flex items-start justify-center pt-24 px-4"
                  onClick={handleBackdropClick}
                >
                  <div 
                    className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      backgroundColor: 'var(--megamenu-bg)',
                      WebkitOverflowScrolling: 'touch',
                      overscrollBehavior: 'contain'
                    }}
                  >
                    {/* Header mit Close Button */}
                    <div className="sticky top-0 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10" style={{ backgroundColor: 'var(--megamenu-bg)', borderBottom: '1px solid var(--megamenu-border)' }}>
                      <h3 className="text-lg" style={{ fontFamily: 'Fjalla One', color: 'var(--megamenu-text)' }}>
                        {title}
                      </h3>
                      <button
                        onClick={handleBackdropClick}
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                        style={{ 
                          color: 'var(--megamenu-text)',
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        aria-label="Menü schließen"
                      >
                        <span className="text-2xl" style={{ color: 'var(--megamenu-text)' }}>×</span>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4">
                      {/* Übergeordnete Kategorie "Alle anzeigen" Button */}
                      {onTitleClick && (
                        <button
                          onClick={handleCategoryClick}
                          className="w-full mb-4 pb-3 text-left flex items-center justify-between group"
                          style={{ 
                            borderBottom: '2px solid var(--megamenu-border)'
                          }}
                        >
                          <span style={{ fontFamily: 'Fjalla One', color: 'var(--megamenu-text)', fontSize: '1rem' }}>
                            Alle {title} anzeigen
                          </span>
                          <span className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--vibrant-coral)' }}>
                            →
                          </span>
                        </button>
                      )}

                      {/* Kategorien und Items */}
                      <div className="space-y-6">
                        {(Array.isArray(categories) ? categories : []).map((category, catIdx) => (
                          <div key={catIdx}>
                            {category.title && (
                              <h4 
                                className="mb-3 pb-2" 
                                style={{ 
                                  fontFamily: 'Fjalla One', 
                                  color: 'var(--megamenu-text)', 
                                  fontSize: '0.95rem',
                                  borderBottom: '1px solid var(--megamenu-border)'
                                }}
                              >
                                {category.title}
                              </h4>
                            )}
                            <ul className="space-y-2.5">
                              {(Array.isArray(category.items) ? category.items : []).map((item, itemIdx) => (
                                <li key={itemIdx}>
                                  <button
                                    onClick={() => handleItemClick(item)}
                                    className="text-left w-full py-2 px-3 rounded-lg transition-colors"
                                    style={{ 
                                      color: 'var(--megamenu-text)',
                                      fontSize: '0.95rem',
                                      minHeight: '44px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      backgroundColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    {item}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}