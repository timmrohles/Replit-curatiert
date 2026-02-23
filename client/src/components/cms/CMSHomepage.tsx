/**
 * CMSHomepage - CMS-driven Homepage
 * 
 * Loads the "Startseite" page from CMS and renders it with Header/Footer.
 * This replaces the hardcoded DataDrivenHomepage for the root path `/`.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from '../../utils/routing';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { InfoBar } from '../layout/InfoBar';
import { BottomBanner } from '../layout/BottomBanner';
import { UniversalSectionRenderer } from '../sections/UniversalSectionRenderer';
import { SEOHead } from '../seo/SEOHead';
import { BreadcrumbSchema, WebPageSchema } from '../seo/StructuredData';
import { DynamicPageContentRenderer } from './DynamicPageContentRenderer';
import { PageNavigationBadge } from './PageNavigationBadge';
import type { PageSection } from '../../types/page-resolve';

interface Page {
  id: string;
  name: string;
  slug: string;
  title: string;
  description?: string;
  content?: string;
  template?: string;
  sectionIds?: string[];
  enabled?: boolean;
  // SEO Fields
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
}

export function CMSHomepage() {
  const { t } = useTranslation();
  const navigate = useSafeNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomepage = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Load the "Startseite" page from CMS using root path `/`
        const pageResponse = await fetch(
          `/api/pages/resolve?path=/&includeDraft=false`,
          {
            headers: {
            },
          }
        );

        if (!pageResponse.ok) {
          if (pageResponse.status === 404) {
            // Fallback to old DataDrivenHomepage if no CMS homepage is configured
            console.warn('⚠️ No CMS homepage found for path `/`. Using fallback.');
            setError(t('cms.homepageNotConfigured'));
            return;
          }
          throw new Error('Failed to fetch homepage');
        }

        const pageData = await pageResponse.json();

        if (!pageData.ok || !pageData.page) {
          setError(t('cms.homepageNotConfigured'));
          return;
        }

        setPage(pageData.page);
        setSections((pageData.sections || []).map((s: any): PageSection => ({
          id: s.id ?? 0,
          zone: s.zone ?? 'main',
          sortOrder: s.sort_order ?? s.sortOrder ?? 0,
          type: s.section_type ?? s.type ?? '',
          section_type: s.section_type ?? s.type ?? '',
          status: s.status ?? 'published',
          visibility: s.visibility ?? 'visible',
          config: s.config ?? {},
          items: s.items ?? [],
          _queryBookIds: s._queryBookIds ?? [],
        })));
        setBooks(pageData.books || []);

        console.log('🏠 CMS Homepage loaded:', pageData.page);
        console.log('  - Page ID:', pageData.page.id);
        console.log('  - Title:', pageData.page.title);
        console.log('  - Sections:', pageData.sections?.length || 0);
      } catch (err) {
        console.error('❌ Error fetching CMS homepage:', err);
        setError(t('cms.homepageNotLoaded'));
      } finally {
        setLoading(false);
      }
    };

    fetchHomepage();
  }, []);

  if (loading) {
    return (
      <>
        <InfoBar />
        <Header isHomePage={true} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !page) {
    return (
      <>
        <InfoBar />
        <Header isHomePage={true} />
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl mb-4">{t('cms.homepageNotFound')}</h1>
          <p className="text-xl mb-8">{error || t('cms.homepageNotLoaded')}</p>
          <p className="text-sm text-muted-foreground mb-8">
            {t('cms.adminHint')}
          </p>
        </div>
        <Footer />
      </>
    );
  }

  if (!page.enabled) {
    return (
      <>
        <InfoBar />
        <Header isHomePage={true} />
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl mb-4">{t('cms.homepageDisabledTitle')}</h1>
          <p className="text-xl mb-8">{t('cms.homepageDisabled')}</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        metadata={{
          title: page.title,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          canonicalUrl: page.canonicalUrl || 'https://coratiert.de/',
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          keywords: page.keywords,
          noIndex: page.noIndex,
          noFollow: page.noFollow
        }}
      />

      {/* Structured Data - WebPage */}
      <WebPageSchema
        name={page.metaTitle || page.title}
        description={page.metaDescription || page.description}
        url="https://coratiert.de/"
        breadcrumbs={[
          { name: 'Home', url: 'https://coratiert.de' }
        ]}
      />

      {/* Breadcrumb Schema */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://coratiert.de' }
        ]}
      />

      {/* Layout */}
      <InfoBar />
      <Header isHomePage={true} />

      {/* Main Content */}
      <main id="main-content" className="min-h-screen relative z-0">
        {/* Page Title - hidden for homepage (slug "/") */}
        {page.title && page.title !== '/' && page.slug !== '/' && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6">{page.title}</h1>
              {page.description && (
                <p className="text-xl text-muted-foreground">{page.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Sections - sorted by zone (above_fold first, then main) */}
        <div className="pb-12">
          {(() => {
            const zonePriority: Record<string, number> = { above_fold: 0, main: 1 };
            const sortedSections = [...sections].sort((a, b) => {
              const zoneA = zonePriority[a.zone] ?? 99;
              const zoneB = zonePriority[b.zone] ?? 99;
              if (zoneA !== zoneB) return zoneA - zoneB;
              return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
            });

            const booksById: Record<number, any> = {};
            books.forEach((b: any) => { booksById[b.id] = b; });

            return sortedSections.length > 0 ? (
              sortedSections.map((section) => {
                const pinnedBooks = (section.items || [])
                  .filter((item: any) => item.book_id)
                  .map((item: any) => booksById[item.book_id])
                  .filter(Boolean);

                const pinnedIds = new Set(pinnedBooks.map((b: any) => b.id));
                const queryBooks = ((section as any)._queryBookIds || [])
                  .map((id: number) => booksById[id])
                  .filter((b: any) => b && !pinnedIds.has(b.id));

                const sectionBooks = [...pinnedBooks, ...queryBooks];

                return (
                  <div key={section.id} className="mb-section-gap">
                    <UniversalSectionRenderer
                      section={section}
                      books={sectionBooks}
                    />
                  </div>
                );
              })
            ) : page.content ? (
              <div className="max-w-4xl mx-auto prose px-4">
                <DynamicPageContentRenderer content={page.content} />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>{t('cms.contentComingSoon')}</p>
              </div>
            );
          })()}
        </div>

        {/* Navigation Badge - only visible in preview mode */}
        <PageNavigationBadge pageId={page.id} />
      </main>

      <BottomBanner />
      <Footer />
    </>
  );
}