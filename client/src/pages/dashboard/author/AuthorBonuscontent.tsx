import { Gift, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../../components/dashboard/DashboardEmptyState';

export function AuthorBonuscontent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.authorBonusTitle', 'Bonusinhalte')}
        description={t('dashboardPages.authorBonusDesc', 'Verwalte exklusive Inhalte für deine Community.')}
        action={{
          label: t('dashboardPages.newBonus', 'Neuer Bonusinhalt'),
          onClick: () => {},
          icon: Plus,
        }}
      />

      <DashboardEmptyState
        icon={Gift}
        title={t('dashboardPages.emptyBonusTitle', 'Noch keine Bonusinhalte')}
        description={t('dashboardPages.emptyBonusDesc', 'Erstelle exklusive Inhalte wie alternative Enden, Charakterportraits oder Playlists für deine treuesten Leser:innen.')}
        action={{
          label: t('dashboardPages.emptyBonusAction', 'Ersten Bonusinhalt erstellen'),
          onClick: () => {},
        }}
      />
    </div>
  );
}
