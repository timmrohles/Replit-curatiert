import { useState, useEffect, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from "../../utils/routing";
import { Container } from "../ui/container";
import { Section } from "../ui/section";
import { Heading, Text } from "../ui/typography";
import { Search, Heart, Users, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Header } from "../layout/Header";
import { Footer } from "../layout/Footer";
import { Breadcrumb } from "../layout/Breadcrumb";
import { InfoBar } from "../layout/InfoBar";
import { useFavorites } from "../favorites/FavoritesContext";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface Curator {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  focus: string;
  bio: string;
  socialMedia?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };
  status?: string;
  visibility?: string;
  visible?: boolean;
}

interface AllCuratorsPageProps {
  onGoBack?: () => void;
  pageTitle?: string;
  pageSubtitle?: string;
  breadcrumbLabel?: string;
}

export function AllCuratorsPage({ onGoBack, pageTitle, pageSubtitle, breadcrumbLabel }: AllCuratorsPageProps = { onGoBack: undefined }) {
  const { t } = useTranslation();
  const safeNavigate = useSafeNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const [curators, setCurators] = useState<Curator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/curators")
      .then((res) => res.json())
      .then((result) => {
        if (result.ok && Array.isArray(result.data)) {
          setCurators(result.data);
        }
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Kurator*innen:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredCurators = useMemo(() => {
    if (searchQuery === "") return curators;
    const q = searchQuery.toLowerCase();
    return curators.filter(
      (curator) =>
        curator.name?.toLowerCase().includes(q) ||
        curator.bio?.toLowerCase().includes(q) ||
        curator.focus?.toLowerCase().includes(q)
    );
  }, [curators, searchQuery]);

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />

      <Helmet>
        <title>{t('curators.pageTitle')}</title>
        <meta
          name="description"
          content={t('curators.pageDescription')}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Alle Kurator*innen bei coratiert.de",
            "description": "Entdecke unsere Expert*innen und folge ihren Empfehlungen. Jede*r Kurator*in bringt eine einzigartige Perspektive und fachliche Expertise mit.",
            "url": "https://coratiert.de/curators",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Start",
                  "item": "https://coratiert.de"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Alle Kurator*innen"
                }
              ]
            },
            "mainEntity": {
              "@type": "ItemList",
              "name": "Kurator*innen Liste",
              "numberOfItems": filteredCurators.length,
              "itemListElement": filteredCurators.map((curator, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Person",
                  "@id": `https://coratiert.de/${curator.slug}`,
                  "name": curator.name,
                  "description": curator.bio,
                  "jobTitle": curator.focus,
                  "image": curator.avatar,
                  "url": `https://coratiert.de/${curator.slug}`
                }
              }))
            }
          })}
        </script>
      </Helmet>

      <Breadcrumb
        items={[
          { label: "Start", href: "/", onClick: () => safeNavigate('/') },
          { label: breadcrumbLabel || "Alle Kurator*innen" }
        ]}
      />

      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading
              as="h1"
              variant="h1"
              className="mb-4 !text-foreground"
            >
              {pageTitle || "Alle Kurator*innen"}
            </Heading>

            <Text variant="large" className="max-w-3xl !text-foreground">
              {pageSubtitle || t('curators.pageDescription')}
            </Text>
          </div>
        </Container>
      </Section>

      <Section variant="compact" className="!pb-4">
        <Container>
          <div className="max-w-2xl mx-auto mb-8">
            <Text variant="base" className="mb-3 text-foreground">
              {t('curators.searchHint')}
            </Text>
            <div className="relative">
              <Search className="absolute left-3 md:left-3.5 lg:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5" style={{ color: 'var(--search-icon)' }} />
              <input
                type="search"
                placeholder="Kurator*in suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 md:pl-11 lg:pl-12 h-10 md:h-11 rounded-lg text-sm md:text-base"
                style={{
                  backgroundColor: 'var(--search-bg)',
                  color: 'var(--search-text)',
                  border: `1px solid var(--search-border)`,
                  boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
                }}
                aria-label="Kurator*innen durchsuchen"
                data-testid="input-curator-search"
              />
            </div>
          </div>

          {searchQuery && (
            <Text variant="small" className="text-foreground mb-4">
              <span style={{ fontWeight: '600' }}>{filteredCurators.length}</span> Kurator*{filteredCurators.length === 1 ? 'in' : 'innen'} gefunden
            </Text>
          )}
        </Container>
      </Section>

      <Section variant="default" className="!pt-4 !pb-12">
        <Container>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: 'var(--color-foreground-muted)' }} />
              <Text variant="body" className="text-foreground opacity-70">
                {t('curators.loading')}
              </Text>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-items-center">
                {filteredCurators.map(curator => (
                  <div
                    key={curator.id}
                    className="rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group relative w-44 h-[280px] md:w-[260px] md:h-[360px]"
                    style={{
                      transform: 'perspective(1000px) rotateY(-5deg)',
                      boxShadow: '-8px 8px 12px 2px rgba(0, 0, 0, 0.3)'
                    }}
                    onClick={() => {
                      safeNavigate(`/${curator.slug}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        safeNavigate(`/${curator.slug}`);
                      }
                    }}
                    tabIndex={0}
                    role="article"
                    aria-label={`Kurator*in ${curator.name}, ${curator.focus || ''}`}
                    data-testid={`card-curator-${curator.id}`}
                  >
                    {curator.avatar ? (
                      <ImageWithFallback
                        src={curator.avatar}
                        alt={curator.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a3a4a] to-[#0B1F33]" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F33]/90 via-[#0B1F33]/40 to-[#0B1F33]/90 p-3 md:p-6 flex flex-col items-center justify-between">
                      <div className="flex items-center gap-2 justify-center w-full">
                        <h3 className="text-white text-base md:text-xl text-center" style={{ fontFamily: 'Fjalla One' }}>{curator.name}</h3>

                        <button
                          className="p-1 hover:bg-white/10 rounded-full transition-colors group/like flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isFavorite(curator.id)) {
                              removeFavorite(curator.id);
                            } else {
                              addFavorite({
                                id: curator.id,
                                type: 'creator',
                                title: curator.name,
                                subtitle: curator.focus || '',
                                image: curator.avatar
                              });
                            }
                          }}
                          aria-label={isFavorite(curator.id) ? t('curators.removeFromFavorites') : t('curators.addToFavorites')}
                          data-testid={`button-favorite-curator-${curator.id}`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${
                              isFavorite(curator.id)
                                ? 'text-[#A0CEC8] fill-[#A0CEC8]'
                                : 'text-white group-hover/like:text-[#A0CEC8]'
                            }`}
                          />
                        </button>
                      </div>

                      {curator.focus && (
                        <div className="text-[#A0CEC8] text-[10px] md:text-xs tracking-wide uppercase text-center w-full">{curator.focus}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredCurators.length === 0 && (
                <div className="text-center py-8 md:py-16">
                  <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-foreground-muted)' }} aria-hidden="true" />
                  <Heading as="h3" variant="h3" className="mb-2 text-foreground">
                    Keine Kurator*innen gefunden
                  </Heading>
                  <Text variant="body" className="text-foreground opacity-70">
                    Versuche andere Suchbegriffe
                  </Text>
                </div>
              )}
            </>
          )}
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
