import { useState } from "react";
import { useSafeNavigate } from "../../utils/routing";
import { Search, Store, MapPin, ExternalLink } from "lucide-react";
import { Breadcrumb } from "../layout/Breadcrumb";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Container } from "../ui/container";
import { Section } from "../ui/section";
import { Heading, Text } from "../ui/typography";
import { Helmet } from "react-helmet-async";
import { DSButton } from "../design-system/DSButton";

interface Bookstore {
  id: string;
  name: string;
  image: string;
  city: string;
  address: string;
  description: string;
  website?: string;
  specialty: string;
}

// Demo Bookstores Data
const allBookstores: Bookstore[] = [
  {
    id: "1",
    name: "Buchhandlung Walther König",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    city: "Berlin",
    address: "Burgstraße 27, 10178 Berlin",
    description: "Internationale Kunstbuchandlung mit Fokus auf zeitgenössische Kunst, Fotografie und Architektur.",
    website: "https://www.buchhandlung-walther-koenig.de",
    specialty: "Kunst & Fotografie"
  },
  {
    id: "2",
    name: "Philosophische Buchhandlung",
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400",
    city: "Köln",
    address: "Ehrenstraße 23, 50672 Köln",
    description: "Spezialisiert auf Philosophie, Gesellschaftstheorie und kritische Wissenschaft.",
    website: "https://www.philosophische-buchhandlung.de",
    specialty: "Philosophie & Theorie"
  },
  {
    id: "3",
    name: "Buchhandlung Lehmkuhl",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    city: "München",
    address: "Leopoldstraße 45, 80802 München",
    description: "Traditionelle Buchhandlung mit exzellenter Auswahl an deutschsprachiger und internationaler Literatur.",
    specialty: "Belletristik & Klassiker"
  },
  {
    id: "4",
    name: "Pro qm",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400",
    city: "Berlin",
    address: "Almstadtstraße 48-50, 10119 Berlin",
    description: "Unabhängige Buchhandlung mit Café, Lesungen und kulturellem Programm.",
    website: "https://www.pro-qm.de",
    specialty: "Kulturprogramm & Events"
  },
  {
    id: "5",
    name: "Buchhandlung Kisch & Co.",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400",
    city: "Hamburg",
    address: "Eppendorfer Landstraße 96, 20249 Hamburg",
    description: "Gemütliche Stadtteilbuchhandlung mit persönlicher Beratung und sorgfältig kuratierten Empfehlungen.",
    specialty: "Persönliche Beratung"
  },
  {
    id: "6",
    name: "Curious Fox Bookshop",
    image: "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=400",
    city: "Berlin",
    address: "Kreuzbergstraße 76, 10965 Berlin",
    description: "Englischsprachige Buchhandlung mit Fokus auf queere Literatur, feministische Texte und progressive Politik.",
    website: "https://www.curiousfoxbooks.com",
    specialty: "English Books & Queer Lit"
  }
];

export function AllBookstoresPage() {
  const navigate = useSafeNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Extract unique cities
  const cities = Array.from(new Set(allBookstores.map(store => store.city))).sort();

  // Filter bookstores
  const filteredBookstores = allBookstores.filter(store => {
    const matchesCity = !selectedCity || store.city === selectedCity;
    const matchesSearch = searchQuery === "" || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCity && matchesSearch;
  });

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <Helmet>
        <title>Buchhandlungen - Partner-Buchläden | coratiert.de</title>
        <meta 
          name="description" 
          content="Entdecke unabhängige Buchhandlungen und lokale Buchhändler*innen. Unterstütze den stationären Buchhandel und besuche diese besonderen Orte der Buchkultur."
        />
      </Helmet>

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Start", href: "/", onClick: () => navigate('/') },
          { label: "Buchhandlungen" }
        ]}
      />

      {/* Hero Section */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading 
              as="h1" 
              variant="h1" 
              className="mb-4 !text-foreground"
            >
              Buchhandlungen
            </Heading>
            
            <Text variant="large" className="max-w-3xl !text-foreground">
              Entdecke unabhängige Buchhandlungen und unterstütze den stationären Buchhandel. Besuche diese besonderen Orte der Buchkultur.
            </Text>
          </div>
        </Container>
      </Section>

      {/* Search & Filter Section */}
      <Section variant="compact" className="!pb-4">
        <Container>
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <Text variant="base" className="mb-3 text-foreground">
              Durchsuche Buchhandlungen nach Name, Stadt oder Spezialgebiet
            </Text>
            <div className="relative">
              <Search className="absolute left-3 md:left-3.5 lg:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5" style={{ color: 'var(--search-icon)' }} />
              <input
                type="search"
                placeholder="Buchhandlung suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 md:pl-11 lg:pl-12 h-10 md:h-11 rounded-lg text-sm md:text-base"
                style={{ 
                  backgroundColor: 'var(--search-bg)',
                  color: 'var(--search-text)',
                  border: `1px solid var(--search-border)`,
                  boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)' 
                }}
                aria-label="Buchhandlungen durchsuchen"
              />
            </div>
          </div>

          {/* City Filter */}
          <div className="mb-8">
            <Heading
              as="h3"
              variant="h3"
              className="mb-3 text-foreground"
            >
              Nach Stadt filtern
            </Heading>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCity(null)}
                className="tag-button"
                aria-pressed={selectedCity === null}
              >
                Alle Städte
              </button>
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className="tag-button"
                  aria-pressed={selectedCity === city}
                >
                  {city}
                </button>
              ))}
            </div>
            
            {filteredBookstores.length > 0 && (
              <Text variant="small" className="text-foreground mt-3">
                <span style={{ fontWeight: '600' }}>{filteredBookstores.length}</span> Buchhandlung{filteredBookstores.length === 1 ? '' : 'en'} gefunden
              </Text>
            )}
          </div>
        </Container>
      </Section>

      {/* Bookstores Grid */}
      <Section variant="compact">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookstores.map(store => (
              <div
                key={store.id}
                className="bg-white dark:bg-charcoal rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
              >
                {/* Store Image */}
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={store.image}
                    alt={store.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-saffron text-white text-xs rounded-full font-headline">
                    {store.specialty}
                  </div>
                </div>

                {/* Store Content */}
                <div className="p-5">
                  <Heading as="h3" variant="h4" className="mb-2 text-foreground">
                    {store.name}
                  </Heading>
                  
                  <div className="flex items-center gap-2 mb-3 text-sm text-foreground/70">
                    <MapPin className="w-4 h-4" />
                    <span>{store.city}</span>
                  </div>

                  <Text variant="small" className="text-foreground/80 mb-3 line-clamp-3">
                    {store.description}
                  </Text>

                  <Text variant="small" className="text-foreground/60 mb-4">
                    {store.address}
                  </Text>

                  {store.website && (
                    <DSButton
                      variant="primary"
                      size="small"
                      iconRight={ExternalLink}
                      onClick={() => window.open(store.website, '_blank', 'noopener,noreferrer')}
                      aria-label={`Zur Website von ${store.name} öffnen`}
                    >
                      Zur Website
                    </DSButton>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredBookstores.length === 0 && (
            <div className="text-center py-16">
              <Store className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-foreground-muted)' }} />
              <Heading as="h3" variant="h3" className="mb-2 text-foreground">
                Keine Buchhandlungen gefunden
              </Heading>
              <Text variant="body" className="text-foreground opacity-70">
                Versuche andere Filter oder Suchbegriffe
              </Text>
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}