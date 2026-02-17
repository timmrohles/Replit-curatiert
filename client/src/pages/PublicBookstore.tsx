import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Flag } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useSafeNavigate } from '../utils/routing';
import { CreatorCarousel } from '../components/creator/CreatorCarousel';

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
        <section className="max-w-7xl mx-auto px-0 md:px-2 py-4" data-testid="curations-section">
          {curations.length === 0 && (
            <p className="text-center text-muted-foreground py-12" data-testid="text-no-curations">
              Noch keine Kurationen vorhanden.
            </p>
          )}

          {curations.map((curation) => (
            <div key={curation.id} data-testid={`curation-${curation.id}`}>
              <CreatorCarousel
                creatorAvatar={profile.avatar_url || ''}
                creatorName={profile.display_name}
                creatorFocus={profile.tagline || ''}
                occasion={curation.title}
                curationReason={curation.description || ''}
                showSocials={false}
                creatorWebsiteUrl={profile.social_links?.website}
                isVerified={false}
                showHeader={true}
                books={mapBooksForCarousel(curation.books)}
                tags={curation.tags}
                showCta={false}
                backgroundColor="white"
                useEditorialLayout={true}
                showVideo={false}
              />
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
