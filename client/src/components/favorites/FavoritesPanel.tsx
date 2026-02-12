import { X, Trash2, Heart, Store } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSafeNavigate } from "../../utils/routing";
import { useFavorites } from "./FavoritesContext";
import { FavoriteCard } from "./FavoriteCard";

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FavoritesPanel({ isOpen, onClose }: FavoritesPanelProps) {
  const { t } = useTranslation();
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useSafeNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleRemove = (id: string) => {
    removeFavorite(id);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        t('favorites.confirmClearAll')
      )
    ) {
      favorites.forEach((fav) => removeFavorite(fav.id));
    }
  };

  const tabs = [
    { id: "all", label: t('favorites.tabAll'), count: favorites.length },
    { id: "book", label: t('favorites.tabBooks'), count: favorites.filter((f) => f.type === "book").length },
    { id: "creator", label: t('favorites.tabCurators'), count: favorites.filter((f) => f.type === "creator").length },
    { id: "author", label: t('favorites.tabAuthors'), count: favorites.filter((f) => f.type === "author").length },
    { id: "publisher", label: t('favorites.tabPublishers'), count: favorites.filter((f) => f.type === "publisher").length },
    { id: "category", label: t('favorites.tabCategories'), count: favorites.filter((f) => f.type === "category").length },
    { id: "tag", label: t('favorites.tabTopics'), count: favorites.filter((f) => f.type === "tag").length },
    { id: "series", label: t('favorites.tabSeries'), count: favorites.filter((f) => f.type === "series").length },
    { id: "genre", label: t('favorites.tabGenres'), count: favorites.filter((f) => f.type === "genre").length },
  ];

  const visibleTabs = tabs.filter((t) => t.id === "all" || t.count > 0);

  const getFilteredFavorites = () => {
    if (activeTab === "all") return favorites;
    return favorites.filter((f) => f.type === activeTab);
  };

  const filteredFavorites = getFilteredFavorites();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/60 transition-opacity"
        style={{ bottom: 0 }}
        onClick={onClose}
        data-testid="overlay-favorites"
      />

      <div className="fixed inset-x-0 top-0 z-[201] flex items-end md:items-center md:justify-center pointer-events-none favorites-panel-container">
        <div
          className="pointer-events-auto bg-card text-card-foreground w-full md:max-w-2xl lg:max-w-4xl h-full md:h-auto md:max-h-[85vh] md:rounded-2xl md:mx-4 flex flex-col overflow-hidden md:shadow-2xl border-0 md:border md:border-border"
          onClick={(e) => e.stopPropagation()}
          data-testid="panel-favorites"
        >
          <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Heart className="w-5 h-5 text-[var(--color-coral-vibrant)] flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-headline text-foreground truncate">
                  {t('favorites.title')}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t('favorites.count', { count: favorites.length })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {favorites.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive-foreground bg-destructive/10 hover:bg-destructive/20 transition-colors"
                  data-testid="button-clear-all-favorites"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('favorites.clearAll')}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="ml-1 w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                data-testid="button-close-favorites"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            ref={tabsRef}
            className="px-4 md:px-6 overflow-x-auto flex-shrink-0 border-b border-border"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
          >
            <style>{`.fav-tabs::-webkit-scrollbar { display: none; }`}</style>
            <div className="fav-tabs flex gap-1.5 py-2.5 min-w-max">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] flex items-center gap-1.5 ${
                      isActive
                        ? "bg-[var(--color-coral-vibrant)] text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`tab-favorites-${tab.id}`}
                  >
                    {tab.label}
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? "bg-white/25 text-white" : "bg-background text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto bg-background p-4 md:p-6 pb-24 md:pb-6"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {filteredFavorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Heart className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-headline text-foreground mb-2">
                  {activeTab === "all"
                    ? t('favorites.emptyTitle')
                    : `Keine ${visibleTabs.find((t) => t.id === activeTab)?.label}`}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {activeTab === "all"
                    ? t('favorites.emptyDescription')
                    : `Markiere ${visibleTabs.find((t) => t.id === activeTab)?.label} als Favoriten, um sie hier zu sehen.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFavorites.map((item) => (
                  <FavoriteCard
                    key={item.id}
                    type={item.type}
                    title={item.title}
                    subtitle={item.subtitle}
                    imageUrl={item.image}
                    color={item.color}
                    onRemove={() => handleRemove(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {favorites.length > 0 && (
            <div className="flex-shrink-0 border-t border-border px-4 py-3 md:px-6 md:py-4 bg-card">
              <button
                onClick={() => {
                  onClose();
                  navigate('/dashboard/creator-storefront');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--creator-accent, #10B981)', color: '#ffffff' }}
                data-testid="button-favorites-to-storefront"
              >
                <Store className="w-4 h-4" />
                {t('favorites.toStorefront')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
