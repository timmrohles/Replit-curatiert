import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { FavoritesProvider } from './components/favorites/FavoritesContext';
import { CartProvider } from './components/shop/CartContext';
import { ThemeProvider } from './utils/ThemeContext';
import { ThemeScript } from './components/seo/ThemeScript';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LocaleLayout } from './components/layout/LocaleLayout';
import { DEFAULT_LOCALE } from './utils/LocaleContext';

const CMSHomepage = React.lazy(() => import('./components/cms/CMSHomepage').then(m => ({ default: m.CMSHomepage })));
const DataDrivenHomepage = React.lazy(() => import('./components/homepage/DataDrivenHomepage').then(m => ({ default: m.DataDrivenHomepage })));
const Homepage = React.lazy(() => import('./components/homepage/NewHomepage').then(m => ({ default: m.Homepage })));
const BookDetailPage = React.lazy(() => import('./components/book/BookDetailPage').then(m => ({ default: m.BookDetailPage })));
const BookstoreTemplate = React.lazy(() => import('./components/creator/BookstoreTemplate').then(m => ({ default: m.BookstoreTemplate })));
const AuthorsPage = React.lazy(() => import('./components/creator/AuthorsPage').then(m => ({ default: m.AuthorsPage })));
const PublishersPage = React.lazy(() => import('./components/creator/PublishersPage').then(m => ({ default: m.PublishersPage })));
const SeriesPage = React.lazy(() => import('./components/book/SeriesPage').then(m => ({ default: m.SeriesPage })));
const AllCuratorsPage = React.lazy(() => import('./components/creator/AllCuratorsPage').then(m => ({ default: m.AllCuratorsPage })));
const AllListsPage = React.lazy(() => import('./components/creator/AllListsPage').then(m => ({ default: m.AllListsPage })));
const AllBookstoresPage = React.lazy(() => import('./components/creator/AllBookstoresPage').then(m => ({ default: m.AllBookstoresPage })));
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
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
              <CartProvider>
                <BrowserRouter>
                  <ScrollToTop />
                  <Routes>
                    {/* Root redirect to default locale */}
                    <Route path="/" element={<Navigate to={`/${DEFAULT_LOCALE}/`} replace />} />

                    {/* All public routes under /:locale */}
                    <Route path="/:locale" element={<LocaleLayout />}>
                      <Route index element={<S><CMSHomepage /></S>} />
                      <Route path="data-driven-homepage" element={<S><DataDrivenHomepage /></S>} />
                      <Route path="old-homepage" element={<S><Homepage /></S>} />

                      <Route path="book/:bookId" element={<S><BookDetailPage /></S>} />
                      <Route path="bookstore/:bookId" element={<S><BookstoreTemplate /></S>} />

                      <Route path="authors" element={<S><AuthorsPage /></S>} />
                      <Route path="publishers" element={<S><PublishersPage /></S>} />
                      <Route path="series" element={<S><SeriesPage /></S>} />

                      <Route path="curators" element={<S><AllCuratorsPage onGoBack={() => {}} /></S>} />
                      <Route path="storefronts" element={<S><AllBookstoresPage /></S>} />
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
                </BrowserRouter>
              </CartProvider>
            </FavoritesProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
