import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from '../../utils/routing';
import { ChevronRight } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  'dashboard': 'dashboardNav.home',
  'buchhandlung': 'dashboardNav.buchhandlung',
  'kurationen': 'dashboardNav.kurationen',
  'rezensionen': 'dashboardNav.rezensionen',
  'bewertungen': 'dashboardNav.bewertungen',
  'content-quellen': 'dashboardNav.contentSources',
  'feed': 'dashboardNav.feed',
  'veranstaltungen': 'dashboardNav.events',
  'follower': 'dashboardNav.follower',
  'einnahmen': 'dashboardNav.earnings',
  'affiliate': 'dashboardNav.affiliate',
  'statistiken': 'dashboardNav.statistics',
  'profil': 'dashboardNav.myData',
  'oeffentliches-profil': 'dashboardNav.publicProfile',
  'benachrichtigungen': 'dashboardNav.notifications',
  'datenschutz': 'dashboardNav.privacy',
  'autor': 'dashboardNav.author',
  'buecher': 'dashboardNav.authorBooks',
  'buchklub': 'dashboardNav.authorBookclub',
  'bonusinhalte': 'dashboardNav.authorBonus',
  'newsletter': 'dashboardNav.authorNewsletter',
  'autor-werden': 'dashboardNav.becomeAuthor',
  'sections': 'Sections',
};

const FALLBACK_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'buchhandlung': 'Buchhandlung',
  'kurationen': 'Kurationen',
  'rezensionen': 'Rezensionen',
  'bewertungen': 'Bewertungen',
  'content-quellen': 'Content-Quellen',
  'feed': 'Feed',
  'veranstaltungen': 'Veranstaltungen',
  'follower': 'Follower',
  'einnahmen': 'Einnahmen',
  'affiliate': 'Affiliate-Programm',
  'statistiken': 'Statistiken',
  'profil': 'Meine Daten',
  'oeffentliches-profil': 'Öffentliches Profil',
  'benachrichtigungen': 'Benachrichtigungen',
  'datenschutz': 'Datenschutz',
  'autor': 'Autor:in',
  'buecher': 'Meine Bücher',
  'buchklub': 'Buchklub',
  'bonusinhalte': 'Bonusinhalte',
  'newsletter': 'Newsletter',
  'autor-werden': 'Autor:in werden',
  'sections': 'Sections',
};

export function DashboardBreadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useSafeNavigate();

  const dashIdx = location.pathname.indexOf('/dashboard');
  if (dashIdx === -1) return null;

  const afterDashboard = location.pathname.substring(dashIdx + '/dashboard'.length);
  const segments = afterDashboard.split('/').filter(Boolean);

  const crumbs: { label: string; path: string }[] = [];

  let buildPath = '/dashboard';
  for (const seg of segments) {
    buildPath += `/${seg}`;
    const i18nKey = ROUTE_LABELS[seg];
    const fallback = FALLBACK_LABELS[seg] || seg;
    const label = i18nKey ? t(i18nKey, fallback) : fallback;
    crumbs.push({ label, path: buildPath });
  }

  const isRoot = segments.length === 0;

  return (
    <nav
      className="flex items-center gap-2 text-sm"
      aria-label="Breadcrumb"
      data-testid="dashboard-breadcrumbs"
    >
      {isRoot ? (
        <span style={{ color: '#1F2937', fontWeight: 600 }} data-testid="breadcrumb-dashboard">
          Dashboard
        </span>
      ) : (
        <button
          onClick={() => navigate('/dashboard')}
          className="transition-colors hover:underline"
          style={{ color: '#6B7280' }}
          data-testid="breadcrumb-dashboard"
        >
          Dashboard
        </button>
      )}
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
            {isLast ? (
              <span style={{ color: '#1F2937', fontWeight: 600 }} data-testid={`breadcrumb-${i}`}>
                {crumb.label}
              </span>
            ) : (
              <button
                onClick={() => navigate(crumb.path)}
                className="transition-colors hover:underline"
                style={{ color: '#6B7280' }}
                data-testid={`breadcrumb-${i}`}
              >
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
