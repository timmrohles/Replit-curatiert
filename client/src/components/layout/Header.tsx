import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSafeNavigate } from "../../utils/routing";
import { Input } from "../ui/input";
import { MegaMenu } from "./MegaMenu";
import { FavoritesPanel } from "../favorites/FavoritesPanel";
import { useFavorites } from "../favorites/FavoritesContext";
import { ThemeToggle } from "../common/ThemeToggle";
import { useTheme } from "../../utils/ThemeContext";
import { Moon, Sun, Search, Heart, Menu, X, ChevronDown, ShoppingCart, User, LogIn, LogOut, Sliders, Star, Store, Bell, MoreHorizontal } from "lucide-react";
import { RegionSwitcher } from "./RegionSwitcher";
import { useNavigationV2, FALLBACK_NAVIGATION_V2 } from "../../utils/useNavigation";
import { logger } from "../../utils/logger";
import { useAuth } from "../../hooks/use-auth";

interface HeaderProps {
  isHomePage?: boolean;
  hideRegionSelector?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

// 🆕 Hard-coded Navigation Structure
interface NavMenuItem {
  id: string;
  name: string;
  path: string;
  subcategories?: Array<{
    title: string;
    items: string[];
  }>;
}

const NAVIGATION_ITEMS: NavMenuItem[] = [
  {
    id: 'nav-belletristik',
    name: 'Belletristik',
    path: '/',
    subcategories: [
      {
        title: 'Romane & Erzählungen',
        items: ['Gegenwartsliteratur', 'Historische Romane', 'Familienromane']
      },
      {
        title: 'Krimis & Thriller',
        items: ['Psychothriller', 'Cosy Crime', 'True Crime']
      },
      {
        title: 'Fantasy & SciFi',
        items: ['High Fantasy', 'Science Fiction', 'Dystopien']
      },
      {
        title: 'Klassiker',
        items: ['Deutsche Klassiker', 'Weltliteratur', 'Moderne Klassiker']
      },
      {
        title: 'Weitere',
        items: ['Lyrik & Gedichte', 'Kurzgeschichten', 'Graphic Novels']
      }
    ]
  },
  {
    id: 'nav-sachbuch',
    name: 'Sachbuch',
    path: '/',
    subcategories: [
      {
        title: 'Biografien',
        items: ['Politik & Geschichte', 'Kunst & Kultur', 'Wahre Geschichten']
      },
      {
        title: 'Geschichte',
        items: ['Antike & Archäologie', 'Weltkriege', 'Deutsche Geschichte']
      },
      {
        title: 'Politik',
        items: ['Aktuelle Debatten', 'Wirtschaft & Finanzen', 'Umwelt & Klima']
      },
      {
        title: 'Philosophie',
        items: ['Ethik & Denker', 'Religion & Theologie']
      },
      {
        title: 'Wissenschaft',
        items: ['Psychologie allgemein', 'Naturwissenschaften', 'Technik & Digitales']
      }
    ]
  },
  {
    id: 'nav-kinder-jugend',
    name: 'Kinder & Jugend',
    path: '/',
    subcategories: [
      {
        title: 'Bilderbücher',
        items: ['Ab 2 Jahren', 'Ab 4 Jahren', 'Vorlesebücher']
      },
      {
        title: 'Kinderbücher',
        items: ['Ab 6 Jahren', 'Ab 8 Jahren', 'Ab 10 Jahren']
      },
      {
        title: 'Jugendbücher',
        items: ['Ab 12 Jahren', 'Ab 14 Jahren', 'Young Adult']
      },
      {
        title: 'Sachbücher für Kinder',
        items: ['Natur & Tiere', 'Geschichte & Wissen', 'Experimente & Basteln']
      }
    ]
  },
  {
    id: 'nav-ratgeber',
    name: 'Ratgeber',
    path: '/',
    subcategories: [
      {
        title: 'Gesundheit & Ernährung',
        items: ['Fitness & Sport', 'Ernährung & Diät', 'Medizin & Heilung']
      },
      {
        title: 'Lebenshilfe',
        items: ['Psychologie & Coaching', 'Persönlichkeitsentwicklung', 'Partnerschaft & Familie']
      },
      {
        title: 'Haus & Garten',
        items: ['Gärtnern & Pflanzen', 'Wohnen & Einrichten', 'Heimwerken']
      },
      {
        title: 'Hobby & Freizeit',
        items: ['Kochen & Backen', 'Handarbeit & Kreativ', 'Fotografie & Kunst']
      }
    ]
  },
  {
    id: 'nav-reise',
    name: 'Reise',
    path: '/',
    subcategories: [
      {
        title: 'Deutschland',
        items: ['Nord- & Ostsee', 'Alpen & Bayern', 'Wandern & Natur']
      },
      {
        title: 'Europa',
        items: ['Italien', 'Frankreich', 'Spanien & Portugal', 'Skandinavien', 'Österreich & Schweiz']
      },
      {
        title: 'Weltweit',
        items: ['USA & Kanada', 'Asien', 'Australien & Ozeanien']
      },
      {
        title: 'Stil',
        items: ['Städtefhrer', 'Camping & Roadtrips', 'Reiseberichte']
      }
    ]
  },
  {
    id: 'nav-fachbuch',
    name: 'Fachbuch',
    path: '/',
    subcategories: [
      {
        title: 'Wirtschaft',
        items: ['Management & Führung', 'Marketing & Vertrieb', 'Steuern & Finanzen']
      },
      {
        title: 'Recht',
        items: ['Zivilrecht', 'Strafrecht']
      },
      {
        title: 'IT & Technik',
        items: ['Softwareentwicklung', 'KI & Daten', 'Handwerk']
      },
      {
        title: 'Pädagogik',
        items: ['Schule & Unterricht', 'Erziehungswissenschaft']
      },
      {
        title: 'Medizin',
        items: ['Fachmedizin', 'Pflege & Soziales']
      }
    ]
  },
  {
    id: 'nav-lifestyle',
    name: 'Lifestyle',
    path: '/',
    subcategories: [
      {
        title: 'Kunst',
        items: ['Kunstgeschichte', 'Malerei & Zeichnen', 'Fotografie']
      },
      {
        title: 'Architektur',
        items: ['Hausbau & Design', 'Innenarchitektur']
      },
      {
        title: 'Musik',
        items: ['Rock & Pop', 'Klassik']
      },
      {
        title: 'Bühne',
        items: ['Film & Fernsehen', 'Theater & Tanz']
      },
      {
        title: 'Hobby',
        items: ['Mode & Fashion', 'Gaming', 'Antiquitäten']
      }
    ]
  },
  {
    id: 'nav-auszeichnungen',
    name: 'Auszeichnungen',
    path: '/',
    subcategories: []
  },
  {
    id: 'nav-buchbesprechungen',
    name: 'Shownotes',
    path: '/',
    subcategories: []
  },
  {
    id: 'nav-suche',
    name: 'Kurator*innen',
    path: '/curators',
    subcategories: [
      {
        title: 'Entdecken',
        items: ['Alle Bücher', 'Alle Kuratoren', 'Alle Kurationen', 'Alle Veranstaltungen']
      }
    ]
  }
];

export function Header({
  isHomePage = true,
  hideRegionSelector = false,
  backgroundColor,
  textColor,
}: HeaderProps) {
  const { t } = useTranslation();
  const navigate = useSafeNavigate();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const { favoriteCount } = useFavorites();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user: authUser, isAuthenticated: isLoggedIn, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFavoritesPanelOpen, setIsFavoritesPanelOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ==================================================================
  // 🚩 FEATURE FLAG - V2 Navigation (Toggle for rollback)
  // ==================================================================
  const USE_V2_NAV = true; // ✅ V2 Navigation ACTIVATED - DB schema complete!
  
  // ✅ NEW: Load V2 navigation (parallel load)
  const { data: navDataV2, isLoading: navLoadingV2, error: navErrorV2 } = useNavigationV2();
  
  // 🛡️ DEFENSIVE: Choose navigation based on feature flag
  const menuItems = useMemo(() => {
    // ✅ V2 Path (active)
    if (navDataV2 && navDataV2.items) {
      // V2 data is already in the right format (NavigationItemV2[])
      // But MegaMenu expects the legacy format, so transform it
      
      console.log('🔄 Transforming V2 Navigation:', navDataV2.items.length, 'items');
      
      // Transform V2 to legacy format
      // NOTE: V2 uses 'label' and 'href', legacy uses 'name' and 'path'
      const transformed: NavMenuItem[] = navDataV2.items.map((item, index) => {
        const raw = item as any;
        return {
          id: `${item.slug}-${index}`,
          name: raw.label || item.name || item.slug,
          path: raw.href || item.path || '/',
          subcategories: item.children.length > 0 ? [
            {
              title: '',
              items: item.children.map(child => {
                const rawChild = child as any;
                return rawChild.label || child.name || child.slug;
              })
            }
          ] : []
        };
      });
      
      // Validate V2 items have required fields
      const missingNames = transformed.filter((item: NavMenuItem) => !item.name);
      if (missingNames.length > 0) {
        logger.warn('V2 Navigation: Items with missing names detected:', missingNames);
      }
      
      console.log('✅ Transformed navigation:', transformed.map(i => i.name).join(', '));
      
      return transformed;
    }
    
    // Fallback to hardcoded if V2 fails
    logger.warn('V2 Navigation failed, using fallback');
    return NAVIGATION_ITEMS;
  }, [navDataV2]);

  // ✅ Optional: Log für Debugging
  useEffect(() => {
    if (navErrorV2) {
      console.error('❌ V2 Navigation API failed:', navErrorV2);
    }
    if (navDataV2) {
      console.log('📊 V2 Navigation Data:', {
        schema_version: navDataV2.schema_version,
        content_version: navDataV2.content_version,
        items_count: navDataV2.items.length,
        needs_setup: navDataV2.meta.needs_setup
      });
    }
  }, [navDataV2, navErrorV2]);

  const [feedViewActive, setFeedViewActive] = useState(() => 
    localStorage.getItem('coratiert-feed-as-homepage') === 'true'
  );

  const isOnHomepage = location.pathname === '/' || /^\/[a-z]{2}-[a-z]{2}\/?$/.test(location.pathname);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setFeedViewActive(detail.active);
    };
    window.addEventListener('feed-view-changed', handler);
    return () => window.removeEventListener('feed-view-changed', handler);
  }, []);

  const handleFeedToggle = () => {
    if (isOnHomepage) {
      window.dispatchEvent(new CustomEvent('toggle-feed-view'));
    } else {
      localStorage.setItem('coratiert-feed-as-homepage', 'true');
      setFeedViewActive(true);
      navigate('/');
    }
  };

  const formatKeys = ['hardcover', 'softcover', 'ebook', 'audiobook', 'game'] as const;
  const formatLabels: Record<string, string> = {
    hardcover: t('header.hardcover'),
    softcover: t('header.softcover'),
    ebook: t('header.ebook'),
    audiobook: t('header.audiobook'),
    game: t('header.game'),
  };

  // Sample data for suggestions
  const sampleBooks = [
    'Die Bücherdiebin', 'Der Alchemist', 'Das Café am Rande der Welt', 'Der Schwarm',
    'Die Säulen der Erde', 'Sapiens', 'Homo Deus', 'Der Herr der Ringe',
    'Harry Potter und der Stein der Weisen', '1984', 'Atomic Habits', 'Der Marsianer'
  ];
  const sampleAuthors = [
    'Markus Zusak', 'Paulo Coelho', 'John Strelecky', 'Frank Schätzing',
    'Ken Follett', 'Yuval Noah Harari', 'J.R.R. Tolkien', 'J.K. Rowling',
    'George Orwell', 'James Clear', 'Andy Weir'
  ];
  const samplePublishers = [
    'Blanvalet', 'Diogenes', 'dtv', 'Kiepenheuer & Witsch', 'Lübbe',
    'C.H. Beck', 'Heyne', 'Carlsen', 'Penguin', 'Goldmann'
  ];

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  // Sticky header effect - OPTIMIZED with throttle
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsSticky(window.scrollY > 0);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Generischer Handler für alle anderen Menüs
  const handleGenericMenuClick = (item: string) => {
    // 🎯 Map menu items to page slugs
    const itemToSlugMap: { [key: string]: string } = {
      // Kurator*innen-Menü
      'Alle Bücher': 'bücher',
      'Alle Kuratoren': 'curators',
      'Alle Kurationen': 'kurationen',
      'Alle Veranstaltungen': 'events',
      // Literaturpreise
      'Deutscher Buchpreis': 'deutscher-buchpreis',
      'Booker Prize': 'booker-prize',
      'Pulitzer Prize': 'pulitzer-prize',
      // Genres
      'Belletristik': 'belletristik',
      'Sachbuch': 'sachbuch',
      'Krimi & Thriller': 'krimi-thriller',
      'Fantasy & SciFi': 'fantasy-scifi',
      // Altersgruppen
      'Kinder & Jugend': 'kinder-jugend',
      'Erwachsene': 'erwachsene',
      // Weitere Kategorien
      'Neuerscheinungen': 'neuerscheinungen',
      'Bestseller': 'bestseller',
    };
    
    const slug = itemToSlugMap[item];
    if (slug) {
      navigate(`/${slug}`);
    }
    
    // Body overflow zurücksetzen
    document.body.style.overflow = '';
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/bücher?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/bücher');
    }
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    navigate(`/bücher?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  // ⚡ Performance: Memoize expensive search suggestions calculation
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const suggestions: Array<{ text: string; type: 'book' | 'author' | 'publisher' | 'category' }> = [];

    // Books
    sampleBooks.forEach(book => {
      if (book.toLowerCase().includes(query) && suggestions.length < 15) {
        suggestions.push({ text: book, type: 'book' });
      }
    });

    // Authors
    sampleAuthors.forEach(author => {
      if (author.toLowerCase().includes(query) && suggestions.length < 15) {
        suggestions.push({ text: author, type: 'author' });
      }
    });

    // Publishers
    samplePublishers.forEach(publisher => {
      if (publisher.toLowerCase().includes(query) && suggestions.length < 15) {
        suggestions.push({ text: publisher, type: 'publisher' });
      }
    });

    // Remove duplicates
    const unique = suggestions.filter((item, index, self) => 
      index === self.findIndex(s => s.text === item.text)
    );

    return unique.slice(0, 8);
  }, [searchQuery]);

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      {/* ✅ A11Y: Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue focus:text-white focus:rounded-br-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        {t('header.skipToContent')}
      </a>
      <header
        className={`header-bg border-b border-gray-600 transition-all duration-300 ${
          isSticky ? "sticky top-0 z-[200] shadow-md" : "relative z-[200]"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-3 md:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="py-2 md:py-3 lg:py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4 lg:gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                <button 
                  onClick={() => navigate('/')}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <div className="flex flex-col gap-0.5 mb-0.5">
                    {/* Subtitle line above logo */}
                    <p className="text-[12px] md:text-[13px] lg:text-[15px] origin-left font-sans text-cerulean scale-x-93 font-semibold text-shadow-subtle">
                      {t('header.tagline')}
                    </p>
                    {/* Lowercase logo */}
                    <span 
                      className="text-4xl md:text-5xl flex items-center font-headline font-bold tracking-[0.02em] text-shadow-subtle"
                    >
                      <span className="text-coral">co</span>
                      <span className="mx-[2px] flex items-center gap-[1px]">
                        <span className="logo-spine-outer logo-spine-rotate-up"></span>
                        <span className="logo-spine-inner logo-spine-rotate"></span>
                        <span className="logo-spine-outer logo-spine-rotate-down"></span>
                      </span>
                      <span className="text-cerulean">ratiert</span>
                    </span>
                  </div>
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex-1 w-full md:max-w-xl lg:max-w-2xl">
                <div className="relative">
                  <Search className="search-icon-color absolute left-3 md:left-3.5 lg:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5" />
                  <Input
                    type="search"
                    placeholder={t('header.searchPlaceholder')}
                    className="search-bar pl-9 md:pl-11 lg:pl-12 pr-10 md:pr-12 lg:pr-14 h-10 md:h-11 rounded-lg text-sm md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="search-icon-color absolute right-3 md:right-3.5 lg:right-4 top-1/2 -translate-y-1/2 transition-colors"
                    title={t('header.filter')}
                  >
                    <Sliders className="w-4 md:w-5 h-4 md:h-5" />
                  </button>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-1 md:mt-2 rounded-lg shadow-xl overflow-hidden z-50 bg-white border border-gray-200"
                    >
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="w-full px-3 md:px-4 py-2 md:py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                        >
                          <span className="text-xs md:text-sm text-foreground">
                            {suggestion.text}
                          </span>
                          <span 
                            className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full suggestion-badge"
                          >
                            {suggestion.type === 'book' ? t('header.suggestionBook') : suggestion.type === 'author' ? t('header.suggestionAuthor') : suggestion.type === 'publisher' ? t('header.suggestionPublisher') : t('header.suggestionCategory')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Icons - Desktop */}
              <div 
                className="hidden lg:flex items-center gap-1.5 md:gap-2 lg:gap-3"
                style={{ paddingRight: 'env(safe-area-inset-right)' }}
              >
                {/* Region Switcher */}
                {!hideRegionSelector && <RegionSwitcher />}
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {isLoggedIn ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="rounded-lg w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 transition-all hover:scale-105 flex items-center justify-center bg-foreground hover:opacity-90"
                    aria-label={t('header.openDashboard')}
                    title="Dashboard"
                    data-testid="button-header-dashboard"
                  >
                    {authUser?.profileImageUrl ? (
                      <img src={authUser.profileImageUrl} alt="" className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-background" style={{ strokeWidth: 1.5 }} />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => { window.location.href = '/api/login'; }}
                    className="rounded-lg w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 transition-all hover:scale-105 flex items-center justify-center bg-foreground hover:opacity-90"
                    aria-label="Anmelden"
                    title="Anmelden"
                    data-testid="button-header-login"
                  >
                    <LogIn className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-background" style={{ strokeWidth: 1.5 }} />
                  </button>
                )}
                <div className="relative">
                  <button
                    onClick={() => setIsFavoritesPanelOpen(true)}
                    className="rounded-lg w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 transition-all hover:scale-105 relative flex items-center justify-center bg-foreground hover:opacity-90"
                    aria-label={`${t('header.openFavorites')}${favoriteCount > 0 ? `, ${t('header.booksSaved', { count: favoriteCount })}` : ''}`}
                    title="Favoriten"
                  >
                    <Heart className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-background" style={{ strokeWidth: 1.5 }} />
                    {favoriteCount > 0 && (
                      <span 
                        className="absolute -top-1 -right-1 md:-top-2 md:-right-2 flex items-center justify-center min-w-[18px] h-[18px] md:min-w-[22px] md:h-[22px] rounded-full text-[10px] md:text-xs px-1 favorite-badge"
                      >
                        {favoriteCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation - Horizontal Scroll on Mobile & Tablet */}
          <nav className="nav-bar py-2.5 md:py-2 overflow-x-auto lg:overflow-visible scrollbar-hide -mx-3 px-3 lg:mx-0 lg:px-0 relative translate-y-3 md:translate-y-4 lg:translate-y-6 rounded-none md:rounded-2xl shadow-2xl z-[100]">
            <div className="flex items-center justify-start lg:justify-center gap-0 min-w-max lg:min-w-0">
              {menuItems.map((menuItem) => {
                if (!menuItem.subcategories || menuItem.subcategories.length === 0) {
                  return (
                    <button
                      key={menuItem.id}
                      onClick={() => navigate(menuItem.path)}
                      className="nav-item px-3 md:px-4 lg:px-5 py-2 md:py-2 lg:py-2.5 rounded-full transition-all text-xs md:text-sm lg:text-base font-medium whitespace-nowrap hover:scale-105 flex items-center gap-1.5"
                    >
                      {menuItem.name}
                    </button>
                  );
                }

                const columnCount = menuItem.subcategories.length <= 1 ? 1 : 2;

                return (
                  <MegaMenu
                    key={menuItem.id}
                    title={menuItem.name}
                    categories={menuItem.subcategories}
                    columns={columnCount}
                    onItemClick={handleGenericMenuClick}
                    onTitleClick={() => navigate(menuItem.path)}
                  />
                );
              })}
              <button
                onClick={handleFeedToggle}
                className="ml-4 lg:ml-8 px-4 md:px-5 lg:px-6 py-2 md:py-2 lg:py-2.5 rounded-full transition-all text-xs md:text-sm lg:text-base font-medium whitespace-nowrap hover:scale-105 flex items-center gap-1.5"
                style={{
                  backgroundColor: '#e8604c',
                  color: '#ffffff',
                }}
                data-testid="button-nav-mein-feed"
              >
                {(isOnHomepage && feedViewActive) ? 'Startseite' : 'Mein Feed'}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Unified Mobile Bottom Navigation Bar - shown on all pages */}
      <nav className="nav-mobile md:hidden fixed bottom-0 left-0 right-0 z-[210] safe-area-bottom">
        <div className="grid grid-cols-6 w-full">
          <button
            data-testid="mobile-tab-favorites"
            onClick={() => setIsFavoritesPanelOpen(!isFavoritesPanelOpen)}
            className={`nav-mobile-btn flex flex-col items-center justify-center py-2.5 transition-colors relative ${isFavoritesPanelOpen ? 'nav-mobile-active' : ''}`}
          >
            <div className="relative">
              <Heart className="w-5 h-5" strokeWidth={1.5} />
              {favoriteCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {favoriteCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">{t('mobileNav.favorites')}</span>
          </button>
          <button
            data-testid="mobile-tab-ratings"
            onClick={() => navigate('/dashboard/ratings')}
            className={`nav-mobile-btn flex flex-col items-center justify-center py-2.5 transition-colors ${location.pathname.includes('/dashboard/ratings') ? 'nav-mobile-active' : ''}`}
          >
            <Star className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px] mt-0.5 leading-tight">{t('mobileNav.ratings')}</span>
          </button>
          <button
            data-testid="mobile-tab-storefront"
            onClick={() => navigate('/dashboard/creator-storefront')}
            className={`nav-mobile-btn flex flex-col items-center justify-center py-2.5 transition-colors ${location.pathname.includes('/dashboard/creator-storefront') ? 'nav-mobile-active' : ''}`}
          >
            <Store className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px] mt-0.5 leading-tight">{t('mobileNav.bookstore')}</span>
          </button>
          <button
            data-testid="mobile-tab-notifications"
            onClick={() => navigate('/dashboard/notifications')}
            className={`nav-mobile-btn flex flex-col items-center justify-center py-2.5 transition-colors ${location.pathname.includes('/dashboard/notifications') ? 'nav-mobile-active' : ''}`}
          >
            <Bell className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px] mt-0.5 leading-tight">{t('mobileNav.news')}</span>
          </button>
          <button
            data-testid="mobile-tab-theme"
            onClick={toggleTheme}
            className="nav-mobile-btn flex flex-col items-center justify-center py-2.5 transition-colors"
          >
            {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" strokeWidth={1.5} /> : <Sun className="w-5 h-5" strokeWidth={1.5} />}
            <span className="text-[10px] mt-0.5 leading-tight">{resolvedTheme === 'dark' ? t('mobileNav.darkMode') : t('mobileNav.lightMode')}</span>
          </button>
          <button
            data-testid="mobile-tab-more"
            onClick={() => navigate('/dashboard')}
            className={`nav-mobile-btn flex flex-col items-center justify-center py-2.5 transition-colors ${isDashboard && !location.pathname.includes('/dashboard/ratings') && !location.pathname.includes('/dashboard/creator-storefront') && !location.pathname.includes('/dashboard/notifications') ? 'nav-mobile-active' : ''}`}
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px] mt-0.5 leading-tight">{t('mobileNav.more')}</span>
          </button>
        </div>
      </nav>

      <FavoritesPanel
        isOpen={isFavoritesPanelOpen}
        onClose={() => setIsFavoritesPanelOpen(false)}
      />

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsFilterModalOpen(false)}>
          <div className="absolute top-20 right-4 md:right-8 bg-white rounded-2xl shadow-2xl max-w-md w-full md:w-80 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-gray-900 font-headline">{t('header.filter')}</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-700 mb-3">{t('header.formats')}</h3>
                <div className="flex flex-wrap gap-2">
                  {formatKeys.map(formatKey => (
                    <button
                      key={formatKey}
                      onClick={() => toggleFormat(formatKey)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedFormats.includes(formatKey)
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={selectedFormats.includes(formatKey) ? { backgroundColor: 'var(--creator-accent)' } : {}}
                    >
                      {formatLabels[formatKey]}
                    </button>
                  ))}
                </div>
              </div>
              
              {selectedFormats.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedFormats([])}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--creator-accent)' }}
                  >
                    {t('common.resetAll')}
                  </button>
                </div>
              )}
              
              <div className="pt-4">
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="w-full text-white py-3 rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--creator-accent)' }}
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}