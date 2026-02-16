import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from '../utils/routing';
import { 
  User, 
  Star, 
  MessageSquare, 
  Heart, 
  Bell, 
  Lock, 
  Store, 
  Calendar, 
  BarChart3, 
  BookOpen,
  Home,
  ListChecks,
  Megaphone,
  Users,
  Gift,
  Mail,
  Settings,
  PenTool
} from 'lucide-react';
import { DashboardHome } from './dashboard/DashboardHome';
import { DashboardProfile } from './dashboard/Profile';
import { DashboardRatings } from './dashboard/Ratings';
import { DashboardReviews } from './dashboard/Reviews';
import { DashboardFollows } from './dashboard/Follows';
import { DashboardNotifications } from './dashboard/Notifications';
import { DashboardPrivacy } from './dashboard/Privacy';
import { DashboardSettings } from './dashboard/Settings';
import { CreatorStorefront } from './dashboard/creator/CreatorStorefront';
import { CreatorCurations } from './dashboard/creator/CreatorCurations';
import { CreatorReviews } from './dashboard/creator/CreatorReviews';
import { CreatorTopics } from './dashboard/creator/CreatorTopics';
import { CreatorCampaigns } from './dashboard/creator/CreatorCampaigns';
import { CreatorEvents } from './dashboard/creator/CreatorEvents';
import { CreatorAnalytics } from './dashboard/creator/CreatorAnalytics';
import { AuthorStorefront } from './dashboard/author/AuthorStorefront';
import { AuthorBooks } from './dashboard/author/AuthorBooks';
import { AuthorCommunity } from './dashboard/author/AuthorCommunity';
import { AuthorBookclub } from './dashboard/author/AuthorBookclub';
import { AuthorMembers } from './dashboard/author/AuthorMembers';
import { AuthorBonuscontent } from './dashboard/author/AuthorBonuscontent';
import { AuthorNewsletter } from './dashboard/author/AuthorNewsletter';
import { AuthorEvents } from './dashboard/author/AuthorEvents';
import { AuthorStatistics } from './dashboard/author/AuthorStatistics';
import { AuthorRequest } from './dashboard/AuthorRequest';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { DashboardFeedProvider } from './dashboard/DashboardFeedContext';
import { DashboardFeed } from './dashboard/DashboardFeed';

const API_BASE = '/api';

interface UserModule {
  userId: string;
  moduleKey: string;
  enabled: boolean;
  grantedAt: string;
  grantedBy: string;
}

type DashboardSection = 
  | 'home'
  | 'profile' 
  | 'ratings' 
  | 'reviews' 
  | 'follows' 
  | 'notifications' 
  | 'privacy'
  | 'settings'
  | 'creator-storefront'
  | 'creator-curations'
  | 'creator-reviews'
  | 'creator-topics'
  | 'creator-campaigns'
  | 'creator-events'
  | 'creator-analytics'
  | 'author-request'
  | 'author-storefront'
  | 'author-books'
  | 'author-community'
  | 'author-bookclub'
  | 'author-members'
  | 'author-bonuscontent'
  | 'author-newsletter'
  | 'author-events'
  | 'author-statistics';

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: typeof Home;
  moduleKey?: string;
  group?: string;
}

