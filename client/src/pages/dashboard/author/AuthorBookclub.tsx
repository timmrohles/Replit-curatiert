import { Users, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../../components/dashboard/DashboardEmptyState';

export function AuthorBookclub() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.authorBookclubTitle', 'Buchklub')}
        description={t('dashboardPages.authorBookclubDesc', 'Organisiere Buchclub-Treffen und diskutiere mit deinen Leser:innen.')}
        action={{
          label: t('dashboardPages.newBookclub', 'Neuer Buchklub'),
          onClick: () => {},
          icon: Plus,
        }}
      />

      <DashboardEmptyState
        icon={Users}
        title={t('dashboardPages.emptyBookclubTitle', 'Noch keine Buchklubs')}
        description={t('dashboardPages.emptyBookclubDesc', 'Erstelle deinen ersten Buchklub und bringe deine Leser:innen zusammen. Plane regelmäßige Treffen und diskutiere über deine Werke.')}
        action={{
          label: t('dashboardPages.emptyBookclubAction', 'Ersten Buchklub erstellen'),
          onClick: () => {},
        }}
      />
    </div>
  );
}
