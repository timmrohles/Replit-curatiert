import React, { useState, useMemo } from "react";
import { useSafeNavigate } from "../../utils/routing";
import { Container } from "../ui/container";
import { Section } from "../ui/section";
import { Heading, Text } from "../ui/typography";
import { EventCard } from "./EventCard";
import { Calendar, MapPin, Video } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Header } from "../layout/Header";
import { Footer } from "../layout/Footer";
import { Breadcrumb } from "../layout/Breadcrumb";
import { InfoBar } from "../layout/InfoBar";

// ================================================================
// ONIX 3.0 EVENT STRUCTURE
// ================================================================
// Die Events-Sektion nutzt ONIX 3.0 <Event> Block zur Strukturierung:
// - <EventType>: Code aus Liste 231 (01-04)
// - <EventName>: Titel der Veranstaltung
// - <EventDateTime>: ISO 8601 Format
// - <EventOccurrence>: Ortsangaben (physisch/virtuell)
// - <WebsiteLink>: URL für Online-Events oder Teilnahme
// - <TextContent> TextType 18: Promotional description
// - <EventSponsor>: Veranstalter/Kurator (PersonName oder CorporateName)
// - <Website> WebsiteRole 05: Link zum Event-Kalender des Autors/Verlags
//
// Schema.org Mapping:
// - ONIX <EventName> → Schema.org "name"
// - ONIX <EventDateTime> → Schema.org "startDate"
// - ONIX <EventType> → Schema.org "@type" (Event/EducationEvent)
// - ONIX <WebsiteLink> → Schema.org "location" (VirtualLocation)
// - ONIX <EventSponsor> → Schema.org "organizer" & "performer"
// ================================================================

// ONIX 3.0 Event Type Codes (Code List 231)
type ONIXEventType = 
  | "01" // Signing (Buchsignierung)
  | "02" // Reading (Lesung)
  | "03" // Talk/Lecture (Diskussion/Vortrag)
  | "04"; // Seminar/Workshop

// User-facing Event Types
type EventTypeLabel = 
  | "Buchsignierung"
  | "Lesung" 
  | "Podcast Live-Episode" 
  | "Livestream" 
  | "Panel" 
  | "Buchveröffentlichung"
  | "Workshop"
  | "Seminar";

interface Event {
  id: string;
  // ONIX 3.0: <EventName>
  title: string;
  // ONIX 3.0: <EventDateTime> - ISO 8601 Format
  eventDateTime: string;
  // UI-friendly date/time (parsed from eventDateTime)
  date: string;
  time: string;
  // ONIX 3.0: <Event> → <EventOccurrence> → <EventOccurrenceDate>
  location: string;
  locationType: "physical" | "virtual";
  // ONIX 3.0: <WebsiteLink> - URL für Webinar/Stream
  websiteLink?: string;
  // ONIX 3.0: <TextContent> TextType 18 (Promotional description)
  description: string;
  // ONIX 3.0: <EventType> Code List 231
  onixEventType: ONIXEventType;
  // User-facing label
  eventType: EventTypeLabel;
  // ONIX 3.0: <EventSponsor> → <PersonName> oder <CorporateName>
  curator: string;
  curatorAvatar: string;
  curatorSlug?: string;
  curatorFocus?: string;
  // ONIX 3.0: <Website> WebsiteRole 05 (Author/Publisher event calendar)
  eventCalendarUrl?: string;
  rssSource?: string;
  city?: string;
}

// Parse German date format (e.g., "15. Januar 2025")
function parseGermanDate(dateString: string): Date {
  const months: Record<string, number> = {
    "Januar": 0, "Februar": 1, "März": 2, "April": 3, "Mai": 4, "Juni": 5,
    "Juli": 6, "August": 7, "September": 8, "Oktober": 9, "November": 10, "Dezember": 11
  };
  const parts = dateString.match(/(\d+)\.\s+(\w+)\s+(\d{4})/);
  if (!parts) return new Date();
  const [, day, month, year] = parts;
  return new Date(parseInt(year), months[month] || 0, parseInt(day));
}

