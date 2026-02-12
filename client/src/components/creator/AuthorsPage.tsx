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
interface Author {
  id: string;
  name: string;
  nameBeforeKey: string;
  keyName: string;
  photo: string;
  bio: string;
  shortBio?: string;
  booksCount: number;
  followersCount: number;
  tags: string[];
}

export function AuthorsPage() {
  const navigate = useSafeNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);

  // Mock Autoren-Daten (später aus Backend)
  const authors: Author[] = useMemo(() => [
    {
      id: "stephen-king",
      name: "Stephen King",
      nameBeforeKey: "Stephen",
      keyName: "King",
      photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
      bio: "Meister des Horrors und der psychologischen Spannung",
      booksCount: 64,
      followersCount: 12450,
      tags: ["Horror", "Thriller", "Fantasy"]
    },
    {
      id: "margaret-atwood",
      name: "Margaret Atwood",
      nameBeforeKey: "Margaret",
      keyName: "Atwood",
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      bio: "Preisgekrönte Autorin dystopischer Klassiker",
      booksCount: 48,
      followersCount: 9320,
      tags: ["Dystopie", "Feminismus", "Zeitgenössisch"]
    },
    {
      id: "haruki-murakami",
      name: "Haruki Murakami",
      nameBeforeKey: "Haruki",
      keyName: "Murakami",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      bio: "Japanischer Autor surrealistischer Welten",
      booksCount: 32,
      followersCount: 15600,
      tags: ["International", "Surrealismus", "Zeitgenössisch"]
    },
    {
      id: "chimamanda-ngozi-adichie",
      name: "Chimamanda Ngozi Adichie",
      nameBeforeKey: "Chimamanda Ngozi",
      keyName: "Adichie",
      photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
      bio: "Nigerianische Autorin über Identität und Migration",
      booksCount: 18,
      followersCount: 8740,
      tags: ["International", "Diversity", "Feminismus"]
    },
    {
      id: "yuval-noah-harari",
      name: "Yuval Noah Harari",
      nameBeforeKey: "Yuval Noah",
      keyName: "Harari",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      bio: "Historiker und Philosoph der Menschheitsgeschichte",
      booksCount: 5,
      followersCount: 22100,
      tags: ["Sachbuch", "Geschichte", "Wissenschaft"]
    },
    {
      id: "elena-ferrante",
      name: "Elena Ferrante",
      nameBeforeKey: "Elena",
      keyName: "Ferrante",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
      bio: "Anonyme italienische Autorin der Neapolitanischen Saga",
      booksCount: 11,
      followersCount: 11200,
      tags: ["International", "Feminismus", "Zeitgenössisch"]
    }
  ], []);

  // Verfügbare Tags
  const availableTags = useMemo(() => [
    "Horror", "Thriller", "Fantasy", "Dystopie", "Feminismus", 
    "Zeitgenössisch", "International", "Surrealismus", "Diversity", 
    "Sachbuch", "Geschichte", "Wissenschaft", "Philosophie", "Politik"
  ], []);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Filter & Sort authors with useMemo for performance
  const sortedAuthors = useMemo(() => {
    const filtered = authors.filter(author => {
      const matchesTags = selectedTags.length === 0 || 
        author.tags.some(tag => selectedTags.includes(tag));
      const matchesSearch = searchQuery === "" || 
        author.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTags && matchesSearch;
    });

    return filtered.sort((a, b) => b.followersCount - a.followersCount);
  }, [authors, selectedTags, searchQuery]);

  // Keyboard navigation handler for author cards
  const handleAuthorCardKeyDown = (e: React.KeyboardEvent, authorId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/autoren/${authorId}`);
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
        <title>Autoren entdecken - Die besten Schriftsteller*innen auf coratiert.de</title>
        <meta 
          name="description" 
          content="Entdecke die Autoren hinter den Geschichten und folge deinen Lieblingsschriftstellern. Durchsuche unsere Autoren-Datenbank nach Namen oder filtere nach Genre-Tags."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Autoren bei coratiert.de",
            "description": "Entdecke die Autoren hinter den Geschichten und folge deinen Lieblingsschriftstellern",
            "url": "https://coratiert.de/autoren",
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
                  "name": "Autoren"
                }
              ]
            },
            "mainEntity": {
              "@type": "ItemList",
              "name": "Autoren-Übersicht",
              "numberOfItems": sortedAuthors.length,
              "itemListElement": sortedAuthors.map((author, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Person",
                  "@id": `https://coratiert.de/autoren/${author.id}`,
                  "name": author.name,
                  "givenName": author.nameBeforeKey,
                  "familyName": author.keyName,
                  "description": author.bio,
                  "image": author.photo,
                  "url": `https://coratiert.de/autoren/${author.id}`,
                  "jobTitle": "Autor*in",
                  "knowsAbout": author.tags,
                  "interactionStatistic": [
                    {
                      "@type": "InteractionCounter",
                      "interactionType": "https://schema.org/FollowAction",
                      "userInteractionCount": author.followersCount
                    }
                  ],
                  "numberOfBooks": author.booksCount,
                  "genre": author.tags
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
          { label: "Autoren" }
        ]}
      />

      {/* Hero-Sektion: Autoren entdecken */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading 
              as="h1" 
              variant="h1" 
              className="mb-4 !text-foreground"
            >
              Autoren entdecken
            </Heading>
            
            <Text variant="large" className="max-w-3xl !text-foreground">
              Entdecke die Autoren hinter den Geschichten und folge deinen Lieblingsschriftstellern
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
              Durchsuche unsere Autoren-Datenbank nach Namen oder filtere nach Genre-Tags
            </Text>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Autor*in suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Autoren durchsuchen"
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
              Nach Genre filtern
            </Heading>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Genre-Filter">
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
                aria-label="Weitere Genre-Tags anzeigen"
              >
                + Weitere Themen laden ({availableTags.length - 8} weitere)
              </button>
            )}
            
            {selectedTags.length > 0 && (
              <Text variant="small" className="text-foreground mt-3">
                <span style={{ fontWeight: '600' }}>{sortedAuthors.length}</span> Autoren gefunden
              </Text>
            )}
          </div>
        </Container>
      </Section>

      {/* Authors Grid */}
      <Section variant="default" className="!pt-4 !pb-12">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedAuthors.map(author => (
              <div
                key={author.id}
                onClick={() => navigate(`/autoren/${author.id}`)}
                onKeyDown={(e) => handleAuthorCardKeyDown(e, author.id)}
                className="author-card"
                role="article"
                tabIndex={0}
                aria-label={`Autor ${author.name}, ${author.booksCount} Bücher, ${author.followersCount} Follower`}
              >
                {/* Author Photo */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <ImageWithFallback
                    src={author.photo}
                    alt={`Porträt von ${author.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Stats Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex gap-3 author-stats">
                      <span>
                        {author.booksCount} Bücher
                      </span>
                      <span>
                        {author.followersCount.toLocaleString()} Follower
                      </span>
                    </div>
                  </div>
                </div>

                {/* Author Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heading as="h3" className="text-base author-card-name">
                      {author.name}
                    </Heading>
                  </div>
                  <Text className="text-xs mb-3 author-card-bio">
                    {author.shortBio || (author.bio.length > 80 ? author.bio.substring(0, 80).trim() + '...' : author.bio)}
                  </Text>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {author.tags.slice(0, 2).map(tag => (
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
            {sortedAuthors.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Heading className="text-xl mb-2 text-foreground">
                  Keine Autoren gefunden
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