import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Globe, Instagram, ExternalLink, Loader2, Flag } from 'lucide-react';
import { SiYoutube, SiTiktok } from 'react-icons/si';
import { apiRequest } from '@/lib/queryClient';
import { useSafeNavigate } from '../utils/routing';
import { Text } from '@/components/ui/typography';
import { EditorialBookCard } from '@/components/book/EditorialBookCard';

interface BookstoreProfile {
  id: number;
  display_name: string;
  slug: string;
  tagline?: string;
  description?: string;
  avatar_url?: string;
  address?: string;
  is_physical_store?: boolean;
  social_links?: {
    website?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
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

export function PublicBookstore({ overrideSlug }: { overrideSlug?: string } = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = overrideSlug || paramSlug;
  const navigate = useSafeNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [activeSortChips, setActiveSortChips] = useState<Record<number, string>>({});

  const { data, isLoading, error } = useQuery<{ ok: boolean; data: BookstoreData }>({
    queryKey: [`/api/bookstore/${slug}`],
    enabled: !!slug,
  });

  const profile = data?.data?.profile;
  const curations = data?.data?.curations || [];

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

  const socialLinks = profile.social_links || {};

  return (
    <>
      <Header isHomePage={false} />

      <main id="main-content">
        <section
          className="py-12 px-6 text-center"
          style={{ background: 'linear-gradient(to bottom, #f5f5f5, #ffffff)' }}
          data-testid="hero-section"
        >
          {profile.avatar_url && (
            <div className="flex justify-center mb-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                <AvatarFallback className="text-xl font-headline">
                  {profile.display_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          <h1
            className="text-3xl md:text-4xl font-headline text-[#3A3A3A] dark:text-foreground mb-2"
            data-testid="text-display-name"
          >
            {profile.display_name}
          </h1>

          {profile.tagline && (
            <p className="text-lg text-[#6B7280] dark:text-muted-foreground mb-3" data-testid="text-tagline">
              {profile.tagline}
            </p>
          )}

          {profile.description && (
            <p className="max-w-2xl mx-auto text-muted-foreground mb-4" data-testid="text-description">
              {profile.description}
            </p>
          )}

          {(socialLinks.website || socialLinks.instagram || socialLinks.youtube || socialLinks.tiktok || socialLinks.twitter) && (
            <div className="flex items-center justify-center gap-3 mb-4" data-testid="social-links">
              {socialLinks.website && (
                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" data-testid="link-social-website" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" data-testid="link-social-instagram" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" data-testid="link-social-youtube" className="text-muted-foreground hover:text-foreground transition-colors">
                  <SiYoutube className="w-5 h-5" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" data-testid="link-social-tiktok" className="text-muted-foreground hover:text-foreground transition-colors">
                  <SiTiktok className="w-5 h-5" />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" data-testid="link-social-twitter" className="text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          )}

          {profile.is_physical_store && profile.address && (
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground" data-testid="text-address">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{profile.address}</span>
            </div>
          )}
        </section>

        <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8" data-testid="curations-section">
          {curations.length === 0 && (
            <p className="text-center text-muted-foreground py-12" data-testid="text-no-curations">
              Noch keine Kurationen vorhanden.
            </p>
          )}

          {curations.map((curation) => (
            <div key={curation.id} className="mb-10" data-testid={`curation-${curation.id}`}>
              <h2 className="text-xl md:text-2xl font-headline text-[#3A3A3A] dark:text-foreground mb-1">
                {curation.title}
              </h2>

              {curation.description && (
                <p className="text-muted-foreground mb-3 text-sm md:text-base">
                  {curation.description}
                </p>
              )}

              {curation.tags && curation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {curation.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {curation.books.length > 0 && (
                <div className="mb-4 md:mb-6">
                  <div className="relative flex justify-end">
                    <div
                      className="flex gap-2 overflow-x-auto max-w-full select-none overscroll-x-contain pr-6 md:pr-0"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                    >
                      {['Beliebtheit', 'Auszeichnungen', 'Independent', 'Hidden Gems', 'Aktuell'].map(chip => (
                        <button
                          key={chip}
                          className="sort-chip"
                          aria-pressed={activeSortChips[curation.id] === chip ? 'true' : 'false'}
                          onClick={() => setActiveSortChips(prev => ({
                            ...prev,
                            [curation.id]: prev[curation.id] === chip ? '' : chip
                          }))}
                          data-testid={`chip-sort-${chip.toLowerCase().replace(/\s+/g, '-')}-${curation.id}`}
                        >
                          <Text as="span" variant="xs" className="whitespace-nowrap !normal-case !tracking-normal !font-semibold">
                            {chip}
                          </Text>
                        </button>
                      ))}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-10 pointer-events-none bg-gradient-to-l from-white to-transparent md:hidden" />
                  </div>
                </div>
              )}

              {curation.books.length > 0 ? (
                <div className="mb-4">
                  <div
                    className="flex items-stretch -ml-4 overflow-x-auto pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                    data-testid={`carousel-curation-${curation.id}`}
                  >
                    {curation.books.map((book) => (
                      <div key={book.id} className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 pl-4" data-testid={`card-book-${book.id}`}>
                        <EditorialBookCard
                          book={{
                            id: String(book.id),
                            title: book.title,
                            author: book.contributor_name || '',
                            coverImage: book.cover_url || '',
                            isbn: book.isbn13 || undefined,
                            klappentext: book.klappentext || book.description || undefined,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Bücher in dieser Kuration.</p>
              )}
            </div>
          ))}
        </section>

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
