import { BookOpen, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../../components/dashboard/DashboardEmptyState';

export function AuthorBooks() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.authorBooksTitle', 'Meine Bücher')}
        description={t('dashboardPages.authorBooksDesc', 'Verwalte deine veröffentlichten Werke und ONIX-verknüpften Titel.')}
        action={{
          label: t('dashboardPages.addBook', 'Buch hinzufügen'),
          onClick: () => {},
          icon: Plus,
        }}
      />

      <DashboardEmptyState
        icon={BookOpen}
        title={t('dashboardPages.emptyAuthorBooksTitle', 'Noch keine Bücher verknüpft')}
        description={t('dashboardPages.emptyAuthorBooksDesc', 'Verknüpfe deine veröffentlichten Bücher über die ONIX-Datenbank, um sie hier zu verwalten und mit deiner Community zu teilen.')}
        action={{
          label: t('dashboardPages.emptyAuthorBooksAction', 'Erstes Buch verknüpfen'),
          onClick: () => {},
        }}
      />
    </div>
  );
}
