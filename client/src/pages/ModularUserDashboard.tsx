import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  ListChecks,
  Megaphone,
  FileText,
  MessageCircle,
  Users,
  Gift,
  Mail
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
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Breadcrumb } from '../components/layout/Breadcrumb';

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
  | 'author-storefront'
  | 'author-books'
  | 'author-community'
  | 'author-bookclub'
  | 'author-members'
  | 'author-bonuscontent'
  | 'author-newsletter'
  | 'author-events'
  | 'author-statistics';

export function ModularUserDashboard() {
  const navigate = useSafeNavigate();
  const location = useLocation();
  
  // Mock user - in production würde dies aus Auth Context kommen
  const userId = 'demo-user-123';
  const userName = 'Max Mustermann';
  
  const [activeSection, setActiveSection] = useState<DashboardSection>('home');
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadUserModules();
  }, []);

  // Parse section from URL
  useEffect(() => {
    const path = location.pathname.replace('/dashboard/', '').replace('/dashboard', '');
    if (path && path !== '' && path !== 'dashboard' && path !== 'home') {
      setActiveSection(path as DashboardSection);
    } else {
      // Default to home wenn keine section in URL
      setActiveSection('home');
    }
  }, [location]);

  const loadUserModules = async () => {
    try {
      // Demo: Alle Module per Default freischalten
      const mockModules: UserModule[] = [
        {
          userId,
          moduleKey: 'creator_storefront',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'creator_curations',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'creator_reviews',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'creator_topics',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'creator_campaigns',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'creator_events',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'creator_analytics',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'author_storefront',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'author_books',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'author_community',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'author_bookclub',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'author_members',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'author_bonuscontent',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'author_newsletter',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'author_events',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        },
        {
          userId,
          moduleKey: 'author_statistics',
          enabled: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'demo-admin'
        }
      ];
      
      setUserModules(mockModules);
      
      // Optional: Backend Call für Production
      // const res = await fetch(`${API_BASE}/api/user/${userId}/modules`, {
      //   headers: { }
      // });
      // const data = await res.json();
      // if (data.success) {
      //   setUserModules(data.data);
      // }
    } catch (error) {
      // Generic error handling - no sensitive data logged
      // In production, use proper error tracking service
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
    // Don't change URL - keep everything on /dashboard/home
    // navigate(`/dashboard/${section}`);
    setSidebarOpen(false); // Close mobile menu
  };

  const handleLogout = () => {
    // TODO: Implement real logout
    navigate('/');
  };

  // Navigation items
  const coreNavItems = [
    { id: 'home' as DashboardSection, label: 'Home', icon: Home },
    { id: 'profile' as DashboardSection, label: 'Meine Daten', icon: User },
    { id: 'ratings' as DashboardSection, label: 'Bewertungen', icon: Star },
    { id: 'reviews' as DashboardSection, label: 'Rezensionen', icon: MessageSquare },
    { id: 'follows' as DashboardSection, label: 'Favoriten', icon: Heart },
    { id: 'notifications' as DashboardSection, label: 'Benachrichtigungen', icon: Bell },
    { id: 'privacy' as DashboardSection, label: 'Datenschutz', icon: Lock },
  ];

  const creatorNavItems = [
    { id: 'creator-storefront' as DashboardSection, label: 'Storefront', icon: Store, moduleKey: 'creator_storefront' },
    { id: 'creator-curations' as DashboardSection, label: 'Kuratierte Inhalte', icon: BookOpen, moduleKey: 'creator_curations' },
    { id: 'creator-reviews' as DashboardSection, label: 'Rezensionen', icon: MessageSquare, moduleKey: 'creator_reviews' },
    { id: 'creator-topics' as DashboardSection, label: 'Themen', icon: ListChecks, moduleKey: 'creator_topics' },
    { id: 'creator-campaigns' as DashboardSection, label: 'Kampagnen', icon: Megaphone, moduleKey: 'creator_campaigns' },
    { id: 'creator-events' as DashboardSection, label: 'Events', icon: Calendar, moduleKey: 'creator_events' },
    { id: 'creator-analytics' as DashboardSection, label: 'Statistiken', icon: BarChart3, moduleKey: 'creator_analytics' },
  ];

  const authorNavItems = [
    { id: 'author-storefront' as DashboardSection, label: 'Storefront', icon: Store, moduleKey: 'author_storefront' },
    { id: 'author-books' as DashboardSection, label: 'Bücher', icon: BookOpen, moduleKey: 'author_books' },
    { id: 'author-community' as DashboardSection, label: 'Community', icon: Users, moduleKey: 'author_community' },
    { id: 'author-bookclub' as DashboardSection, label: 'Buchklub', icon: Gift, moduleKey: 'author_bookclub' },
    { id: 'author-members' as DashboardSection, label: 'Mitglieder', icon: Users, moduleKey: 'author_members' },
    { id: 'author-bonuscontent' as DashboardSection, label: 'Bonusinhalte', icon: Gift, moduleKey: 'author_bonuscontent' },
    { id: 'author-newsletter' as DashboardSection, label: 'Newsletter', icon: Mail, moduleKey: 'author_newsletter' },
    { id: 'author-events' as DashboardSection, label: 'Events', icon: Calendar, moduleKey: 'author_events' },
    { id: 'author-statistics' as DashboardSection, label: 'Statistiken', icon: BarChart3, moduleKey: 'author_statistics' },
  ];

  // Filter nav items based on permissions
  const availableCreatorItems = creatorNavItems.filter(item => hasModule(item.moduleKey));
  const availableAuthorItems = authorNavItems.filter(item => hasModule(item.moduleKey));

  // Get breadcrumb items based on active section
  const getBreadcrumbItems = () => {
    const allNavItems = [...coreNavItems, ...creatorNavItems, ...authorNavItems];
    const currentItem = allNavItems.find(item => item.id === activeSection);
    
    const items = [
      { label: 'Startseite', href: '/' },
      { label: 'Dashboard', onClick: () => navigateToSection('home') }
    ];

    if (activeSection !== 'home' && currentItem) {
      items.push({ label: currentItem.label, href: '#' });
    }

    return items;
  };

  const renderSidebarNav = () => (
    <nav className="space-y-1">
      {/* Core Navigation */}
      <div className="mb-6">
        {coreNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigateToSection(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group"
              style={{
                backgroundColor: isActive ? '#247ba0' : 'transparent',
                color: isActive ? '#FFFFFF' : '#3A3A3A'
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          );
        })}
      </div>

      {/* Creator Modules */}
      {availableCreatorItems.length > 0 && (
        <div className="mb-6">
          <div className="px-4 py-2 text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>
            Creator Features
          </div>
          {availableCreatorItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: isActive ? '#10B981' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#3A3A3A'
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Author Modules */}
      {availableAuthorItems.length > 0 && (
        <div className="mb-6">
          <div className="px-4 py-2 text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>
            Autoren Features
          </div>
          {availableAuthorItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: isActive ? '#F59E0B' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#3A3A3A'
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Logout */}
      <div className="pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-red-50"
          style={{ color: '#EF4444' }}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Abmelden</span>
        </button>
      </div>
    </nav>
  );

  const FeatureLockedMessage = ({ feature }: { feature: string }) => (
    <div className="p-4 bg-red-50 rounded-lg text-sm text-red-600">
      <p>Das Feature <strong>{feature}</strong> ist nicht verfügbar.</p>
    </div>
  );

  const renderContent = () => {
    try {
      switch (activeSection) {
        case 'home':
          return <DashboardHome />;
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
        
        // Creator Modules
        case 'creator-storefront':
          return hasModule('creator_storefront') ? <CreatorStorefront /> : <FeatureLockedMessage feature="Storefront" />;
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
          return hasModule('creator_analytics') ? <CreatorAnalytics /> : <FeatureLockedMessage feature="Analytics" />;
        
        // Author Modules
        case 'author-storefront':
          return hasModule('author_storefront') ? <AuthorStorefront /> : <FeatureLockedMessage feature="Storefront" />;
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
          return hasModule('author_statistics') ? <AuthorStatistics /> : <FeatureLockedMessage feature="Analytics" />;
        
        default:
          return <DashboardHome />;
      }
    } catch (error) {
      // Error boundary - zeige Fehlermeldung statt Absturz
      return (
        <div className="p-6 rounded-lg border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <h2 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#991B1B' }}>
            Fehler beim Laden
          </h2>
          <p className="text-sm" style={{ color: '#991B1B' }}>
            Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder wählen Sie eine andere Seite.
          </p>
          <button 
            onClick={() => navigateToSection('home')}
            className="mt-4 px-4 py-2 rounded-lg text-sm text-white"
            style={{ backgroundColor: '#247ba0' }}
          >
            Zurück zur Startseite
          </button>
        </div>
      );
    }
  };

  if (loadingModules) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#247ba0' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--header-bg)' }}>
      <Header />
      
      {/* Breadcrumb - Full Width, above everything */}
      <div className="relative z-30">
        <Breadcrumb items={getBreadcrumbItems()} />
      </div>
      
      {/* Mobile Header - Below Breadcrumbs */}
      <div className="lg:hidden sticky z-40 border-b" style={{ backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', top: '0' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg"
            style={{ color: '#3A3A3A' }}
            aria-label={sidebarOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Dashboard
          </h1>
          <div className="w-10" aria-hidden="true"></div>
        </div>
      </div>

      <div className="flex relative">
        {/* Sidebar - starts below complete header (including blue navigation) */}
        <aside 
          className={`
            fixed lg:sticky left-0
            w-64 border-r
            transition-transform duration-300 ease-in-out
            z-[5] lg:z-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ 
            backgroundColor: '#F3F4F6', 
            borderColor: '#D1D5DB',
            top: '60px',
            height: 'calc(100vh - 60px)'
          }}
        >
          <div className="h-full flex flex-col">
            {/* Back to Homepage Link */}
            <div className="p-4 border-b" style={{ borderColor: '#D1D5DB' }}>
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#247ba0'
                }}
              >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">Zurück zur Homepage</span>
              </button>
            </div>

            {/* User Info */}
            <div className="p-6 border-b" style={{ borderColor: '#D1D5DB' }}>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                >
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-medium" style={{ color: '#3A3A3A' }}>
                    {userName}
                  </div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>
                    Mitglied seit 2024
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderSidebarNav()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t text-xs" style={{ borderColor: '#D1D5DB', color: '#9CA3AF' }}>
              Version 1.0.0
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Content - Constrained Width */}
          <div className="max-w-5xl mx-auto p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export default ModularUserDashboard;