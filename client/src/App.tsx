import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
// ✅ Only load these components synchronously (Providers, Context, etc.)
import { FavoritesProvider } from './components/favorites/FavoritesContext';
import { CartProvider } from './components/shop/CartContext';
import { ThemeProvider } from './utils/ThemeContext';
import { ThemeScript } from './components/seo/ThemeScript';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// ✅ Lazy load ALL page components (reduces initial bundle size)
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
const EventsPage = React.lazy(() => import('./components/events/EventsPage').then(m => ({ default: m.EventsPage })));
const ShopPage = React.lazy(() => import('./components/shop/ShopPage').then(m => ({ default: m.ShopPage })));
const DynamicPage = React.lazy(() => import('./components/cms/DynamicPage').then(m => ({ default: m.DynamicPage })));
const TagRouter = React.lazy(() => import('./components/tags/TagRouter').then(m => ({ default: m.TagRouter })));

// Lazy load pages
const ImpressumPage = React.lazy(() => import('./pages/Impressum'));
const DatenschutzPage = React.lazy(() => import('./pages/Datenschutz'));
const FAQPage = React.lazy(() => import('./pages/FAQ'));
const UeberUnsPage = React.lazy(() => import('./pages/UeberUns'));
const MissionPage = React.lazy(() => import('./pages/Mission'));
const ModularUserDashboard = React.lazy(() => import('./pages/ModularUserDashboard'));
const CreatorStorefront = React.lazy(() => import('./pages/CreatorStorefront'));
const DashboardLanding = React.lazy(() => import('./pages/DashboardLanding'));

// Section Library Pages
const SectionIndex = React.lazy(() => import('./pages/sections/SectionIndex'));
const SectionInventory = React.lazy(() => import('./pages/sections/SectionInventory'));
const HeaderSectionPage = React.lazy(() => import('./pages/sections/HeaderSection'));
const HeroSectionPage = React.lazy(() => import('./pages/sections/HeroSectionPage'));
const BookCarouselPage = React.lazy(() => import('./pages/sections/BookCarouselPage'));
const FooterPage = React.lazy(() => import('./pages/sections/FooterPage'));
const RefactoredHeroSectionPage = React.lazy(() => import('./pages/sections/RefactoredHeroSectionPage'));
const HorizontalRowSectionPage = React.lazy(() => import('./pages/sections/HorizontalRowSectionPage'));
const GridSectionPage = React.lazy(() => import('./pages/sections/GridSectionPage'));
const FeaturedSectionPage = React.lazy(() => import('./pages/sections/FeaturedSectionPage'));
const CategoryGridPage = React.lazy(() => import('./pages/sections/CategoryGridPage'));
const TopicTagsGridPage = React.lazy(() => import('./pages/sections/TopicTagsGridPage'));
const CreatorCarouselSectionPage = React.lazy(() => import('./pages/sections/CreatorCarouselSectionPage'));
const RecipientCategoryGridPage = React.lazy(() => import('./pages/sections/RecipientCategoryGridPage'));
const CuratorMatchmakingPage = React.lazy(() => import('./pages/sections/CuratorMatchmakingPage'));
const LatestReviewsSectionPage = React.lazy(() => import('./pages/sections/LatestReviewsSectionPage'));
const ScrollSectionPage = React.lazy(() => import('./pages/sections/ScrollSectionPage'));
const SupportersSectionPage = React.lazy(() => import('./pages/sections/SupportersSectionPage'));
const GenreCategoriesSectionPage = React.lazy(() => import('./pages/sections/GenreCategoriesSectionPage'));
const StorefrontsCarouselPage = React.lazy(() => import('./pages/sections/StorefrontsCarouselPage'));
const EventsSectionPage = React.lazy(() => import('./pages/sections/EventsSectionPage'));
const CuratedListsSectionPage = React.lazy(() => import('./pages/sections/CuratedListsSectionPage'));

// Admin Pages
const AdminContentManager = React.lazy(() => import('./pages/admin/ContentManager').then(m => ({ default: m.ContentManager })));
const AdminLogin = React.lazy(() => import('./pages/admin/Login').then(m => ({ default: m.AdminLogin })));
const QuickLogin = React.lazy(() => import('./pages/admin/QuickLogin').then(m => ({ default: m.QuickLogin })));
const PasswordReset = React.lazy(() => import('./pages/admin/PasswordReset').then(m => ({ default: m.PasswordReset })));
const AdminDataSeeding = React.lazy(() => import('./pages/admin/AdminDataSeeding').then(m => ({ default: m.AdminDataSeeding })));
const SecretManager = React.lazy(() => import('./pages/admin/SecretManager').then(m => ({ default: m.SecretManager })));
// ❌ REMOVED: NuclearReset - file does not exist
const Diagnostics = React.lazy(() => import('./pages/admin/Diagnostics').then(m => ({ default: m.Diagnostics })));
const HealthCheck = React.lazy(() => import('./pages/admin/HealthCheck').then(m => ({ default: m.HealthCheck })));
const ApiHealthCheck = React.lazy(() => import('./pages/admin/ApiHealthCheck').then(m => ({ default: m.ApiHealthCheck })));
const Setup = React.lazy(() => import('./pages/admin/Setup').then(m => ({ default: m.Setup })));
const PublishControlPanel = React.lazy(() => import('./pages/admin/PublishControlPanel'));

