import { useSafeNavigate } from '../../utils/routing';
import { Text } from '../ui/typography';
import { Facebook, Twitter, Instagram, Youtube, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

interface FooterLink {
  id: number;
  name: string;
  path: string;
  icon: string | null;
}

interface FooterGroup {
  id: number;
  name: string;
  slug: string;
  children: FooterLink[];
}

const FALLBACK_FOOTER_GROUPS: FooterGroup[] = [
  {
    id: -1,
    name: 'Kuratiert',
    slug: 'footer-kuratiert',
    children: [
      { id: -10, name: 'Über uns', path: '/ueber-uns', icon: null },
      { id: -11, name: 'Mission', path: '/mission', icon: null },
      { id: -12, name: 'FAQ', path: '/faq', icon: null },
      { id: -13, name: 'Admin', path: '/sys-mgmt-xK9/login', icon: 'Settings' },
    ]
  },
  {
    id: -2,
    name: 'Entdecken',
    slug: 'footer-entdecken',
    children: [
      { id: -20, name: 'Alle Kurator:innen', path: '/curators', icon: null },
      { id: -21, name: 'Alle Kurationen', path: '/kurationen', icon: null },
      { id: -22, name: 'Alle Bookstores', path: '/storefronts', icon: null },
      { id: -23, name: 'Alle Bücher', path: '/bücher', icon: null },
      { id: -24, name: 'Alle Autor:innen', path: '/authors', icon: null },
      { id: -25, name: 'Alle Verlage', path: '/publishers', icon: null },
      { id: -26, name: 'Alle Events', path: '/events', icon: null },
    ]
  },
  {
    id: -3,
    name: 'Alle Seiten',
    slug: 'footer-alle-seiten',
    children: [
      { id: -30, name: 'Startseite', path: '/', icon: null },
      { id: -31, name: 'Serien', path: '/series', icon: null },
      { id: -32, name: 'Dashboard', path: '/dashboard', icon: null },
    ]
  }
];

function useFooterNavigation() {
  return useQuery<{ success: boolean; data: FooterGroup[] }, Error, FooterGroup[]>({
    queryKey: ['/api/navigation/footer'],
    select: (response) => {
      if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return FALLBACK_FOOTER_GROUPS;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: { success: true, data: FALLBACK_FOOTER_GROUPS },
    throwOnError: false,
  });
}

export function Footer() {
  const navigate = useSafeNavigate();
  const { t } = useTranslation();
  const { data: footerGroups } = useFooterNavigation();
  const groups = footerGroups || FALLBACK_FOOTER_GROUPS;
  
  return (
    <>
      <div 
        className="py-4 px-6 text-center border-t border-b bg-surface-elevated border-[var(--color-border)]"
      >
        <Text variant="small" className="max-w-4xl mx-auto text-content-muted">
          <strong>{t('footer.affiliateTitle')}</strong> {t('footer.affiliateText')}
        </Text>
      </div>

      <footer className="bg-[#2a2a2a] text-white py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => navigate('/')}
                  className="text-left opacity-90 hover:opacity-100 transition-opacity"
                  data-testid="link-footer-home"
                >
                  <div className="flex flex-col gap-0">
                    <span className="text-[#247ba0] text-xs tracking-wide">
                      Bücher besser finden
                    </span>
                    <span
                      className="text-white text-3xl md:text-[2rem] lg:text-[2.3rem] uppercase leading-none"
                      style={{ fontFamily: "'League Gothic', sans-serif" }}
                    >
                      BACKLIST
                    </span>
                  </div>
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                {t('footer.description')}
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  className="text-white/70 hover:opacity-80 p-2 rounded-lg transition-opacity"
                  aria-label={t('footer.ariaLabel.facebook')}
                  data-testid="link-footer-facebook"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button
                  className="text-white/70 hover:opacity-80 p-2 rounded-lg transition-opacity"
                  aria-label={t('footer.ariaLabel.twitter')}
                  data-testid="link-footer-twitter"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button
                  className="text-white/70 hover:opacity-80 p-2 rounded-lg transition-opacity"
                  aria-label={t('footer.ariaLabel.instagram')}
                  data-testid="link-footer-instagram"
                >
                  <Instagram className="w-5 h-5" />
                </button>
                <button
                  className="text-white/70 hover:opacity-80 p-2 rounded-lg transition-opacity"
                  aria-label={t('footer.ariaLabel.youtube')}
                  data-testid="link-footer-youtube"
                >
                  <Youtube className="w-5 h-5" />
                </button>
              </div>
            </div>

            {groups.map((group) => (
              <div key={group.id} data-testid={`footer-group-${group.slug}`}>
                <h3 className="headline mb-4">{group.name}</h3>
                <ul className="space-y-2 text-sm">
                  {group.children.map((link) => (
                    <li key={link.id}>
                      <button 
                        onClick={() => navigate(link.path)}
                        className="text-gray-400 hover:opacity-80 transition-opacity text-left flex items-center gap-1.5"
                        data-testid={`link-footer-${link.path.replace(/\//g, '-').replace(/^-/, '')}`}
                      >
                        {link.icon === 'Settings' && <Settings className="w-3.5 h-3.5" />}
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-sm text-gray-400">
            <p className="flex items-center justify-center gap-2 flex-wrap">
              {t('footer.copyright', { year: new Date().getFullYear() })}
              {' '}
              <span className="hidden md:inline">·</span>
              {' '}
              <button 
                onClick={() => navigate('/impressum')} 
                className="text-gray-400 hover:opacity-80 transition-opacity underline"
                data-testid="link-footer-impressum"
              >
                {t('footer.impressum')}
              </button>
              {' '}
              <span className="hidden md:inline">·</span>
              {' '}
              <button 
                onClick={() => navigate('/datenschutz')}
                className="text-gray-400 hover:opacity-80 transition-opacity underline"
                data-testid="link-footer-datenschutz"
              >
                {t('footer.datenschutz')}
              </button>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
