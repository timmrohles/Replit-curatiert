import { X, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { FavoriteCard } from "./FavoriteCard";
import { useState } from "react";
import { useFavorites } from "./FavoritesContext";
import { Heading, Text } from "../ui";

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FavoritesPanel({ isOpen, onClose }: FavoritesPanelProps) {
  const { favorites, removeFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleRemove = (id: string) => {
    removeFavorite(id);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "Möchten Sie wirklich alle Favoriten löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      // Remove all favorites one by one
      favorites.forEach((fav) => removeFavorite(fav.id));
    }
  };

  const tabs = [
    { id: "all", label: "Alle", count: favorites.length },
    {
      id: "book",
      label: "Bücher",
      count: favorites.filter((f) => f.type === "book").length,
    },
    {
      id: "curator",
      label: "Kurator:innen",
      count: favorites.filter((f) => f.type === "curator").length,
    },
    {
      id: "author",
      label: "Autoren",
      count: favorites.filter((f) => f.type === "author").length,
    },
    {
      id: "publisher",
      label: "Verlage",
      count: favorites.filter((f) => f.type === "publisher").length,
    },
    {
      id: "category",
      label: "Kategorien",
      count: favorites.filter((f) => f.type === "category").length,
    },
    {
      id: "tag",
      label: "Tags",
      count: favorites.filter((f) => f.type === "tag").length,
    },
    {
      id: "series",
      label: "Buchreihen",
      count: favorites.filter((f) => f.type === "series").length,
    },
    {
      id: "genre",
      label: "Genres",
      count: favorites.filter((f) => f.type === "genre").length,
    },
  ];

  const getFilteredFavorites = () => {
    if (activeTab === "all") {
      return favorites;
    }
    return favorites.filter((f) => f.type === activeTab);
  };

  const filteredFavorites = getFilteredFavorites();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200] transition-opacity"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      />

      {/* Panel - Mobile: Full screen minus safe areas, Desktop: Centered modal */}
      <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-4">
        <div
          className="rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-5xl h-[95vh] md:max-h-[90vh] flex flex-col"
          style={{ backgroundColor: 'var(--color-white)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="p-4 md:p-6 flex items-center justify-between border-b flex-shrink-0"
            style={{ borderColor: 'var(--color-gray-200)' }}
          >
            <div className="flex-1 min-w-0 mr-4">
              <Heading as="h2" variant="h3" className="mb-0.5 md:mb-1 truncate">
                Meine Favoriten
              </Heading>
              <Text variant="xs" className="md:text-sm" style={{ color: 'var(--color-gray-600)' }}>
                {favorites.length} {favorites.length === 1 ? "Element" : "Elemente"}
              </Text>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {favorites.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={handleClearAll}
                  className="rounded-xl hover:bg-red-50 h-10 px-3"
                  style={{ color: 'var(--color-coral)' }}
                >
                  <Trash2 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Alle löschen</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-xl h-10 w-10"
                style={{ color: 'var(--color-charcoal)' }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tabs - Horizontal scroll on mobile */}
          <div 
            className="px-4 md:px-6 overflow-x-auto scrollbar-hide border-b flex-shrink-0"
            style={{ 
              borderColor: 'var(--color-gray-200)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex gap-2 py-3 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-3 md:px-4 py-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center"
                  style={{
                    backgroundColor: activeTab === tab.id 
                      ? 'var(--color-coral)' 
                      : 'var(--color-gray-100)',
                    color: activeTab === tab.id 
                      ? 'var(--color-white)' 
                      : 'var(--color-charcoal)',
                  }}
                >
                  <Text 
                    as="span" 
                    variant="xs"
                    className="md:text-sm font-semibold"
                    style={{ color: 'inherit' }}
                  >
                    {tab.label}
                  </Text>
                  {" "}
                  <span
                    className="ml-1.5 px-1.5 md:px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: activeTab === tab.id 
                        ? 'rgba(255, 255, 255, 0.25)' 
                        : 'var(--color-gray-200)',
                      color: activeTab === tab.id 
                        ? 'var(--color-white)' 
                        : 'var(--color-gray-700)',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content - Scrollable */}
          <div 
            className="flex-1 overflow-y-auto p-4 md:p-6"
            style={{ 
              backgroundColor: 'var(--color-gray-50)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {filteredFavorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center px-4">
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-gray-200)' }}
                >
                  <span className="text-3xl md:text-4xl">💛</span>
                </div>
                <Heading as="h3" variant="h4" className="mb-2">
                  {activeTab === "all"
                    ? "Noch keine Favoriten"
                    : `Keine ${tabs.find((t) => t.id === activeTab)?.label}`}
                </Heading>
                <Text 
                  variant="small" 
                  className="max-w-sm"
                  style={{ color: 'var(--color-gray-600)' }}
                >
                  {activeTab === "all"
                    ? "Speichere Bücher, Kurator:innen, Autoren und mehr, um sie hier wiederzufinden."
                    : `Markiere ${
                        tabs.find((t) => t.id === activeTab)?.label
                      } als Favoriten, um sie hier zu sehen.`}
                </Text>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filteredFavorites.map((item) => (
                  <FavoriteCard
                    key={item.id}
                    type={item.type}
                    title={item.title}
                    subtitle={item.subtitle}
                    imageUrl={item.image}
                    onRemove={() => handleRemove(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}