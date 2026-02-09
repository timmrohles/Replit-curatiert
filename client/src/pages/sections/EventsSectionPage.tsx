/**
 * ==================================================================
 * EVENTS SECTION - DETAIL PAGE
 * ==================================================================
 * 
 * Component: Inline in HomepageSections.tsx
 * Zweck: Literarische Events mit Filter-Funktionalität
 * Pattern: Horizontal Carousel mit Event Cards + Filter Chips
 * 
 * Used in: Homepage (alte Version)
 * 
 * ==================================================================
 */

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import { EventCard } from '../../components/events/EventCard';
import { SectionHeader } from '../../components/homepage/SectionHeader';

interface MockEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  locationType: 'Live' | 'Online';
  description: string;
  type: string;
  curatorName: string;
  curatorImage: string;
  curatorSlug: string;
  curatorFocus: string;
  registrationUrl: string;
}

export default function EventsSectionPage() {
  const [selectedEventType, setSelectedEventType] = useState<string>('Alle');
  const [selectedEventLocation, setSelectedEventLocation] = useState<string>('Alle');
  const eventsCarouselRef = useRef<HTMLDivElement>(null);

  // Mock Events Data
  const allEvents: MockEvent[] = [
    {
      id: 1,
      title: 'Lesung: Neue deutsche Gegenwartsliteratur',
      date: '2026-02-15',
      time: '19:00',
      location: 'Literaturhaus Berlin',
      locationType: 'Live',
      description: 'Eine Lesung mit ausgewählten Autor*innen der aktuellen Literaturszene',
      type: 'Lesung',
      curatorName: 'coratiert Redaktion',
      curatorImage: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400',
      curatorSlug: 'coratiert-redaktion',
      curatorFocus: 'Literarische Events',
      registrationUrl: 'https://example.com/register'
    },
    {
      id: 2,
      title: 'Panel: Diversität im Literaturbetrieb',
      date: '2026-02-20',
      time: '18:30',
      location: 'Online via Zoom',
      locationType: 'Online',
      description: 'Expert*innen diskutieren über Repräsentation und Vielfalt in der Verlagslandschaft',
      type: 'Panel',
      curatorName: 'Diversity Book Club',
      curatorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      curatorSlug: 'diversity-book-club',
      curatorFocus: 'Diverse Stimmen',
      registrationUrl: 'https://example.com/register'
    },
    {
      id: 3,
      title: 'Workshop: Kreatives Schreiben',
      date: '2026-02-25',
      time: '14:00',
      location: 'Schreibwerkstatt München',
      locationType: 'Live',
      description: 'Praktischer Workshop für Einsteiger*innen und Fortgeschrittene',
      type: 'Workshop',
      curatorName: 'Schreibraum Kollektiv',
      curatorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      curatorSlug: 'schreibraum-kollektiv',
      curatorFocus: 'Kreativität & Praxis',
      registrationUrl: 'https://example.com/register'
    },
    {
      id: 4,
      title: 'Diskussion: Klimakrise in der Literatur',
      date: '2026-03-05',
      time: '20:00',
      location: 'Online via YouTube',
      locationType: 'Online',
      description: 'Wie reflektiert zeitgenössische Literatur die Klimakrise?',
      type: 'Diskussion',
      curatorName: 'Öko-Literatur Initiative',
      curatorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      curatorSlug: 'oeko-literatur',
      curatorFocus: 'Nachhaltigkeit & Literatur',
      registrationUrl: 'https://example.com/register'
    },
    {
      id: 5,
      title: 'Livestream: Autorenlesung mit Q&A',
      date: '2026-03-10',
      time: '19:30',
      location: 'Instagram Live',
      locationType: 'Online',
      description: 'Exklusive Lesung mit anschließender Fragerunde',
      type: 'Livestream',
      curatorName: 'Social Reading Collective',
      curatorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      curatorSlug: 'social-reading',
      curatorFocus: 'Digitale Events',
      registrationUrl: 'https://example.com/register'
    },
    {
      id: 6,
      title: 'Podcast Live-Episode: Buchbesprechung',
      date: '2026-03-15',
      time: '21:00',
      location: 'Online via Discord',
      locationType: 'Online',
      description: 'Live-Aufnahme unserer beliebten Podcast-Episode',
      type: 'Podcast Live-Episode',
      curatorName: 'Literatur Podcast',
      curatorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      curatorSlug: 'literatur-podcast',
      curatorFocus: 'Audio-Formate',
      registrationUrl: 'https://example.com/register'
    }
  ];

  // Filter events
  const filteredEvents = allEvents.filter(event => {
    const matchesType = selectedEventType === 'Alle' || event.type === selectedEventType;
    const matchesLocation = selectedEventLocation === 'Alle' || event.locationType === selectedEventLocation;
    return matchesType && matchesLocation;
  });

  // Scroll function
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (eventsCarouselRef.current) {
      const scrollAmount = 400;
      eventsCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard/sections" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Zurück zur Library</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6" style={{ color: '#f25f5c' }} />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Fjalla One' }}>
                Events Section
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mt-2 ml-10">
            Literarische Events · Lesungen, Diskussionen, Workshops
          </p>
        </div>
      </div>

      {/* Documentation */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-coral/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-coral" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fjalla One' }}>
                Events Section
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Horizontaler Carousel mit Event Cards inkl. Filter-Funktionalität für Event-Typ und Location.
                Ideal für Lesungen, Workshops, Diskussionen und Online-Events.
              </p>
            </div>
          </div>

          {/* Component Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Component Path</h3>
              <code className="text-xs text-coral font-mono">
                Inline in /components/homepage/HomepageSections.tsx
              </code>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Related Component</h3>
              <code className="text-xs text-coral font-mono">
                /components/EventCard.tsx
              </code>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Type</h3>
              <span className="text-sm text-gray-900">Filtered Carousel Section</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Background</h3>
              <span className="text-sm text-gray-900">var(--color-background)</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Filter nach Event-Typ (Lesung, Workshop, etc.)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Filter nach Location (Online, Live)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Horizontal Scroll Carousel</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Navigation Arrows</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Curator Info auf Event Cards</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Registration Links</span>
              </div>
            </div>
          </div>

          {/* Usage Notes */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-cerulean rounded">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Usage Notes</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Filter-Chips sind interaktiv und highlighten aktive Filter</li>
              <li>• Event-Typen: Lesung, Workshop, Diskussion, Panel, Livestream, Podcast Live-Episode</li>
              <li>• Locations: Online (Zoom, YouTube, etc.) oder Live (physische Orte)</li>
              <li>• Snap-Scrolling für bessere UX auf Mobile</li>
            </ul>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-700">
            <h3 className="text-white font-semibold" style={{ fontFamily: 'Fjalla One' }}>
              Live Preview
            </h3>
          </div>
          
          {/* Events Section */}
          <section className="py-12 md:py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeader
                title="Literarische Events"
                subtitle="Lesungen, Diskussionen und Workshops"
              />
              
              {/* Event Filters */}
              <div className="flex flex-wrap gap-4 mb-8">
                {/* Event Type Filter Chips */}
                <div className="flex flex-wrap gap-2">
                  {['Alle', 'Lesung', 'Workshop', 'Diskussion', 'Panel', 'Livestream', 'Podcast Live-Episode'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedEventType(type)}
                      className="filter-chip-coral text-sm font-medium"
                      aria-pressed={selectedEventType === type}
                      aria-label={`Filter nach ${type}`}
                    >
                      {type === 'Alle' ? 'Alle Typen' : type}
                    </button>
                  ))}
                </div>

                {/* Location Type Filter Chips */}
                <div className="flex flex-wrap gap-2">
                  {['Alle', 'Online', 'Live'].map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => setSelectedEventLocation(location)}
                      className="filter-chip-coral text-sm font-medium"
                      aria-pressed={selectedEventLocation === location}
                      aria-label={`Filter nach ${location}`}
                    >
                      {location === 'Alle' ? 'Alle Orte' : location === 'Live' ? 'Vor Ort' : location}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events Carousel */}
              <div className="relative">
                <div
                  ref={eventsCarouselRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filteredEvents.map(event => (
                    <div key={event.id} className="snap-start shrink-0">
                      <EventCard {...event as any} />
                    </div>
                  ))}
                </div>

                {/* Scroll Arrows */}
                <button
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-background dark:bg-foreground shadow-lg flex items-center justify-center hover:bg-foreground hover:dark:bg-background transition-colors z-10"
                  aria-label="Vorherige Events"
                >
                  <ChevronLeft className="w-6 h-6 text-foreground dark:text-background" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-background dark:bg-foreground shadow-lg flex items-center justify-center hover:bg-foreground hover:dark:bg-background transition-colors z-10"
                  aria-label="Nächste Events"
                >
                  <ChevronRight className="w-6 h-6 text-foreground dark:text-background" />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Props Interface */}
        <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Fjalla One' }}>
            Data Structure
          </h3>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
{`interface Event {
  id: number;
  title: string;
  date: string;                    // ISO format: "2026-02-15"
  time: string;                    // "19:00"
  location: string;                // "Literaturhaus Berlin" or "Online via Zoom"
  locationType: 'Live' | 'Online'; // For filtering
  description: string;
  type: string;                    // "Lesung", "Workshop", "Panel", etc.
  curatorName: string;
  curatorImage: string;            // Avatar URL
  curatorSlug: string;             // For navigation
  curatorFocus: string;
  registrationUrl: string;         // External link
}`}
          </pre>
        </div>

        {/* Related Sections */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/sections/creator-carousel"
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-teal hover:shadow-lg transition-all"
          >
            <h4 className="font-semibold text-gray-900 mb-2">Creator Carousel</h4>
            <p className="text-sm text-gray-600">Carousel mit Curator Info</p>
          </Link>
          <Link
            to="/dashboard/sections/scroll"
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-teal hover:shadow-lg transition-all"
          >
            <h4 className="font-semibold text-gray-900 mb-2">Scroll Section</h4>
            <p className="text-sm text-gray-600">Generic scrolling container</p>
          </Link>
          <Link
            to="/dashboard/sections"
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-coral hover:shadow-lg transition-all"
          >
            <h4 className="font-semibold text-gray-900 mb-2">← Alle Sections</h4>
            <p className="text-sm text-gray-600">Zurück zur Übersicht</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
