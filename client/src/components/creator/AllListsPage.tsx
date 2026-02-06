import React, { useState, useMemo } from "react";
import { useSafeNavigate } from "../utils/routing";
import { Container } from "./ui/container";
import { Section } from "./ui/section";
import { Heading, Text } from "./ui/typography";
import { DSCuratedListCard } from "./design-system/DSCuratedListCard";
import { Search, SlidersHorizontal, List } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Header } from "../layout/Header";
import { Footer } from "../layout/Footer";
import { Breadcrumb } from "../layout/Breadcrumb";
import { InfoBar } from "../layout/InfoBar";
import { useCurationFilters, type Curation } from "../../hooks/useCurationFilters";
import { useFavorites } from "../favorites/FavoritesContext";

// Mock Curation Data with Books
const allCurations: Curation[] = [
  {
    id: "1",
    title: "Die besten Wirtschaftsbücher 2024",
    curator: "Maurice Ökonomius",
    curatorAvatar: "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?w=200",
    curatorFocus: "Wirtschaftspolitik & Modern Monetary Theory",
    description: "Meine persönliche Auswahl der wichtigsten und lesenswertesten Wirtschaftsbücher des Jahres. Von MMT bis zur Klimaökonomie.",
    bookCount: 12,
    category: "Wirtschaft",
    likes: 245,
    views: 1823,
    coverImages: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    ],
    featured: true,
    createdDate: "15. Dezember 2024",
    hasVideo: true,
    videoThumbnail: "https://images.unsplash.com/photo-1692014957131-d0d992bf47ae?w=400",
    books: [
      {
        id: 1,
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
        title: "The Deficit Myth",
        author: "Stephanie Kelton",
        price: "24,99 €",
        publisher: "PublicAffairs",
        year: "2020"
      },
      {
        id: 2,
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
        title: "Capital and Ideology",
        author: "Thomas Piketty",
        price: "32,99 €",
        publisher: "Belknap Press",
        year: "2020"
      },
      {
        id: 3,
        cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
        title: "Doughnut Economics",
        author: "Kate Raworth",
        price: "18,99 €",
        publisher: "Random House",
        year: "2017"
      },
      {
        id: 4,
        cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
        title: "Good Economics for Hard Times",
        author: "Abhijit Banerjee, Esther Duflo",
        price: "26,99 €",
        publisher: "PublicAffairs",
        year: "2019"
      },
      {
        id: 5,
        cover: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
        title: "Climate Crisis and the Global Green New Deal",
        author: "Noam Chomsky, Robert Pollin",
        price: "16,99 €",
        publisher: "Verso",
        year: "2020"
      }
    ]
  },
  {
    id: "2",
    title: "Feministische Klassiker",
    curator: "Lisa Schmidt",
    curatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    curatorFocus: "Feministische Theorie & Gender Studies",
    description: "Grundlegende Werke der feministischen Literatur und Theorie, die jede*r gelesen haben sollte.",
    bookCount: 15,
    category: "Politik & Gesellschaft",
    likes: 312,
    views: 2456,
    coverImages: [
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
    ],
    featured: true,
    createdDate: "10. Dezember 2024",
    hasVideo: true,
    videoThumbnail: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    books: [
      {
        id: 6,
        cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
        title: "The Second Sex",
        author: "Simone de Beauvoir",
        price: "22,99 €",
        publisher: "Vintage",
        year: "1949"
      },
      {
        id: 7,
        cover: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
        title: "Gender Trouble",
        author: "Judith Butler",
        price: "19,99 €",
        publisher: "Routledge",
        year: "1990"
      },
      {
        id: 8,
        cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
        title: "We Should All Be Feminists",
        author: "Chimamanda Ngozi Adichie",
        price: "8,99 €",
        publisher: "Fourth Estate",
        year: "2014"
      },
      {
        id: 9,
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
        title: "The Feminine Mystique",
        author: "Betty Friedan",
        price: "16,99 €",
        publisher: "Norton",
        year: "1963"
      }
    ]
  },
  {
    id: "3",
    title: "Science-Fiction des 21. Jahrhunderts",
    curator: "Tom Weber",
    curatorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    curatorFocus: "Moderne Literatur & Science Fiction",
    description: "Die besten zeitgenössischen Science-Fiction-Romane, die unsere Gegenwart und Zukunft reflektieren.",
    bookCount: 20,
    category: "Belletristik",
    likes: 428,
    views: 3104,
    coverImages: [
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400",
      "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400",
      "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=400",
    ],
    featured: true,
    createdDate: "5. Dezember 2024",
    hasVideo: false,
    books: [
      {
        id: 10,
        cover: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400",
        title: "The Three-Body Problem",
        author: "Liu Cixin",
        price: "14,99 €",
        publisher: "Tor Books",
        year: "2014"
      },
      {
        id: 11,
        cover: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400",
        title: "Neuromancer",
        author: "William Gibson",
        price: "15,99 €",
        publisher: "Ace",
        year: "1984"
      },
      {
        id: 12,
        cover: "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=400",
        title: "Ancillary Justice",
        author: "Ann Leckie",
        price: "13,99 €",
        publisher: "Orbit",
        year: "2013"
      },
      {
        id: 13,
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
        title: "Station Eleven",
        author: "Emily St. John Mandel",
        price: "16,99 €",
        publisher: "Knopf",
        year: "2014"
      },
      {
        id: 14,
        cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
        title: "The Fifth Season",
        author: "N.K. Jemisin",
        price: "17,99 €",
        publisher: "Orbit",
        year: "2015"
      }
    ]
  },
  {
    id: "4",
    title: "Kinderbücher über Diversität",
    curator: "Sarah Müller",
    curatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    curatorFocus: "Kinderliteratur & Pädagogik",
    description: "Empowermente Geschichten für Kinder, die Vielfalt feiern und wichtige Werte vermitteln.",
    bookCount: 18,
    category: "Kinder & Jugend",
    likes: 267,
    views: 1945,
    coverImages: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    ],
    featured: false,
    createdDate: "1. Dezember 2024",
    hasVideo: true,
    videoThumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    books: [
      {
        id: 15,
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
        title: "Hair Love",
        author: "Matthew A. Cherry",
        price: "12,99 €",
        publisher: "Kokila",
        year: "2019"
      },
      {
        id: 16,
        cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
        title: "Last Stop on Market Street",
        author: "Matt de la Peña",
        price: "14,99 €",
        publisher: "Putnam",
        year: "2015"
      },
      {
        id: 17,
        cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
        title: "All Are Welcome",
        author: "Alexandra Penfold",
        price: "11,99 €",
        publisher: "Knopf",
        year: "2018"
      }
    ]
  },
  {
    id: "5",
    title: "Philosophie für Einsteiger",
    curator: "Dr. Andreas Klein",
    curatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    curatorFocus: "Philosophie & Ethik",
    description: "Zugängliche Einführungen in philosophische Grundfragen und große Denker der Geschichte.",
    bookCount: 10,
    category: "Philosophie",
    likes: 189,
    views: 1534,
    coverImages: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
    ],
    featured: false,
    createdDate: "28. November 2024",
    hasVideo: false,
    books: [
      {
        id: 18,
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
        title: "Sophie's World",
        author: "Jostein Gaarder",
        price: "16,99 €",
        publisher: "Farrar, Straus and Giroux",
        year: "1991"
      },
      {
        id: 19,
        cover: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
        title: "Meditations",
        author: "Marcus Aurelius",
        price: "12,99 €",
        publisher: "Modern Library",
        year: "180"
      },
      {
        id: 20,
        cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
        title: "The Republic",
        author: "Plato",
        price: "14,99 €",
        publisher: "Penguin Classics",
        year: "-380"
      }
    ]
  },
  {
    id: "6",
    title: "Klimakrise verstehen",
    curator: "Prof. Maria Schneider",
    curatorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
    curatorFocus: "Klimawissenschaft & Nachhaltigkeit",
    description: "Wissenschaftlich fundierte Bücher über den Klimawandel, seine Ursachen und Lösungsansätze.",
    bookCount: 14,
    category: "Wissenschaft",
    likes: 356,
    views: 2789,
    coverImages: [
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400",
      "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400",
      "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=400",
    ],
    featured: false,
    createdDate: "25. November 2024",
    hasVideo: true,
    videoThumbnail: "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=400",
    books: [
      {
        id: 21,
        cover: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400",
        title: "The Uninhabitable Earth",
        author: "David Wallace-Wells",
        price: "18,99 €",
        publisher: "Tim Duggan Books",
        year: "2019"
      },
      {
        id: 22,
        cover: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400",
        title: "This Changes Everything",
        author: "Naomi Klein",
        price: "19,99 €",
        publisher: "Simon & Schuster",
        year: "2014"
      },
      {
        id: 23,
        cover: "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=400",
        title: "Drawdown",
        author: "Paul Hawken",
        price: "29,99 €",
        publisher: "Penguin",
        year: "2017"
      }
    ]
  },
];

