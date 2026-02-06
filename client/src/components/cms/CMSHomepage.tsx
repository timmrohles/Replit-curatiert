/**
 * CMSHomepage - CMS-driven Homepage
 * 
 * Loads the "Startseite" page from CMS and renders it with Header/Footer.
 * This replaces the hardcoded DataDrivenHomepage for the root path `/`.
 */

import { useState, useEffect } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { InfoBar } from '../layout/InfoBar';
import { BottomBanner } from '../layout/BottomBanner';
import { SectionRenderer } from '../sections/SectionRenderer';
import { SEOHead } from '../seo/SEOHead';
import { BreadcrumbSchema, WebPageSchema } from '../seo/StructuredData';
import { DynamicPageContentRenderer } from './DynamicPageContentRenderer';
import { PageNavigationBadge } from './PageNavigationBadge';
import type { Section as SectionType, Book as BookType } from '../sections/SectionRenderer';

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
  const navigate = useSafeNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [books, setBooks] = useState<BookType[]>([]);
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
            setError('Keine Startseite konfiguriert. Bitte erstellen Sie eine Page mit Pfad "/" im Content Manager.');
            return;
          }
          throw new Error('Failed to fetch homepage');
        }

        const pageData = await pageResponse.json();

        if (!pageData.ok || !pageData.page) {
          setError('Keine Startseite konfiguriert.');
          return;
        }

        setPage(pageData.page);
        setSections(pageData.sections || []);
        setBooks(pageData.books || []);

        console.log('🏠 CMS Homepage loaded:', pageData.page);
        console.log('  - Page ID:', pageData.page.id);
        console.log('  - Title:', pageData.page.title);
        console.log('  - Sections:', pageData.sections?.length || 0);
      } catch (err) {
        console.error('❌ Error fetching CMS homepage:', err);
        setError('Fehler beim Laden der Startseite');
      } finally {
        setLoading(false);
      }
    };

    fetchHomepage();
  }, []);

  if (loading) {
    return (
      <>
        <Header isHomePage={true} />
        <InfoBar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !page) {
    return (
      <>
        <Header isHomePage={true} />
        <InfoBar />
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl mb-4">Startseite nicht gefunden</h1>
          <p className="text-xl mb-8">{error || 'Die Startseite konnte nicht geladen werden.'}</p>
          <p className="text-sm text-white/60 mb-8">
            Bitte erstellen Sie im Content Manager eine Page mit Pfad "/" und Status "Published".
          </p>
        </div>
        <Footer />
      </>
    );
  }

  if (!page.enabled) {
    return (
      <>
        <Header isHomePage={true} />
        <InfoBar />
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl mb-4">Startseite deaktiviert</h1>
          <p className="text-xl mb-8">Die Startseite ist derzeit nicht verfügbar.</p>
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
      <main id="main-content" className="min-h-screen">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 text-white">{page.title}</h1>
            {page.description && (
              <p className="text-xl text-white/80">{page.description}</p>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="container mx-auto px-4 pb-12">
          {sections.length > 0 ? (
            sections.map((section) => (
              <div key={section.id} className="mb-16">
                <SectionRenderer section={section} books={books} />
              </div>
            ))
          ) : page.content ? (
            <div className="max-w-4xl mx-auto prose prose-invert">
              <DynamicPageContentRenderer content={page.content} />
            </div>
          ) : (
            <div className="text-center text-white/60">
              <p>Inhalt wird bald hinzugefügt.</p>
            </div>
          )}
        </div>

        {/* Navigation Badge - only visible in preview mode */}
        <PageNavigationBadge pageId={page.id} />
      </main>

      <BottomBanner />
      <Footer />
    </>
  );
}