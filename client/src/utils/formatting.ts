import { RegionConfig } from './LocaleContext';

export function formatCurrency(amount: number, region: RegionConfig): string {
  return new Intl.NumberFormat(region.dateLocale, {
    style: 'currency',
    currency: region.currency,
  }).format(amount);
}

export function formatNumber(value: number, region: RegionConfig, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(region.dateLocale, options).format(value);
}

export function formatDate(date: Date | string, region: RegionConfig, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(region.dateLocale, options || {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateShort(date: Date | string, region: RegionConfig): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(region.dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatRelativeTime(date: Date | string, region: RegionConfig): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(region.dateLocale, { numeric: 'auto' });

  if (diffDay > 30) return formatDate(d, region);
  if (diffDay > 0) return rtf.format(-diffDay, 'day');
  if (diffHour > 0) return rtf.format(-diffHour, 'hour');
  if (diffMin > 0) return rtf.format(-diffMin, 'minute');
  return rtf.format(-diffSec, 'second');
}
