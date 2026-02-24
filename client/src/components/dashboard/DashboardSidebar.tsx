import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSafeNavigate } from '../../utils/routing';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

interface SidebarItem {
  id: string;
  path: string;
  label: string;
  moduleKey?: string;
}

interface SidebarGroup {
  id: string;
  label: string;
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
      label: t('dashboardNav.overview', 'ÜBERSICHT'),
      defaultOpen: true,
      items: [
        { id: 'home', path: '/dashboard', label: t('dashboardNav.home', 'Start') },
      ]
    },
    {
      id: 'content',
      label: t('dashboardNav.myContent', 'MEINE INHALTE'),
      defaultOpen: true,
      items: [
        { id: 'kurationen', path: '/dashboard/kurationen', label: t('dashboardNav.kurationen', 'Kurationen') },
        { id: 'rezensionen', path: '/dashboard/rezensionen', label: t('dashboardNav.rezensionen', 'Rezensionen') },
        { id: 'bewertungen', path: '/dashboard/bewertungen', label: t('dashboardNav.bewertungen', 'Bewertungen') },
        { id: 'buchhandlung', path: '/dashboard/buchhandlung', label: t('dashboardNav.buchhandlung', 'Buchhandlung'), moduleKey: 'creator_storefront' },
        { id: 'content-quellen', path: '/dashboard/content-quellen', label: t('dashboardNav.contentSources', 'Content-Quellen'), moduleKey: 'creator_storefront' },
      ]
    },
    {
      id: 'community',
      label: t('dashboardNav.community', 'COMMUNITY'),
      defaultOpen: false,
      items: [
        { id: 'oeffentliches-profil', path: '/dashboard/oeffentliches-profil', label: t('dashboardNav.publicProfile', 'Öffentliches Profil') },
        { id: 'feed', path: '/dashboard/feed', label: t('dashboardNav.feed', 'Feed') },
        { id: 'veranstaltungen', path: '/dashboard/veranstaltungen', label: t('dashboardNav.events', 'Veranstaltungen') },
      ]
    },
    {
      id: 'earnings',
      label: t('dashboardNav.earnings', 'EINNAHMEN'),
      defaultOpen: false,
      items: [
        { id: 'einnahmen', path: '/dashboard/einnahmen', label: t('dashboardNav.earningsOverview', 'Übersicht') },
        { id: 'einnahmen-affiliate', path: '/dashboard/einnahmen/affiliate', label: t('dashboardNav.affiliate', 'Affiliate-Programm') },
        { id: 'einnahmen-statistiken', path: '/dashboard/einnahmen/statistiken', label: t('dashboardNav.statistics', 'Statistiken') },
      ]
    },
    {
      id: 'settings',
      label: t('dashboardNav.settings', 'EINSTELLUNGEN'),
      defaultOpen: false,
      items: [
        { id: 'profil', path: '/dashboard/profil', label: t('dashboardNav.myData', 'Meine Daten') },
        { id: 'benachrichtigungen', path: '/dashboard/benachrichtigungen', label: t('dashboardNav.notifications', 'Benachrichtigungen') },
        { id: 'datenschutz', path: '/dashboard/datenschutz', label: t('dashboardNav.privacy', 'Datenschutz') },
      ]
    },
  ];

  if (hasAnyAuthorModule) {
    groups.push({
      id: 'author',
      label: t('dashboardNav.author', 'AUTOR:IN'),
      defaultOpen: false,
      items: [
        { id: 'autor-buecher', path: '/dashboard/autor/buecher', label: t('dashboardNav.authorBooks', 'Meine Bücher'), moduleKey: 'author_books' },
        { id: 'autor-buchklub', path: '/dashboard/autor/buchklub', label: t('dashboardNav.authorBookclub', 'Buchklub'), moduleKey: 'author_bookclub' },
        { id: 'autor-bonusinhalte', path: '/dashboard/autor/bonusinhalte', label: t('dashboardNav.authorBonus', 'Bonusinhalte'), moduleKey: 'author_bonuscontent' },
        { id: 'autor-newsletter', path: '/dashboard/autor/newsletter', label: t('dashboardNav.authorNewsletter', 'Newsletter'), moduleKey: 'author_newsletter' },
      ].filter(item => !item.moduleKey || hasModule(item.moduleKey))
    });
  } else {
    groups.push({
      id: 'author',
      label: t('dashboardNav.author', 'AUTOR:IN'),
      defaultOpen: false,
      items: [
        { id: 'autor-werden', path: '/dashboard/autor-werden', label: t('dashboardNav.becomeAuthor', 'Autor:in werden') },
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
    <nav className="flex flex-col gap-0.5 pt-8 pb-6 px-3" data-testid="dashboard-sidebar">
      {filteredGroups.map(group => {
        const isOpen = openGroups[group.id] ?? false;

        return (
          <div key={group.id} className="mb-1.5">
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors hover:bg-black/[0.04]"
              data-testid={`sidebar-group-${group.id}`}
            >
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: '#4B5563', letterSpacing: '0.06em' }}
              >
                {group.label}
              </span>
              {isOpen
                ? <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                : <ChevronRight className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              }
            </button>

            {isOpen && (
              <div className="mt-0.5 space-y-0.5">
                {group.items.map(item => {
                  const isActive = activePath === item.path || (item.path !== '/dashboard' && activePath.startsWith(item.path + '/'));
                  const isExactHome = item.path === '/dashboard' && activePath === '/dashboard';
                  const active = isActive || isExactHome;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      data-testid={`sidebar-item-${item.id}`}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        active
                          ? 'font-medium'
                          : 'hover:bg-black/[0.04]'
                      }`}
                      style={active
                        ? { backgroundColor: '#247ba0', color: '#FFFFFF' }
                        : { color: '#374151' }
                      }
                    >
                      {item.label}
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
      <aside
        className="hidden lg:block w-56 flex-shrink-0 border-r overflow-y-auto"
        style={{ borderColor: '#E5E7EB', minHeight: 'calc(100vh - 64px)' }}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>
                Dashboard
              </span>
              <button onClick={onMobileClose} className="p-1.5 rounded-md hover:bg-black/5 transition-colors" data-testid="sidebar-close">
                <X className="w-4 h-4" style={{ color: '#374151' }} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
