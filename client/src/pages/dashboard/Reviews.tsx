import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ReviewWizard } from '../../components/review-wizard/ReviewWizard';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../components/dashboard/DashboardEmptyState';

export function DashboardReviews() {
  const { t } = useTranslation();
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return (
      <ReviewWizard
        onClose={() => setShowWizard(false)}
        onComplete={() => {
          setShowWizard(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.reviewsTitle', 'Rezensionen')}
        description={t('dashboardPages.reviewsDesc', 'Verwalte deine Buchrezensionen und teile deine Meinung.')}
        action={{
          label: t('dashboardPages.newReview', 'Neue Rezension'),
          onClick: () => setShowWizard(true),
          icon: Plus,
        }}
      />

      <DashboardEmptyState
        icon={Star}
        title={t('dashboardPages.emptyReviewsTitle', 'Noch keine Rezensionen')}
        description={t('dashboardPages.emptyReviewsDesc', 'Schreibe deine erste Buchrezension und teile deine Meinung mit anderen Leser:innen. Deine Rezensionen erscheinen auf den Buchseiten und in deinem öffentlichen Profil.')}
        action={{
          label: t('dashboardPages.emptyReviewsAction', 'Erste Rezension schreiben'),
          onClick: () => setShowWizard(true),
        }}
      />
    </div>
  );
}
