import { useState, useEffect, useRef } from 'react';
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
  X,
  ChevronRight,
  ChevronDown,
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
  const navigate = useSafeNavigate();
  const location = useLocation();
  
  const userId = 'demo-user-123';
  const userName = 'Max Mustermann';
  
  const [activeSection, setActiveSection] = useState<DashboardSection>('home');
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    core: true,
    creator: false,
    author: false
  });
  const drawerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileDrawerOpen]);

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
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    navigate('/');
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const coreNavItems: NavItem[] = [
    { id: 'home', label: 'Übersicht', icon: Home, group: 'core' },
    { id: 'profile', label: 'Meine Daten', icon: User, group: 'core' },
    { id: 'ratings', label: 'Bewertungen', icon: Star, group: 'core' },
    { id: 'reviews', label: 'Rezensionen', icon: MessageSquare, group: 'core' },
    { id: 'follows', label: 'Favoriten', icon: Heart, group: 'core' },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell, group: 'core' },
    { id: 'privacy', label: 'Datenschutz', icon: Lock, group: 'core' },
    { id: 'settings', label: 'Einstellungen', icon: Settings, group: 'core' },
  ];

  const creatorNavItems: NavItem[] = [
    { id: 'creator-storefront', label: 'Bookstore', icon: Store, moduleKey: 'creator_storefront', group: 'creator' },
    { id: 'creator-curations', label: 'Kurationen', icon: BookOpen, moduleKey: 'creator_curations', group: 'creator' },
    { id: 'creator-reviews', label: 'Rezensionen', icon: MessageSquare, moduleKey: 'creator_reviews', group: 'creator' },
    { id: 'creator-topics', label: 'Themen', icon: ListChecks, moduleKey: 'creator_topics', group: 'creator' },
    { id: 'creator-campaigns', label: 'Kampagnen', icon: Megaphone, moduleKey: 'creator_campaigns', group: 'creator' },
    { id: 'creator-events', label: 'Events', icon: Calendar, moduleKey: 'creator_events', group: 'creator' },
    { id: 'creator-analytics', label: 'Statistiken', icon: BarChart3, moduleKey: 'creator_analytics', group: 'creator' },
  ];

  const authorNavItems: NavItem[] = [
    { id: 'author-storefront', label: 'Bookstore', icon: Store, moduleKey: 'author_storefront', group: 'author' },
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

  const authorRequestItem: NavItem = { id: 'author-request', label: 'Autor werden', icon: PenTool, group: 'author' };

  const allNavItems = [...coreNavItems, ...availableCreatorItems, ...(hasAnyAuthorModule ? availableAuthorItems : [authorRequestItem])];
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

  const renderNavButton = (item: NavItem, accentColor: string) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    return (
      <button
        key={item.id}
        data-testid={`nav-${item.id}`}
        onClick={() => navigateToSection(item.id)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left"
        style={{
          backgroundColor: isActive ? accentColor : 'transparent',
          color: isActive ? '#FFFFFF' : '#3A3A3A'
        }}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        <span className="text-sm truncate">{item.label}</span>
        {isActive && <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />}
      </button>
    );
  };

  const renderNavGroup = (title: string, items: NavItem[], groupKey: string, accentColor: string) => {
    if (items.length === 0) return null;
    const isExpanded = expandedGroups[groupKey];
    const hasActiveChild = items.some(item => item.id === activeSection);
    const showExpanded = isExpanded || hasActiveChild;

    return (
      <div className="mb-2" key={groupKey}>
        <button
          onClick={() => toggleGroup(groupKey)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider rounded-md transition-colors"
          style={{ color: '#6B7280' }}
          data-testid={`nav-group-${groupKey}`}
        >
          <span>{title}</span>
          <ChevronDown 
            className="w-3.5 h-3.5 transition-transform duration-200" 
            style={{ transform: showExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
        {showExpanded && (
          <div className="mt-1 space-y-0.5">
            {items.map(item => renderNavButton(item, accentColor))}
          </div>
        )}
      </div>
    );
  };

  const renderDesktopSidebar = () => (
    <aside 
      className="hidden lg:flex flex-col w-64 border-r flex-shrink-0 sticky top-0 h-screen overflow-hidden"
      style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
    >
      <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
          >
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate" style={{ color: '#3A3A3A' }}>
              {userName}
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>
              Mitglied seit 2024
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {renderNavGroup('Mein Bereich', coreNavItems, 'core', '#247ba0')}
        {availableCreatorItems.length > 0 && renderNavGroup('Creator', availableCreatorItems, 'creator', '#10B981')}
        {hasAnyAuthorModule 
          ? renderNavGroup('Autor:in', availableAuthorItems, 'author', '#F59E0B')
          : renderNavGroup('Autor:in', [authorRequestItem], 'author', '#F59E0B')
        }
      </div>

      <div className="p-3 border-t" style={{ borderColor: '#E5E7EB' }}>
        <button
          onClick={() => navigate('/')}
          data-testid="nav-back-home"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 mb-1"
          style={{ color: '#247ba0' }}
        >
          <Home className="w-[18px] h-[18px]" />
          <span className="text-sm">Zur Startseite</span>
        </button>
        <button
          onClick={handleLogout}
          data-testid="button-logout"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
          style={{ color: '#EF4444' }}
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span className="text-sm">Abmelden</span>
        </button>
      </div>
    </aside>
  );


  const renderMobileDrawer = () => {
    if (!mobileDrawerOpen) return null;
    return (
      <div className="lg:hidden fixed inset-0 z-[60]">
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setMobileDrawerOpen(false)} 
        />
        <div 
          ref={drawerRef}
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden animate-slide-up"
          style={{ backgroundColor: '#FFFFFF', maxHeight: '85vh' }}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
              >
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: '#3A3A3A' }}>{userName}</div>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>Mitglied seit 2024</div>
              </div>
            </div>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              data-testid="button-close-drawer"
              className="p-2 rounded-full"
              style={{ backgroundColor: '#F3F4F6' }}
            >
              <X className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
          </div>

          <div className="overflow-y-auto p-3" style={{ maxHeight: 'calc(85vh - 72px)' }}>
            <div className="mb-3">
              <div className="px-3 py-1.5 text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                Mein Bereich
              </div>
              <div className="space-y-0.5">
                {coreNavItems.map(item => renderNavButton(item, '#247ba0'))}
              </div>
            </div>

            {availableCreatorItems.length > 0 && (
              <div className="mb-3">
                <div className="px-3 py-1.5 text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                  Creator
                </div>
                <div className="space-y-0.5">
                  {availableCreatorItems.map(item => renderNavButton(item, '#10B981'))}
                </div>
              </div>
            )}

            <div className="mb-3">
              <div className="px-3 py-1.5 text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                Autor:in
              </div>
              <div className="space-y-0.5">
                {hasAnyAuthorModule
                  ? availableAuthorItems.map(item => renderNavButton(item, '#F59E0B'))
                  : renderNavButton(authorRequestItem, '#F59E0B')
                }
              </div>
            </div>

            <div className="pt-3 mt-2 border-t space-y-0.5" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={() => { setMobileDrawerOpen(false); navigate('/'); }}
                data-testid="mobile-nav-home"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ color: '#247ba0' }}
              >
                <Home className="w-[18px] h-[18px]" />
                <span className="text-sm">Zur Startseite</span>
              </button>
              <button
                onClick={handleLogout}
                data-testid="mobile-logout"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ color: '#EF4444' }}
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span className="text-sm">Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileHeader = () => (
    <div 
      className="lg:hidden sticky top-0 z-40 border-b px-4 py-3 flex items-center gap-3"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
      >
        {currentNavItem ? <currentNavItem.icon className="w-4 h-4" /> : <Home className="w-4 h-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-semibold truncate" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          {currentNavItem?.label || 'Dashboard'}
        </h1>
      </div>
    </div>
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
        case 'settings':
          return <DashboardSettings />;
        case 'creator-storefront':
          return hasModule('creator_storefront') ? <CreatorStorefront /> : <FeatureLockedMessage feature="Bookstore" />;
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
        case 'author-request':
          return <AuthorRequest userId={userId} />;
        case 'author-storefront':
          return hasModule('author_storefront') ? <AuthorStorefront /> : <FeatureLockedMessage feature="Bookstore" />;
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
    } catch {
      return (
        <div className="p-6 rounded-lg border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <h2 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#991B1B' }}>
            Fehler beim Laden
          </h2>
          <p className="text-sm" style={{ color: '#991B1B' }}>
            Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuche es erneut.
          </p>
          <button 
            onClick={() => navigateToSection('home')}
            data-testid="button-error-home"
            className="mt-4 px-4 py-2 rounded-lg text-sm text-white"
            style={{ backgroundColor: '#247ba0' }}
          >
            Zurück zur Übersicht
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--header-bg, #F9FAFB)' }}>
      <Header />
      
      <div className="hidden lg:block">
        <Breadcrumb items={getBreadcrumbItems()} />
      </div>

      <div className="flex flex-1 min-h-0">
        {renderDesktopSidebar()}

        <div className="flex-1 flex flex-col min-w-0">
          {renderMobileHeader()}
          
          <main className="flex-1 pb-20 lg:pb-0">
            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
      
      <div className="hidden lg:block">
        <Footer />
      </div>

      {renderMobileDrawer()}
    </div>
  );
}
