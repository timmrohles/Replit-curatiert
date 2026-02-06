import { Search, Bell, Menu } from 'lucide-react';
import { DSText } from './DSTypography';

interface DSTopNavProps {
  userName?: string;
  userAvatar?: string;
  onMenuClick?: () => void;
  notificationCount?: number;
}

export function DSTopNav({ 
  userName = "Creator", 
  userAvatar,
  onMenuClick,
  notificationCount = 0 
}: DSTopNavProps) {
  return (
    <header className="h-[var(--ds-header-height)] bg-[var(--ds-bg-primary)] border-b border-[var(--ds-border-default)] flex items-center justify-between px-6">
      {/* Left: Mobile Menu + Search */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-[var(--ds-radius-md)] hover:bg-[var(--ds-hover-overlay)] transition-colors"
          aria-label="Menü öffnen"
        >
          <Menu className="w-5 h-5 text-[var(--ds-text-secondary)]" />
        </button>

        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--ds-text-tertiary)]" />
          <input
            type="search"
            placeholder="Bücher, Reihen oder Analytics suchen..."
            className="w-full h-10 pl-10 pr-4 bg-[var(--ds-bg-secondary)] border border-[var(--ds-border-subtle)] rounded-[var(--ds-radius-sm)] text-[var(--ds-text-base)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-focus-ring)] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative w-10 h-10 flex items-center justify-center rounded-[var(--ds-radius-md)] hover:bg-[var(--ds-hover-overlay)] transition-colors"
          aria-label="Benachrichtigungen"
        >
          <Bell className="w-5 h-5 text-[var(--ds-text-secondary)]" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-[var(--ds-error)] text-white text-xs font-medium rounded-full flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User Avatar + Name */}
        <button className="flex items-center gap-3 px-3 h-10 rounded-[var(--ds-radius-md)] hover:bg-[var(--ds-hover-overlay)] transition-colors">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#247ba0] ring-offset-2"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--ds-accent-slate-blue)] flex items-center justify-center">
              <DSText variant="label" color="inverse" as="span">
                {userName.charAt(0).toUpperCase()}
              </DSText>
            </div>
          )}
          <DSText variant="label" color="primary" as="span" className="hidden sm:block">
            {userName}
          </DSText>
        </button>
      </div>
    </header>
  );
}