import React, { memo } from 'react';
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
    <div className="bg-white dark:bg-surface rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-center min-w-72 h-full flex flex-col">
      <img 
        src={avatar} 
        alt={name}
        className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-[var(--color-brand-beige)]"
      />
      <h3 className="text-foreground mb-1">{name}</h3>
      <p className="text-sm text-[var(--color-brand-blue-light)] mb-2 font-medium">{focus}</p>
      <p className="text-sm text-[var(--color-brand-gray)] dark:text-foreground-muted mb-4 line-clamp-2 flex-1">{bio}</p>
      <DSButton variant="secondary" size="small" onClick={onClick}>
        Meine Buchreihen
      </DSButton>
    </div>
  );
});