import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Globe, Instagram, ExternalLink, Loader2, Flag, Podcast, BookOpen, Star, CalendarDays, Clock, Video, Users, Download, Share2 } from 'lucide-react';
import { SiYoutube, SiTiktok } from 'react-icons/si';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useSafeNavigate } from '../utils/routing';
import { CreatorCarousel } from '../components/creator/CreatorCarousel';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Text } from '@/components/ui/typography';
import { LikeButton } from '../components/favorites/LikeButton';

type ProfileTab = 'kurationen' | 'rezensionen' | 'bewertungen' | 'veranstaltungen' | 'buchclub' | 'podcast';

interface BookstoreProfile {
  id: number;
  display_name: string;
  slug: string;
  tagline?: string;
  description?: string;
  avatar_url?: string;
  hero_image_url?: string;
  address?: string;
  bio?: string;
  is_physical_store?: boolean;
  is_author?: boolean;
  show_buchclub?: boolean;
  visible_tabs?: Record<string, boolean>;
  social_links?: {
    website?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
    podcast?: string;
  };
}

interface CurationBook {
  id: number | string;
  title: string;
  cover_url?: string;
  contributor_name?: string;
  klappentext?: string;
  isbn13?: string;
  description?: string;
  short_description?: string;
  price?: string;
  publisher?: string;
  publication_year?: string;
  onix_tag_ids?: string[];
  follow_count?: number;
  award_count?: number;
  nomination_count?: number;
  is_indie?: boolean;
  indie_type?: string | null;
  is_hidden_gem?: boolean;
}

interface Curation {
  id: number;
  title: string;
  description?: string;
  tags?: string[];
  books: CurationBook[];
}

interface BookstoreData {
  profile: BookstoreProfile;
  curations: Curation[];
}

function mapBooksForCarousel(books: CurationBook[]) {
  return books.map(book => ({
    id: String(book.id),
    cover: book.cover_url || '',
    title: book.title || '',
    author: book.contributor_name || '',
    price: book.price || '',
    isbn: book.isbn13 || undefined,
    klappentext: book.klappentext || book.description || undefined,
    shortDescription: book.short_description || undefined,
    publisher: book.publisher || undefined,
    year: book.publication_year || undefined,
    onixTagIds: book.onix_tag_ids || undefined,
    followCount: book.follow_count || 0,
    awards: book.award_count || 0,
    award_count: book.award_count || 0,
    shortlists: book.nomination_count || 0,
    longlists: 0,
    nomination_count: book.nomination_count || 0,
    releaseDate: book.publication_year || undefined,
    tags: book.is_indie ? ['indie'] : undefined,
    is_indie: book.is_indie || false,
    indie_type: book.indie_type || null,
    is_hidden_gem: book.is_hidden_gem || false,
  }));
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  lesung: 'Lesung', buchclub: 'Buchclub', workshop: 'Workshop',
  signierstunde: 'Signierstunde', diskussion: 'Podiumsdiskussion',
  messe: 'Messe / Festival', vortrag: 'Vortrag', sonstiges: 'Sonstiges'
};

