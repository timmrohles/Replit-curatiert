import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/use-auth';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { DashboardSidebar } from './DashboardSidebar';
import { Menu } from 'lucide-react';

const API_BASE = '/api';

interface UserModule {
  moduleKey: string;
  enabled: boolean;
}

export function DashboardLayout() {
  const { t } = useTranslation();
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const userId = authUser?.id || 'demo-user-123';

  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUserModules();
  }, []);

  const loadUserModules = async () => {
    try {
      const res = await fetch(`${API_BASE}/user-modules?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.ok && data.data) {
        setUserModules(data.data.map((m: any) => ({
          moduleKey: m.module_key,
          enabled: true,
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

  const authorModuleKeys = ['author_storefront', 'author_books', 'author_community', 'author_bookclub', 'author_members', 'author_bonuscontent', 'author_newsletter', 'author_events', 'author_statistics'];
  const hasAnyAuthorModule = authorModuleKeys.some(k => hasModule(k));

  if (authLoading || loadingModules) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--header-bg, #F9FAFB)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#247ba0' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--header-bg, #F9FAFB)' }}>
        <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          {t('dashboardNav.loginRequired', 'Bitte melde dich an')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('dashboardNav.loginDescription', 'Du musst angemeldet sein, um dein Dashboard zu nutzen.')}
        </p>
        <button
          onClick={() => { window.location.href = '/api/login'; }}
          className="px-6 py-3 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#247ba0' }}
          data-testid="button-dashboard-login"
        >
          {t('dashboardNav.login', 'Anmelden')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--header-bg, #F9FAFB)' }}>
      <Header />

      <div className="flex-1 flex">
        <DashboardSidebar
          hasModule={hasModule}
          hasAnyAuthorModule={hasAnyAuthorModule}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-border">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-muted"
              data-testid="sidebar-toggle"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dashboard</span>
          </div>

          <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6">
            <Outlet context={{ hasModule, hasAnyAuthorModule, userId }} />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export interface DashboardOutletContext {
  hasModule: (key: string) => boolean;
  hasAnyAuthorModule: boolean;
  userId: string;
}
