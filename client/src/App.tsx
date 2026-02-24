import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { FavoritesProvider } from './components/favorites/FavoritesContext';
import { ReadingListProvider } from './components/reading-list/ReadingListContext';
import { CartProvider } from './components/shop/CartContext';
import { ThemeProvider } from './utils/ThemeContext';
import { ThemeScript } from './components/seo/ThemeScript';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LocaleLayout } from './components/layout/LocaleLayout';
import { DEFAULT_LOCALE, isValidLocale, LocaleProvider } from './utils/LocaleContext';
import { Loader2 } from 'lucide-react';
import { ImpersonationBanner } from './components/ImpersonationBanner';

const CMSHomepage = React.lazy(() => import('./components/cms/CMSHomepage').then(m => ({ default: m.CMSHomepage })));
const HomepageFeedView = React.lazy(() => import('./pages/dashboard/HomepageFeedView').then(m => ({ default: m.HomepageFeedView })));

function SmartHomepage() {
  const feedDefault = localStorage.getItem('coratiert-feed-as-homepage') === 'true';
  const [showFeed, setShowFeed] = useState(feedDefault);

  useEffect(() => {
    const handler = () => {
      setShowFeed(prev => {
        const next = !prev;
        localStorage.setItem('coratiert-feed-as-homepage', next ? 'true' : 'false');
        window.dispatchEvent(new CustomEvent('feed-view-changed', { detail: { active: next } }));
        return next;
      });
    };
    window.addEventListener('toggle-feed-view', handler);
    return () => window.removeEventListener('toggle-feed-view', handler);
  }, []);

  return showFeed ? (
    <Suspense fallback={<div />}>
      <HomepageFeedView />
    </Suspense>
  ) : (
    <Suspense fallback={<div />}>
      <CMSHomepage />
    </Suspense>
  );
}
const DataDrivenHomepage = React.lazy(() => import('./components/homepage/DataDrivenHomepage').then(m => ({ default: m.DataDrivenHomepage })));
const Homepage = React.lazy(() => import('./components/homepage/NewHomepage').then(m => ({ default: m.Homepage })));
const BookDetailPage = React.lazy(() => import('./components/book/BookDetailPage').then(m => ({ default: m.BookDetailPage })));
const BookstoreTemplate = React.lazy(() => import('./components/creator/BookstoreTemplate').then(m => ({ default: m.BookstoreTemplate })));
const SeriesPage = React.lazy(() => import('./components/book/SeriesPage').then(m => ({ default: m.SeriesPage })));
const AllCuratorsPage = React.lazy(() => import('./components/creator/AllCuratorsPage').then(m => ({ default: m.AllCuratorsPage })));
const AllListsPage = React.lazy(() => import('./components/creator/AllListsPage').then(m => ({ default: m.AllListsPage })));

const EventsPage = React.lazy(() => import('./components/events/EventsPage').then(m => ({ default: m.EventsPage })));
const CreatorBookLink = React.lazy(() => import('./pages/CreatorBookLink').then(m => ({ default: m.CreatorBookLink })));
const ShopPage = React.lazy(() => import('./components/shop/ShopPage').then(m => ({ default: m.ShopPage })));
const DynamicPage = React.lazy(() => import('./components/cms/DynamicPage').then(m => ({ default: m.DynamicPage })));
const TagRouter = React.lazy(() => import('./components/tags/TagRouter').then(m => ({ default: m.TagRouter })));

const ImpressumPage = React.lazy(() => import('./pages/Impressum'));
const DatenschutzPage = React.lazy(() => import('./pages/Datenschutz'));
const FAQPage = React.lazy(() => import('./pages/FAQ'));
const UeberUnsPage = React.lazy(() => import('./pages/UeberUns'));
const MissionPage = React.lazy(() => import('./pages/Mission'));
const CreatorStorefront = React.lazy(() => import('./pages/CreatorStorefront'));