// Mock Event Data from multiple curators
const allEvents: Event[] = [
  {
    id: "event-1",
    title: "Buchvorstellung: Mythos Geldknappheit – Eine Lesung mit Diskussion",
    eventDateTime: "2025-01-15T19:00:00Z",
    date: "15. Januar 2025",
    time: "19:00 Uhr",
    location: "Buchhandlung Walther König, Berlin",
    locationType: "physical",
    city: "Berlin",
    description: "Maurice Ökonomius stellt sein neues Buch 'Mythos Geldknappheit' vor und diskutiert mit dem Publikum über moderne Geldpolitik, wirtschaftliche Mythen und die Prinzipien der Modern Monetary Theory. Eine interaktive Veranstaltung mit anschließender Q&A-Session.",
    onixEventType: "02",
    eventType: "Lesung",
    curator: "Maurice Ökonomius",
    curatorAvatar: "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?w=200",
    curatorSlug: "maurice-oekonomius",
    curatorFocus: "Wirtschaftspolitik & Modern Monetary Theory",
    websiteLink: "https://coratiert.de/events/mythos-geldknappheit"
  },
  {
    id: "event-2",
    title: "Podcast Live-Episode: MMT in der Praxis mit Stephanie Kelton",
    eventDateTime: "2025-01-22T20:00:00Z",
    date: "22. Januar 2025",
    time: "20:00 Uhr",
    location: "Online via Zoom",
    locationType: "virtual",
    description: "Sonderfolge von 'Geld für die Welt' live aufgezeichnet. Stephanie Kelton, Wirtschaftsprofessorin und MMT-Pionierin, spricht über die praktische Anwendung der Modern Monetary Theory in der aktuellen Wirtschaftspolitik. Mit Live-Chat für Zuschauerfragen.",
    onixEventType: "03",
    eventType: "Podcast Live-Episode",
    curator: "Maurice Ökonomius",
    curatorAvatar: "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?w=200",
    curatorSlug: "maurice-oekonomius",
    curatorFocus: "Wirtschaftspolitik & Modern Monetary Theory",
    websiteLink: "https://zoom.us/j/example-mmt-podcast"
  },
  {
    id: "event-3",
    title: "Panel-Diskussion: Zukunft der Wirtschaftspolitik in Europa",
    eventDateTime: "2025-02-05T18:30:00Z",
    date: "5. Februar 2025",
    time: "18:30 Uhr",
    location: "Heinrich-Böll-Stiftung, Berlin",
    locationType: "physical",
    city: "Berlin",
    description: "Gemeinsam mit führenden Ökonomen diskutiert Maurice über alternative Wirtschaftsmodelle und die Rolle der Finanzpolitik. Die Veranstaltung beleuchtet progressive Ansätze für eine nachhaltige und gerechte Wirtschaft in Europa.",
    onixEventType: "03",
    eventType: "Panel",
    curator: "Maurice Ökonomius",
    curatorAvatar: "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?w=200",
    curatorSlug: "maurice-oekonomius",
    curatorFocus: "Wirtschaftspolitik & Modern Monetary Theory",
    websiteLink: "https://www.boell.de/de/events/wirtschaftspolitik-europa"
  },
  {
    id: "event-4",
    title: "Livestream: Q&A zu Modern Monetary Theory",
    eventDateTime: "2025-02-12T19:00:00Z",
    date: "12. Februar 2025",
    time: "19:00 Uhr",
    location: "YouTube Live",
    locationType: "virtual",
    description: "Maurice beantwortet Zuschauerfragen zur MMT und diskutiert aktuelle wirtschaftspolitische Entwicklungen. Ein interaktiver Livestream für alle, die mehr über alternative Wirtschaftskonzepte erfahren möchten. Keine Vorkenntnisse erforderlich!",
    onixEventType: "03",
    eventType: "Livestream",
    curator: "Maurice Ökonomius",
    curatorAvatar: "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?w=200",
    curatorSlug: "maurice-oekonomius",
    curatorFocus: "Wirtschaftspolitik & Modern Monetary Theory",
    websiteLink: "https://youtube.com/live/mmt-qa-session"
  },
  {
    id: "event-5",
    title: "Buchclub: Die besten feministischen Bücher 2024",
    eventDateTime: "2025-01-18T18:00:00Z",
    date: "18. Januar 2025",
    time: "18:00 Uhr",
    location: "Café Literatur, Hamburg",
    locationType: "physical",
    city: "Hamburg",
    description: "Lisa Schmidt lädt zum monatlichen Buchclub ein. Diesen Monat diskutieren wir die wichtigsten feministischen Neuerscheinungen des Jahres 2024 und ihre gesellschaftlichen Implikationen. Ein Safe Space für offene Diskussionen über Feminismus und Literatur.",
    onixEventType: "02",
    eventType: "Lesung",
    curator: "Lisa Schmidt",
    curatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    curatorSlug: "lisa-schmidt",
    curatorFocus: "Feministische Literatur & Gesellschaftskritik"
  },
  {
    id: "event-6",
    title: "Lesung: Neue Science-Fiction-Stimmen",
    eventDateTime: "2025-01-25T20:00:00Z",
    date: "25. Januar 2025",
    time: "20:00 Uhr",
    location: "Literaturhaus München",
    locationType: "physical",
    city: "München",
    description: "Tom Weber präsentiert die aufregendsten neuen Stimmen der Science-Fiction-Literatur. Von Klimafiktion bis zur postkapitalistischen Spekulation – entdecken Sie Autor*innen, die die Zukunft neu denken.",
    onixEventType: "02",
    eventType: "Lesung",
    curator: "Tom Weber",
    curatorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    curatorSlug: "tom-weber",
    curatorFocus: "Science-Fiction & Zukunftsforschung",
    websiteLink: "https://literaturhaus-muenchen.de/events/scifi-stimmen"
  },
  {
    id: "event-7",
    title: "Online-Workshop: Kinderbücher mit diverser Perspektive",
    eventDateTime: "2025-01-30T16:00:00Z",
    date: "30. Januar 2025",
    time: "16:00 Uhr",
    location: "Zoom Meeting",
    locationType: "virtual",
    description: "Sarah Müller zeigt, wie man Kindern durch Bücher Vielfalt näherbringen kann. Mit praktischen Tipps für Eltern und Pädagog*innen. Der Workshop umfasst Buchempfehlungen, Vorlesetechniken und Diskussionsanregungen für verschiedene Altersgruppen.",
    onixEventType: "04",
    eventType: "Workshop",
    curator: "Sarah Müller",
    curatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    curatorSlug: "sarah-mueller",
    curatorFocus: "Kinderliteratur & Diversity",
    websiteLink: "https://zoom.us/j/workshop-diversity-kinderbuecher"
  },
  {
    id: "event-8",
    title: "Buchpremiere: Philosophie für den Alltag",
    eventDateTime: "2025-02-08T19:30:00Z",
    date: "8. Februar 2025",
    time: "19:30 Uhr",
    location: "Philosophische Buchhandlung, Köln",
    locationType: "physical",
    city: "Köln",
    description: "Dr. Andreas Klein stellt sein neues Buch vor, das philosophische Konzepte alltagstauglich erklärt. Von Stoizismus bis Existenzialismus – entdecken Sie, wie antike und moderne Philosophie uns im Alltag helfen kann.",
    onixEventType: "01",
    eventType: "Buchveröffentlichung",
    curator: "Dr. Andreas Klein",
    curatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    curatorSlug: "andreas-klein",
    curatorFocus: "Philosophie & Lebenshilfe"
  },
  {
    id: "event-9",
    title: "Panel: Klimakrise und Literatur",
    eventDateTime: "2025-02-14T18:00:00Z",
    date: "14. Februar 2025",
    time: "18:00 Uhr",
    location: "Umweltzentrum Frankfurt",
    locationType: "physical",
    city: "Frankfurt",
    description: "Prof. Maria Schneider diskutiert mit Autor*innen über die Rolle von Literatur in der Klimakrise. Wie können Geschichten zum Klimaschutz beitragen? Eine interdisziplinäre Diskussion zwischen Literaturwissenschaft und Klimaforschung.",
    onixEventType: "03",
    eventType: "Panel",
    curator: "Prof. Maria Schneider",
    curatorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
    curatorSlug: "maria-schneider",
    curatorFocus: "Klimaliteratur & Nachhaltigkeit",
    websiteLink: "https://umweltzentrum-frankfurt.de/klimakrise-literatur"
  },
  {
    id: "event-10",
    title: "Livestream: Buchempfehlungen für den Winter",
    eventDateTime: "2025-02-20T19:00:00Z",
    date: "20. Februar 2025",
    time: "19:00 Uhr",
    location: "Instagram Live",
    locationType: "virtual",
    description: "Sarah Klein teilt ihre liebsten Winterlektüren und beantwortet Zuschauerfragen. Von Hygge-Romanen bis zu spannenden Thrillern – die perfekte Lektüre für kalte Winterabende. Live-Interaktion via Kommentare!",
    onixEventType: "03",
    eventType: "Livestream",
    curator: "Sarah Klein",
    curatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    curatorSlug: "sarah-klein",
    curatorFocus: "Belletristik & Lifestyle",
    websiteLink: "https://instagram.com/sarahklein/live"
  }
];

