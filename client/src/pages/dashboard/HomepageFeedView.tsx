import { DashboardFeedProvider } from './DashboardFeedContext';
import { DashboardFeed } from './DashboardFeed';

export function HomepageFeedView() {
  return (
    <DashboardFeedProvider>
      <div className="px-4 md:px-8 py-6">
        <DashboardFeed />
      </div>
    </DashboardFeedProvider>
  );
}
