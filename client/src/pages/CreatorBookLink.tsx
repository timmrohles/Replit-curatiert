import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Loader2, ExternalLink, ShoppingCart, User, BookOpen, ArrowLeft } from 'lucide-react';
import { useSafeNavigate } from '../utils/routing';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

function generateSessionId(): string {
  const stored = localStorage.getItem('affiliate_session_id');
  const storedTs = localStorage.getItem('affiliate_session_ts');
  const now = Date.now();
  const TTL = 48 * 60 * 60 * 1000;

  if (stored && storedTs && (now - parseInt(storedTs)) < TTL) {
    return stored;
  }

  const newId = 'sess_' + Math.random().toString(36).substring(2) + '_' + now.toString(36);
  localStorage.setItem('affiliate_session_id', newId);
  localStorage.setItem('affiliate_session_ts', now.toString());
  return newId;
}

interface CreatorLinkData {
  creator: {
    userId: string;
    displayName: string;
    slug: string;
    avatarUrl?: string;
    heroImageUrl?: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
    isbn13: string;
    coverUrl?: string;
    description?: string;
  } | null;
  merchants: Array<{
    id: number;
    name: string;
    slug: string;
    url: string;
    iconUrl?: string;
    faviconUrl?: string;
  }>;
  isbn: string;
}

export function CreatorBookLink() {
  const { creatorSlug, isbn } = useParams<{ creatorSlug: string; isbn: string }>();
  const safeNav = useSafeNavigate();
  const [clickTracked, setClickTracked] = useState(false);

  const { data, isLoading, error } = useQuery<{ ok: boolean; data: CreatorLinkData }>({
    queryKey: ['/api/creator-link', creatorSlug, 'buch', isbn],
    queryFn: async () => {
      const res = await fetch(`/api/creator-link/${creatorSlug}/buch/${isbn}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!creatorSlug && !!isbn,
  });

  useEffect(() => {
    if (data?.ok && data.data?.creator && !clickTracked) {
      const sessionId = generateSessionId();
      const creator = data.data.creator;

      localStorage.setItem('affiliate_creator_id', creator.userId);
      localStorage.setItem('affiliate_creator_slug', creator.slug);

      fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.userId,
          creatorSlug: creator.slug,
          bookId: data.data.book?.id || isbn,
          isbn13: data.data.book?.isbn13 || isbn,
          sessionId,
          landingPage: window.location.pathname,
          referrer: document.referrer || null,
        }),
      }).catch(() => {});

      setClickTracked(true);
    }
  }, [data, clickTracked, isbn]);

  const handleMerchantClick = (merchant: CreatorLinkData['merchants'][0]) => {
    const sessionId = generateSessionId();
    const creator = data?.data?.creator;

    fetch('/api/affiliate/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId: creator?.userId,
        creatorSlug: creator?.slug,
        bookId: data?.data?.book?.id || isbn,
        isbn13: data?.data?.book?.isbn13 || isbn,
        sessionId,
        merchant: merchant.slug,
        affiliateId: merchant.id,
        landingPage: window.location.pathname,
      }),
    }).catch(() => {});

    window.open(merchant.url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#247ba0' }} />
      </div>
    );
  }

  if (error || !data?.ok) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
          <div className="text-center p-8">
            <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h1 className="text-2xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Buch nicht gefunden
            </h1>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              Der Link ist leider ungueltig oder das Buch existiert nicht mehr.
            </p>
            <button
              onClick={() => safeNav('/de-de/')}
              className="px-6 py-2.5 rounded-lg font-medium text-sm text-white"
              style={{ backgroundColor: '#247ba0' }}
              data-testid="button-back-home"
            >
              Zur Startseite
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const { creator, book, merchants } = data.data;

  return (
    <>
      <Header />
      <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button
            onClick={() => safeNav(`/${creator.slug}`)}
            className="flex items-center gap-2 text-sm mb-6 transition-colors"
            style={{ color: '#6B7280' }}
            data-testid="link-back-creator"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurueck zu {creator.displayName}
          </button>

          <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(36, 123, 160, 0.08)' }}>
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-10 h-10 rounded-full object-cover border-2"
                style={{ borderColor: '#247ba0' }}
                data-testid="img-creator-avatar"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#247ba0' }}>
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: '#3A3A3A' }} data-testid="text-creator-name">
                Empfohlen von {creator.displayName}
              </p>
              <p className="text-xs" style={{ color: '#6B7280' }}>
                @{creator.slug}
              </p>
            </div>
          </div>

          {book ? (
            <div className="rounded-lg shadow-sm border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 p-6 flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                  {book.coverUrl ? (
                    <ImageWithFallback
                      src={book.coverUrl}
                      alt={book.title}
                      className="max-h-80 rounded shadow-lg"
                      data-testid="img-book-cover"
                    />
                  ) : (
                    <div className="w-48 h-64 rounded flex items-center justify-center" style={{ backgroundColor: '#E5E7EB' }}>
                      <BookOpen className="w-12 h-12" style={{ color: '#9CA3AF' }} />
                    </div>
                  )}
                </div>
                <div className="md:w-2/3 p-6">
                  <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }} data-testid="text-book-title">
                    {book.title}
                  </h1>
                  <p className="text-lg mb-1" style={{ color: '#6B7280' }} data-testid="text-book-author">
                    {book.author}
                  </p>
                  <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
                    ISBN: {book.isbn13}
                  </p>
                  {book.description && (
                    <p className="text-sm mb-6 line-clamp-4" style={{ color: '#4B5563' }}>
                      {book.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>
                      Jetzt kaufen bei:
                    </h3>
                    {merchants.length > 0 ? (
                      merchants.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleMerchantClick(m)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all hover:shadow-md"
                          style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
                          data-testid={`button-buy-${m.slug}`}
                        >
                          <div className="flex items-center gap-3">
                            {m.faviconUrl ? (
                              <img src={m.faviconUrl} alt={m.name} className="w-6 h-6 rounded" />
                            ) : (
                              <ShoppingCart className="w-5 h-5" style={{ color: '#247ba0' }} />
                            )}
                            <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>
                              Kaufen bei {m.name}
                            </span>
                          </div>
                          <ExternalLink className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                        </button>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: '#9CA3AF' }}>
                        Keine Kauflinks verfuegbar.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg shadow-sm border p-8 text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
              <h2 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                Buch (ISBN: {isbn})
              </h2>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                Dieses Buch wurde noch nicht in unserer Datenbank erfasst, aber {creator.displayName} empfiehlt es dir.
              </p>
              {merchants.length > 0 && (
                <div className="space-y-3 max-w-md mx-auto">
                  <h3 className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>
                    Jetzt kaufen bei:
                  </h3>
                  {merchants.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleMerchantClick(m)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all hover:shadow-md"
                      style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
                      data-testid={`button-buy-${m.slug}`}
                    >
                      <div className="flex items-center gap-3">
                        {m.faviconUrl ? (
                          <img src={m.faviconUrl} alt={m.name} className="w-6 h-6 rounded" />
                        ) : (
                          <ShoppingCart className="w-5 h-5" style={{ color: '#247ba0' }} />
                        )}
                        <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>
                          Kaufen bei {m.name}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              Dieser Link wurde von {creator.displayName} geteilt. Bei einem Kauf ueber diesen Link erhaelt der Creator eine Provision.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