interface EventsPageProps {
  onGoBack?: () => void;
}

export function EventsPage({ onGoBack }: EventsPageProps) {
  const navigate = useSafeNavigate();
  const [selectedCurator, setSelectedCurator] = useState<string>("Alle");
  const [selectedEventType, setSelectedEventType] = useState<string>("Alle");
  const [selectedLocationType, setSelectedLocationType] = useState<string>("alle");
  const [selectedCity, setSelectedCity] = useState<string>("Alle");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("alle");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get unique curators
  const curators = useMemo(() => {
    const uniqueCurators = Array.from(new Set(allEvents.map(e => e.curator)));
    return ["Alle", ...uniqueCurators];
  }, []);

  // Get unique event types
  const eventTypes = useMemo(() => {
    const types = Array.from(new Set(allEvents.map(e => e.eventType)));
    return ["Alle", ...types];
  }, []);

  // Get unique cities
  const cities = useMemo(() => {
    const physicalCities = allEvents
      .filter(e => e.locationType === 'physical' && e.city)
      .map(e => e.city!);
    const uniqueCities = Array.from(new Set(physicalCities));
    return ["Alle", ...uniqueCities.sort(), "Online"];
  }, []);

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    let filtered = allEvents.filter(event => {
      // Curator filter
      if (selectedCurator !== "Alle" && event.curator !== selectedCurator) {
        return false;
      }

      // Event type filter
      if (selectedEventType !== "Alle" && event.eventType !== selectedEventType) {
        return false;
      }

      // Location type filter
      if (selectedLocationType !== "alle" && event.locationType !== selectedLocationType) {
        return false;
      }

      // City filter
      if (selectedCity !== "Alle") {
        if (selectedCity === "Online" && event.locationType !== "virtual") {
          return false;
        }
        if (selectedCity !== "Online" && event.city !== selectedCity) {
          return false;
        }
      }

      // Date filter
      if (selectedDateFilter !== "alle") {
        const eventDate = parseGermanDate(event.date);
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        
        if (selectedDateFilter === "upcoming" && eventDate < now) {
          return false;
        }
        if (selectedDateFilter === "this-month" && (eventDate < thisMonthStart || eventDate >= nextMonthStart)) {
          return false;
        }
        if (selectedDateFilter === "next-month" && (eventDate < nextMonthStart || eventDate > nextMonthEnd)) {
          return false;
        }
      }

      return true;
    });

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = parseGermanDate(a.date);
      const dateB = parseGermanDate(b.date);
      return sortOrder === 'asc' 
        ? dateA.getTime() - dateB.getTime() 
        : dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [selectedCurator, selectedEventType, selectedLocationType, selectedCity, selectedDateFilter, sortOrder]);

  const handleClearFilters = () => {
    setSelectedCurator("Alle");
    setSelectedEventType("Alle");
    setSelectedLocationType("alle");
    setSelectedCity("Alle");
    setSelectedDateFilter("alle");
  };

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      {/* InfoBar - Beta Hinweis */}
      <InfoBar />
      
      {/* Header */}
      <Header />
      
      {/* Schema.org JSON-LD für Events */}
      <Helmet>
        <title>Veranstaltungen - Lesungen, Buchpremieren & Events | coratiert.de</title>
        <meta 
          name="description" 
          content="Entdecken Sie exklusive Lesungen, Buchvorstellungen und literarische Events unserer Kurator*innen. Erleben Sie Literatur live – ob vor Ort oder online."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Veranstaltungen bei coratiert.de",
            "description": "Literarische Events, Lesungen und Buchpremieren",
            "url": "https://coratiert.de/events",
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
                  "name": "Veranstaltungen"
                }
              ]
            },
            "mainEntity": {
              "@type": "ItemList",
              "name": "Event-Übersicht",
              "numberOfItems": filteredEvents.length,
              "itemListElement": filteredEvents.map((event, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Event",
                  "@id": `https://coratiert.de/events/${event.id}`,
                  "name": event.title,
                  "description": event.description,
                  "startDate": parseGermanDate(event.date).toISOString(),
                  "eventAttendanceMode": event.locationType === "virtual" 
                    ? "https://schema.org/OnlineEventAttendanceMode"
                    : "https://schema.org/OfflineEventAttendanceMode",
                  "eventStatus": "https://schema.org/EventScheduled",
                  "location": event.locationType === "virtual" 
                    ? {
                        "@type": "VirtualLocation",
                        "url": "https://coratiert.de/events/" + event.id
                      }
                    : {
                        "@type": "Place",
                        "name": event.location,
                        "address": {
                          "@type": "PostalAddress",
                          "addressLocality": event.city,
                          "addressCountry": "DE"
                        }
                      },
                  "organizer": {
                    "@type": "Person",
                    "name": event.curator,
                    "image": event.curatorAvatar
                  },
                  "performer": {
                    "@type": "Person",
                    "name": event.curator
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
          { label: "Start", onClick: onGoBack || (() => navigate('/')) },
          { label: "Veranstaltungen" }
        ]}
      />

      {/* Hero Section - Blauer Hintergrund, Text linksbündig */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading as="h1" variant="h1" className="mb-4 !text-foreground">
              Veranstaltungen
            </Heading>
            
            <Text variant="large" className="max-w-3xl !text-foreground">
              Entdecken Sie exklusive Lesungen, Buchvorstellungen und literarische Events 
              unserer Kurator*innen. Erleben Sie Literatur live – ob vor Ort oder online.
            </Text>
          </div>
        </Container>
      </Section>

      {/* Filters Section */}
      <Section variant="compact" className="!pb-4">
        <Container>
          <div className="space-y-6">
            {/* Filter Controls */}
            <div className="flex flex-col gap-4">
              {/* Curator Filter - ALWAYS VISIBLE */}
              <div>
                <Text variant="small" className="mb-2 font-medium">Kurator*in:</Text>
                <div className="flex flex-wrap gap-2">
                  {curators.map(curator => (
                    <button
                      key={curator}
                      onClick={() => setSelectedCurator(curator)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCurator === curator
                          ? 'bg-[var(--color-blue)] text-white'
                          : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                      }`}
                    >
                      {curator}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Type Filter - ALWAYS VISIBLE */}
              <div>
                <Text variant="small" className="mb-2 font-medium">Event-Typ:</Text>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedEventType(type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedEventType === type
                          ? 'bg-[var(--color-blue)] text-white'
                          : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter - ALWAYS VISIBLE */}
              <div>
                <Text variant="small" className="mb-2 font-medium">Zeitraum:</Text>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedDateFilter("alle")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedDateFilter === "alle"
                        ? 'bg-[var(--color-blue)] text-white'
                        : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                    }`}
                  >
                    Alle
                  </button>
                  <button
                    onClick={() => setSelectedDateFilter("upcoming")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedDateFilter === "upcoming"
                        ? 'bg-[var(--color-blue)] text-white'
                        : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                    }`}
                  >
                    Bevorstehend
                  </button>
                  <button
                    onClick={() => setSelectedDateFilter("this-month")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedDateFilter === "this-month"
                        ? 'bg-[var(--color-blue)] text-white'
                        : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                    }`}
                  >
                    Dieser Monat
                  </button>
                  <button
                    onClick={() => setSelectedDateFilter("next-month")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedDateFilter === "next-month"
                        ? 'bg-[var(--color-blue)] text-white'
                        : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                    }`}
                  >
                    Nächster Monat
                  </button>
                </div>
              </div>

              {/* ADVANCED FILTERS - COLLAPSIBLE */}
              {showAdvancedFilters && (
                <div className="flex flex-col gap-4 pt-4 pb-2 border-t border-gray-200/50">
                  {/* Location Type Filter */}
                  <div>
                    <Text variant="small" className="mb-2 font-medium">Ort:</Text>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedLocationType("alle")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedLocationType === "alle"
                            ? 'bg-[var(--color-blue)] text-white'
                            : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                        }`}
                      >
                        Alle
                      </button>
                      <button
                        onClick={() => setSelectedLocationType("physical")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                          selectedLocationType === "physical"
                            ? 'bg-[var(--color-blue)] text-white'
                            : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                        Vor Ort
                      </button>
                      <button
                        onClick={() => setSelectedLocationType("virtual")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                          selectedLocationType === "virtual"
                            ? 'bg-[var(--color-blue)] text-white'
                            : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        Online
                      </button>
                    </div>
                  </div>

                  {/* City Filter */}
                  {selectedLocationType !== "virtual" && (
                    <div>
                      <Text variant="small" className="mb-2 font-medium">Stadt:</Text>
                      <div className="flex flex-wrap gap-2">
                        {cities.map(city => (
                          <button
                            key={city}
                            onClick={() => setSelectedCity(city)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              selectedCity === city
                                ? 'bg-[var(--color-blue)] text-white'
                                : 'bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40'
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Weitere Filter Toggle Button - BELOW COLLAPSIBLE CONTENT */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-blue)] hover:bg-white/20 transition-all flex items-center gap-2 self-start"
              >
                {showAdvancedFilters ? '− Weniger Filter' : '+ Weitere Filter'}
              </button>

              {/* Sort & Clear */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/30 backdrop-blur-sm text-[var(--charcoal)] hover:bg-white/40 border border-white/40 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {sortOrder === 'asc' ? 'Älteste zuerst' : 'Neueste zuerst'}
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-blue)] hover:underline"
                >
                  Filter zurücksetzen
                </button>
              </div>
            </div>

            {/* Results Count */}
            <Text variant="body" className="text-gray-600">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'Veranstaltung' : 'Veranstaltungen'} gefunden
            </Text>
          </div>
        </Container>
      </Section>

      {/* Events Grid */}
      <Section variant="default" className="!pt-0">
        <Container>
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  date={event.date}
                  time={event.time}
                  location={event.location}
                  locationType={event.locationType}
                  description={event.description}
                  eventType={event.eventType}
                  curatorName={event.curator}
                  curatorImage={event.curatorAvatar}
                  curatorSlug={event.curatorSlug}
                  curatorFocus={event.curatorFocus}
                  websiteLink={event.websiteLink}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <Heading as="h3" variant="h3" className="mb-2">
                Keine Veranstaltungen gefunden
              </Heading>
              <Text variant="body" className="text-gray-500 mb-6">
                Versuchen Sie andere Filter oder Suchbegriffe
              </Text>
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: 'var(--color-blue)',
                  color: 'white',
                  fontFamily: 'var(--font-family-headline)'
                }}
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </Container>
      </Section>

      {/* Footer */}
      <Footer />
    </div>
  );
}