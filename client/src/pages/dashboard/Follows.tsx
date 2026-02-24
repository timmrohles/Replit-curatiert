import { useMemo, useState } from 'react';
import { Heart, Users, BookOpen, Building2, Tag, List, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../components/dashboard/DashboardEmptyState';
import { useFavorites, type FavoriteItem, type FrontendEntityType } from '../../components/favorites/FavoritesContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

type TabType = 'curators' | 'authors' | 'publishers' | 'categories' | 'tags' | 'curations';

const TAB_TO_ENTITY: Record<TabType, FrontendEntityType[]> = {
  curators: ['creator'],
  authors: ['author'],
  publishers: ['publisher'],
  categories: ['category'],
  tags: ['tag', 'topic', 'genre'],
  curations: ['storefront'],
};

function makeInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function FollowCard({ item, onUnfollow }: { item: FavoriteItem; onUnfollow: (item: FavoriteItem) => void }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card" data-testid={`follow-card-${item.id}`}>
      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center">
        {item.image ? (
          <ImageWithFallback
            src={item.image}
            alt={item.title}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">{makeInitials(item.title)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground truncate">{item.title}</h3>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
        )}
      </div>
      <button
        onClick={() => onUnfollow(item)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        data-testid={`button-unfollow-${item.id}`}
      >
        <Heart className="w-3.5 h-3.5 fill-current" />
        Entfolgen
      </button>
    </div>
  );
}

function TagFollowCard({ item, onUnfollow }: { item: FavoriteItem; onUnfollow: (item: FavoriteItem) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card" data-testid={`follow-tag-${item.id}`}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: item.color ? `${item.color}20` : '#247ba020' }}
      >
        <Tag className="w-4 h-4" style={{ color: item.color || '#247ba0' }} />
      </div>
      <span className="text-sm font-medium text-foreground flex-1 truncate">{item.title}</span>
      <button
        onClick={() => onUnfollow(item)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        data-testid={`button-unfollow-tag-${item.id}`}
      >
        <Heart className="w-3.5 h-3.5 fill-current" />
      </button>
    </div>
  );
}

export function DashboardFollows() {
  const { t } = useTranslation();
  const { favorites, isLoading, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<TabType>('curators');

  const groupedFavorites = useMemo(() => {
    const groups: Record<TabType, FavoriteItem[]> = {
      curators: [],
      authors: [],
      publishers: [],
      categories: [],
      tags: [],
      curations: [],
    };
    for (const fav of favorites) {
      for (const [tab, types] of Object.entries(TAB_TO_ENTITY)) {
        if (types.includes(fav.type)) {
          groups[tab as TabType].push(fav);
          break;
        }
      }
    }
    return groups;
  }, [favorites]);

  const tabs = [
    { id: 'curators' as TabType, label: t('dashboardPages.followsCurators', 'Kurator:innen'), icon: Users },
    { id: 'authors' as TabType, label: t('dashboardPages.followsAuthors', 'Autor:innen'), icon: BookOpen },
    { id: 'publishers' as TabType, label: t('dashboardPages.followsPublishers', 'Verlage'), icon: Building2 },
    { id: 'categories' as TabType, label: t('dashboardPages.followsCategories', 'Kategorien'), icon: Tag },
    { id: 'tags' as TabType, label: t('dashboardPages.followsTags', 'Themen'), icon: Tag },
    { id: 'curations' as TabType, label: t('dashboardPages.followsCurations', 'Kurationen'), icon: List },
  ];

  const totalFollows = favorites.length;
  const activeItems = groupedFavorites[activeTab];

  const handleUnfollow = async (item: FavoriteItem) => {
    await toggleFavorite(item);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title={t('dashboardPages.followsTitle', 'Follower & Folge ich')}
          description={t('dashboardPages.followsDesc', 'Verwalte deine Follows.')}
        />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.followsTitle', 'Follower & Folge ich')}
        description={t('dashboardPages.followsDesc', 'Verwalte deine Follows.')}
      />

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Heart className="w-4 h-4 text-[#247ba0]" />
        <span>{t('dashboardPages.followsTotal', '{{count}} Follows insgesamt', { count: totalFollows })}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const count = groupedFavorites[tab.id].length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-[#247ba0] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              data-testid={`tab-follows-${tab.id}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-foreground/10 text-foreground/60'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeItems.length === 0 ? (
        <DashboardEmptyState
          icon={Heart}
          title={t('dashboardPages.noFollows', 'Noch keine Follows')}
          description={t('dashboardPages.noFollowsDesc', 'Durchstöbere Bücher, Kurator:innen und Themen und folge, was dich interessiert. Deine Follows erscheinen dann hier.')}
        />
      ) : (
        <div className={activeTab === 'tags' || activeTab === 'categories' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'space-y-2'}>
          {activeItems.map(item => (
            activeTab === 'tags' || activeTab === 'categories' ? (
              <TagFollowCard key={item.id} item={item} onUnfollow={handleUnfollow} />
            ) : (
              <FollowCard key={item.id} item={item} onUnfollow={handleUnfollow} />
            )
          ))}
        </div>
      )}
    </div>
  );
}
