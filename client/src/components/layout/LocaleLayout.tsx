import { Outlet, Navigate, useParams } from 'react-router-dom';
import { LocaleProvider, isValidLocale, DEFAULT_LOCALE } from '../../utils/LocaleContext';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const PublicBookstore = lazy(() => import('../../pages/PublicBookstore').then(m => ({ default: m.PublicBookstore })));

export function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>();

  if (isValidLocale(locale)) {
    return (
      <LocaleProvider>
        <Outlet />
      </LocaleProvider>
    );
  }

  return <BookstoreOrRedirect slug={locale || ''} />;
}

function BookstoreOrRedirect({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery<{ ok: boolean; data: any }>({
    queryKey: [`/api/bookstore/${slug}`],
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data?.ok && data?.data?.profile) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <PublicBookstore overrideSlug={slug} />
      </Suspense>
    );
  }

  return <Navigate to={`/${DEFAULT_LOCALE}/`} replace />;
}
