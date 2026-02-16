import { Outlet, Navigate, useParams } from 'react-router-dom';
import { LocaleProvider, isValidLocale, DEFAULT_LOCALE } from '../../utils/LocaleContext';

export function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>();

  if (!isValidLocale(locale)) {
    return <Navigate to={`/${DEFAULT_LOCALE}/`} replace />;
  }

  return (
    <LocaleProvider>
      <Outlet />
    </LocaleProvider>
  );
}