// Create QueryClient
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

// Simple Loading Component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen text-lg text-muted-foreground">
    Lädt...
  </div>
);

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
                    {/* Homepage - CMS-driven */}
                    <Route path="/" element={<Suspense fallback={<LoadingFallback />}><CMSHomepage /></Suspense>} />
                    <Route path="/data-driven-homepage" element={<Suspense fallback={<LoadingFallback />}><DataDrivenHomepage /></Suspense>} />
                    <Route path="/old-homepage" element={<Suspense fallback={<LoadingFallback />}><Homepage /></Suspense>} />
                    
                    {/* Book Detail Page */}
                    <Route path="/book/:bookId" element={<Suspense fallback={<LoadingFallback />}><BookDetailPage /></Suspense>} />
                    
                    {/* Bookstore Template - Purchase Options */}
                    <Route path="/bookstore/:bookId" element={<Suspense fallback={<LoadingFallback />}><BookstoreTemplate /></Suspense>} />
                    
                    {/* Authors Page */}
                    <Route path="/authors" element={<Suspense fallback={<LoadingFallback />}><AuthorsPage /></Suspense>} />
                    
                    {/* Publishers Page */}
                    <Route path="/publishers" element={<Suspense fallback={<LoadingFallback />}><PublishersPage /></Suspense>} />
                    
                    {/* Series Page */}
                    <Route path="/series" element={<Suspense fallback={<LoadingFallback />}><SeriesPage /></Suspense>} />
                    
                    {/* Curator Pages */}
                    <Route path="/curators" element={<Suspense fallback={<LoadingFallback />}><AllCuratorsPage onGoBack={() => {}} /></Suspense>} />
                    <Route path="/storefronts" element={<Suspense fallback={<LoadingFallback />}><AllListsPage onGoBack={() => {}} /></Suspense>} />
                    <Route path="/creator/:creatorId" element={<Suspense fallback={<LoadingFallback />}><CreatorStorefront /></Suspense>} />
                    <Route path="/storefront/:creatorId" element={<Suspense fallback={<LoadingFallback />}><CreatorStorefront /></Suspense>} />
                    <Route path="/events" element={<Suspense fallback={<LoadingFallback />}><EventsPage onGoBack={() => {}} /></Suspense>} />
                    <Route path="/bücher" element={<Suspense fallback={<LoadingFallback />}><ShopPage /></Suspense>} />
                    
                    {/* Legal Pages */}
                    <Route path="/impressum" element={<Suspense fallback={<LoadingFallback />}><ImpressumPage /></Suspense>} />
                    <Route path="/datenschutz" element={<Suspense fallback={<LoadingFallback />}><DatenschutzPage /></Suspense>} />
                    <Route path="/faq" element={<Suspense fallback={<LoadingFallback />}><FAQPage /></Suspense>} />
                    <Route path="/ueber-uns" element={<Suspense fallback={<LoadingFallback />}><UeberUnsPage /></Suspense>} />
                    <Route path="/mission" element={<Suspense fallback={<LoadingFallback />}><MissionPage /></Suspense>} />
                    
                    {/* Dashboard Routes - NEW: Landing Page as Entry Point */}
                    <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><DashboardLanding /></Suspense>} />
                    <Route path="/dashboard/home" element={<Suspense fallback={<LoadingFallback />}><ModularUserDashboard /></Suspense>} />
                    
                    {/* Section Library Pages */}
                    <Route path="/dashboard/sections" element={<Suspense fallback={<LoadingFallback />}><SectionIndex /></Suspense>} />
                    <Route path="/dashboard/sections/inventory" element={<Suspense fallback={<LoadingFallback />}><SectionInventory /></Suspense>} />
                    <Route path="/dashboard/sections/header" element={<Suspense fallback={<LoadingFallback />}><HeaderSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/footer" element={<Suspense fallback={<LoadingFallback />}><FooterPage /></Suspense>} />
                    <Route path="/dashboard/sections/hero" element={<Suspense fallback={<LoadingFallback />}><HeroSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/refactored-hero" element={<Suspense fallback={<LoadingFallback />}><RefactoredHeroSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/horizontal-row" element={<Suspense fallback={<LoadingFallback />}><HorizontalRowSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/grid" element={<Suspense fallback={<LoadingFallback />}><GridSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/featured" element={<Suspense fallback={<LoadingFallback />}><FeaturedSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/creator-carousel" element={<Suspense fallback={<LoadingFallback />}><CreatorCarouselSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/scroll" element={<Suspense fallback={<LoadingFallback />}><ScrollSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/supporters" element={<Suspense fallback={<LoadingFallback />}><SupportersSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/latest-reviews" element={<Suspense fallback={<LoadingFallback />}><LatestReviewsSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/book-carousel" element={<Suspense fallback={<LoadingFallback />}><BookCarouselPage /></Suspense>} />
                    <Route path="/dashboard/sections/category-grid" element={<Suspense fallback={<LoadingFallback />}><CategoryGridPage /></Suspense>} />
                    <Route path="/dashboard/sections/topic-tags-grid" element={<Suspense fallback={<LoadingFallback />}><TopicTagsGridPage /></Suspense>} />
                    <Route path="/dashboard/sections/recipient-grid" element={<Suspense fallback={<LoadingFallback />}><RecipientCategoryGridPage /></Suspense>} />
                    <Route path="/dashboard/sections/matchmaking" element={<Suspense fallback={<LoadingFallback />}><CuratorMatchmakingPage /></Suspense>} />
                    <Route path="/dashboard/sections/genre-categories" element={<Suspense fallback={<LoadingFallback />}><GenreCategoriesSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/storefronts-carousel" element={<Suspense fallback={<LoadingFallback />}><StorefrontsCarouselPage /></Suspense>} />
                    <Route path="/dashboard/sections/events" element={<Suspense fallback={<LoadingFallback />}><EventsSectionPage /></Suspense>} />
                    <Route path="/dashboard/sections/curated-lists" element={<Suspense fallback={<LoadingFallback />}><CuratedListsSectionPage /></Suspense>} />
                    
                    {/* Admin Routes */}
                    <Route path="/sys-mgmt-xK9/content-manager" element={<Suspense fallback={<LoadingFallback />}><AdminContentManager /></Suspense>} />
                    <Route path="/sys-mgmt-xK9/login" element={<Suspense fallback={<LoadingFallback />}><AdminLogin /></Suspense>} />
                    <Route path="/sys-mgmt-xK9/quick-login" element={<Suspense fallback={<LoadingFallback />}><QuickLogin /></Suspense>} />
                    <Route path="/sys-mgmt-xK9/password-reset" element={<Suspense fallback={<LoadingFallback />}><PasswordReset /></Suspense>} />
                    <Route path="/sys-mgmt-xK9/data-seeding" element={<Suspense fallback={<LoadingFallback />}><AdminDataSeeding /></Suspense>} />
                    <Route path="/sys-mgmt-xK9/secret-manager" element={<Suspense fallback={<LoadingFallback />}><SecretManager /></Suspense>} />
                    {/* ❌ REMOVED: /sys-mgmt-xK9/nuclear-reset - NuclearReset component does not exist */}
                    <Route path="/sys-mgmt-xK9/diagnostics" element={<Suspense fallback={<LoadingFallback />}><Diagnostics /></Suspense>} />
                    <Route path="/sys-mgmt-xK9/health-check" element={<Suspense fallback={<LoadingFallback />}><HealthCheck /></Suspense>} />
                    <Route path="/sys-mgmt-xK9/api-health-check" element={<Suspense fallback={<LoadingFallback />}><ApiHealthCheck /></Suspense>} />
                    <Route path="/sys-mgmt-xK9/setup" element={<Suspense fallback={<LoadingFallback />}><Setup /></Suspense>} />
                    <Route path="/sys-mgmt-xK9/publish-control-panel" element={<Suspense fallback={<LoadingFallback />}><PublishControlPanel /></Suspense>} />
                    
                    {/* Tag & Category Routes - MUST be before DynamicPage */}
                    <Route path="/tag/:param" element={<Suspense fallback={<LoadingFallback />}><TagRouter /></Suspense>} />
                    <Route path="/tags/:param" element={<Suspense fallback={<LoadingFallback />}><TagRouter /></Suspense>} />
                    <Route path="/themen/:param" element={<Suspense fallback={<LoadingFallback />}><TagRouter /></Suspense>} />
                    <Route path="/kategorie/:category" element={<Suspense fallback={<LoadingFallback />}><ShopPage /></Suspense>} />
                    
                    {/* Dynamic Page - MUST be before fallback */}
                    <Route path="/:slug" element={<Suspense fallback={<LoadingFallback />}><DynamicPage /></Suspense>} />
                    <Route path="/:slug/:subslug" element={<Suspense fallback={<LoadingFallback />}><DynamicPage /></Suspense>} />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Suspense fallback={<LoadingFallback />}><Homepage /></Suspense>} />
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