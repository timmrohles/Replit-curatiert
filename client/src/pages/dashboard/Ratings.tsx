import { Star, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../components/dashboard/DashboardEmptyState';

export function DashboardRatings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.ratingsTitle', 'Bewertungen')}
        description={t('dashboardPages.ratingsDesc', 'Deine Sternebewertungen für gelesene Bücher.')}
        action={{
          label: t('dashboardPages.newRating', 'Buch bewerten'),
          onClick: () => {},
          icon: Plus,
        }}
      />

      <DashboardEmptyState
        icon={Star}
        title={t('dashboardPages.emptyRatingsTitle', 'Noch keine Bewertungen')}
        description={t('dashboardPages.emptyRatingsDesc', 'Bewerte gelesene Bücher mit Sternen, um anderen Leser:innen bei der Entscheidung zu helfen. Deine Bewertungen erscheinen auf den Buchseiten und in deinem Profil.')}
        action={{
          label: t('dashboardPages.emptyRatingsAction', 'Erstes Buch bewerten'),
          onClick: () => {},
        }}
      />
    </div>
  );
}
