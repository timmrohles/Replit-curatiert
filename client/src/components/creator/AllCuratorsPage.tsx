import React, { useState, useMemo } from "react";
import { useSafeNavigate } from "../utils/routing";
import { Container } from "./ui/container";
import { Section } from "./ui/section";
import { Heading, Text } from "./ui/typography";
import { DSCreatorCard } from "./design-system/DSCreatorCard";
import { Search, SlidersHorizontal, Heart, Users } from "lucide-react";
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
  avatar: string;
  focus: string;
  bio: string;
  bookCount: number;
  listCount: number;
  followers: number;
  category: string;
  verified: boolean;
  socials: {
    youtube?: boolean;
    twitter?: boolean;
    podcast?: boolean;
  };
}

// Mock Curator Data
const mockCurators: Curator[] = [
  {
    id: "maurice-oekonomius",  // ✅ Verwende die existierende Demo-Storefront
    name: "Maurice Ökonomius",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    focus: "Wirtschaft & Politik",
    bio: "Ökonom, Podcaster und Autor. Erklärt komplexe wirtschaftliche Zusammenhänge verständlich.",
    bookCount: 45,
    listCount: 8,
    followers: 2345,
    category: "Sachbuch",
    verified: true,
    socials: {
      youtube: true,
      podcast: true,
    },
  },
  {
    id: "demo-2",  // ✅ Dummy-ID für Entwicklung
    name: "Sophie Wagner",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    focus: "Krimi & Thriller",
    bio: "Krimiautorin und Literaturkritikerin. Kennt jede dunkle Gasse der deutschsprachigen Kriminalliteratur.",
    bookCount: 67,
    listCount: 11,
    followers: 4521,
    category: "Krimi",
    verified: true,
    socials: {
      youtube: true,
      twitter: true,
      podcast: true,
    },
  },
  {
    id: "demo-3",  // ✅ Dummy-ID für Entwicklung
    name: "Tom Becker",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    focus: "Science Fiction & Fantasy",
    bio: "Science-Fiction-Autor und Lektoratsleiter. Bringt die Zukunft ins Bücherregal.",
    bookCount: 52,
    listCount: 7,
    followers: 1654,
    category: "Belletristik",
    verified: true,
    socials: {
      youtube: true,
      twitter: true,
    },
  },
  {
    id: "demo-4",  // ✅ Dummy-ID für Entwicklung
    name: "Dr. Sarah Müller",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    focus: "Kinderliteratur & Pädagogik",
    bio: "Erziehungswissenschaftlerin und Mutter. Empfiehlt Kinderbücher, die bilden, ermutigen und Spaß machen.",
    bookCount: 89,
    listCount: 12,
    followers: 3421,
    category: "Kinder & Jugend",
    verified: true,
    socials: {
      youtube: true,
      podcast: true,
    },
  },
  {
    id: "demo-5",  // ✅ Dummy-ID für Entwicklung
    name: "Prof. Dr. Andreas Klein",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    focus: "Philosophie & Ethik",
    bio: "Philosophieprofessor an der Humboldt-Universität. Macht komplexe philosophische Fragen zugänglich.",
    bookCount: 34,
    listCount: 5,
    followers: 1234,
    category: "Philosophie",
    verified: true,
    socials: {
      twitter: true,
    },
  },
  {
    id: "demo-6",  // ✅ Dummy-ID für Entwicklung
    name: "Prof. Maria Schneider",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
    focus: "Klimawissenschaft & Nachhaltigkeit",
    bio: "Klimaforscherin am Potsdam-Institut. Empfiehlt wissenschaftlich fundierte Literatur zur Klimakrise.",
    bookCount: 41,
    listCount: 6,
    followers: 2789,
    category: "Wissenschaft",
    verified: true,
    socials: {
      youtube: true,
      twitter: true,
      podcast: true,
    },
  },
  {
    id: "demo-7",  // ✅ Dummy-ID für Entwicklung
    name: "Alex Fischer",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
    focus: "Comics & Graphic Novels",
    bio: "Comic-Enthusiast und Illustrator. Kuratiert die besten grafischen Erzählungen aus aller Welt.",
    bookCount: 76,
    listCount: 9,
    followers: 1567,
    category: "Comics",
    verified: false,
    socials: {
      youtube: true,
      twitter: true,
    },
  },
  {
    id: "demo-8",  // ✅ Dummy-ID für Entwicklung
    name: "Julia Reise",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    focus: "Reiseliteratur & Abenteuer",
    bio: "Weltreisende und Reisebloggerin. Teilt die besten Bücher für alle, die das Fernweh packt.",
    bookCount: 45,
    listCount: 7,
    followers: 2103,
    category: "Reise",
    verified: false,
    socials: {
      youtube: true,
      podcast: true,
    },
  },
  {
    id: "demo-9",  // ✅ Dummy-ID für Entwicklung
    name: "Michael Koch",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200",
    focus: "Geschichte & Biografien",
    bio: "Historiker und Biografie-Fan. Empfiehlt Bücher, die Geschichte lebendig machen.",
    bookCount: 58,
    listCount: 8,
    followers: 1432,
    category: "Geschichte",
    verified: false,
    socials: {
      podcast: true,
    },
  },
  {
    id: "demo-10",  // ✅ Dummy-ID für Entwicklung
    name: "Nina Kunst",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200",
    focus: "Kunst & Design",
    bio: "Kunsthistorikerin und Kuratorin. Empfiehlt Bücher über Kunst, Design und visuelle Kultur.",
    bookCount: 63,
    listCount: 10,
    followers: 1876,
    category: "Kunst & Kultur",
    verified: true,
    socials: {
      youtube: true,
      twitter: true,
    },
  },
];

