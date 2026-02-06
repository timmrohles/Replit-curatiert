// ============================================================================
// DataDrivenHomepage - Neue datengetriebene Startseite
// ============================================================================

import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "../layout/Header";
import { Footer } from "../layout/Footer";
import { InfoBar } from "../layout/InfoBar";
import { PageRenderer } from "../cms/PageRenderer";
import { PageResolveResponse } from "../../types/page-resolve";
import { resolvePage } from "../../utils/page-resolve-service";

/**
 * Loading UI
 */
function LoadingState() {
  return (
    <>
      <Header isHomePage={true} />
      <InfoBar />
      <div
        className="flex items-center justify-center py-24 md:py-32 lg:py-48"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div
            className="inline-block w-12 h-12 md:w-16 md:h-16 border-4 rounded-full animate-spin mb-4"
            style={{
              borderColor: "var(--color-coral)",
              borderTopColor: "transparent",
            }}
          />
          <p
            className="text-lg md:text-xl"
            style={{
              fontFamily: "Inter",
              color: "var(--foreground)",
              opacity: 0.7,
            }}
          >
            Lade Startseite...
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

/**
 * Error UI
 */
function ErrorState({ error }: { error: string }) {
  return (
    <>
      <Header isHomePage={true} />
      <InfoBar />
      <div
        className="flex items-center justify-center py-24 md:py-32 lg:py-48 px-4"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center max-w-2xl">
          <div
            className="text-6xl md:text-8xl mb-6"
            style={{ color: "var(--color-coral)" }}
          >
            ⚠️
          </div>
          <h1
            className="text-2xl md:text-3xl lg:text-4xl mb-4"
            style={{
              fontFamily: "Fjalla One",
              color: "var(--foreground)",
            }}
          >
            Fehler beim Laden
          </h1>
          <p
            className="text-base md:text-lg mb-6"
            style={{
              fontFamily: "Inter",
              color: "var(--foreground)",
              opacity: 0.7,
            }}
          >
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg text-white transition-all hover:scale-105"
            style={{
              backgroundColor: "var(--color-coral)",
              fontFamily: "Inter",
              fontWeight: 600,
            }}
          >
            Seite neu laden
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

/**
 * DataDrivenHomepage - Hook-basierter Loader
 */
export function DataDrivenHomepage() {
  const [data, setData] = useState<PageResolveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resolvePage("/")
      .then((response) => {
        setData(response);
        if (!response.ok) {
          setError(response.error.message);
        }
      })
      .catch((err) => {
        console.error("Failed to resolve page:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Loading State
  if (loading) {
    return <LoadingState />;
  }

  // Error State
  if (error || !data || !data.ok) {
    return <ErrorState error={error || "Page not found"} />;
  }

  // Success State - Render mit PageRenderer
  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{data.page.seo.title || data.page.title}</title>
        {data.page.seo.description && (
          <meta name="description" content={data.page.seo.description} />
        )}
        {data.page.seo.keywords && data.page.seo.keywords.length > 0 && (
          <meta name="keywords" content={data.page.seo.keywords.join(", ")} />
        )}
        {data.page.seo.ogImage && (
          <meta property="og:image" content={data.page.seo.ogImage} />
        )}
      </Helmet>

      {/* Layout */}
      <Header isHomePage={true} />
      <InfoBar />
      
      {/* Main Content - ID für Skip Navigation */}
      <main id="main-content">
        <PageRenderer data={data} />
      </main>

      <Footer />
    </>
  );
}
