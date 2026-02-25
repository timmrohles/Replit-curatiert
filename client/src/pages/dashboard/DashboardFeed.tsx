import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/use-auth';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../components/dashboard/DashboardEmptyState';
import { useFavorites, type FavoriteItem } from '../../components/favorites/FavoritesContext';
import { BookCarouselItem, type BookCarouselItemData } from '../../components/book/BookCarouselItem';
import { CarouselContainer } from '../../components/carousel/CarouselContainer';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Text } from '../../components/ui/typography';
import {
  Loader2,
  BookOpen,
  Heart,
  Bookmark,
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useSafeNavigate } from '../../utils/routing';

const API_BASE = '/api';

interface UserCuration {
  id: number;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
}

interface SavedCuration {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  liked_at?: string;
  bookmarked_at?: string;
  interaction_type: 'liked' | 'bookmarked';
}

interface UserEvent {
  id: number;
  title: string;
  event_type: string;
  location_type: string;
  location_name: string | null;
  event_date: string;
  participant_count: number;
  background_image_url: string | null;
  is_published: boolean;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function FeedSection({ title, icon: Icon, children, actionLabel, onAction }: {
  title: string;
  icon: typeof BookOpen;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#247ba0]" />
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-1 text-xs text-[#247ba0] hover:underline"
            data-testid={`feed-action-${title.toLowerCase().replace(/\s/g, '-')}`}
          >
            {actionLabel}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export function DashboardFeed() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const navigate = useSafeNavigate();
  const userId = authUser?.id || '';
  const { favorites, isLoading: favsLoading } = useFavorites();

  const [curations, setCurations] = useState<UserCuration[]>([]);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [latestBooks, setLatestBooks] = useState<BookCarouselItemData[]>([]);
  const [likedCurations, setLikedCurations] = useState<SavedCuration[]>([]);
  const [bookmarkedCurations, setBookmarkedCurations] = useState<SavedCuration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeedData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [curationsRes, eventsRes, booksRes, savedRes] = await Promise.all([
        fetch(`${API_BASE}/user-curations?userId=${encodeURIComponent(userId)}`).then(r => r.json()).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/user-events?userId=${encodeURIComponent(userId)}`).then(r => r.json()).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/books?limit=12&sort=newest`).then(r => r.json()).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/me/saved-curations`, { credentials: 'include' }).then(r => r.json()).catch(() => ({ ok: false })),
      ]);
      if (curationsRes.ok) setCurations(curationsRes.data || []);
      if (eventsRes.ok) setEvents(eventsRes.data || []);
      if (booksRes.ok) setLatestBooks(booksRes.data || []);
      if (savedRes.ok) {
        setLikedCurations(savedRes.liked || []);
        setBookmarkedCurations(savedRes.bookmarked || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFeedData();
  }, [loadFeedData]);

  const bookFavorites = favorites.filter(f => f.type === 'book');
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const publishedCurations = curations.filter(c => c.is_published);

  const hasContent = bookFavorites.length > 0 || publishedCurations.length > 0 || upcomingEvents.length > 0 || latestBooks.length > 0 || likedCurations.length > 0 || bookmarkedCurations.length > 0;

  if (isLoading || favsLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title={t('dashboardPages.feedTitle', 'Mein Feed')}
          description={t('dashboardPages.feedDesc', 'Dein persönlicher Überblick über Bücher, Kurationen und Veranstaltungen.')}
        />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={t('dashboardPages.feedTitle', 'Mein Feed')}
        description={t('dashboardPages.feedDesc', 'Dein persönlicher Überblick über Bücher, Kurationen und Veranstaltungen.')}
      />

      {!hasContent ? (
        <DashboardEmptyState
          icon={Sparkles}
          title={t('dashboardPages.emptyFeedTitle', 'Dein Feed ist noch leer')}
          description={t('dashboardPages.emptyFeedDesc', 'Folge Kurator:innen, merke dir Bücher und erstelle Kurationen — dein Feed füllt sich automatisch mit relevanten Inhalten.')}
          action={{
            label: t('dashboardPages.exploreBooksAction', 'Bücher entdecken'),
            onClick: () => navigate('/buecher'),
          }}
        />
      ) : (
        <>
          {latestBooks.length > 0 && (
            <FeedSection
              title={t('dashboardPages.feedNewBooks', 'Neueste Bücher')}
              icon={BookOpen}
              actionLabel={t('dashboardPages.feedShowAll', 'Alle anzeigen')}
              onAction={() => navigate('/buecher')}
            >
              <CarouselContainer>
                <div className="flex gap-4">
                  {latestBooks.slice(0, 8).map(book => (
                    <div key={book.id} className="flex-shrink-0 w-[220px]">
                      <BookCarouselItem book={book} />
                    </div>
                  ))}
                </div>
              </CarouselContainer>
            </FeedSection>
          )}

          {bookFavorites.length > 0 && (
            <FeedSection
              title={t('dashboardPages.feedFavorites', 'Meine Favoriten')}
              icon={Heart}
              actionLabel={t('dashboardPages.feedManage', 'Verwalten')}
              onAction={() => navigate('/dashboard/follower')}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {bookFavorites.slice(0, 8).map(fav => (
                  <div key={fav.id} className="rounded-lg border bg-card p-3 flex gap-3 items-start" data-testid={`feed-fav-${fav.id}`}>
                    {fav.image && (
                      <ImageWithFallback
                        src={fav.image}
                        alt={fav.title}
                        className="w-12 h-16 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <Text variant="xs" className="font-medium text-foreground line-clamp-2">{fav.title}</Text>
                      {fav.subtitle && <Text variant="xs" className="text-muted-foreground line-clamp-1">{fav.subtitle}</Text>}
                    </div>
                  </div>
                ))}
              </div>
            </FeedSection>
          )}

          {publishedCurations.length > 0 && (
            <FeedSection
              title={t('dashboardPages.feedMyCurations', 'Meine Kurationen')}
              icon={BookOpen}
              actionLabel={t('dashboardPages.feedManage', 'Verwalten')}
              onAction={() => navigate('/dashboard/kurationen')}
            >
              <div className="space-y-2">
                {publishedCurations.slice(0, 5).map(cur => (
                  <button
                    key={cur.id}
                    onClick={() => navigate('/dashboard/kurationen')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card text-left hover:border-[#247ba0]/30 transition-colors"
                    data-testid={`feed-curation-${cur.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#247ba0]/10">
                      <BookOpen className="w-5 h-5 text-[#247ba0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text variant="small" className="font-medium text-foreground truncate">{cur.title}</Text>
                      {cur.description && <Text variant="xs" className="text-muted-foreground truncate">{cur.description}</Text>}
                    </div>
                    <Text variant="xs" className="text-muted-foreground flex-shrink-0">{formatDate(cur.created_at)}</Text>
                  </button>
                ))}
              </div>
            </FeedSection>
          )}

          {upcomingEvents.length > 0 && (
            <FeedSection
              title={t('dashboardPages.feedUpcomingEvents', 'Kommende Veranstaltungen')}
              icon={Calendar}
              actionLabel={t('dashboardPages.feedManage', 'Verwalten')}
              onAction={() => navigate('/dashboard/veranstaltungen')}
            >
              <div className="space-y-2">
                {upcomingEvents.slice(0, 4).map(event => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    data-testid={`feed-event-${event.id}`}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-500/10">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text variant="small" className="font-medium text-foreground">{event.title}</Text>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(event.event_date)}
                        </span>
                        {event.location_name && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {event.location_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {event.participant_count} Teilnehmer
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FeedSection>
          )}
        </>
      )}
    </div>
  );
}