const SectionIndex = React.lazy(() => import('./pages/sections/SectionIndex'));

const DashboardLayout = React.lazy(() => import('./components/dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const DashboardOverview = React.lazy(() => import('./pages/dashboard/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const DashboardProfile = React.lazy(() => import('./pages/dashboard/Profile').then(m => ({ default: m.DashboardProfile })));
const PublicProfile = React.lazy(() => import('./pages/dashboard/PublicProfile').then(m => ({ default: m.PublicProfile })));
const DashboardRatings = React.lazy(() => import('./pages/dashboard/Ratings').then(m => ({ default: m.DashboardRatings })));
const DashboardReviews = React.lazy(() => import('./pages/dashboard/Reviews').then(m => ({ default: m.DashboardReviews })));
const DashboardNotifications = React.lazy(() => import('./pages/dashboard/Notifications').then(m => ({ default: m.DashboardNotifications })));
const DashboardPrivacy = React.lazy(() => import('./pages/dashboard/Privacy').then(m => ({ default: m.DashboardPrivacy })));
const DashboardFeed = React.lazy(() => import('./pages/dashboard/DashboardFeed').then(m => ({ default: m.DashboardFeed })));
const DashboardFollows = React.lazy(() => import('./pages/dashboard/Follows').then(m => ({ default: m.DashboardFollows })));
const EarningsOverview = React.lazy(() => import('./pages/dashboard/earnings/EarningsOverview').then(m => ({ default: m.EarningsOverview })));
const EarningsAffiliate = React.lazy(() => import('./pages/dashboard/earnings/EarningsAffiliate').then(m => ({ default: m.EarningsAffiliate })));
const EarningsStatistics = React.lazy(() => import('./pages/dashboard/earnings/EarningsStatistics').then(m => ({ default: m.EarningsStatistics })));
const UserCurations = React.lazy(() => import('./pages/dashboard/UserCurations').then(m => ({ default: m.UserCurations })));
const UserEvents = React.lazy(() => import('./pages/dashboard/UserEvents').then(m => ({ default: m.UserEvents })));
const ContentSourcesManager = React.lazy(() => import('./pages/dashboard/ContentSources').then(m => ({ default: m.ContentSourcesManager })));
const DashboardCreatorStorefront = React.lazy(() => import('./pages/dashboard/creator/CreatorStorefront').then(m => ({ default: m.CreatorStorefront })));
const AuthorBooks = React.lazy(() => import('./pages/dashboard/author/AuthorBooks').then(m => ({ default: m.AuthorBooks })));
const AuthorBookclub = React.lazy(() => import('./pages/dashboard/author/AuthorBookclub').then(m => ({ default: m.AuthorBookclub })));
const AuthorBonuscontent = React.lazy(() => import('./pages/dashboard/author/AuthorBonuscontent').then(m => ({ default: m.AuthorBonuscontent })));
const AuthorNewsletter = React.lazy(() => import('./pages/dashboard/author/AuthorNewsletter').then(m => ({ default: m.AuthorNewsletter })));
const AuthorRequest = React.lazy(() => import('./pages/dashboard/AuthorRequest').then(m => ({ default: m.AuthorRequest })));

const AdminContentManager = React.lazy(() => import('./pages/admin/ContentManager').then(m => ({ default: m.ContentManager })));
const AdminLogin = React.lazy(() => import('./pages/admin/Login').then(m => ({ default: m.AdminLogin })));
const QuickLogin = React.lazy(() => import('./pages/admin/QuickLogin').then(m => ({ default: m.QuickLogin })));
const PasswordReset = React.lazy(() => import('./pages/admin/PasswordReset').then(m => ({ default: m.PasswordReset })));
const AdminDataSeeding = React.lazy(() => import('./pages/admin/AdminDataSeeding').then(m => ({ default: m.AdminDataSeeding })));
const SecretManager = React.lazy(() => import('./pages/admin/SecretManager').then(m => ({ default: m.SecretManager })));
const Diagnostics = React.lazy(() => import('./pages/admin/Diagnostics').then(m => ({ default: m.Diagnostics })));
const HealthCheck = React.lazy(() => import('./pages/admin/HealthCheck').then(m => ({ default: m.HealthCheck })));
const ApiHealthCheck = React.lazy(() => import('./pages/admin/ApiHealthCheck').then(m => ({ default: m.ApiHealthCheck })));
const Setup = React.lazy(() => import('./pages/admin/Setup').then(m => ({ default: m.Setup })));
const PublishControlPanel = React.lazy(() => import('./pages/admin/PublishControlPanel'));
const PublicBookstore = React.lazy(() => import('./pages/PublicBookstore').then(m => ({ default: m.PublicBookstore })));

const RESERVED_ROOT_PREFIXES: string[] = [
  'api', 'sys-mgmt-xK9', 'de-de', 'de-at', 'de-ch', 'uploads', 'assets', 'src', 'vite-hmr', '@',
];

function isBookstoreCandidate(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 1) return false;
  const slug = segments[0];
  if (RESERVED_ROOT_PREFIXES.includes(slug.toLowerCase())) return false;
  if (isValidLocale(slug)) return false;
  if (slug.includes('.')) return false;
  return true;
}

function BookstoreRouteGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const candidateSlug = isBookstoreCandidate(location.pathname) ? location.pathname.split('/').filter(Boolean)[0] : null;
  const [bookstoreState, setBookstoreState] = useState<'checking' | 'found' | 'not_bookstore'>(candidateSlug ? 'checking' : 'not_bookstore');
  const [bookstoreSlug, setBookstoreSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateSlug) {
      setBookstoreState('not_bookstore');
      setBookstoreSlug(null);
      return;
    }

    let cancelled = false;
    setBookstoreState('checking');

    fetch(`/api/bookstore/exists/${candidateSlug}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data?.exists) {
          setBookstoreSlug(candidateSlug);
          setBookstoreState('found');
        } else {
          setBookstoreState('not_bookstore');
          setBookstoreSlug(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBookstoreState('not_bookstore');
          setBookstoreSlug(null);
        }
      });

    return () => { cancelled = true; };
  }, [candidateSlug]);

  if (candidateSlug && bookstoreState === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bookstoreState === 'found' && bookstoreSlug) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <LocaleProvider>
          <PublicBookstore overrideSlug={bookstoreSlug} />
        </LocaleProvider>
      </Suspense>
    );
  }

  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey.join('/') as string, { credentials: 'include' });
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        return await res.json();
      },
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen text-lg text-muted-foreground">
    Lädt...
  </div>
);

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeScript />
      <Toaster position="top-right" />
      <HelmetProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ImpersonationBanner />
            <FavoritesProvider>
              <ReadingListProvider>
              <CartProvider>
                <BrowserRouter>
                  <ScrollToTop />
                  <BookstoreRouteGuard>
                  <Routes>
                    {/* Root redirect to default locale */}
                    <Route path="/" element={<Navigate to={`/${DEFAULT_LOCALE}/`} replace />} />

                    {/* All public routes under /:locale */}
                    <Route path="/:locale" element={<LocaleLayout />}>
                      <Route index element={<SmartHomepage />} />
                      <Route path="data-driven-homepage" element={<S><DataDrivenHomepage /></S>} />
                      <Route path="old-homepage" element={<S><Homepage /></S>} />

                      <Route path="book/:bookId" element={<S><BookDetailPage /></S>} />
                      <Route path="bookstore/:bookId" element={<S><BookstoreTemplate /></S>} />

                      <Route path="authors" element={<Navigate to="../buecher" replace />} />
                      <Route path="publishers" element={<Navigate to="../buecher" replace />} />
                      <Route path="series" element={<S><SeriesPage /></S>} />

                      <Route path="curators" element={<S><AllCuratorsPage onGoBack={() => {}} /></S>} />
                      <Route path="storefronts" element={<S><AllCuratorsPage onGoBack={() => {}} pageTitle="Alle Bookstores" pageSubtitle="Entdecke die Bookstores unserer Kurator*innen – kuratierte Buchempfehlungen, persönliche Auswahl und einzigartige Perspektiven." breadcrumbLabel="Alle Bookstores" /></S>} />
                      <Route path="kurationen" element={<S><AllListsPage onGoBack={() => {}} /></S>} />
                      <Route path="creator/:creatorId" element={<S><CreatorStorefront /></S>} />
                      <Route path="storefront/:creatorId" element={<S><CreatorStorefront /></S>} />
                      <Route path="events" element={<S><EventsPage onGoBack={() => {}} /></S>} />
                      <Route path="buecher" element={<S><ShopPage /></S>} />

                      <Route path="impressum" element={<S><ImpressumPage /></S>} />
                      <Route path="datenschutz" element={<S><DatenschutzPage /></S>} />
                      <Route path="faq" element={<S><FAQPage /></S>} />
                      <Route path="ueber-uns" element={<S><UeberUnsPage /></S>} />
                      <Route path="mission" element={<S><MissionPage /></S>} />

                      <Route path="dashboard" element={<S><DashboardLayout /></S>}>
                        <Route index element={<DashboardOverview />} />
                        <Route path="buchhandlung" element={<DashboardCreatorStorefront />} />
                        <Route path="kurationen" element={<UserCurations />} />
                        <Route path="rezensionen" element={<DashboardReviews />} />
                        <Route path="bewertungen" element={<DashboardRatings />} />
                        <Route path="content-quellen" element={<ContentSourcesManager />} />
                        <Route path="feed" element={<DashboardFeed />} />
                        <Route path="follower" element={<DashboardFollows />} />
                        <Route path="veranstaltungen" element={<UserEvents />} />
                        <Route path="einnahmen" element={<EarningsOverview />} />
                        <Route path="einnahmen/affiliate" element={<EarningsAffiliate />} />
                        <Route path="einnahmen/statistiken" element={<EarningsStatistics />} />
                        <Route path="oeffentliches-profil" element={<PublicProfile />} />
                        <Route path="profil" element={<DashboardProfile />} />
                        <Route path="benachrichtigungen" element={<DashboardNotifications />} />
                        <Route path="datenschutz" element={<DashboardPrivacy />} />
                        <Route path="autor/buecher" element={<AuthorBooks />} />
                        <Route path="autor/buchklub" element={<AuthorBookclub />} />
                        <Route path="autor/bonusinhalte" element={<AuthorBonuscontent />} />
                        <Route path="autor/newsletter" element={<AuthorNewsletter />} />
                        <Route path="autor-werden" element={<AuthorRequest />} />
                        <Route path="sections" element={<SectionIndex />} />
                        {/* Redirects from old routes */}
                        <Route path="home" element={<Navigate to="../dashboard" replace />} />
                        <Route path="profile" element={<Navigate to="../dashboard/profil" replace />} />
                        <Route path="ratings" element={<Navigate to="../dashboard/bewertungen" replace />} />
                        <Route path="reviews" element={<Navigate to="../dashboard/rezensionen" replace />} />
                        <Route path="curations" element={<Navigate to="../dashboard/kurationen" replace />} />
                        <Route path="events" element={<Navigate to="../dashboard/veranstaltungen" replace />} />
                        <Route path="content-sources" element={<Navigate to="../dashboard/content-quellen" replace />} />
                        <Route path="earnings" element={<Navigate to="../dashboard/einnahmen" replace />} />
                        <Route path="notifications" element={<Navigate to="../dashboard/benachrichtigungen" replace />} />
                        <Route path="privacy" element={<Navigate to="../dashboard/datenschutz" replace />} />
                        <Route path="creator-storefront" element={<Navigate to="../dashboard/buchhandlung" replace />} />
                        <Route path="creator-curations" element={<Navigate to="../dashboard/kurationen" replace />} />
                        <Route path="creator-reviews" element={<Navigate to="../dashboard/rezensionen" replace />} />
                        <Route path="creator-events" element={<Navigate to="../dashboard/veranstaltungen" replace />} />
                        <Route path="creator-analytics" element={<Navigate to="../dashboard/einnahmen/statistiken" replace />} />
                        <Route path="creator-topics" element={<Navigate to="../dashboard/buchhandlung" replace />} />
                        <Route path="creator-campaigns" element={<Navigate to="../dashboard/buchhandlung" replace />} />
                        <Route path="author-storefront" element={<Navigate to="../dashboard/buchhandlung" replace />} />
                        <Route path="author-books" element={<Navigate to="../dashboard/autor/buecher" replace />} />
                        <Route path="author-events" element={<Navigate to="../dashboard/veranstaltungen" replace />} />
                        <Route path="author-statistics" element={<Navigate to="../dashboard/einnahmen/statistiken" replace />} />
                        <Route path="author-community" element={<Navigate to="../dashboard/feed" replace />} />
                        <Route path="author-members" element={<Navigate to="../dashboard/feed" replace />} />
                        <Route path="author-bookclub" element={<Navigate to="../dashboard/autor/buchklub" replace />} />
                        <Route path="author-bonuscontent" element={<Navigate to="../dashboard/autor/bonusinhalte" replace />} />
                        <Route path="author-newsletter" element={<Navigate to="../dashboard/autor/newsletter" replace />} />
                        <Route path="author-request" element={<Navigate to="../dashboard/autor-werden" replace />} />
                      </Route>

                      <Route path="tag/:param" element={<S><TagRouter /></S>} />
                      <Route path="tags/:param" element={<S><TagRouter /></S>} />
                      <Route path="themen/:param" element={<S><TagRouter /></S>} />
                      <Route path="kategorie/:category" element={<S><ShopPage /></S>} />

                      <Route path=":slug" element={<S><DynamicPage /></S>} />
                      <Route path=":slug/:subslug" element={<S><DynamicPage /></S>} />
                    </Route>

                    {/* Creator affiliate book link - /@creatorSlug/buch/:isbn */}
                    <Route path="/@:creatorSlug/buch/:isbn" element={<S><CreatorBookLink /></S>} />

                    {/* Admin routes - no locale prefix */}
                    <Route path="/sys-mgmt-xK9/content-manager" element={<S><AdminContentManager /></S>} />
                    <Route path="/sys-mgmt-xK9/login" element={<S><AdminLogin /></S>} />
                    <Route path="/sys-mgmt-xK9/quick-login" element={<S><QuickLogin /></S>} />
                    <Route path="/sys-mgmt-xK9/password-reset" element={<S><PasswordReset /></S>} />
                    <Route path="/sys-mgmt-xK9/data-seeding" element={<S><AdminDataSeeding /></S>} />
                    <Route path="/sys-mgmt-xK9/secret-manager" element={<S><SecretManager /></S>} />
                    <Route path="/sys-mgmt-xK9/diagnostics" element={<S><Diagnostics /></S>} />
                    <Route path="/sys-mgmt-xK9/health-check" element={<S><HealthCheck /></S>} />
                    <Route path="/sys-mgmt-xK9/api-health-check" element={<S><ApiHealthCheck /></S>} />
                    <Route path="/sys-mgmt-xK9/setup" element={<S><Setup /></S>} />
                    <Route path="/sys-mgmt-xK9/publish-control-panel" element={<S><PublishControlPanel /></S>} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to={`/${DEFAULT_LOCALE}/`} replace />} />
                  </Routes>
                  </BookstoreRouteGuard>
                </BrowserRouter>
              </CartProvider>
            </ReadingListProvider>
            </FavoritesProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
