import { Mail, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../../components/dashboard/DashboardEmptyState';

export function AuthorNewsletter() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.authorNewsletterTitle', 'Newsletter')}
        description={t('dashboardPages.authorNewsletterDesc', 'Halte deine Leser:innen mit regelmäßigen Updates auf dem Laufenden.')}
        action={{
          label: t('dashboardPages.newNewsletter', 'Neuer Newsletter'),
          onClick: () => {},
          icon: Plus,
        }}
      />

      <DashboardEmptyState
        icon={Mail}
        title={t('dashboardPages.emptyNewsletterTitle', 'Noch keine Newsletter')}
        description={t('dashboardPages.emptyNewsletterDesc', 'Starte deinen eigenen Newsletter und teile Neuigkeiten, Leseempfehlungen und exklusive Einblicke mit deinen Abonnent:innen.')}
        action={{
          label: t('dashboardPages.emptyNewsletterAction', 'Ersten Newsletter erstellen'),
          onClick: () => {},
        }}
      />
    </div>
  );
}
