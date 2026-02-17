import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Globe, Instagram, ExternalLink, Loader2, Flag, Podcast, BookOpen, Star, CalendarDays } from 'lucide-react';
import { SiYoutube, SiTiktok } from 'react-icons/si';
import { apiRequest } from '@/lib/queryClient';
import { useSafeNavigate } from '../utils/routing';
import { CreatorCarousel } from '../components/creator/CreatorCarousel';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Text } from '@/components/ui/typography';
import { LikeButton } from '../components/favorites/LikeButton';

type ProfileTab = 'kurationen' | 'rezensionen' | 'bewertungen' | 'veranstaltungen' | 'buchclub';

interface BookstoreProfile {
  id: number;
  display_name: string;
  slug: string;
  tagline?: string;
  description?: string;
  avatar_url?: string;
  address?: string;
  is_physical_store?: boolean;
  is_author?: boolean;
  show_buchclub?: boolean;
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

export function PublicBookstore({ overrideSlug }: { overrideSlug?: string } = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = overrideSlug || paramSlug;
  const navigate = useSafeNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('kurationen');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery<{ ok: boolean; data: BookstoreData }>({
    queryKey: [`/api/bookstore/${slug}`],
    enabled: !!slug,
  });

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

  return (
    <>
      <Header isHomePage={false} />

      <main id="main-content">
        {/* Breadcrumbs */}
        <Breadcrumb items={[
          { label: 'Startseite', href: '/' },
          { label: 'Kurator:innen', href: '/curators' },
          { label: profile.display_name },
        ]} />

        {/* Profile Hero Section - left-aligned avatar layout like CreatorHeader */}
        <section
          className="py-8 md:py-10 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto"
          data-testid="hero-section"
        >
          <div className="flex items-start gap-4 md:gap-6">
            {/* Avatar with blue ring - matching CreatorHeader style */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 ring-cerulean ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                {profile.avatar_url ? (
                  <ImageWithFallback
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-cerulean/10 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl font-headline text-cerulean">
                      {profile.display_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Name, Tagline, Description, Social Links */}
            <div className="min-w-0 flex-1">
              <h1
                className="kuratorname text-cerulean mb-1"
                data-testid="text-display-name"
              >
                {profile.display_name}
              </h1>

              {profile.tagline && (
                <Text as="p" variant="small" className="font-semibold text-gray-500 mb-2" data-testid="text-tagline">
                  {profile.tagline}
                </Text>
              )}

              {profile.description && (
                <Text as="p" variant="base" className="text-foreground leading-relaxed mb-3 max-w-2xl" data-testid="text-description">
                  {profile.description}
                </Text>
              )}

              {/* Social Media Links */}
              {(socialLinks.website || socialLinks.instagram || socialLinks.youtube || socialLinks.tiktok || socialLinks.twitter || socialLinks.podcast) && (
                <div className="flex items-center gap-3 flex-wrap" data-testid="social-links">
                  {socialLinks.website && (
                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" data-testid="link-social-website" className="text-muted-foreground hover:text-cerulean transition-colors">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-instagram" className="text-muted-foreground hover:text-cerulean transition-colors">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/${socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-youtube" className="text-muted-foreground hover:text-cerulean transition-colors">
                      <SiYoutube className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.tiktok && (
                    <a href={socialLinks.tiktok.startsWith('http') ? socialLinks.tiktok : `https://tiktok.com/@${socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-tiktok" className="text-muted-foreground hover:text-cerulean transition-colors">
                      <SiTiktok className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.podcast && (
                    <a href={socialLinks.podcast} target="_blank" rel="noopener noreferrer" data-testid="link-social-podcast" className="text-muted-foreground hover:text-cerulean transition-colors">
                      <Podcast className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" data-testid="link-social-twitter" className="text-muted-foreground hover:text-cerulean transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}

              {/* Physical Store Address */}
              {profile.is_physical_store && profile.address && (
                <div className="flex items-center gap-1.5 text-muted-foreground mt-2" data-testid="text-address">
                  <MapPin className="w-4 h-4" />
                  <Text as="span" variant="small">{profile.address}</Text>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Profile Tabs */}
        <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 border-b border-border" data-testid="profile-tabs">
          <div className="flex gap-2 flex-wrap justify-center">
            {([
              { id: 'kurationen' as ProfileTab, label: 'Kurationen' },
              { id: 'rezensionen' as ProfileTab, label: 'Rezensionen' },
              { id: 'bewertungen' as ProfileTab, label: 'Bewertungen' },
              { id: 'veranstaltungen' as ProfileTab, label: 'Veranstaltungen' },
              ...(profile.is_author && profile.show_buchclub
                ? [{ id: 'buchclub' as ProfileTab, label: 'Buchclub' }]
                : []),
            ]).map((tab) => (
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
            <div className="text-center py-16">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <Text as="p" variant="base" className="text-muted-foreground">
                Noch keine Veranstaltungen vorhanden.
              </Text>
            </div>
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
      </main>

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
