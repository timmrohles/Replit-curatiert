import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useSafeNavigate } from '../utils/routing';
import { BookCard } from '../book/BookCard';
import { BookCarousel } from './homepage/BookCarousel';
import { Sparkles, Award, Users, Calendar } from 'lucide-react';
import { DynamicPageContentRenderer } from './DynamicPageContentRenderer';
import { SEOHead } from './seo/SEOHead';
import { BreadcrumbSchema, WebPageSchema } from './seo/StructuredData';
import { getBookUrl } from '../utils/bookUrlHelper';
import { SectionRenderer } from './sections/SectionRenderer';
import type { Section as SectionType, Book as BookType } from './sections/SectionRenderer';
import { PageNavigationBadge } from './PageNavigationBadge';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { InfoBar } from '../layout/InfoBar';

// Reserved routes that should NOT be handled by DynamicPage
const RESERVED_ROUTES = [
  '',  // Root path (Homepage) - must not be overridden by sections
  'storefront',
  'creator-dashboard',
  'author-dashboard',
  'publisher-dashboard',
  'dashboard-selector',
  'dashboard',
  'lists',
  'curators',
  'storefronts',
  'events',
  'shop',
  'bücher',
  'buecher',
  'awarded-books',
  'design-system',
  'book',
  'bookstore',
  'book-subscription',
  'matching',
  'impressum',
  'datenschutz',
  'agb',
  'ueber-uns',
  'mission',
  'faq',
  'tag',
  'tags',
  'themen',
  'kategorie',
  'authors',
  'autoren',
  'publishers',
  'verlage',
  'series',
  'serien',
  'reihen',
  'admin',
  'sys-mgmt-xK9',
  'creator',
  'backend-health',
];

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

interface Section {
  id: string;
  title: string;
  type: 'hero' | 'books-grid' | 'books-carousel' | 'text' | 'featured';
  content?: any;
  order: number;
}

interface Book {
  id: number;
  title: string;
  author: string;
  cover?: string;
  year?: string;
  price?: string;
  category?: string;
  tags?: string[];
  description?: string;
}

export function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useSafeNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🐛 DEBUG: Log DynamicPage mount
  useEffect(() => {
    console.log('⚠️ DynamicPage mounted with slug:', slug);
  }, []);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;

      console.log('DynamicPage: Attempting to load slug:', slug);

      // Check if this is a reserved route that should not be handled by DynamicPage
      if (RESERVED_ROUTES.includes(slug)) {
        console.log('DynamicPage: Slug is reserved, ignoring:', slug);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // ✅ NEW: Use Page Resolve API (only published pages)
        const path = `/${slug}`;
        const pageResponse = await fetch(
          `/api/api/pages/resolve?path=${encodeURIComponent(path)}&includeDraft=false`,
          {
            headers: {
            },
          }
        );

        if (!pageResponse.ok) {
          if (pageResponse.status === 404) {
            setError('Seite nicht gefunden');
            return;
          }
          throw new Error('Failed to fetch page');
        }

        const pageData = await pageResponse.json();
        
        // Check if page was found
        if (!pageData.ok || !pageData.page) {
          setError('Seite nicht gefunden');
          return;
        }

        setPage(pageData.page);
        setSections(pageData.sections || []);
        setBooks(pageData.books || []);
        
        console.log('📄 DynamicPage loaded:', pageData.page);
        console.log('  - Page ID:', pageData.page.id);
        console.log('  - Title:', pageData.page.title);
        console.log('  - Sections:', pageData.sections?.length || 0);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('Fehler beim Laden der Seite');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Header isHomePage={false} />
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
        <Header isHomePage={false} />
        <InfoBar />
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl mb-4">404</h1>
          <p className="text-xl mb-8">{error || 'Seite nicht gefunden'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            Zurück zur Startseite
          </button>
        </div>
        <Footer />
      </>
    );
  }

  if (!page.enabled) {
    return (
      <>
        <Header isHomePage={false} />
        <InfoBar />
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl mb-4">Seite nicht verfügbar</h1>
          <p className="text-xl mb-8">Diese Seite ist derzeit deaktiviert.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            Zurück zur Startseite
          </button>
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
          canonicalUrl: page.canonicalUrl || (slug === '/' ? 'https://coratiert.de/' : `https://coratiert.de/${slug}`),
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
        url={page.canonicalUrl || (slug === '/' ? 'https://coratiert.de/' : `https://coratiert.de/${slug}`)}
        breadcrumbs={[
          { name: 'Home', url: 'https://coratiert.de' },
          { name: page.name, url: page.canonicalUrl || (slug === '/' ? 'https://coratiert.de/' : `https://coratiert.de/${slug}`) }
        ]}
      />
      
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://coratiert.de' },
          { name: page.name, url: page.canonicalUrl || (slug === '/' ? 'https://coratiert.de/' : `https://coratiert.de/${slug}`) }
        ]}
      />

      {/* Layout */}
      <Header isHomePage={false} />
      <InfoBar />
      
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

      <Footer />
    </>
  );
}