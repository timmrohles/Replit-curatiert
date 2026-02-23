import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from '../../utils/routing';
import {
  Home, BookOpen, Users, Banknote, Settings,
  Store, Star, MessageSquare, Rss, Calendar,
  BarChart3, Bell, User, Shield, PenTool,
  Gift, Mail, ChevronDown, ChevronRight, X
} from 'lucide-react';

interface SidebarItem {
  id: string;
  path: string;
  label: string;
  icon: typeof Home;
  moduleKey?: string;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: typeof Home;
  items: SidebarItem[];
  defaultOpen?: boolean;
}

interface DashboardSidebarProps {
  hasModule: (key: string) => boolean;
  hasAnyAuthorModule: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DashboardSidebar({ hasModule, hasAnyAuthorModule, mobileOpen, onMobileClose }: DashboardSidebarProps) {
  const { t } = useTranslation();
  const navigate = useSafeNavigate();
  const location = useLocation();

  const getActivePath = () => {
    const idx = location.pathname.indexOf('/dashboard');
    if (idx === -1) return '/dashboard';
    return location.pathname.substring(idx);
  };
  const activePath = getActivePath();

  const groups: SidebarGroup[] = [
    {
      id: 'overview',
      label: t('dashboardNav.overview', 'Übersicht'),
      icon: Home,
      defaultOpen: true,
      items: [
        { id: 'home', path: '/dashboard', label: t('dashboardNav.home', 'Start'), icon: Home },
      ]
    },
    {
      id: 'content',
      label: t('dashboardNav.myContent', 'Meine Inhalte'),
      icon: BookOpen,
      defaultOpen: true,
      items: [
        { id: 'buchhandlung', path: '/dashboard/buchhandlung', label: t('dashboardNav.buchhandlung', 'Buchhandlung'), icon: Store, moduleKey: 'creator_storefront' },
        { id: 'kurationen', path: '/dashboard/kurationen', label: t('dashboardNav.kurationen', 'Kurationen'), icon: BookOpen },
        { id: 'rezensionen', path: '/dashboard/rezensionen', label: t('dashboardNav.rezensionen', 'Rezensionen'), icon: MessageSquare },
        { id: 'bewertungen', path: '/dashboard/bewertungen', label: t('dashboardNav.bewertungen', 'Bewertungen'), icon: Star },
        { id: 'content-quellen', path: '/dashboard/content-quellen', label: t('dashboardNav.contentSources', 'Content-Quellen'), icon: Rss, moduleKey: 'creator_storefront' },
      ]
    },
    {
      id: 'community',
      label: t('dashboardNav.community', 'Community'),
      icon: Users,
      defaultOpen: false,
      items: [
        { id: 'feed', path: '/dashboard/feed', label: t('dashboardNav.feed', 'Feed'), icon: Home },
        { id: 'veranstaltungen', path: '/dashboard/veranstaltungen', label: t('dashboardNav.events', 'Veranstaltungen'), icon: Calendar },
      ]
    },
    {
      id: 'earnings',
      label: t('dashboardNav.earnings', 'Einnahmen'),
      icon: Banknote,
      defaultOpen: false,
      items: [
        { id: 'einnahmen', path: '/dashboard/einnahmen', label: t('dashboardNav.earningsOverview', 'Übersicht'), icon: Banknote },
        { id: 'einnahmen-affiliate', path: '/dashboard/einnahmen/affiliate', label: t('dashboardNav.affiliate', 'Affiliate-Programm'), icon: Banknote },
        { id: 'einnahmen-statistiken', path: '/dashboard/einnahmen/statistiken', label: t('dashboardNav.statistics', 'Statistiken'), icon: BarChart3 },
      ]
    },
    {
      id: 'settings',
      label: t('dashboardNav.settings', 'Einstellungen'),
      icon: Settings,
      defaultOpen: false,
      items: [
        { id: 'profil', path: '/dashboard/profil', label: t('dashboardNav.profile', 'Profil'), icon: User },
        { id: 'benachrichtigungen', path: '/dashboard/benachrichtigungen', label: t('dashboardNav.notifications', 'Benachrichtigungen'), icon: Bell },
        { id: 'datenschutz', path: '/dashboard/datenschutz', label: t('dashboardNav.privacy', 'Datenschutz'), icon: Shield },
      ]
    },
  ];

  if (hasAnyAuthorModule) {
    groups.push({
      id: 'author',
      label: t('dashboardNav.author', 'Autor:in'),
      icon: PenTool,
      defaultOpen: false,
      items: [
        { id: 'autor-buecher', path: '/dashboard/autor/buecher', label: t('dashboardNav.authorBooks', 'Meine Bücher'), icon: BookOpen, moduleKey: 'author_books' },
        { id: 'autor-buchklub', path: '/dashboard/autor/buchklub', label: t('dashboardNav.authorBookclub', 'Buchklub'), icon: Gift, moduleKey: 'author_bookclub' },
        { id: 'autor-bonusinhalte', path: '/dashboard/autor/bonusinhalte', label: t('dashboardNav.authorBonus', 'Bonusinhalte'), icon: Gift, moduleKey: 'author_bonuscontent' },
        { id: 'autor-newsletter', path: '/dashboard/autor/newsletter', label: t('dashboardNav.authorNewsletter', 'Newsletter'), icon: Mail, moduleKey: 'author_newsletter' },
      ].filter(item => !item.moduleKey || hasModule(item.moduleKey))
    });
  } else {
    groups.push({
      id: 'author',
      label: t('dashboardNav.author', 'Autor:in'),
      icon: PenTool,
      defaultOpen: false,
      items: [
        { id: 'autor-werden', path: '/dashboard/autor-werden', label: t('dashboardNav.becomeAuthor', 'Autor:in werden'), icon: PenTool },
      ]
    });
  }

  const filteredGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.moduleKey || hasModule(item.moduleKey))
  })).filter(group => group.items.length > 0);

  const initialOpen: Record<string, boolean> = {};
  filteredGroups.forEach(g => {
    const hasActive = g.items.some(item => activePath === item.path || activePath.startsWith(item.path + '/'));
    initialOpen[g.id] = g.defaultOpen || hasActive;
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onMobileClose?.();
  };

  const sidebarContent = (
    <nav className="flex flex-col gap-1 py-4" data-testid="dashboard-sidebar">
      {filteredGroups.map(group => {
        const isOpen = openGroups[group.id] ?? false;
        const GroupIcon = group.icon;

        return (
          <div key={group.id}>
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50 rounded-lg mx-2"
              style={{ color: 'var(--ds-text-secondary, #6B7280)' }}
              data-testid={`sidebar-group-${group.id}`}
            >
              <span className="flex items-center gap-2.5">
                <GroupIcon className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">{group.label}</span>
              </span>
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {isOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activePath === item.path || (item.path !== '/dashboard' && activePath.startsWith(item.path + '/'));
                  const isExactHome = item.path === '/dashboard' && activePath === '/dashboard';
                  const active = isActive || isExactHome;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      data-testid={`sidebar-item-${item.id}`}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm rounded-lg mx-2 transition-colors ${
                        active
                          ? 'bg-[#247ba0]/10 text-[#247ba0] font-medium'
                          : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-border bg-card overflow-y-auto" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-card z-50 lg:hidden overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>
                Dashboard
              </span>
              <button onClick={onMobileClose} className="p-1 rounded hover:bg-muted" data-testid="sidebar-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
