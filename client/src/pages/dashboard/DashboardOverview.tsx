import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSafeNavigate } from '../../utils/routing';
import { useAuth } from '../../hooks/use-auth';
import {
  Star, MessageSquare, Heart, Store, BookOpen,
  ArrowRight, User, Calendar, Rss, Users, ExternalLink
} from 'lucide-react';
import type { DashboardOutletContext } from '../../components/dashboard/DashboardLayout';

interface DashboardKpis {
  curations: number;
  events: number;
  contentSources: number;
  hasStorefront: boolean;
  isPublished: boolean;
  curatorSlug: string | null;
}

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
  const userName = authUser?.displayName || authUser?.firstName || 'Nutzer:in';

  const { data: kpiData, isLoading, isError } = useQuery<{ ok: boolean; data: DashboardKpis }>({
    queryKey: ['/api/dashboard/kpis'],
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">{t('common.error', 'Fehler')}</p>
        <p className="text-xs text-muted-foreground mt-1">Dashboard-Daten konnten nicht geladen werden.</p>
      </div>
    );
  }

  const kpis = kpiData?.data ?? {
    curations: 0,
    events: 0,
    contentSources: 0,
    hasStorefront: false,
    isPublished: false,
    curatorSlug: null,
  };

  const profileSteps = [
    !!authUser?.displayName,
    !!authUser?.profileImageUrl,
    kpis.hasStorefront,
    kpis.curations > 0,
  ];
  const profileProgress = Math.round((profileSteps.filter(Boolean).length / profileSteps.length) * 100);

  const nextActions: NextAction[] = [];

  if (!kpis.hasStorefront && context?.hasModule?.('creator_storefront')) {
    nextActions.push({
      id: 'setup-store',
      title: t('dashboardOverview.setupStore', 'Buchhandlung einrichten'),
      description: t('dashboardOverview.setupStoreDesc', 'Erstelle deine eigene Buchhandlung und präsentiere deine Lieblingswerke.'),
      icon: Store,
      path: '/dashboard/buchhandlung',
      priority: 1,
    });
  }

  if (kpis.curations === 0) {
    nextActions.push({
      id: 'create-curation',
      title: t('dashboardOverview.createCuration', 'Kuration erstellen'),
      description: t('dashboardOverview.createCurationDesc', 'Stelle Bücher zu einem Thema zusammen und teile sie.'),
      icon: BookOpen,
      path: '/dashboard/kurationen',
      priority: 2,
    });
  }

  if (kpis.events === 0) {
    nextActions.push({
      id: 'create-event',
      title: t('dashboardOverview.createEvent', 'Veranstaltung erstellen'),
      description: t('dashboardOverview.createEventDesc', 'Plane eine Lesung, einen Buchklub oder ein anderes Event.'),
      icon: Calendar,
      path: '/dashboard/veranstaltungen',
      priority: 3,
    });
  }

  if (kpis.contentSources === 0) {
    nextActions.push({
      id: 'add-content',
      title: t('dashboardOverview.addContent', 'Content-Quelle hinzufügen'),
      description: t('dashboardOverview.addContentDesc', 'Verbinde deinen Podcast oder RSS-Feed für automatische Buchempfehlungen.'),
      icon: Rss,
      path: '/dashboard/content-quellen',
      priority: 4,
    });
  }

  if (!authUser?.profileImageUrl) {
    nextActions.push({
      id: 'complete-profile',
      title: t('dashboardOverview.completeProfile', 'Profil vervollständigen'),
      description: t('dashboardOverview.completeProfileDesc', 'Füge ein Profilbild hinzu, damit andere dich erkennen.'),
      icon: User,
      path: '/dashboard/profil',
      priority: 5,
    });
  }

  const sortedActions = nextActions.sort((a, b) => a.priority - b.priority).slice(0, 3);

  const kpiCards = [
    { label: t('dashboardOverview.kpiCurations', 'Kurationen'), value: kpis.curations, icon: BookOpen, path: '/dashboard/kurationen' },
    { label: t('dashboardOverview.kpiEvents', 'Veranstaltungen'), value: kpis.events, icon: Calendar, path: '/dashboard/veranstaltungen' },
    { label: t('dashboardOverview.kpiContentSources', 'Content-Quellen'), value: kpis.contentSources, icon: Rss, path: '/dashboard/content-quellen' },
    { label: t('dashboardOverview.kpiStore', 'Buchhandlung'), value: kpis.hasStorefront ? '✓' : '—', icon: Store, path: '/dashboard/buchhandlung', subtitle: kpis.hasStorefront ? t('dashboardOverview.storeActive', 'Eingerichtet') : t('dashboardOverview.storeNotSetup', 'Noch nicht eingerichtet') },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg p-5 md:p-8 border bg-card" data-testid="dashboard-welcome">
        <div className="flex items-start gap-4 md:gap-6">
          {authUser?.profileImageUrl ? (
            <img
              src={authUser.profileImageUrl}
              alt={userName}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover flex-shrink-0"
              data-testid="avatar-image"
            />
          ) : (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-[#247ba0] text-white">
              <User className="w-7 h-7 md:w-8 md:h-8" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl md:text-2xl lg:text-3xl mb-1 text-gray-800 dark:text-gray-100"
              style={{ fontFamily: 'Fjalla One' }}
              data-testid="text-username"
            >
              {t('dashboardOverview.welcome', 'Willkommen, {{name}}!', { name: userName })}
            </h1>
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {t('dashboardOverview.profileProgress', 'Profil {{progress}}% vollständig', { progress: profileProgress })}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#247ba0]">
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
            <button
              key={i}
              onClick={() => navigate(kpi.path)}
              className="rounded-lg p-4 border bg-card text-left hover:border-[#247ba0]/30 transition-colors"
              data-testid={`kpi-card-${i}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {isLoading ? '…' : String(kpi.value)}
              </div>
              {'subtitle' in kpi && kpi.subtitle && (
                <span className="text-xs text-muted-foreground">{kpi.subtitle}</span>
              )}
            </button>
          );
        })}
      </div>

      {sortedActions.length > 0 && (
        <section>
          <h2 className="text-lg mb-3 text-gray-800 dark:text-gray-100" style={{ fontFamily: 'Fjalla One' }}>
            {t('dashboardOverview.nextSteps', 'Nächste Schritte')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sortedActions.map(action => {
              const Icon = action.icon;
              const isExternal = action.id === 'view-public-profile';
              if (isExternal) {
                return (
                  <a
                    key={action.id}
                    href={action.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card text-left hover:border-[#247ba0]/30 transition-colors group no-underline"
                    data-testid={`action-${action.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#247ba0]/10 dark:bg-[#247ba0]/20">
                      <Icon className="w-5 h-5 text-[#247ba0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium mb-0.5 text-gray-800 dark:text-gray-100">
                        {action.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#247ba0] transition-colors flex-shrink-0 mt-1" />
                  </a>
                );
              }
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card text-left hover:border-[#247ba0]/30 transition-colors group"
                  data-testid={`action-${action.id}`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#247ba0]/10 dark:bg-[#247ba0]/20">
                    <Icon className="w-5 h-5 text-[#247ba0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium mb-0.5 text-gray-800 dark:text-gray-100">
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

      {kpis.isPublished && kpis.curatorSlug && (
        <section>
          <h2 className="text-lg mb-3 text-gray-800 dark:text-gray-100" style={{ fontFamily: 'Fjalla One' }}>
            {t('dashboardOverview.quicklinks', 'Quicklinks')}
          </h2>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/${kpis.curatorSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md no-underline"
              style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
              data-testid="quicklink-public-profile"
            >
              <ExternalLink className="w-4 h-4" />
              {t('dashboardOverview.viewProfile', 'Zum öffentlichen Profil')}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
