import { Heart } from 'lucide-react';
import { DSText } from './DSTypography';
import { useState } from 'react';

interface DSCreatorCardProps {
  avatar: string;
  name: string;
  bio: string;
  liked?: boolean;
  onLike?: (liked: boolean) => void;
  onClick?: () => void;
}

export function DSCreatorCard({
  avatar,
  name,
  bio,
  liked = false,
  onLike,
  onClick,
}: DSCreatorCardProps) {
  const [isLiked, setIsLiked] = useState(liked);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    onLike?.(newLiked);
  };

  return (
    <div
      className="bg-[var(--ds-bg-primary)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] p-6 hover:shadow-[var(--ds-shadow-md)] transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <img
          src={avatar}
          alt={name}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-[#247ba0] ring-offset-2"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <DSText variant="label" color="primary" className="mb-1">
            {name}
          </DSText>
          <DSText variant="caption" color="secondary" className="line-clamp-2">
            {bio}
          </DSText>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
            isLiked
              ? 'bg-[var(--ds-error-light)] text-[var(--ds-error)]'
              : 'bg-[var(--ds-bg-secondary)] text-[var(--ds-text-tertiary)] hover:bg-[var(--ds-error-light)] hover:text-[var(--ds-error)]'
          }`}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}