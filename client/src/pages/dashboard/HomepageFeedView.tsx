import { DashboardFeedProvider } from './DashboardFeedContext';
import { DashboardFeed } from './DashboardFeed';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { InfoBar } from '../../components/layout/InfoBar';
import { BottomBanner } from '../../components/layout/BottomBanner';

export function HomepageFeedView() {
  return (
    <DashboardFeedProvider>
      <InfoBar />
      <Header isHomePage={true} />
      <main id="main-content" className="min-h-screen">
        <div className="px-4 md:px-8 pt-12 pb-6">
          <DashboardFeed />
        </div>
      </main>
      <BottomBanner />
      <Footer />
    </DashboardFeedProvider>
  );
}
