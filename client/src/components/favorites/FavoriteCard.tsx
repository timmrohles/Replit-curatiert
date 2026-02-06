import { X } from "lucide-react";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { memo, useMemo } from "react";
import { Text } from "../ui";
import { type FrontendEntityType } from "./FavoritesContext";  // ✅ Import type

interface FavoriteCardProps {
  type: FrontendEntityType;  // ✅ Updated: FrontendEntityType statt hardcoded union
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onRemove?: () => void;
}

export const FavoriteCard = memo(function FavoriteCard({
  type,
  title,
  subtitle,
  imageUrl,
  onRemove,
}: FavoriteCardProps) {
  // Type-specific badge colors using CSS Custom Properties
  const badgeStyles = useMemo(() => {
    switch (type) {
      case "book":
        return {
          backgroundColor: 'var(--color-blue)',
          color: 'var(--color-white)',
        };
      case "creator":
        return {
          backgroundColor: 'var(--color-saffron)',
          color: 'var(--color-white)',
        };
      case "author":
        return {
          backgroundColor: 'var(--color-saffron)',
          color: 'var(--color-white)',
        };
      case "publisher":
        return {
          backgroundColor: 'var(--color-mint)',
          color: 'var(--color-charcoal)',
        };
      case "category":
        return {
          backgroundColor: 'var(--color-coral)',
          color: 'var(--color-white)',
        };
      case "tag":
        return {
          backgroundColor: 'var(--color-teal)',
          color: 'var(--color-white)',
        };
      case "series":
        return {
          backgroundColor: 'var(--color-lavender)',
          color: 'var(--color-charcoal)',
        };
      case "genre":
        return {
          backgroundColor: 'var(--color-peach)',
          color: 'var(--color-charcoal)',
        };
      default:
        return {
          backgroundColor: 'var(--color-gray-200)',
          color: 'var(--color-charcoal)',
        };
    }
  }, [type]);

  const typeLabel = useMemo(() => {
    switch (type) {
      case "book":
        return "Buch";
      case "creator":
        return "Kurator:in";
      case "publisher":
        return "Verlag";
      case "author":
        return "Autor:in";
      case "category":
        return "Kategorie";
      case "tag":
        return "Tag";
      case "series":
        return "Buchreihe";
      case "genre":
        return "Genre";
      default:
        return "";
    }
  }, [type]);

  // Generate initials for fallback avatar
  const getInitials = (text: string): string => {
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return text.charAt(0).toUpperCase();
  };

  return (
    <div 
      className="group rounded-xl border hover:shadow-lg transition-all p-3 md:p-4"
      style={{
        backgroundColor: 'var(--color-white)',
        borderColor: 'var(--color-gray-200)',
      }}
    >
      <div className="flex gap-2.5 md:gap-3">
        {/* Image/Avatar */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              alt={title}
              className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-lg"
            />
          ) : (
            <div 
              className="w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-gray-100)' }}
            >
              <Text 
                as="span" 
                variant="small"
                className="md:text-base font-semibold"
                style={{ color: 'var(--color-gray-500)' }}
              >
                {getInitials(title)}
              </Text>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Text 
              as="h4" 
              variant="xs"
              className="md:text-sm font-semibold truncate leading-tight"
              style={{ color: 'var(--color-charcoal)' }}
            >
              {title}
            </Text>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="w-8 h-8 md:w-7 md:h-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex-shrink-0 hover:bg-red-50 -mt-1"
              style={{ color: 'var(--color-coral)' }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {subtitle && (
            <Text 
              as="p" 
              variant="xs" 
              className="truncate mb-2 leading-tight"
              style={{ color: 'var(--color-gray-600)' }}
            >
              {subtitle}
            </Text>
          )}
          
          <span
            className="inline-block px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-xs font-medium"
            style={badgeStyles}
          >
            {typeLabel}
          </span>
        </div>
      </div>
    </div>
  );
});