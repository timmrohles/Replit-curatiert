import { memo } from 'react';
import { DSButton } from '../design-system/DSButton';

interface CreatorCardProps {
  avatar: string;
  name: string;
  bio: string;
  focus: string;
  onClick?: () => void;
}

export const CreatorCard = memo(function CreatorCard({ avatar, name, bio, focus, onClick }: CreatorCardProps) {
  return (
    <div
      className="bg-card dark:bg-card border border-border rounded-md p-[var(--space-6)] hover-elevate transition-all text-center min-w-72 h-full flex flex-col"
      data-testid="card-creator"
    >
      <img
        src={avatar}
        alt={name}
        className="rounded-full object-cover mx-auto mb-[var(--space-4)] border-2 border-[var(--color-beige)]"
        style={{ width: 'var(--avatar-lg)', height: 'var(--avatar-lg)' }}
        data-testid="img-creator-avatar"
      />
      <h3 className="text-foreground mb-[var(--space-1)]" data-testid="text-creator-name">{name}</h3>
      <p className="text-sm text-[var(--color-blue-cerulean)] mb-[var(--space-2)] font-medium" data-testid="text-creator-focus">{focus}</p>
      <p className="text-sm text-muted-foreground mb-[var(--space-4)] line-clamp-2 flex-1" data-testid="text-creator-bio">{bio}</p>
      <DSButton variant="secondary" size="small" onClick={onClick} data-testid="button-creator-action">
        Meine Buchreihen
      </DSButton>
    </div>
  );
});
