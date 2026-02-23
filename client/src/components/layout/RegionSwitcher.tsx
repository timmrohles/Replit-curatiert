import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale, getSupportedLocales, isValidLocale, type RegionConfig } from '../../utils/LocaleContext';

const FLAG_MAP: Record<string, string> = {
  DE: 'DE',
  AT: 'AT',
  CH: 'CH',
  GB: 'GB',
};

function RegionFlag({ country }: { country: string }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-4 text-xs font-bold rounded-sm bg-muted text-muted-foreground" aria-hidden="true">
      {FLAG_MAP[country] || country}
    </span>
  );
}

export function RegionSwitcher() {
  const { t } = useTranslation();
  const { locale, region } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const regions = getSupportedLocales();

  const handleSwitch = (targetLocale: string) => {
    if (targetLocale === locale) return;

    const currentPath = location.pathname;
    const pathWithoutLocale = currentPath.replace(new RegExp(`^/${locale}/?`), '/');
    const newPath = `/${targetLocale}${pathWithoutLocale === '/' ? '/' : pathWithoutLocale}`;

    navigate(newPath);
  };

  return (
    <div className="flex items-center gap-1" data-testid="region-switcher">
      {regions.map((r: RegionConfig) => (
        <button
          key={r.locale}
          onClick={() => handleSwitch(r.locale)}
          className={`
            flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors
            ${r.locale === locale
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover-elevate'}
          `}
          title={r.countryName}
          aria-label={t('region.currentRegion', { region: r.countryName })}
          aria-current={r.locale === locale ? 'true' : undefined}
          data-testid={`region-switch-${r.locale}`}
        >
          <RegionFlag country={r.country} />
          <span className="hidden sm:inline">{r.country}</span>
        </button>
      ))}
    </div>
  );
}
