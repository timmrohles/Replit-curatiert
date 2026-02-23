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
      className="bg-card border border-border rounded-md p-[var(--space-6)] hover-elevate transition-all cursor-pointer group"
      onClick={onClick}
      data-testid="card-ds-creator"
    >
      <div className="flex items-start gap-[var(--space-4)]">
        <img
          src={avatar}
          alt={name}
          className="rounded-full object-cover flex-shrink-0 ring-2 ring-[var(--color-blue-cerulean)] ring-offset-2"
          style={{ width: 'var(--avatar-md)', height: 'var(--avatar-md)' }}
          data-testid="img-ds-creator-avatar"
        />

        <div className="flex-1 min-w-0">
          <DSText variant="label" color="primary" className="mb-[var(--space-1)]">
            {name}
          </DSText>
          <DSText variant="caption" color="secondary" className="line-clamp-2">
            {bio}
          </DSText>
        </div>

        <button
          onClick={handleLike}
          className={`flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
            isLiked
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-muted-foreground hover-elevate'
          }`}
          style={{ width: 'var(--avatar-sm)', height: 'var(--avatar-sm)' }}
          aria-label={isLiked ? 'Unlike' : 'Like'}
          data-testid="button-ds-creator-like"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
