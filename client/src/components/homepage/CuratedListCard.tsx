import React, { memo, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useFavorites } from '../favorites/FavoritesContext';
import { CoRatiertLogo } from '../common/CoRatiertLogo';

interface CuratedListCardProps {
  title: string;
  reason: string;
  curator: string;
  curatorAvatar?: string;
  curatorBio?: string;
  curatorFocus?: string;
  covers: string[];
  onClick?: () => void;
}

export const CuratedListCard = memo(function CuratedListCard({
  title,
  reason,
  curator,
  curatorAvatar,
  curatorBio,
  curatorFocus,
  covers,
  onClick
}: CuratedListCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({
      id: `curator-${curator}`,
      type: 'creator',
      title: curator,
      subtitle: curatorFocus,
      image: curatorAvatar,
    });
  }, [curator, curatorFocus, curatorAvatar, toggleFavorite]);

  const isCuratorFavorite = isFavorite(`curator-${curator}`);

  return (
    <div 
      className="bg-transparent rounded-xl p-4 transition-all cursor-pointer group h-full flex flex-col w-fit"
      onClick={onClick}
    >
      {/* Book covers preview */}
      <div className="flex gap-2.5 mb-5">
        {covers.slice(0, 3).map((cover, i) => (
          <div 
            key={i} 
            className="rounded-sm w-[117px] h-[156px] shadow-[4px_4px_8px_rgba(0,0,0,0.2)] border border-gray-200 dark:border-gray-700"
          >
            <img 
              src={cover} 
              alt=""
              className="w-full h-full group-hover:scale-105 transition-transform duration-300 rounded-sm object-contain"
            />
          </div>
        ))}
      </div>
      
      <h4 className="mb-2 line-clamp-2 font-medium text-base text-foreground">
        {title}
      </h4>
      <p className="text-sm mb-2.5 line-clamp-2 flex-1 text-blue">
        {reason}
      </p>
      
      <div className="pt-2.5 border-t border-white/20 dark:border-gray-700/50">
        <p className="text-xs mb-2 text-foreground">Kuratiert von:</p>
        <div className="flex items-center gap-3">
          {curatorAvatar && (
            <div className="relative flex-shrink-0">
              <div className="curator-avatar curator-avatar-sm ring-2 ring-cerulean ring-offset-2 shadow-lg">
                <ImageWithFallback
                  src={curatorAvatar}
                  alt={curator}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="curator-name text-base truncate flex items-center gap-2 text-blue">{curator.toLowerCase().startsWith('coratiert') ? (
                  <>
                    <CoRatiertLogo size="sm" />
                    <span>{curator.replace(/^coratiert\s*/i, '')}</span>
                  </>
                ) : (
                  curator
                )}
              </p>
              <button
                onClick={handleFavoriteClick}
                className="flex-shrink-0 transition-transform hover:scale-110"
                aria-label={isCuratorFavorite ? 'Nicht mehr folgen' : 'Folgen'}
                title={isCuratorFavorite ? 'Nicht mehr folgen' : 'Folgen'}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isCuratorFavorite ? 'fill-blue text-blue' : 'text-blue'
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            </div>
            {curatorFocus && (
              <p className="text-sm font-semibold truncate text-foreground">
                {curatorFocus}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});