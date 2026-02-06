import { memo, useState } from "react";
import { MapPin, Video, Calendar, Clock, ChevronDown, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Text } from "../ui/typography";
import { LikeButton } from "../favorites/LikeButton";
import { DSButton } from "../design-system/DSButton";

// ONIX 3.0 Event Type Codes (Code List 231)
type ONIXEventType = "01" | "02" | "03" | "04";

// User-facing Event Types
type EventTypeLabel = 
  | "Buchsignierung"
  | "Lesung" 
  | "Podcast Live-Episode" 
  | "Livestream" 
  | "Panel" 
  | "Buchveröffentlichung"
  | "Workshop"
  | "Diskussion"
  | "Seminar";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  locationType: "physical" | "virtual";
  description: string;
  eventType: EventTypeLabel;
  rssSource?: string;
  curatorName?: string;
  curatorImage?: string;
  curatorSlug?: string;
  curatorFocus?: string;
  // ONIX 3.0: <WebsiteLink> - URL to join virtual event
  websiteLink?: string;
}

export const EventCard = memo(function EventCard({
  id,
  title,
  date,
  time,
  location,
  locationType,
  description,
  eventType,
  rssSource = "RSS Feed",
  curatorName,
  curatorImage,
  curatorSlug,
  curatorFocus,
  websiteLink
}: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowExpandButton = description.length > 200;

  return (
    <article 
      className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-white/40 w-[380px] h-full flex flex-col"
      aria-labelledby={`event-title-${id}`}
    >
      {/* Event Type Badge - oben */}
      <div className="mb-4">
        <span 
          className="inline-block px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: 'var(--color-coral)',
            color: 'white'
          }}
        >
          {eventType}
        </span>
      </div>

      {/* Curator Avatar & Name - wie SeriesPage */}
      {curatorName && curatorImage && (
        <div className="mb-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-blue ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                <ImageWithFallback
                  src={curatorImage}
                  alt={`${curatorName} Profilbild`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 self-center">
              <div className="inline-flex items-center gap-1.5">
                {curatorSlug ? (
                  <a 
                    href={`/autoren/${curatorSlug}/`}
                    className="kuratorname text-blue inline-block hover:opacity-80 transition-opacity"
                  >
                    {curatorName}
                  </a>
                ) : (
                  <span className="kuratorname text-blue inline-block">
                    {curatorName}
                  </span>
                )}
              </div>

              {/* Kurator-Fokus unter dem Namen (ONIX MainSubject) */}
              {curatorFocus && (
                <Text 
                  as="span"
                  variant="xs" 
                  className="text-foreground-muted block mt-0.5"
                >
                  {curatorFocus}
                </Text>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Title */}
      <h3 
        id={`event-title-${id}`}
        className="text-xl font-bold mb-3 line-clamp-2"
        style={{
          fontFamily: 'var(--font-family-headline)',
          color: 'var(--charcoal)'
        }}
      >
        {title}
      </h3>

      {/* Event Description mit Expand-Funktionalität */}
      <div className="mb-4 flex-1">
        <Text 
          variant="body" 
          className={`text-gray-600 ${!isExpanded && shouldShowExpandButton ? 'line-clamp-2' : ''}`}
        >
          {description}
        </Text>
        
        {shouldShowExpandButton && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="expand-btn"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Beschreibung verkürzen' : 'Vollständige Beschreibung anzeigen'}
          >
            {isExpanded ? 'Weniger anzeigen' : 'Weiterlesen'}
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              aria-hidden="true" 
            />
          </button>
        )}
      </div>

      {/* Event Details */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
          <span>{time}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {locationType === "virtual" ? (
            <>
              <Video className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
              <span>{location}</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
              <span>{location}</span>
            </>
          )}
        </div>
      </div>

      {/* Website-Link Button (falls vorhanden) */}
      {websiteLink && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-center">
          <DSButton
            variant="primary"
            size="medium"
            iconRight={ExternalLink}
            onClick={() => window.open(websiteLink, '_blank', 'noopener,noreferrer')}
            aria-label={`Zur Event-Website öffnen: ${title}`}
          >
            Zur Event-Website
          </DSButton>
        </div>
      )}
    </article>
  );
});