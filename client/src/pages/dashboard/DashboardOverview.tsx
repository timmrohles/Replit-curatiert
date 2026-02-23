import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from '../../utils/routing';
import { useAuth } from '../../hooks/use-auth';
import {
  Star, MessageSquare, Heart, Store, BookOpen,
  ArrowRight, User
} from 'lucide-react';
import type { DashboardOutletContext } from '../../components/dashboard/DashboardLayout';

interface NextAction {
  id: string;
  title: string;
  description: string;
  icon: typeof Star;
  path: string;
  priority: number;
}

export function DashboardOverview() {
  const { t } = useTranslation();
  const navigate = useSafeNavigate();
  const { user: authUser } = useAuth();
  const context = useOutletContext<DashboardOutletContext>();
  const userName = authUser?.displayName || authUser?.username || 'Nutzer:in';

  const [kpis, setKpis] = useState({
    ratings: 0,
    reviews: 0,
    favorites: 0,
    storefrontSetup: false,
  });

  const profileProgress = kpis.storefrontSetup ? 65 : 35;

  const nextActions: NextAction[] = [];

  if (!kpis.storefrontSetup && context?.hasModule?.('creator_storefront')) {
    nextActions.push({
      id: 'setup-store',
      title: t('dashboardOverview.setupStore', 'Buchhandlung einrichten'),
      description: t('dashboardOverview.setupStoreDesc', 'Erstelle deine eigene Buchhandlung und präsentiere deine Lieblingswerke.'),
      icon: Store,
      path: '/dashboard/buchhandlung',
      priority: 1,
    });
  }

  if (kpis.ratings === 0) {
    nextActions.push({
      id: 'first-rating',
      title: t('dashboardOverview.firstRating', 'Erstes Buch bewerten'),
      description: t('dashboardOverview.firstRatingDesc', 'Bewerte ein Buch und hilf anderen bei der Buchauswahl.'),
      icon: Star,
      path: '/dashboard/bewertungen',
      priority: 2,
    });
  }

  if (kpis.reviews === 0) {
    nextActions.push({
      id: 'first-review',
      title: t('dashboardOverview.firstReview', 'Erste Rezension schreiben'),
      description: t('dashboardOverview.firstReviewDesc', 'Teile deine Meinung und inspiriere andere Leser:innen.'),
      icon: MessageSquare,
      path: '/dashboard/rezensionen',
      priority: 3,
    });
  }

  nextActions.push({
    id: 'create-curation',
    title: t('dashboardOverview.createCuration', 'Kuration erstellen'),
    description: t('dashboardOverview.createCurationDesc', 'Stelle Bücher zu einem Thema zusammen und teile sie.'),
    icon: BookOpen,
    path: '/dashboard/kurationen',
    priority: 4,
  });

  const sortedActions = nextActions.sort((a, b) => a.priority - b.priority).slice(0, 3);

  const kpiCards = [
    { label: t('dashboardOverview.kpiRatings', 'Bewertungen'), value: String(kpis.ratings), icon: Star, subtitle: kpis.ratings === 0 ? t('dashboardOverview.noRatingsYet', 'Noch keine Bewertungen') : undefined },
    { label: t('dashboardOverview.kpiReviews', 'Rezensionen'), value: String(kpis.reviews), icon: MessageSquare, subtitle: kpis.reviews === 0 ? t('dashboardOverview.noReviewsYet', 'Noch keine Rezensionen') : undefined },
    { label: t('dashboardOverview.kpiFavorites', 'Favoriten'), value: String(kpis.favorites), icon: Heart, subtitle: kpis.favorites === 0 ? t('dashboardOverview.noFavoritesYet', 'Noch keine Favoriten') : undefined },
    { label: t('dashboardOverview.kpiStore', 'Buchhandlung'), value: kpis.storefrontSetup ? '✓' : '—', icon: Store, subtitle: kpis.storefrontSetup ? t('dashboardOverview.storeActive', 'Eingerichtet') : t('dashboardOverview.storeNotSetup', 'Noch nicht eingerichtet') },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg p-5 md:p-8 border bg-card" data-testid="dashboard-welcome">
        <div className="flex items-start gap-4 md:gap-6">
          <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
          >
            <User className="w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl md:text-2xl lg:text-3xl mb-1"
              style={{ fontFamily: 'Fjalla One', color: 'var(--ds-text-primary, #3A3A3A)' }}
              data-testid="text-username"
            >
              {t('dashboardOverview.welcome', 'Willkommen, {{name}}!', { name: userName })}
            </h1>
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {t('dashboardOverview.profileProgress', 'Profil {{progress}}% vollständig', { progress: profileProgress })}
                </span>
                <span className="text-xs sm:text-sm font-medium" style={{ color: '#247ba0' }}>
                  {profileProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${profileProgress}%`,
                    background: 'linear-gradient(to right, #247ba0, #70c1b3)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="rounded-lg p-4 border bg-card"
              data-testid={`kpi-card-${i}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--ds-text-primary, #3A3A3A)' }}>
                {kpi.value}
              </div>
              {kpi.subtitle && (
                <span className="text-xs text-muted-foreground">{kpi.subtitle}</span>
              )}
            </div>
          );
        })}
      </div>

      {sortedActions.length > 0 && (
        <section>
          <h2
            className="text-lg mb-3"
            style={{ fontFamily: 'Fjalla One', color: 'var(--ds-text-primary, #3A3A3A)' }}
          >
            {t('dashboardOverview.nextSteps', 'Nächste Schritte')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sortedActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card text-left hover:border-[#247ba0]/30 transition-colors group"
                  data-testid={`action-${action.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#247ba0', opacity: 0.1 }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#247ba0' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium mb-0.5" style={{ color: 'var(--ds-text-primary, #3A3A3A)' }}>
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#247ba0] transition-colors flex-shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
