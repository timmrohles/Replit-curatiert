import { EventCard } from "./EventCard";
import { Button } from "../ui/button";
import { Calendar, ArrowRight } from "lucide-react";

interface Event {
  id: string;
  image: string;
  title: string;
  date: string;
  time: string;
  location: string;
  locationType: "physical" | "virtual";
  description: string;
  eventType: "Lesung" | "Podcast Live-Episode" | "Livestream" | "Panel" | "Buchveröffentlichung";
  rssSource?: string;
}

interface EventsSectionProps {
  creatorName?: string;
  events?: Event[];
  backgroundColor?: 'white' | 'beige';
  onViewAllEvents?: () => void;
}

// Mock Event Data
const defaultEvents: Event[] = [
  {
    id: "event-1",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    title: "Buchvorstellung: Mythos Geldknappheit – Eine Lesung mit Diskussion",
    date: "15. Januar 2025",
    time: "19:00 Uhr",
    location: "Buchhandlung Walther König, Berlin",
    locationType: "physical",
    description: "Maurice Ökonomius stellt sein neues Buch vor und diskutiert mit dem Publikum über moderne Geldpolitik und wirtschaftliche Mythen.",
    eventType: "Lesung",
    rssSource: "RSS Feed"
  },
  {
    id: "event-2",
    image: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=800",
    title: "Podcast Live-Episode: MMT in der Praxis mit Stephanie Kelton",
    date: "22. Januar 2025",
    time: "20:00 Uhr",
    location: "Online via Zoom",
    locationType: "virtual",
    description: "Sonderfolge von 'Geld für die Welt' live aufgezeichnet. Stephanie Kelton spricht über die praktische Anwendung der Modern Monetary Theory.",
    eventType: "Podcast Live-Episode",
    rssSource: "RSS Feed"
  },
  {
    id: "event-3",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800",
    title: "Panel-Diskussion: Zukunft der Wirtschaftspolitik in Europa",
    date: "5. Februar 2025",
    time: "18:30 Uhr",
    location: "Heinrich-Böll-Stiftung, Berlin",
    locationType: "physical",
    description: "Gemeinsam mit führenden Ökonomen diskutiert Maurice über alternative Wirtschaftsmodelle und die Rolle der Finanzpolitik.",
    eventType: "Panel",
    rssSource: "RSS Feed"
  },
  {
    id: "event-4",
    image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=800",
    title: "Livestream Q&A: Eure Fragen zur Geldpolitik",
    date: "12. Februar 2025",
    time: "19:00 Uhr",
    location: "YouTube & Twitch",
    locationType: "virtual",
    description: "Interaktive Session wo Maurice eure Fragen zu MMT, Inflation, Staatsschulden und aktueller Wirtschaftspolitik beantwortet.",
    eventType: "Livestream",
    rssSource: "RSS Feed"
  },
  {
    id: "event-5",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
    title: "Buchveröffentlichung: Wirtschaft neu denken – Die Zukunft der Ökonomie",
    date: "1. März 2025",
    time: "17:00 Uhr",
    location: "Ullstein Verlag, Berlin",
    locationType: "physical",
    description: "Offizielle Buchpremiere mit anschließendem Empfang. Das neue Werk bietet einen radikalen Blick auf Wirtschaftsreformen.",
    eventType: "Buchveröffentlichung",
    rssSource: "RSS Feed"
  },
  {
    id: "event-6",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
    title: "Workshop: Moderne Geldtheorie für Einsteiger",
    date: "10. März 2025",
    time: "10:00 - 16:00 Uhr",
    location: "Online via Zoom",
    locationType: "virtual",
    description: "Ganztägiger Workshop mit praktischen Übungen und Fallstudien zum Verständnis der MMT. Begrenzte Teilnehmerzahl.",
    eventType: "Livestream",
    rssSource: "RSS Feed"
  }
];

export function EventsSection({
  creatorName = "Maurice Ökonomius",
  events = defaultEvents,
  backgroundColor = 'white',
  onViewAllEvents
}: EventsSectionProps) {
  const bgColor = backgroundColor === 'beige' ? 'var(--color-gray-50)' : 'bg-white';

  return (
    <section className={`py-16 px-8 ${bgColor}`}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-[var(--charcoal)] mb-4 text-[48px] leading-tight">
            Veranstaltungen & Termine
          </h2>
          <p className="text-gray-600 max-w-3xl leading-relaxed">
            Lesungen, Live-Episoden, Panels & mehr – automatisch aus dem RSS-Feed von {creatorName}.
          </p>
        </div>

        {/* Events Grid - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
          {events.map((event) => (
            <EventCard
              key={event.id}
              id={event.id}
              image={event.image}
              title={event.title}
              date={event.date}
              time={event.time}
              location={event.location}
              locationType={event.locationType}
              description={event.description}
              eventType={event.eventType}
              rssSource={event.rssSource}
            />
          ))}
        </div>

        {/* View All Events Button */}
        {onViewAllEvents && (
          <div className="text-center">
            <Button
              onClick={onViewAllEvents}
              className="bg-[var(--charcoal)] text-white hover:bg-[#D6A847] px-8 py-6 text-lg"
            >
              Alle Veranstaltungen anzeigen
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}