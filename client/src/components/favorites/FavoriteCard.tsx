import { X } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { memo, useMemo } from "react";
import { type FrontendEntityType } from "./FavoritesContext";

interface FavoriteCardProps {
  type: FrontendEntityType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  color?: string;
  onRemove?: () => void;
}

export const FavoriteCard = memo(function FavoriteCard({
  type,
  title,
  subtitle,
  imageUrl,
  color,
  onRemove,
}: FavoriteCardProps) {
  const badgeConfig = useMemo(() => {
    switch (type) {
      case "book":
        return { bg: "bg-[var(--color-blue-cerulean)]", text: "text-white", label: "Buch" };
      case "creator":
        return { bg: "bg-[var(--color-saffron)]", text: "text-white", label: "Kurator:in" };
      case "author":
        return { bg: "bg-[var(--color-saffron)]", text: "text-white", label: "Autor:in" };
      case "publisher":
        return { bg: "bg-[var(--color-teal-tropical)]", text: "text-foreground", label: "Verlag" };
      case "category":
        return { bg: "bg-[var(--color-coral-vibrant)]", text: "text-white", label: "Kategorie" };
      case "tag":
        return { bg: "bg-primary", text: "text-primary-foreground", label: "Thema" };
      case "series":
        return { bg: "bg-secondary", text: "text-secondary-foreground", label: "Buchreihe" };
      case "genre":
        return { bg: "bg-accent", text: "text-accent-foreground", label: "Genre" };
      default:
        return { bg: "bg-muted", text: "text-muted-foreground", label: "" };
    }
  }, [type]);

  const borderColor = useMemo(() => {
    if (type === "creator" || type === "author") {
      return "var(--color-blue-cerulean)";
    }
    if (color) {
      return color;
    }
    switch (type) {
      case "tag":
        return "var(--color-teal-tropical)";
      case "category":
        return "var(--color-coral-vibrant)";
      case "publisher":
        return "var(--color-teal-tropical)";
      case "book":
        return "var(--color-blue-cerulean)";
      case "series":
        return "var(--color-saffron)";
      case "genre":
        return "var(--color-coral-vibrant)";
      default:
        return "var(--color-blue-cerulean)";
    }
  }, [type, color]);

  const getInitials = (text: string): string => {
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return text.charAt(0).toUpperCase();
  };

  return (
    <div
      className="group bg-card border border-border rounded-xl p-3 flex gap-3 items-center transition-colors"
      data-testid={`card-favorite-${type}`}
    >
      <div className="flex-shrink-0">
        <div
          className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            boxShadow: `0 0 0 2.5px ${borderColor}`,
          }}
        >
          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-xs md:text-sm font-semibold text-muted-foreground">
                {getInitials(title)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate leading-tight">
              {title}
            </h4>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 leading-tight">
                {subtitle}
              </p>
            )}
            <span
              className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeConfig.bg} ${badgeConfig.text}`}
            >
              {badgeConfig.label}
            </span>
          </div>
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-md flex-shrink-0 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 hover:text-destructive-foreground hover:bg-destructive/10 transition-all"
            data-testid="button-remove-favorite"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