interface AllCuratorsPageProps {
  onGoBack?: () => void;
}

export function AllCuratorsPage({ onGoBack }: AllCuratorsPageProps = { onGoBack: undefined }) {
  const safeNavigate = useSafeNavigate();
  const { addFavorite, removeFavorite, isFavorite, toggleFavorite } = useFavorites();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Alle verfügbaren Kategorien extrahieren
  const categories = useMemo(() => 
    Array.from(new Set(mockCurators.map(c => c.category))),
    []
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  // Filter & Sort mit useMemo für Performance
  const filteredAndSortedCurators = useMemo(() => {
    const filtered = mockCurators.filter(curator => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(curator.category);
      const matchesSearch = searchQuery === "" || 
        curator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        curator.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        curator.focus.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });

    // Sort by followers (descending)
    return filtered.sort((a, b) => b.followers - a.followers);
  }, [selectedCategories, searchQuery]);

  // Keyboard navigation handler for curator cards
  const handleCuratorCardKeyDown = (e: React.KeyboardEvent, curatorId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (curatorId === 'maurice-oekonomius') {
        safeNavigate.toPath(`/storefront/${curatorId}`, { fallback: '/' });
      }
    }
  };

  // Keyboard navigation handler for category buttons
  const handleCategoryKeyDown = (e: React.KeyboardEvent, category: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCategory(category);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      {/* InfoBar - Beta Hinweis */}
      <InfoBar />
      
      {/* Header */}
      <Header />
      
      {/* Schema.org JSON-LD für SEO */}
      <Helmet>
        <title>Alle Kurator*innen - Fachexpert*innen für Buchempfehlungen | coratiert.de</title>
        <meta 
          name="description" 
          content="Entdecke unsere Expert*innen und folge ihren Empfehlungen. Jede*r Kurator*in bringt eine einzigartige Perspektive und fachliche Expertise mit."
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
              "numberOfItems": filteredAndSortedCurators.length,
              "itemListElement": filteredAndSortedCurators.map((curator, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Person",
                  "@id": `https://coratiert.de/curator/${curator.id}`,
                  "name": curator.name,
                  "description": curator.bio,
                  "jobTitle": curator.focus,
                  "image": curator.avatar,
                  "knowsAbout": curator.category,
                  "url": `https://coratiert.de/curator/${curator.id}`,
                  "interactionStatistic": [
                    {
                      "@type": "InteractionCounter",
                      "interactionType": "https://schema.org/FollowAction",
                      "userInteractionCount": curator.followers
                    },
                    {
                      "@type": "InteractionCounter",
                      "interactionType": "https://schema.org/ReviewAction",
                      "userInteractionCount": curator.bookCount
                    }
                  ],
                  ...(curator.socials.youtube && {
                    "sameAs": [
                      ...(curator.socials.youtube ? ["https://youtube.com/@" + curator.id] : []),
                      ...(curator.socials.twitter ? ["https://twitter.com/" + curator.id] : []),
                      ...(curator.socials.podcast ? ["https://podcast.com/" + curator.id] : [])
                    ].filter(Boolean)
                  })
                }
              }))
            }
          })}
        </script>
      </Helmet>

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Start", href: "/", onClick: () => safeNavigate.toPath('/') },
          { label: "Alle Kurator*innen" }
        ]}
      />

      {/* Hero Section - Blauer Hintergrund, Text linksbündig */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading 
              as="h1" 
              variant="h1" 
              className="mb-4 !text-white"
            >
              Alle Kurator*innen
            </Heading>
            
            <Text variant="large" className="max-w-3xl !text-white">
              Entdecke unsere Expert*innen und folge ihren Empfehlungen. Jede*r Kurator*in bringt eine einzigartige Perspektive und Expertise mit.
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
              Durchsuche unsere Kurator*innen nach Namen, Expertise oder filtere nach Themengebieten
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
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="mb-8">
            <Heading
              as="h3"
              variant="h3"
              className="mb-3 text-foreground"
            >
              Nach Themengebiet filtern
            </Heading>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Themengebiets-Filter">
              {categories.slice(0, showAllCategories ? categories.length : 8).map(category => {
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    onKeyDown={(e) => handleCategoryKeyDown(e, category)}
                    className="tag-button"
                    aria-pressed={selectedCategories.includes(category)}
                    aria-label={`Filter: ${category}`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
            
            {/* "Weitere Themen laden" Link */}
            {!showAllCategories && categories.length > 8 && (
              <button
                onClick={() => setShowAllCategories(true)}
                className="expand-btn mt-3"
                aria-expanded={showAllCategories}
                aria-label="Weitere Themengebiete anzeigen"
              >
                + Weitere Themen laden ({categories.length - 8} weitere)
              </button>
            )}
            
            {selectedCategories.length > 0 && (
              <Text variant="small" className="text-foreground mt-3">
                <span style={{ fontWeight: '600' }}>{filteredAndSortedCurators.length}</span> Kurator*{filteredAndSortedCurators.length === 1 ? 'in' : 'innen'} gefunden
              </Text>
            )}
          </div>
        </Container>
      </Section>

      {/* Curators Grid - Karten bleiben wie sie sind */}
      <Section variant="default" className="!pt-4 !pb-12">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-items-center">
            {filteredAndSortedCurators.map(curator => (
              <div
                key={curator.id}
                className="rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group relative w-44 h-[280px] md:w-[260px] md:h-[360px]"
                style={{ 
                  transform: 'perspective(1000px) rotateY(-5deg)',
                  boxShadow: '-8px 8px 12px 2px rgba(0, 0, 0, 0.3)'
                }}
                onClick={() => {
                  // ✅ Nur zu existierenden Storefronts navigieren
                  if (curator.id === 'maurice-oekonomius') {
                    safeNavigate.toPath(`/storefront/${curator.id}`, { fallback: '/' });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (curator.id === 'maurice-oekonomius') {
                      safeNavigate.toPath(`/storefront/${curator.id}`, { fallback: '/' });
                    }
                  }
                }}
                tabIndex={0}
                role="article"
                aria-label={`Kurator*in ${curator.name}, ${curator.focus}, ${curator.bookCount} Bücher, ${curator.followers} Follower`}
              >
                {/* Background Image */}
                <ImageWithFallback
                  src={curator.avatar}
                  alt={curator.name}
                  className="w-full h-full object-cover"
                />

                {/* Gradient Overlay with Content */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F33] via-[#0B1F33]/50 to-[#0B1F33]/85 p-3 md:p-6 flex flex-col justify-between">
                  {/* Top Section - Name with Heart */}
                  <div>
                    <div className="text-[#A0CEC8] text-[10px] md:text-xs mb-1 tracking-wide uppercase">{curator.focus}</div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white text-base md:text-xl" style={{ fontFamily: 'Fjalla One' }}>{curator.name}</h3>
                      
                      {/* Like Button */}
                      <button 
                        className="p-1 hover:bg-white/10 rounded-full transition-colors group/like flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFavorite(curator.id)) {
                            removeFavorite(curator.id);
                          } else {
                            addFavorite({
                              id: curator.id,
                              type: 'curator',
                              title: curator.name,
                              subtitle: curator.focus,
                              image: curator.avatar
                            });
                          }
                        }}
                        aria-label={isFavorite(curator.id) ? "Von Favoriten entfernen" : "Zu Favoriten hinzufügen"}
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
                  </div>

                  {/* Bottom Section - Bio */}
                  <p className="text-gray-300 text-xs md:text-sm line-clamp-2 md:line-clamp-none">
                    {curator.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredAndSortedCurators.length === 0 && (
            <div className="text-center py-8 md:py-16">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-foreground-muted)' }} aria-hidden="true" />
              <Heading as="h3" variant="h3" className="mb-2 text-foreground">
                Keine Kurator*innen gefunden
              </Heading>
              <Text variant="body" className="text-foreground opacity-70">
                Versuche andere Filter oder Suchbegriffe
              </Text>
            </div>
          )}
        </Container>
      </Section>

      {/* Footer */}
      <Footer />
    </div>
  );
}