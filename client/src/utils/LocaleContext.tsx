import { createContext, useContext, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import i18n from '../i18n/i18n';

export interface RegionConfig {
  locale: string;
  language: string;
  country: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  dateLocale: string;
}

const SUPPORTED_LOCALES: Record<string, RegionConfig> = {
  'de-de': {
    locale: 'de-de',
    language: 'de',
    country: 'DE',
    countryName: 'Deutschland',
    currency: 'EUR',
    currencySymbol: '€',
    dateLocale: 'de-DE',
  },
  'de-at': {
    locale: 'de-at',
    language: 'de',
    country: 'AT',
    countryName: 'Österreich',
    currency: 'EUR',
    currencySymbol: '€',
    dateLocale: 'de-AT',
  },
  'de-ch': {
    locale: 'de-ch',
    language: 'de',
    country: 'CH',
    countryName: 'Schweiz',
    currency: 'CHF',
    currencySymbol: 'CHF',
    dateLocale: 'de-CH',
  },
  'en-gb': {
    locale: 'en-gb',
    language: 'en',
    country: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    dateLocale: 'en-GB',
  },
};

export const DEFAULT_LOCALE = 'de-de';

export function isValidLocale(locale: string | undefined): locale is string {
  return !!locale && locale.toLowerCase() in SUPPORTED_LOCALES;
}

export function getRegionConfig(locale: string): RegionConfig {
  return SUPPORTED_LOCALES[locale.toLowerCase()] || SUPPORTED_LOCALES[DEFAULT_LOCALE];
}

export function getSupportedLocales(): RegionConfig[] {
  return Object.values(SUPPORTED_LOCALES);
}

export function prefixWithLocale(path: string, locale: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const cleanLocale = locale.toLowerCase();
  if (cleanPath.startsWith(`/${cleanLocale}/`) || cleanPath === `/${cleanLocale}`) {
    return cleanPath;
  }
  return `/${cleanLocale}${cleanPath}`;
}

interface LocaleContextValue {
  locale: string;
  region: RegionConfig;
  localePath: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  region: SUPPORTED_LOCALES[DEFAULT_LOCALE],
  localePath: (path: string) => prefixWithLocale(path, DEFAULT_LOCALE),
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ locale?: string }>();
  const locale = isValidLocale(params.locale) ? params.locale.toLowerCase() : DEFAULT_LOCALE;
  const region = getRegionConfig(locale);

  useEffect(() => {
    if (i18n.language !== region.language) {
      i18n.changeLanguage(region.language);
    }
  }, [region.language]);

  const value = useMemo(() => ({
    locale,
    region,
    localePath: (path: string) => prefixWithLocale(path, locale),
  }), [locale, region]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
