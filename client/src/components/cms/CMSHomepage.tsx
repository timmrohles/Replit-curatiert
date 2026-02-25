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
import { LazySection } from '../sections/LazySection';
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


      } catch (err) {
        console.error('❌ Error fetching CMS homepage:', err);
        setError(t('cms.homepageNotLoaded'));
      } finally {
        setLoading(false);
      }
    };

    fetchHomepage();
  }, []);

  if (error && !page) {
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

  return (
    <>
      {page && (
        <>
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
          <WebPageSchema
            name={page.metaTitle || page.title}
            description={page.metaDescription || page.description}
            url="https://coratiert.de/"
            breadcrumbs={[
              { name: 'Home', url: 'https://coratiert.de' }
            ]}
          />
          <BreadcrumbSchema
            items={[
              { name: 'Home', url: 'https://coratiert.de' }
            ]}
          />
        </>
      )}

      <InfoBar />
      <Header isHomePage={true} />

      <main id="main-content" className="min-h-screen relative z-0">
        {loading ? (
          <div className="animate-in fade-in duration-200">
            <div className="w-full h-[400px] md:h-[500px] bg-gradient-to-b from-muted/60 to-transparent animate-pulse" />
            <div className="max-w-7xl mx-auto px-4 mt-8 space-y-6">
              <div className="h-7 w-56 bg-muted/40 rounded animate-pulse" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[140px] space-y-2">
                    <div className="w-[140px] h-[210px] bg-muted/30 rounded-lg animate-pulse" />
                    <div className="h-3 w-24 bg-muted/20 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {page && page.title && page.title !== '/' && page.slug !== '/' && (
              <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto text-center mb-12">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6">{page.title}</h1>
                  {page.description && (
                    <p className="text-xl text-muted-foreground">{page.description}</p>
                  )}
                </div>
              </div>
            )}

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
              sortedSections.map((section, idx) => {
                const sectionType = section.section_type || section.type;
                const pinnedBooks = (section.items || [])
                  .filter((item: any) => item.book_id)
                  .map((item: any) => booksById[item.book_id])
                  .filter(Boolean);

                const pinnedIds = new Set(pinnedBooks.map((b: any) => b.id));
                const queryBooks = ((section as any)._queryBookIds || [])
                  .map((id: number) => booksById[id])
                  .filter((b: any) => b && !pinnedIds.has(b.id));

                const sectionBooks = [...pinnedBooks, ...queryBooks];

                if (section.config?.hide_when_empty === true && sectionBooks.length === 0) {
                  return null;
                }

                const isAboveFold = idx === 0 || section.zone === 'above_fold' || sectionType === 'hero' || sectionType === 'category_hero';

                const content = (
                  <div key={section.id} className="mb-section-gap">
                    <UniversalSectionRenderer
                      section={section}
                      books={sectionBooks}
                      isFirstSection={isAboveFold}
                    />
                  </div>
                );

                if (isAboveFold) return content;

                return (
                  <LazySection key={section.id}>
                    {content}
                  </LazySection>
                );
              })
            ) : page?.content ? (
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

            {page && <PageNavigationBadge pageId={page.id} />}
          </>
        )}
      </main>

      <BottomBanner />
      <Footer />
    </>
  );
}