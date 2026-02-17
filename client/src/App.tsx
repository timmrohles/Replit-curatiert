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
const AuthorsPage = React.lazy(() => import('./components/creator/AuthorsPage').then(m => ({ default: m.AuthorsPage })));
const PublishersPage = React.lazy(() => import('./components/creator/PublishersPage').then(m => ({ default: m.PublishersPage })));
const SeriesPage = React.lazy(() => import('./components/book/SeriesPage').then(m => ({ default: m.SeriesPage })));
const AllCuratorsPage = React.lazy(() => import('./components/creator/AllCuratorsPage').then(m => ({ default: m.AllCuratorsPage })));
const AllListsPage = React.lazy(() => import('./components/creator/AllListsPage').then(m => ({ default: m.AllListsPage })));

const EventsPage = React.lazy(() => import('./components/events/EventsPage').then(m => ({ default: m.EventsPage })));
const ShopPage = React.lazy(() => import('./components/shop/ShopPage').then(m => ({ default: m.ShopPage })));
const DynamicPage = React.lazy(() => import('./components/cms/DynamicPage').then(m => ({ default: m.DynamicPage })));
const TagRouter = React.lazy(() => import('./components/tags/TagRouter').then(m => ({ default: m.TagRouter })));

const ImpressumPage = React.lazy(() => import('./pages/Impressum'));
const DatenschutzPage = React.lazy(() => import('./pages/Datenschutz'));
const FAQPage = React.lazy(() => import('./pages/FAQ'));
const UeberUnsPage = React.lazy(() => import('./pages/UeberUns'));
const MissionPage = React.lazy(() => import('./pages/Mission'));
const ModularUserDashboard = React.lazy(() => import('./pages/ModularUserDashboard'));
const CreatorStorefront = React.lazy(() => import('./pages/CreatorStorefront'));

const DashboardLanding = React.lazy(() => import('./pages/DashboardLanding'));

const SectionIndex = React.lazy(() => import('./pages/sections/SectionIndex'));

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

const RESERVED_ROOT_PREFIXES = [
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

                      <Route path="authors" element={<S><AuthorsPage /></S>} />
                      <Route path="publishers" element={<S><PublishersPage /></S>} />
                      <Route path="series" element={<S><SeriesPage /></S>} />

                      <Route path="curators" element={<S><AllCuratorsPage onGoBack={() => {}} /></S>} />
                      <Route path="storefronts" element={<S><AllCuratorsPage onGoBack={() => {}} pageTitle="Alle Bookstores" pageSubtitle="Entdecke die Bookstores unserer Kurator*innen – kuratierte Buchempfehlungen, persönliche Auswahl und einzigartige Perspektiven." breadcrumbLabel="Alle Bookstores" /></S>} />
                      <Route path="kurationen" element={<S><AllListsPage onGoBack={() => {}} /></S>} />
                      <Route path="creator/:creatorId" element={<S><CreatorStorefront /></S>} />
                      <Route path="storefront/:creatorId" element={<S><CreatorStorefront /></S>} />
                      <Route path="events" element={<S><EventsPage onGoBack={() => {}} /></S>} />
                      <Route path="bücher" element={<S><ShopPage /></S>} />

                      <Route path="impressum" element={<S><ImpressumPage /></S>} />
                      <Route path="datenschutz" element={<S><DatenschutzPage /></S>} />
                      <Route path="faq" element={<S><FAQPage /></S>} />
                      <Route path="ueber-uns" element={<S><UeberUnsPage /></S>} />
                      <Route path="mission" element={<S><MissionPage /></S>} />

                      <Route path="dashboard" element={<S><DashboardLanding /></S>} />
                      <Route path="dashboard/home" element={<S><ModularUserDashboard /></S>} />
                      <Route path="dashboard/sections" element={<S><SectionIndex /></S>} />

                      <Route path="tag/:param" element={<S><TagRouter /></S>} />
                      <Route path="tags/:param" element={<S><TagRouter /></S>} />
                      <Route path="themen/:param" element={<S><TagRouter /></S>} />
                      <Route path="kategorie/:category" element={<S><ShopPage /></S>} />

                      <Route path=":slug" element={<S><DynamicPage /></S>} />
                      <Route path=":slug/:subslug" element={<S><DynamicPage /></S>} />
                    </Route>

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
