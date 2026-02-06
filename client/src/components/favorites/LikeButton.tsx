import { Heart } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { useFavorites, type FrontendEntityType } from "./FavoritesContext";

interface LikeButtonProps {
  entityId?: string;
  entityType?: FrontendEntityType;  // ✅ Updated: FrontendEntityType statt EntityType
  entityTitle?: string;
  entitySubtitle?: string;
  entityImage?: string;
  isLiked?: boolean;
  onToggle?: () => void;
  onLike?: () => void;
  likeCount?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "minimal" | "counter" | "social";
  iconColor?: string;
  backgroundColor?: string;
  hoverBackgroundColor?: string; // Color to use for hover state background
}

export function LikeButton({
  entityId,
  entityType = "book",
  entityTitle = "",
  entitySubtitle = "",
  entityImage,
  isLiked: controlledIsLiked,
  onToggle,
  onLike,
  likeCount,
  size = "md",
  variant = "default",
  iconColor,
  backgroundColor = "transparent",
  hoverBackgroundColor, // New prop for hover background
}: LikeButtonProps) {
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const [isLiked, setIsLiked] = useState(controlledIsLiked ?? false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine icon color: prioritize passed iconColor prop, fallback to background-based logic
  const finalIconColor = iconColor 
    ? iconColor // Use explicitly passed color (e.g., var(--charcoal))
    : backgroundColor === 'var(--color-bg-dark)' || backgroundColor === 'var(--charcoal)'
    ? 'var(--color-white)' // White on dark backgrounds
    : 'var(--charcoal)'; // Dark on light backgrounds
  
  // Special handling for coral backgrounds: white heart in both states
  const isCoralBackground = backgroundColor === 'var(--vibrant-coral)';
  
  // ✅ Special handling for saffron backgrounds: white heart in both states (like author badges)
  const isSaffronBackground = backgroundColor === 'var(--color-saffron)';
  
  // Liked heart is ALWAYS coral, UNLESS on coral/saffron background (then white)
  const likedHeartColor = (isCoralBackground || isSaffronBackground) ? '#ffffff' : 'var(--vibrant-coral)';
  
  // Override finalIconColor for coral/saffron backgrounds
  const effectiveIconColor = (isCoralBackground || isSaffronBackground) ? '#ffffff' : finalIconColor;
  
  // Helper function to get contrast color
  function getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'var(--charcoal)' : 'var(--color-white)';
  }
  
  // Determine hover colors: 
  // - If hoverBackgroundColor is provided, calculate contrast for text
  // - Otherwise use default behavior
  const hoverBgColor = hoverBackgroundColor || finalIconColor;
  const hoverTextColor = hoverBackgroundColor 
    ? getContrastColor(hoverBackgroundColor) // Calculate contrast for visibility
    : 'var(--tropical-teal)'; // Default teal hover text

  // Optimize: Only check favorite status for this specific entity
  const isFavorited = useMemo(() => {
    if (!entityId) return false;
    return favorites.some((fav) => fav.id === entityId);
  }, [entityId, favorites]);

  // Sync with context if entityId is provided
  useEffect(() => {
    if (entityId) {
      setIsLiked(isFavorited);
    }
  }, [entityId, isFavorited]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (entityId && entityTitle) {
      // Use context
      toggleFavorite({
        id: entityId,
        type: entityType,
        title: entityTitle,
        subtitle: entitySubtitle,
        image: entityImage,
      });
    } else {
      // Fallback to local state
      setIsLiked(!isLiked);
    }
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    onToggle?.();
    onLike?.();
  };

  const sizeClasses = {
    xs: "w-3 h-3 p-0",
    sm: "w-6 h-6 p-0",
    md: "w-8 h-8 p-0",
    lg: "w-10 h-10 p-0",
    xl: "w-12 h-12 p-0",
  };

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-4 h-4",
    md: "w-[15px] h-[15px]",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  // Counter variant for BookCard
  if (variant === "counter") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2 py-1 h-auto transition-all duration-200 ${
          isAnimating ? "scale-110" : "scale-100"
        }`}
        style={{ color: isLiked ? likedHeartColor : iconColor || "currentColor" }}
      >
        <Heart
          className={`w-5 h-5 stroke-2 transition-all ${
            isLiked ? `fill-[${likedHeartColor}] stroke-[${likedHeartColor}]` : ""
          }`}
          style={isLiked ? { fill: likedHeartColor, stroke: likedHeartColor } : {}}
        />
        {likeCount !== undefined && likeCount > 0 && (
          <span className="text-sm">{likeCount}</span>
        )}
      </Button>
    );
  }

  if (variant === "minimal") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center justify-center transition-all ${
          isAnimating ? "heart-bounce" : ""
        }`}
      >
        <Heart
          className={`${iconSizes[size]} transition-all`}
          strokeWidth={1.5}
          style={
            isLiked 
              ? { fill: likedHeartColor, stroke: likedHeartColor }
              : { stroke: effectiveIconColor }
          }
        />
      </button>
    );
  }

  if (variant === "social") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center hover:shadow-lg transition-all ${
          isAnimating ? "scale-110" : "scale-100"
        }`}
        style={
          isLiked 
            ? { borderColor: likedHeartColor, color: likedHeartColor, backgroundColor: 'transparent' }
            : { borderColor: finalIconColor, color: finalIconColor, backgroundColor: 'transparent' }
        }
        onMouseEnter={(e) => {
          if (!isLiked) {
            e.currentTarget.style.backgroundColor = hoverBgColor;
            e.currentTarget.style.color = hoverTextColor;
          }
        }}
        onMouseLeave={(e) => {
          if (!isLiked) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = finalIconColor;
          }
        }}
      >
        <Heart
          className="w-5 h-5 transition-all"
          style={
            isLiked 
              ? { fill: likedHeartColor, stroke: likedHeartColor }
              : { stroke: finalIconColor, fill: 'transparent' }
          }
        />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={`w-12 h-12 hover:bg-transparent hover:shadow-none focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all duration-200 shadow-none p-0 -ml-4 text-foreground ${
        isAnimating ? "scale-150" : "scale-100"
      }`}
    >
      <Heart
        className={`w-12 h-12 transition-all`}
        style={
          isLiked 
            ? { fill: likedHeartColor, stroke: likedHeartColor, strokeWidth: 2 }
            : { fill: 'none', strokeWidth: 2 }
        }
      />
    </Button>
  );
}