function PublicEventCard({ event, profileName }: { event: any; profileName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localParticipantCount, setLocalParticipantCount] = useState(parseInt(event.participant_count) || 0);
  const eventDate = new Date(event.event_date);
  const isFull = event.max_participants ? localParticipantCount >= event.max_participants : false;
  const entryFee = parseFloat(String(event.entry_fee || 0));

  const userId = 'demo-user-123';

  useEffect(() => {
    fetch(`/api/user-events/${event.id}/booking-status?userId=${userId}`)
      .then(r => r.json())
      .then(data => { if (data.booked) setBooked(true); })
      .catch(() => {});
  }, [event.id]);

  const handleParticipate = async () => {
    setLoading(true);
    try {
      if (booked) {
        const res = await fetch(`/api/user-events/${event.id}/book?userId=${userId}`, { method: 'DELETE' });
        if (res.ok) {
          setBooked(false);
          setLocalParticipantCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const res = await fetch(`/api/user-events/${event.id}/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, displayName: 'Demo User' }),
        });
        const data = await res.json();
        if (data.ok) {
          setBooked(true);
          setLocalParticipantCount(prev => prev + 1);
        } else if (data.error) {
          console.warn('Booking failed:', data.error);
        }
      }
    } catch (err) {
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col h-full border border-border bg-card"
      data-testid={`public-event-card-${event.id}`}
    >
      <div
        className="h-40 w-full relative flex items-end"
        style={{
          background: event.background_image_url
            ? `url(${event.background_image_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #247ba0 0%, #1a5c78 50%, #0f3d52 100%)',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        <div className="relative z-10 p-3 w-full flex items-end justify-between gap-2">
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', backdropFilter: 'blur(4px)' }}
          >
            {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
          </span>
          {entryFee > 0 ? (
            <span className="text-xs font-semibold text-white">
              {entryFee.toFixed(2).replace('.', ',')} {event.entry_fee_currency || 'EUR'}
            </span>
          ) : (
            <span className="text-xs font-semibold" style={{ color: '#86efac' }}>Kostenlos</span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3
          className="font-semibold text-foreground text-base leading-tight line-clamp-2"
          style={{ fontFamily: 'Fjalla One' }}
          data-testid={`text-event-title-${event.id}`}
        >
          {event.title}
        </h3>
        <Text as="span" variant="small" className="text-muted-foreground font-medium">
          {profileName}
        </Text>

        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
            {eventDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            {eventDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
            {event.event_end_date && ` – ${new Date(event.event_end_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`}
          </div>
          {event.location_name && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{event.location_name}</span>
            </div>
          )}
          {(event.location_type === 'digital' || event.location_type === 'hybrid') && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Video className="w-3.5 h-3.5 flex-shrink-0" />
              {event.location_type === 'digital' ? 'Online-Veranstaltung' : 'Hybrid (Vor Ort + Online)'}
            </div>
          )}
          {event.max_participants && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              {localParticipantCount}/{event.max_participants} Plätze belegt
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-1">
            <Text
              as="p"
              variant="small"
              className={`text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}
            >
              {event.description}
            </Text>
            {event.description.length > 80 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold mt-0.5"
                style={{ color: '#247ba0' }}
                data-testid={`button-expand-event-${event.id}`}
              >
                {expanded ? 'weniger' : 'mehr lesen'}
              </button>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            {event.event_page_url && (
              <a
                href={event.event_page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: '#247ba0' }}
                data-testid={`event-page-link-${event.id}`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Veranstaltungsseite
              </a>
            )}
            {event.video_link && event.video_link_public && (
              <a
                href={event.video_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: '#247ba0' }}
                data-testid={`event-video-link-${event.id}`}
              >
                <Video className="w-3.5 h-3.5" />
                Beitreten
              </a>
            )}
            <a
              href={`/api/user-events/${event.id}/ics`}
              download
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`event-ics-${event.id}`}
            >
              <Download className="w-3.5 h-3.5" />
              Kalender
            </a>
          </div>
          <button
            onClick={handleParticipate}
            className="text-xs px-3 py-1.5 rounded-md font-semibold transition-colors"
            style={{
              backgroundColor: loading ? '#D1D5DB' : booked ? '#16a34a' : (isFull ? '#E5E7EB' : '#247ba0'),
              color: loading ? '#9CA3AF' : (isFull && !booked ? '#9CA3AF' : '#FFFFFF'),
            }}
            disabled={loading || (isFull && !booked)}
            data-testid={`button-participate-${event.id}`}
          >
            {loading ? '...' : booked ? 'Angemeldet' : (isFull ? 'Ausgebucht' : 'Teilnehmen')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PublicBookstore({ overrideSlug }: { overrideSlug?: string } = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = overrideSlug || paramSlug;
  const navigate = useSafeNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('kurationen');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: profile?.display_name || '', url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link kopiert', description: 'Der Link wurde in die Zwischenablage kopiert.' });
      } catch {
        toast({ title: 'Teilen nicht möglich', description: 'Bitte kopiere den Link manuell aus der Adresszeile.', variant: 'destructive' });
      }
    }
  };

  const { data, isLoading, error } = useQuery<{ ok: boolean; data: BookstoreData }>({
    queryKey: [`/api/bookstore/${slug}`],
    enabled: !!slug,
  });

  const { data: eventsData } = useQuery<{ ok: boolean; data: any[] }>({
    queryKey: ['/api/bookstore', slug, 'events'],
    queryFn: async () => {
      const res = await fetch(`/api/bookstore/${slug}/events`);
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: contentBooksData } = useQuery<{ ok: boolean; data: any[] }>({
    queryKey: ['/api/public/content-books', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/content-books/${slug}`);
      return res.json();
    },
    enabled: !!slug,
  });

  const contentBooks = contentBooksData?.data || [];
  const hasContentBooks = contentBooks.length > 0;
  const groupedByEpisode = contentBooks.reduce((acc: Record<string, { episodeTitle: string; episodeNumber: string | null; episodeDate: string | null; episodeUrl: string | null; sourceTitle: string | null; sourceImage: string | null; books: any[] }>, book: any) => {
    const key = `${book.episode_id}`;
    if (!acc[key]) {
      acc[key] = {
        episodeTitle: book.episode_title,
        episodeNumber: book.episode_number,
        episodeDate: book.episode_date,
        episodeUrl: book.episode_url,
        sourceTitle: book.source_title,
        sourceImage: book.source_image,
        books: [],
      };
    }
    acc[key].books.push(book);
    return acc;
  }, {} as Record<string, any>);

  const profile = data?.data?.profile;
  const curations = data?.data?.curations || [];
  const socialLinks = profile?.social_links || {};

  const handleReportSubmit = async () => {
    if (!reportReason || !profile) return;
    setReportSubmitting(true);
    try {
      await apiRequest('POST', '/api/content-reports', {
        contentType: 'bookstore',
        contentId: profile.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportOpen(false);
      setReportReason('');
      setReportDetails('');
    } catch {
    } finally {
      setReportSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header isHomePage={false} />
        <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-spinner">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Header isHomePage={false} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6" data-testid="error-not-found">
          <h1 className="text-2xl font-headline text-[#3A3A3A] dark:text-foreground">Bookstore nicht gefunden</h1>
          <p className="text-muted-foreground">Der gewünschte Bookstore existiert nicht oder wurde entfernt.</p>
          <Link to="/" className="text-cerulean hover:underline" data-testid="link-back-home">
            Zurück zur Startseite
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const hasHeroImage = !!profile.hero_image_url;

  return (
    <>
      {hasHeroImage ? (
        <div className="relative w-full" data-testid="hero-banner-wrapper">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${profile.hero_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            data-testid="hero-bg-image"
          />
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.75) 100%)',
            }}
          />

          <div className="relative z-10">
            <Header isHomePage={false} />

            <main id="main-content">
              <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-2" aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-sm flex-wrap">
                  <li>
                    <a href="/" className="text-white/70 hover:text-white transition-colors">Startseite</a>
                  </li>
                  <li className="text-white/40">/</li>
                  <li>
                    <a href="/curators" className="text-white/70 hover:text-white transition-colors">Kurator:innen</a>
                  </li>
                  <li className="text-white/40">/</li>
                  <li className="text-white font-medium">{profile.display_name}</li>
                </ol>
              </nav>

              <section
                className="py-10 md:py-14 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto"
                data-testid="hero-section"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <div className="flex items-center gap-5 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden ring-2 ring-cerulean ring-offset-2 ring-offset-transparent shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        {profile.avatar_url ? (
                          <ImageWithFallback
                            src={profile.avatar_url}
                            alt={profile.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                            <span className="text-5xl md:text-6xl font-headline text-white">
                              {profile.display_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h1
                        className="text-2xl md:text-3xl font-headline text-white mb-1"
                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                        data-testid="text-display-name"
                      >
                        {profile.display_name}
                      </h1>

                      {profile.tagline && (
                        <p className="text-base font-semibold text-white/80" data-testid="text-tagline">
                          {profile.tagline}
                        </p>
                      )}

                      {profile.is_physical_store && profile.address && (
                        <div className="flex items-center gap-2 text-white/70 mt-2" data-testid="text-address">
                          <MapPin className="w-5 h-5" />
                          <span className="text-base">{profile.address}</span>
                        </div>
                      )}

                      {(socialLinks.website || socialLinks.instagram || socialLinks.youtube || socialLinks.tiktok || socialLinks.twitter || socialLinks.podcast) && (
                        <div className="flex items-center gap-3 flex-wrap mt-3" data-testid="social-links">
                          {socialLinks.website && (
                            <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" data-testid="link-social-website" className="text-white/70 hover:text-white transition-colors">
                              <Globe className="w-6 h-6" />
                            </a>
                          )}
                          {socialLinks.instagram && (
                            <a href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-instagram" className="text-white/70 hover:text-white transition-colors">
                              <Instagram className="w-6 h-6" />
                            </a>
                          )}
                          {socialLinks.youtube && (
                            <a href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-youtube" className="text-white/70 hover:text-white transition-colors">
                              <SiYoutube className="w-6 h-6" />
                            </a>
                          )}
                          {socialLinks.tiktok && (
                            <a href={socialLinks.tiktok.startsWith('http') ? socialLinks.tiktok : `https://tiktok.com/@${socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-tiktok" className="text-white/70 hover:text-white transition-colors">
                              <SiTiktok className="w-6 h-6" />
                            </a>
                          )}
                          {socialLinks.podcast && (
                            <a href={socialLinks.podcast} target="_blank" rel="noopener noreferrer" data-testid="link-social-podcast" className="text-white/70 hover:text-white transition-colors">
                              <Podcast className="w-6 h-6" />
                            </a>
                          )}
                          {socialLinks.twitter && (
                            <a href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-twitter" className="text-white/70 hover:text-white transition-colors">
                              <ExternalLink className="w-6 h-6" />
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap mt-3" data-testid="action-buttons">
                        <LikeButton
                          entityId={`storefront-${profile.slug}`}
                          entityType="storefront"
                          entityTitle={profile.display_name}
                          entityImage={profile.avatar_url}
                          variant="social"
                          iconColor="#ffffff"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-white/40 text-white bg-white/10 backdrop-blur-sm"
                          onClick={handleShare}
                          data-testid="button-share"
                        >
                          <Share2 className="w-4 h-4 mr-1.5" />
                          Teilen
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    {(profile.bio || profile.description) && (
                      <p className="text-base text-white/90 leading-relaxed" data-testid="text-description">
                        {profile.bio || profile.description}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8" data-testid="profile-tabs" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="flex gap-2 flex-wrap justify-center">
                  {([
                    { id: 'kurationen' as ProfileTab, label: 'Kurationen' },
                    ...(hasContentBooks ? [{ id: 'podcast' as ProfileTab, label: 'Podcast-Bücher' }] : []),
                    { id: 'rezensionen' as ProfileTab, label: 'Rezensionen' },
                    { id: 'bewertungen' as ProfileTab, label: 'Bewertungen' },
                    { id: 'veranstaltungen' as ProfileTab, label: 'Veranstaltungen' },
                    { id: 'buchclub' as ProfileTab, label: 'Buchclub' },
                  ]).filter((tab) => {
                    const vt = profile.visible_tabs;
                    if (!vt || Object.keys(vt).length === 0) {
                      if (tab.id === 'buchclub') return profile.is_author && profile.show_buchclub;
                      if (tab.id === 'veranstaltungen') return true;
                      return true;
                    }
                    return vt[tab.id] === true;
                  }).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-5 md:px-8 py-3.5 text-base font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'text-white'
                          : 'text-white/60'
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
                      )}
                    </button>
                  ))}
                </div>
              </nav>
            </main>
          </div>
        </div>
      ) : (
        <>
          <Header isHomePage={false} />
          <Breadcrumb items={[
            { label: 'Startseite', href: '/' },
            { label: 'Kurator:innen', href: '/curators' },
            { label: profile.display_name },
          ]} />

          <section
            className="py-10 md:py-14 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto"
            data-testid="hero-section"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="flex items-center gap-5 md:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden ring-2 ring-cerulean ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                    {profile.avatar_url ? (
                      <ImageWithFallback
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-cerulean/10 flex items-center justify-center">
                        <span className="text-5xl md:text-6xl font-headline text-cerulean">
                          {profile.display_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h1
                    className="text-2xl md:text-3xl font-headline text-cerulean mb-1"
                    data-testid="text-display-name"
                  >
                    {profile.display_name}
                  </h1>

                  {profile.tagline && (
                    <Text as="p" variant="base" className="font-semibold text-gray-500" data-testid="text-tagline">
                      {profile.tagline}
                    </Text>
                  )}

                  {profile.is_physical_store && profile.address && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-2" data-testid="text-address">
                      <MapPin className="w-5 h-5" />
                      <Text as="span" variant="base">{profile.address}</Text>
                    </div>
                  )}

                  {(socialLinks.website || socialLinks.instagram || socialLinks.youtube || socialLinks.tiktok || socialLinks.twitter || socialLinks.podcast) && (
                    <div className="flex items-center gap-3 flex-wrap mt-3" data-testid="social-links">
                      {socialLinks.website && (
                        <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" data-testid="link-social-website" className="text-muted-foreground hover:text-cerulean transition-colors">
                          <Globe className="w-6 h-6" />
                        </a>
                      )}
                      {socialLinks.instagram && (
                        <a href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-instagram" className="text-muted-foreground hover:text-cerulean transition-colors">
                          <Instagram className="w-6 h-6" />
                        </a>
                      )}
                      {socialLinks.youtube && (
                        <a href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-youtube" className="text-muted-foreground hover:text-cerulean transition-colors">
                          <SiYoutube className="w-6 h-6" />
                        </a>
                      )}
                      {socialLinks.tiktok && (
                        <a href={socialLinks.tiktok.startsWith('http') ? socialLinks.tiktok : `https://tiktok.com/@${socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-tiktok" className="text-muted-foreground hover:text-cerulean transition-colors">
                          <SiTiktok className="w-6 h-6" />
                        </a>
                      )}
                      {socialLinks.podcast && (
                        <a href={socialLinks.podcast} target="_blank" rel="noopener noreferrer" data-testid="link-social-podcast" className="text-muted-foreground hover:text-cerulean transition-colors">
                          <Podcast className="w-6 h-6" />
                        </a>
                      )}
                      {socialLinks.twitter && (
                        <a href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-twitter" className="text-muted-foreground hover:text-cerulean transition-colors">
                          <ExternalLink className="w-6 h-6" />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mt-3" data-testid="action-buttons">
                    <LikeButton
                      entityId={`storefront-${profile.slug}`}
                      entityType="storefront"
                      entityTitle={profile.display_name}
                      entityImage={profile.avatar_url}
                      variant="social"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={handleShare}
                      data-testid="button-share"
                    >
                      <Share2 className="w-4 h-4 mr-1.5" />
                      Teilen
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                {(profile.bio || profile.description) && (
                  <Text as="p" variant="base" className="text-foreground leading-relaxed" data-testid="text-description">
                    {profile.bio || profile.description}
                  </Text>
                )}
              </div>
            </div>
          </section>

          <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 border-b border-border" data-testid="profile-tabs">
            <div className="flex gap-2 flex-wrap justify-center">
              {([
                { id: 'kurationen' as ProfileTab, label: 'Kurationen' },
                { id: 'rezensionen' as ProfileTab, label: 'Rezensionen' },
                { id: 'bewertungen' as ProfileTab, label: 'Bewertungen' },
                { id: 'veranstaltungen' as ProfileTab, label: 'Veranstaltungen' },
                { id: 'buchclub' as ProfileTab, label: 'Buchclub' },
              ]).filter((tab) => {
                const vt = profile.visible_tabs;
                if (!vt || Object.keys(vt).length === 0) {
                  if (tab.id === 'buchclub') return profile.is_author && profile.show_buchclub;
                  if (tab.id === 'veranstaltungen') return true;
                  return true;
                }
                return vt[tab.id] === true;
              }).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 md:px-8 py-3.5 text-base font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-cerulean'
                      : 'text-muted-foreground'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-cerulean" />
                  )}
                </button>
              ))}
            </div>
          </nav>
        </>
      )}

        {/* Tab Content */}
        {activeTab === 'kurationen' && (
          <section className="max-w-7xl mx-auto px-0 md:px-2 py-4" data-testid="curations-section">
            {curations.length === 0 ? (
              <div className="text-center py-16 px-6" data-testid="text-no-curations">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <Text as="p" variant="base" className="text-muted-foreground">
                  Noch keine Kurationen vorhanden.
                </Text>
              </div>
            ) : (
              curations.map((curation) => (
                <div key={curation.id} data-testid={`curation-${curation.id}`}>
                  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-2">
                    <h3 className="section-title text-foreground">{curation.title}</h3>
                    {curation.description && (
                      <Text as="p" variant="base" className="text-foreground/80 leading-relaxed mt-2 max-w-3xl">
                        {curation.description}
                      </Text>
                    )}
                    {curation.tags && curation.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {curation.tags.map((tag) => (
                          <div
                            key={tag}
                            role="group"
                            className="px-3 py-1.5 border border-transparent rounded-full inline-flex items-center gap-2 shadow-lg bg-coral cursor-pointer hover:scale-105 transition-all duration-200 select-none"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/tags/${tag.toLowerCase().replace(/\s+/g, '-')}/`); }}
                          >
                            <Text as="span" variant="small" className="text-white font-normal whitespace-nowrap">
                              {tag}
                            </Text>
                            <LikeButton
                              entityId={`tag-${tag.toLowerCase()}`}
                              entityType="tag"
                              entityTitle={tag}
                              variant="minimal"
                              size="sm"
                              iconColor="#ffffff"
                              backgroundColor="var(--vibrant-coral)"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <CreatorCarousel
                    creatorAvatar={profile.avatar_url || ''}
                    creatorName={profile.display_name}
                    creatorFocus={profile.tagline || ''}
                    occasion={curation.title}
                    curationReason={curation.description || ''}
                    showSocials={false}
                    creatorWebsiteUrl={profile.social_links?.website}
                    isVerified={false}
                    showHeader={false}
                    books={mapBooksForCarousel(curation.books)}
                    tags={curation.tags}
                    showCta={false}
                    backgroundColor="white"
                    useEditorialLayout={true}
                    showVideo={false}
                  />
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === 'rezensionen' && (
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4" data-testid="rezensionen-section">
            <div className="text-center py-16">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <Text as="p" variant="base" className="text-muted-foreground">
                Noch keine Rezensionen vorhanden.
              </Text>
            </div>
          </section>
        )}

        {activeTab === 'bewertungen' && (
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4" data-testid="bewertungen-section">
            <div className="text-center py-16">
              <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <Text as="p" variant="base" className="text-muted-foreground">
                Noch keine Bewertungen vorhanden.
              </Text>
            </div>
          </section>
        )}

        {activeTab === 'veranstaltungen' && (
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4" data-testid="veranstaltungen-section">
            {(!eventsData?.data || eventsData.data.length === 0) ? (
              <div className="text-center py-16">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <Text as="p" variant="base" className="text-muted-foreground">
                  Noch keine Veranstaltungen vorhanden.
                </Text>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsData.data.map((event: any) => (
                  <PublicEventCard key={event.id} event={event} profileName={profile.display_name} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'buchclub' && profile.is_author && profile.show_buchclub && (
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4" data-testid="buchclub-section">
            <div className="text-center py-16">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <Text as="p" variant="base" className="text-muted-foreground">
                Noch keine Buchclub-Inhalte vorhanden.
              </Text>
            </div>
          </section>
        )}

        {activeTab === 'podcast' && hasContentBooks && (
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6" data-testid="podcast-books-section">
            <div className="space-y-6">
              {Object.entries(groupedByEpisode).map(([episodeId, episode]: [string, any]) => (
                <div key={episodeId} className="rounded-lg border bg-card p-4 md:p-6" data-testid={`episode-card-${episodeId}`}>
                  <div className="flex items-start gap-3 mb-4">
                    {episode.sourceImage && (
                      <img src={episode.sourceImage} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Podcast className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        {episode.sourceTitle && (
                          <span className="text-xs text-muted-foreground">{episode.sourceTitle}</span>
                        )}
                        {episode.episodeNumber && (
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Folge {episode.episodeNumber}</span>
                        )}
                      </div>
                      <h3 className="font-headline text-base md:text-lg text-foreground leading-tight">
                        {episode.episodeUrl ? (
                          <a href={episode.episodeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cerulean transition-colors inline-flex items-center gap-1">
                            {episode.episodeTitle}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ) : episode.episodeTitle}
                      </h3>
                      {episode.episodeDate && (
                        <time className="text-xs text-muted-foreground mt-0.5 block">
                          {new Date(episode.episodeDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </time>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                    {episode.books.length} {episode.books.length === 1 ? 'besprochenes Buch' : 'besprochene Bücher'}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {episode.books.map((book: any) => {
                      const sentimentColors: Record<string, string> = {
                        very_positive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
                        positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                        neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
                        negative: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                        critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                      };
                      const sentimentLabels: Record<string, string> = {
                        very_positive: 'Begeistert',
                        positive: 'Positiv',
                        neutral: 'Erwähnt',
                        negative: 'Kritisch',
                        critical: 'Negativ',
                      };
                      return (
                        <div key={book.id} className="rounded-md border bg-background p-3 space-y-2" data-testid={`content-book-${book.id}`}>
                          <div>
                            <h4 className="font-medium text-sm text-foreground leading-tight">{book.title}</h4>
                            {book.author && <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${sentimentColors[book.sentiment] || sentimentColors.neutral}`}>
                              {sentimentLabels[book.sentiment] || 'Erwähnt'}
                            </span>
                            <span className="text-xs text-amber-500" title={`Empfehlung: ${book.recommendation_strength}/5`}>
                              {'★'.repeat(Math.min(book.recommendation_strength || 0, 5))}{'☆'.repeat(5 - Math.min(book.recommendation_strength || 0, 5))}
                            </span>
                          </div>
                          {book.host_quote && (
                            <blockquote className="text-xs italic text-muted-foreground border-l-2 border-muted pl-2">
                              &bdquo;{book.host_quote}&ldquo;
                            </blockquote>
                          )}
                          {book.context_note && (
                            <p className="text-xs text-muted-foreground">{book.context_note}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-gray-50 dark:bg-muted/30 py-6 px-6 text-center" data-testid="disclaimer-section">
          <p className="text-xs text-muted-foreground max-w-3xl mx-auto">
            Die hier gezeigten Empfehlungen und Inhalte spiegeln die persönliche Meinung des Bookstore-Betreibers wider und stellen keine redaktionelle Empfehlung von coratiert.de dar.
          </p>
        </section>

        <div className="py-4 text-center">
          <button
            onClick={() => setReportOpen(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            data-testid="button-report"
          >
            <Flag className="w-3 h-3" />
            Inhalt melden
          </button>
        </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent data-testid="dialog-report">
          <DialogHeader>
            <DialogTitle>Inhalt melden</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger data-testid="select-report-reason">
                <SelectValue placeholder="Grund auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unangemessener Inhalt">Unangemessener Inhalt</SelectItem>
                <SelectItem value="Urheberrechtsverletzung">Urheberrechtsverletzung</SelectItem>
                <SelectItem value="Spam">Spam</SelectItem>
                <SelectItem value="Sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Weitere Details (optional)"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              data-testid="textarea-report-details"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)} data-testid="button-report-cancel">
              Abbrechen
            </Button>
            <Button
              onClick={handleReportSubmit}
              disabled={!reportReason || reportSubmitting}
              data-testid="button-report-submit"
            >
              {reportSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Absenden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
}

export default PublicBookstore;