interface AllListsPageProps {
  onGoBack?: () => void;
}

export function AllListsPage({ onGoBack }: AllListsPageProps) {
  const {
    searchQuery,
    sortBy,
    categories,
    filteredAndSortedCurations,
    setSearchQuery,
    setSortBy,
    toggleCategory,
    selectedCategories,
  } = useCurationFilters(allCurations);

  const [showAllCategories, setShowAllCategories] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  // Keyboard navigation handler for category buttons
  const handleCategoryKeyDown = (e: React.KeyboardEvent, category: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCategory(category);
    }
  };

  // Handle category follow/unfollow
  const handleCategoryFollow = (category: string) => {
    toggleFavorite({
      id: `category-${category.toLowerCase()}`,
      type: 'category',
      title: category
    });
    toggleCategory(category);
  };

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      {/* InfoBar - Beta Hinweis */}
      <InfoBar />
      
      {/* Header */}
      <Header />
      
      {/* Schema.org JSON-LD für SEO */}
      <Helmet>
        <title>Alle Kurationen - Kuratierte Buchempfehlungen von Expert*innen | coratiert.de</title>
        <meta 
          name="description" 
          content="Entdecke kuratierte Buchsammlungen von Expert*innen zu allen Themen. Von Klassikern bis zu aktuellen Geheimtipps – handverlesen und mit Herz ausgewählt."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://coratiert.de/lists" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Alle Kurationen bei coratiert.de",
            "description": "Kuratierte Buchsammlungen von Expert*innen zu allen Themen",
            "url": "https://coratiert.de/lists",
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
                  "name": "Alle Kurationen"
                }
              ]
            },
            "mainEntity": {
              "@type": "ItemList",
              "name": "Kuratierte Buchlisten",
              "numberOfItems": filteredAndSortedCurations.length,
              "itemListElement": filteredAndSortedCurations.map((curation, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "ItemList",
                  "@id": `https://coratiert.de/lists/${curation.id}`,
                  "name": curation.title,
                  "description": curation.description,
                  "numberOfItems": curation.bookCount,
                  "dateCreated": curation.createdDate,
                  "genre": curation.category,
                  "creator": {
                    "@type": "Person",
                    "name": curation.curator,
                    "image": curation.curatorAvatar,
                    "jobTitle": curation.curatorFocus
                  },
                  "interactionStatistic": [
                    {
                      "@type": "InteractionCounter",
                      "interactionType": "https://schema.org/LikeAction",
                      "userInteractionCount": curation.likes
                    },
                    {
                      "@type": "InteractionCounter",
                      "interactionType": "https://schema.org/ViewAction",
                      "userInteractionCount": curation.views
                    }
                  ],
                  "itemListElement": curation.books.slice(0, 3).map((book, bookIndex) => ({
                    "@type": "ListItem",
                    "position": bookIndex + 1,
                    "item": {
                      "@type": "Book",
                      "name": book.title,
                      "author": {
                        "@type": "Person",
                        "name": book.author
                      },
                      "image": book.cover,
                      "publisher": {
                        "@type": "Organization",
                        "name": book.publisher
                      },
                      "datePublished": book.year,
                      "offers": {
                        "@type": "Offer",
                        "price": book.price.replace(/[€\s]/g, '').replace(',', '.'),
                        "priceCurrency": "EUR",
                        "availability": "https://schema.org/InStock"
                      }
                    }
                  }))
                }
              }))
            }
          })}
        </script>
      </Helmet>

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Start", href: "/", onClick: onGoBack },
          { label: "Alle Kurationen" }
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
              Alle Kurationen
            </Heading>
            
            <Text variant="large" className="max-w-3xl !text-white">
              Entdecke kuratierte Buchsammlungen von Expert*innen zu allen Themen. Von Klassikern bis zu aktuellen Geheimtipps – handverlesen und mit Herz ausgewählt.
            </Text>
          </div>
        </Container>
      </Section>

      {/* Suche & Sortierung Sektion */}
      <Section variant="compact" className="!pb-4">
        <Container>
          {/* Search Bar & Sort */}
          <div className="max-w-2xl mx-auto mb-8">
            <Text variant="base" className="mb-3 text-foreground">
              Durchsuche Kurationen nach Titel, Beschreibung oder Kurator*in
            </Text>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 md:left-3.5 lg:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5" style={{ color: 'var(--search-icon)' }} />
                <input
                  type="search"
                  placeholder="Kuration suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 md:pl-11 lg:pl-12 h-10 md:h-11 rounded-lg text-sm md:text-base"
                  style={{ 
                    backgroundColor: 'var(--search-bg)',
                    color: 'var(--search-text)',
                    border: `1px solid var(--search-border)`,
                    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)' 
                  }}
                  aria-label="Kurationen durchsuchen"
                />
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="mb-8">
            <Heading
              as="h3"
              variant="h3"
              className="mb-3 text-foreground"
            >
              Nach Kategorie filtern
            </Heading>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Kategorie-Filter">
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
            
            {/* "Weitere Kategorien laden" Link */}
            {!showAllCategories && categories.length > 8 && (
              <button
                onClick={() => setShowAllCategories(true)}
                className="expand-btn mt-3"
                aria-expanded={showAllCategories}
                aria-label="Weitere Kategorien anzeigen"
              >
                + Weitere Kategorien laden ({categories.length - 8} weitere)
              </button>
            )}
            
            {selectedCategories.length > 0 && (
              <Text variant="small" className="text-foreground mt-3">
                <span style={{ fontWeight: '600' }}>{filteredAndSortedCurations.length}</span> {filteredAndSortedCurations.length === 1 ? 'Kuration' : 'Kurationen'} gefunden
              </Text>
            )}
          </div>
        </Container>
      </Section>

      {/* Curations List */}
      <Section variant="default" className="!pt-4 !pb-12">
        <Container>
          {filteredAndSortedCurations.length > 0 ? (
            <div className="space-y-8">
              {filteredAndSortedCurations.map((curation) => (
                <DSCuratedListCard
                  key={curation.id}
                  creatorAvatar={curation.curatorAvatar}
                  creatorName={curation.curator}
                  creatorFocus={curation.curatorFocus}
                  occasion={curation.title}
                  curationReason={curation.description}
                  books={curation.books}
                  category={curation.category}
                  showHeader={true}
                  showVideo={curation.hasVideo}
                  videoThumbnail={curation.videoThumbnail}
                  showCta={false}
                  backgroundColor="transparent"
                  sectionBackgroundColor="transparent"
                  applyBackgroundToContent={false}
                  isStorefront={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <List className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
              <Heading as="h3" variant="h3" className="text-foreground-muted mb-2">
                Keine Kurationen gefunden
              </Heading>
              <Text variant="base" className="text-foreground-muted">
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