export default function ModularUserDashboard() {
  const { t } = useTranslation();
  const navigate = useSafeNavigate();
  const location = useLocation();
  
  const userId = 'demo-user-123';
  const userName = 'Max Mustermann';
  const roles = ['Leser:in'];
  const progress = 35;
  
  const [activeSection, setActiveSection] = useState<DashboardSection>('home');
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    loadUserModules();
  }, []);

  useEffect(() => {
    const path = location.pathname.replace('/dashboard/', '').replace('/dashboard', '');
    if (path && path !== '' && path !== 'dashboard' && path !== 'home') {
      setActiveSection(path as DashboardSection);
    } else {
      setActiveSection('home');
    }
  }, [location]);

  const loadUserModules = async () => {
    try {
      const res = await fetch(`${API_BASE}/user-modules?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.ok && data.data) {
        setUserModules(data.data.map((m: any) => ({
          userId,
          moduleKey: m.module_key,
          enabled: true,
          grantedAt: m.created_at || new Date().toISOString(),
          grantedBy: m.granted_by || 'system'
        })));
      } else {
        setUserModules([]);
      }
    } catch {
      setUserModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const hasModule = (moduleKey: string): boolean => {
    return userModules.some(m => m.moduleKey === moduleKey && m.enabled);
  };

  const navigateToSection = (section: DashboardSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const coreNavItems: NavItem[] = [
    { id: 'home', label: 'Feed', icon: Home, group: 'core' },
    { id: 'profile', label: 'Profil', icon: User, group: 'core' },
    { id: 'ratings', label: 'Bewertungen', icon: Star, group: 'core' },
    { id: 'reviews', label: 'Rezensionen', icon: MessageSquare, group: 'core' },
    { id: 'follows', label: 'Favoriten', icon: Heart, group: 'core' },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell, group: 'core' },
    { id: 'settings', label: 'Einstellungen', icon: Settings, group: 'core' },
  ];

  const creatorNavItems: NavItem[] = [
    { id: 'creator-storefront', label: 'Buchhandlung', icon: Store, moduleKey: 'creator_storefront', group: 'creator' },
    { id: 'creator-curations', label: 'Kurationen', icon: BookOpen, moduleKey: 'creator_curations', group: 'creator' },
    { id: 'creator-reviews', label: 'Rezensionen', icon: MessageSquare, moduleKey: 'creator_reviews', group: 'creator' },
    { id: 'creator-topics', label: 'Themen', icon: ListChecks, moduleKey: 'creator_topics', group: 'creator' },
    { id: 'creator-campaigns', label: 'Kampagnen', icon: Megaphone, moduleKey: 'creator_campaigns', group: 'creator' },
    { id: 'creator-events', label: 'Events', icon: Calendar, moduleKey: 'creator_events', group: 'creator' },
    { id: 'creator-analytics', label: 'Statistiken', icon: BarChart3, moduleKey: 'creator_analytics', group: 'creator' },
  ];

  const authorNavItems: NavItem[] = [
    { id: 'author-storefront', label: 'Buchhandlung', icon: Store, moduleKey: 'author_storefront', group: 'author' },
    { id: 'author-books', label: 'Bücher', icon: BookOpen, moduleKey: 'author_books', group: 'author' },
    { id: 'author-community', label: 'Community', icon: Users, moduleKey: 'author_community', group: 'author' },
    { id: 'author-bookclub', label: 'Buchklub', icon: Gift, moduleKey: 'author_bookclub', group: 'author' },
    { id: 'author-members', label: 'Mitglieder', icon: Users, moduleKey: 'author_members', group: 'author' },
    { id: 'author-bonuscontent', label: 'Bonusinhalte', icon: Gift, moduleKey: 'author_bonuscontent', group: 'author' },
    { id: 'author-newsletter', label: 'Newsletter', icon: Mail, moduleKey: 'author_newsletter', group: 'author' },
    { id: 'author-events', label: 'Events', icon: Calendar, moduleKey: 'author_events', group: 'author' },
    { id: 'author-statistics', label: 'Statistiken', icon: BarChart3, moduleKey: 'author_statistics', group: 'author' },
  ];

  const availableCreatorItems = creatorNavItems.filter(item => !item.moduleKey || hasModule(item.moduleKey));
  const availableAuthorItems = authorNavItems.filter(item => !item.moduleKey || hasModule(item.moduleKey));
  const hasAnyAuthorModule = authorNavItems.some(item => item.moduleKey && hasModule(item.moduleKey));
  const hasAnyCreatorModule = creatorNavItems.some(item => item.moduleKey && hasModule(item.moduleKey));

  const authorRequestItem: NavItem = { id: 'author-request', label: 'Autor:in werden', icon: PenTool, group: 'author' };

  const allNavItems = [
    ...coreNavItems, 
    ...availableCreatorItems, 
    ...(hasAnyAuthorModule ? availableAuthorItems : [authorRequestItem])
  ];
  const currentNavItem = allNavItems.find(item => item.id === activeSection);

  const getBreadcrumbItems = () => {
    const items: Array<{ label: string; href?: string; onClick?: () => void }> = [
      { label: 'Startseite', href: '/' },
      { label: 'Dashboard', onClick: () => navigateToSection('home') }
    ];
    if (activeSection !== 'home' && currentNavItem) {
      items.push({ label: currentNavItem.label });
    }
    return items;
  };

  const quickStats = [
    { label: 'Bewertungen', value: '0', icon: Star },
    { label: 'Rezensionen', value: '0', icon: MessageSquare },
    { label: 'Favoriten', value: '0', icon: Heart },
    { label: 'Leseliste', value: '0', icon: BookOpen },
  ];

  const FeatureLockedMessage = ({ feature }: { feature: string }) => (
    <div className="p-4 bg-red-50 rounded-lg text-sm text-red-600">
      <p>Das Feature <strong>{feature}</strong> ist nicht verfügbar.</p>
    </div>
  );

  const renderContent = () => {
    try {
      switch (activeSection) {
        case 'home':
          return <DashboardFeed />;
        case 'profile':
          return <DashboardProfile />;
        case 'ratings':
          return <DashboardRatings />;
        case 'reviews':
          return <DashboardReviews />;
        case 'follows':
          return <DashboardFollows />;
        case 'notifications':
          return <DashboardNotifications />;
        case 'privacy':
          return <DashboardPrivacy />;
        case 'settings':
          return <DashboardSettings />;
        case 'creator-storefront':
          return hasModule('creator_storefront') ? <CreatorStorefront /> : <FeatureLockedMessage feature="Buchhandlung" />;
        case 'creator-curations':
          return hasModule('creator_curations') ? <CreatorCurations /> : <FeatureLockedMessage feature="Kuratierte Inhalte" />;
        case 'creator-reviews':
          return hasModule('creator_reviews') ? <CreatorReviews /> : <FeatureLockedMessage feature="Rezensionen" />;
        case 'creator-topics':
          return hasModule('creator_topics') ? <CreatorTopics /> : <FeatureLockedMessage feature="Themen" />;
        case 'creator-campaigns':
          return hasModule('creator_campaigns') ? <CreatorCampaigns /> : <FeatureLockedMessage feature="Kampagnen" />;
        case 'creator-events':
          return hasModule('creator_events') ? <CreatorEvents /> : <FeatureLockedMessage feature="Events" />;
        case 'creator-analytics':
          return hasModule('creator_analytics') ? <CreatorAnalytics /> : <FeatureLockedMessage feature="Statistiken" />;
        case 'author-request':
          return <AuthorRequest userId={userId} />;
        case 'author-storefront':
          return hasModule('author_storefront') ? <AuthorStorefront /> : <FeatureLockedMessage feature="Buchhandlung" />;
        case 'author-books':
          return hasModule('author_books') ? <AuthorBooks /> : <FeatureLockedMessage feature="Bücher" />;
        case 'author-community':
          return hasModule('author_community') ? <AuthorCommunity /> : <FeatureLockedMessage feature="Community" />;
        case 'author-bookclub':
          return hasModule('author_bookclub') ? <AuthorBookclub /> : <FeatureLockedMessage feature="Buchklub" />;
        case 'author-members':
          return hasModule('author_members') ? <AuthorMembers /> : <FeatureLockedMessage feature="Mitglieder" />;
        case 'author-bonuscontent':
          return hasModule('author_bonuscontent') ? <AuthorBonuscontent /> : <FeatureLockedMessage feature="Bonusinhalte" />;
        case 'author-newsletter':
          return hasModule('author_newsletter') ? <AuthorNewsletter /> : <FeatureLockedMessage feature="Newsletter" />;
        case 'author-events':
          return hasModule('author_events') ? <AuthorEvents /> : <FeatureLockedMessage feature="Events" />;
        case 'author-statistics':
          return hasModule('author_statistics') ? <AuthorStatistics /> : <FeatureLockedMessage feature="Statistiken" />;
        default:
          return (
            <div id="feed-container" className="rounded-lg p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <p className="text-sm" style={{ color: '#6B7280' }}>Feed wird geladen...</p>
            </div>
          );
      }
    } catch {
      return (
        <div className="p-6 rounded-lg border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <h2 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#991B1B' }}>
            {t('dashboard.errorTitle')}
          </h2>
          <p className="text-sm" style={{ color: '#991B1B' }}>
            {t('dashboard.errorDescription')}
          </p>
          <button 
            onClick={() => navigateToSection('home')}
            data-testid="button-error-home"
            className="mt-4 px-4 py-2 rounded-lg text-sm text-white"
            style={{ backgroundColor: '#247ba0' }}
          >
            {t('dashboard.backToOverview')}
          </button>
        </div>
      );
    }
  };

  const renderTabButton = (item: NavItem, isGroupLabel?: boolean) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    
    if (isGroupLabel) {
      return (
        <span
          key={`group-${item.group}`}
          className="flex items-center px-3 py-2 text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0"
          style={{ color: '#9CA3AF', fontFamily: 'Inter' }}
        >
          {item.label}
        </span>
      );
    }

    return (
      <button
        key={item.id}
        data-testid={`tab-${item.id}`}
        onClick={() => navigateToSection(item.id)}
        className="flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap flex-shrink-0 transition-opacity duration-150 border-b-2"
        style={{
          borderColor: isActive ? '#247ba0' : 'transparent',
          color: isActive ? '#247ba0' : '#6B7280',
        }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">{item.label}</span>
      </button>
    );
  };

  if (loadingModules) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#247ba0' }}></div>
      </div>
    );
  }

  return (
    <DashboardFeedProvider>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--header-bg, #F9FAFB)' }}>
        <Header />
        
        <Breadcrumb items={getBreadcrumbItems()} />

        <main className="flex-1 pb-20 lg:pb-0">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">

            <section
              className="rounded-lg p-5 md:p-6 border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
              data-testid="hero-profile-card"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                  data-testid="avatar-user"
                >
                  <User className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-xl md:text-2xl mb-1"
                    style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
                    data-testid="text-username"
                  >
                    {userName}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {roles.map((role, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-0.5 rounded-full text-xs text-white"
                        style={{ backgroundColor: '#247ba0' }}
                        data-testid={`badge-role-${index}`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs sm:text-sm" style={{ color: '#6B7280' }}>
                        Profil {progress}% vollständig
                      </span>
                      <span className="text-xs sm:text-sm font-medium" style={{ color: '#247ba0' }}>
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${progress}%`,
                          background: 'linear-gradient(to right, #247ba0, #70c1b3)'
                        }}
                        data-testid="progress-bar"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                {quickStats.map((stat, index) => {
                  const StatIcon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                      style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                      data-testid={`stat-pill-${stat.label.toLowerCase()}`}
                    >
                      <StatIcon className="w-3.5 h-3.5" style={{ color: '#247ba0' }} />
                      <span>{stat.value}</span>
                      <span>{stat.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <nav
              className="overflow-x-auto border-b scrollbar-hide"
              style={{ borderColor: '#E5E7EB' }}
              data-testid="tab-navigation"
            >
              <div className="flex items-center min-w-max">
                {coreNavItems.map(item => renderTabButton(item))}

                {hasAnyCreatorModule && availableCreatorItems.length > 0 && (
                  <>
                    <span
                      className="flex items-center px-3 py-2 text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0"
                      style={{ color: '#9CA3AF' }}
                    >
                      Kurator:in
                    </span>
                    {availableCreatorItems.map(item => renderTabButton(item))}
                  </>
                )}

                {hasAnyAuthorModule ? (
                  <>
                    <span
                      className="flex items-center px-3 py-2 text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0"
                      style={{ color: '#9CA3AF' }}
                    >
                      Autor:in
                    </span>
                    {availableAuthorItems.map(item => renderTabButton(item))}
                  </>
                ) : (
                  renderTabButton(authorRequestItem)
                )}
              </div>
            </nav>

            <div data-testid="dashboard-content">
              {renderContent()}
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </DashboardFeedProvider>
  );
}
