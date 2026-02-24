import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../../components/dashboard/DashboardPageHeader';
import { CreatorAnalytics } from '../creator/CreatorAnalytics';

export function EarningsStatistics() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.statisticsTitle', 'Statistiken')}
        description={t('dashboardPages.statisticsDesc', 'Detaillierte Klick-, Attributions- und Umsatzstatistiken deines Affiliate-Programms.')}
      />
      <CreatorAnalytics />
    </div>
  );
}
