interface ContentTabsProps {
  activeTab: 'bücher' | 'rezensionen' | 'veranstaltungen' | 'bonusinhalte' | 'autor:innen';
  onTabChange: (tab: 'bücher' | 'rezensionen' | 'veranstaltungen' | 'bonusinhalte' | 'autor:innen') => void;
  accentColor?: string;
  showAuthorsTab?: boolean; // New prop for publisher storefronts
}

export function ContentTabs({ activeTab, onTabChange, accentColor = '#A0CEC8', showAuthorsTab = false }: ContentTabsProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-12 py-4 md:py-6 lg:py-8">
          <button
            onClick={() => onTabChange('bücher')}
            className={`headline px-6 py-3 transition-all duration-200 text-base tracking-wider ${
              activeTab === 'bücher'
                ? 'text-foreground border-b-[3px] border-foreground'
                : 'text-gray-400 hover:text-foreground border-b-[3px] border-transparent'
            }`}
          >
            Bücher
          </button>
          <button
            onClick={() => onTabChange('rezensionen')}
            className={`headline px-6 py-3 transition-all duration-200 text-base tracking-wider ${
              activeTab === 'rezensionen'
                ? 'text-foreground border-b-[3px] border-foreground'
                : 'text-gray-400 hover:text-foreground border-b-[3px] border-transparent'
            }`}
          >
            Rezensionen
          </button>
          <button
            onClick={() => onTabChange('veranstaltungen')}
            className={`headline px-6 py-3 transition-all duration-200 text-base tracking-wider ${
              activeTab === 'veranstaltungen'
                ? 'text-foreground border-b-[3px] border-foreground'
                : 'text-gray-400 hover:text-foreground border-b-[3px] border-transparent'
            }`}
          >
            Veranstaltungen
          </button>
          <button
            onClick={() => onTabChange('bonusinhalte')}
            className={`headline px-6 py-3 transition-all duration-200 text-base tracking-wider ${
              activeTab === 'bonusinhalte'
                ? 'text-foreground border-b-[3px] border-foreground'
                : 'text-gray-400 hover:text-foreground border-b-[3px] border-transparent'
            }`}
          >
            Bonusinhalte
          </button>
          {showAuthorsTab && (
            <button
              onClick={() => onTabChange('autor:innen')}
              className={`headline px-6 py-3 transition-all duration-200 text-base tracking-wider ${
                activeTab === 'autor:innen'
                  ? 'text-foreground border-b-[3px] border-foreground'
                  : 'text-gray-400 hover:text-foreground border-b-[3px] border-transparent'
              }`}
            >
              Autor:innen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}