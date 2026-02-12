import { useState, useMemo } from "react";
import { useSafeNavigate } from "../../utils/routing";
import { Search, Heart } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Breadcrumb } from "../layout/Breadcrumb";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Container } from "../ui/container";
import { Section } from "../ui/section";
import { Heading, Text } from "../ui/typography";
import { useFavorites } from "../favorites/FavoritesContext";
import { Header } from "../layout/Header";
import { Footer } from "../layout/Footer";

// TypeScript Interfaces
interface Publisher {
  id: string;
  name: string;
  logo: string;
  description: string;
  shortDescription?: string;
  booksCount: number;
  followersCount: number;
  tags: string[];
  foundingYear?: number;
}

export function PublishersPage() {
  const navigate = useSafeNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);

  // Mock Verlags-Daten (später aus Backend)
  const publishers: Publisher[] = useMemo(() => [
    {
      id: "suhrkamp",
      name: "Suhrkamp Verlag",
      logo: "https://images.unsplash.com/photo-1568667256549-094345857637?w=400",
      description: "Literatur und Wissenschaft seit 1950",
      booksCount: 2840,
      followersCount: 18500,
      tags: ["Belletristik", "Wissenschaft", "Philosophie", "International"],
      foundingYear: 1950
    },
    {
      id: "ch-beck",
      name: "C.H. Beck",
      logo: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400",
      description: "Führender wissenschaftlicher Fachverlag",
      booksCount: 3200,
      followersCount: 12300,
      tags: ["Wissenschaft", "Sachbuch", "Recht", "Geschichte"],
      foundingYear: 1763
    },
    {
      id: "ullstein",
      name: "Ullstein Verlag",
      logo: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
      description: "Vielfältiges Programm von Belletristik bis Sachbuch",
      booksCount: 1950,
      followersCount: 14800,
      tags: ["Belletristik", "Sachbuch", "Zeitgenössisch", "Ratgeber"],
      foundingYear: 1877
    },
    {
      id: "fischer",
      name: "S. Fischer Verlag",
      logo: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
      description: "Traditionsverlag für anspruchsvolle Literatur",
      booksCount: 2100,
      followersCount: 16200,
      tags: ["Belletristik", "International", "Klassiker", "Zeitgenössisch"],
      foundingYear: 1886
    },
    {
      id: "hanser",
      name: "Carl Hanser Verlag",
      logo: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400",
      description: "Literatur und Sachbuch mit Anspruch",
      booksCount: 1680,
      followersCount: 9400,
      tags: ["Belletristik", "Sachbuch", "International", "Wissenschaft"],
      foundingYear: 1928
    },
    {
      id: "rowohlt",
      name: "Rowohlt Verlag",
      logo: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
      description: "Unabhängig, vielfältig, lesenswert",
      booksCount: 2450,
      followersCount: 13700,
      tags: ["Belletristik", "Sachbuch", "Zeitgenössisch", "Thriller"],
      foundingYear: 1908
    },
    {
      id: "campus",
      name: "Campus Verlag",
      logo: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400",
      description: "Wirtschaft, Gesellschaft und Wissenschaft",
      booksCount: 980,
      followersCount: 6800,
      tags: ["Sachbuch", "Wissenschaft", "Wirtschaft", "Politik"],
      foundingYear: 1975
    },
    {
      id: "dtv",
      name: "dtv Verlagsgesellschaft",
      logo: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
      description: "Bücher für alle - Taschenbuch-Klassiker",
      booksCount: 3600,
      followersCount: 22100,
      tags: ["Belletristik", "Sachbuch", "Taschenbuch", "Klassiker"],
      foundingYear: 1960
    }
  ], []);

  // Verfügbare Tags
  const availableTags = useMemo(() => [
    "Belletristik", "Sachbuch", "Wissenschaft", "International", 
    "Zeitgenössisch", "Klassiker", "Philosophie", "Geschichte", 
    "Wirtschaft", "Politik", "Recht", "Ratgeber", "Thriller", "Taschenbuch"
  ], []);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Filter & Sort publishers with useMemo for performance
  const sortedPublishers = useMemo(() => {
    const filtered = publishers.filter(publisher => {
      const matchesTags = selectedTags.length === 0 || 
        publisher.tags.some(tag => selectedTags.includes(tag));
      const matchesSearch = searchQuery === "" || 
        publisher.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTags && matchesSearch;
    });

    return filtered.sort((a, b) => b.followersCount - a.followersCount);
  }, [publishers, selectedTags, searchQuery]);

  // Keyboard navigation handler for publisher cards
  const handlePublisherCardKeyDown = (e: React.KeyboardEvent, publisherId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/verlage/${publisherId}`);
    }
  };

  // Keyboard navigation handler for tag buttons
  const handleTagKeyDown = (e: React.KeyboardEvent, tag: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTag(tag);
    }
  };

  return (
    <>
      <Header />
      <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
        {/* Schema.org JSON-LD für SEO */}
        <Helmet>
        <title>Verlage entdecken - Die besten Buchverlage auf coratiert.de</title>
        <meta 
          name="description" 
          content="Entdecke die Verlage hinter den Büchern und folge deinen Lieblingsprogrammen. Durchsuche unsere Verlags-Datenbank nach Namen oder filtere nach Programm-Schwerpunkten."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Verlage bei coratiert.de",
            "description": "Entdecke die Verlage hinter den Büchern und folge deinen Lieblingsprogrammen",
            "url": "https://coratiert.de/verlage",
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
                  "name": "Verlage"
                }
              ]
            },
            "mainEntity": {
              "@type": "ItemList",
              "name": "Verlags-Übersicht",
              "numberOfItems": sortedPublishers.length,
              "itemListElement": sortedPublishers.map((publisher, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Organization",
                  "@id": `https://coratiert.de/verlage/${publisher.id}`,
                  "name": publisher.name,
                  "description": publisher.description,
                  "logo": publisher.logo,
                  "url": `https://coratiert.de/verlage/${publisher.id}`,
                  "foundingDate": publisher.foundingYear ? `${publisher.foundingYear}-01-01` : undefined,
                  "publishingPrinciples": publisher.tags.join(", "),
                  "knowsAbout": publisher.tags,
                  "interactionStatistic": [
                    {
                      "@type": "InteractionCounter",
                      "interactionType": "https://schema.org/FollowAction",
                      "userInteractionCount": publisher.followersCount
                    }
                  ],
                  "numberOfEmployees": {
                    "@type": "QuantitativeValue",
                    "name": "Anzahl veröffentlichter Bücher",
                    "value": publisher.booksCount
                  }
                }
              }))
            }
          })}
        </script>
      </Helmet>

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Start", href: "/", onClick: () => navigate('/') },
          { label: "Verlage" }
        ]}
      />

      {/* Hero-Sektion: Verlage entdecken */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading 
              as="h1" 
              variant="h1" 
              className="mb-4 !text-foreground"
            >
              Verlage entdecken
            </Heading>
            
            <Text variant="large" className="max-w-3xl !text-foreground">
              Entdecke die Verlage hinter den Büchern und folge deinen Lieblingsprogrammen
            </Text>
          </div>
        </Container>
      </Section>

      {/* Suche & Filter Sektion */}
      <Section variant="compact" className="!pb-4">
        <Container>
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <Text variant="base" className="mb-3 text-foreground">
              Durchsuche unsere Verlags-Datenbank nach Namen oder filtere nach Programm-Schwerpunkten
            </Text>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Verlag suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Verlage durchsuchen"
              />
            </div>
          </div>

          {/* Tag Filter Chips */}
          <div className="mb-8">
            <Heading
              as="h3"
              variant="h3"
              className="mb-3 text-foreground"
            >
              Nach Programm filtern
            </Heading>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Programm-Filter">
              {availableTags.slice(0, showAllTags ? availableTags.length : 8).map(tag => {
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    onKeyDown={(e) => handleTagKeyDown(e, tag)}
                    className="tag-button"
                    aria-pressed={selectedTags.includes(tag)}
                    aria-label={`Filter: ${tag}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            
            {/* "Weitere Themen laden" Link */}
            {!showAllTags && availableTags.length > 8 && (
              <button
                onClick={() => setShowAllTags(true)}
                className="expand-btn mt-3"
                aria-expanded={showAllTags}
                aria-label="Weitere Programm-Tags anzeigen"
              >
                + Weitere Themen laden ({availableTags.length - 8} weitere)
              </button>
            )}
            
            {selectedTags.length > 0 && (
              <Text variant="small" className="text-foreground mt-3">
                <span style={{ fontWeight: '600' }}>{sortedPublishers.length}</span> Verlage gefunden
              </Text>
            )}
          </div>
        </Container>
      </Section>

      {/* Publishers Grid */}
      <Section variant="default" className="!pt-4 !pb-12">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedPublishers.map(publisher => (
              <div
                key={publisher.id}
                onClick={() => navigate(`/verlage/${publisher.id}`)}
                onKeyDown={(e) => handlePublisherCardKeyDown(e, publisher.id)}
                className="publisher-card"
                role="article"
                tabIndex={0}
                aria-label={`Verlag ${publisher.name}, ${publisher.booksCount} Bücher, ${publisher.followersCount} Follower`}
              >
                {/* Publisher Logo */}
                <div className="relative aspect-square overflow-hidden bg-white">
                  <ImageWithFallback
                    src={publisher.logo}
                    alt={`Logo von ${publisher.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Stats Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex gap-3 author-stats">
                      <span>
                        {publisher.booksCount} Bücher
                      </span>
                      <span>
                        {publisher.followersCount.toLocaleString()} Follower
                      </span>
                    </div>
                  </div>
                </div>

                {/* Publisher Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heading as="h3" className="text-base publisher-card-name">
                      {publisher.name}
                    </Heading>
                  </div>
                  <Text className="text-xs mb-3 publisher-card-description">
                    {publisher.shortDescription || (publisher.description.length > 80 ? publisher.description.substring(0, 80).trim() + '...' : publisher.description)}
                  </Text>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {publisher.tags.slice(0, 2).map(tag => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTag(tag);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleTag(tag);
                          }
                        }}
                        className="tag-button tag-button-small"
                        aria-pressed={selectedTags.includes(tag)}
                        aria-label={`Filter nach ${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {sortedPublishers.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Heading className="text-xl mb-2 text-foreground">
                  Keine Verlage gefunden
                </Heading>
                <Text className="text-foreground">
                  Versuche es mit anderen Filterkriterien
                </Text>
              </div>
            )}
          </div>
        </Container>
      </Section>
      </div>
      <Footer />
    </>
  );
}