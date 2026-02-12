import { useSafeNavigate } from '../../utils/routing';
import { CoRatiertLogo } from '../common/CoRatiertLogo';
import { Text } from '../ui/typography';
import { Facebook, Twitter, Instagram, Youtube, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const navigate = useSafeNavigate();
  const { t } = useTranslation();
  
  return (
    <>
      {/* Affiliate Disclaimer */}
      <div 
        className="py-4 px-6 text-center border-t border-b bg-surface-elevated border-[var(--color-border)]"
      >
        <Text variant="small" className="max-w-4xl mx-auto text-content-muted">
          <strong>{t('footer.affiliateTitle')}</strong> {t('footer.affiliateText')}
        </Text>
      </div>

      {/* Footer bleibt immer dunkel */}
      <footer className="bg-[#2a2a2a] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => navigate('/')}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <div className="flex flex-col gap-0.5">
                    {/* Subtitle line above logo - Typography System */}
                    <Text 
                      as="p"
                      variant="xs"
                      className="origin-left text-[#247ba0] scale-x-93"
                    >
                      {t('footer.tagline')}
                    </Text>
                    {/* Lowercase logo */}
                    <CoRatiertLogo 
                      size="lg" 
                      className="text-2xl md:text-[1.7rem] lg:text-[1.9rem]"
                    />
                  </div>
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                {t('footer.description')}
              </p>
              
              {/* Social Icons */}
              <div className="flex items-center gap-2">
                <button
                  className="hover:bg-white/10 text-white p-2 rounded-lg transition-colors"
                  aria-label={t('footer.ariaLabel.facebook')}
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button
                  className="hover:bg-white/10 text-white p-2 rounded-lg transition-colors"
                  aria-label={t('footer.ariaLabel.twitter')}
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button
                  className="hover:bg-white/10 text-white p-2 rounded-lg transition-colors"
                  aria-label={t('footer.ariaLabel.instagram')}
                >
                  <Instagram className="w-5 h-5" />
                </button>
                <button
                  className="hover:bg-white/10 text-white p-2 rounded-lg transition-colors"
                  aria-label={t('footer.ariaLabel.youtube')}
                >
                  <Youtube className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Kuratiert */}
            <div>
              <h3 className="headline mb-4">{t('footer.curated')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => navigate('/ueber-uns')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.aboutUs')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/mission')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.mission')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/faq')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.faq')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/sys-mgmt-xK9/login')}
                    className="text-gray-400 transition-colors hover:text-white text-left flex items-center gap-1.5"
                    title="Admin Login"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {t('footer.admin')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Entdecken */}
            <div>
              <h3 className="headline mb-4">{t('footer.discover')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => navigate('/curators')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.allCurators')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/kurationen')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.allCurations')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/storefronts')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.storefronts')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/bücher')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.allBooks')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/authors')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.authors')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/publishers')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.publishers')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/events')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.events')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Alle Seiten */}
            <div>
              <h3 className="headline mb-4">{t('footer.allPages')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => navigate('/')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.homepage')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/series')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.series')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/curators')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.curators')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/storefronts')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.storefronts')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    {t('footer.dashboard')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/old-homepage')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Alte Startseite
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 text-center text-sm text-gray-400">
            <p className="flex items-center justify-center gap-2 flex-wrap">
              {t('footer.copyright', { year: new Date().getFullYear() })}
              {' '}
              <span className="hidden md:inline">·</span>
              {' '}
              <button 
                onClick={() => navigate('/impressum')} 
                className="text-gray-400 hover:text-white transition-colors underline"
              >
                {t('footer.impressum')}
              </button>
              {' '}
              <span className="hidden md:inline">·</span>
              {' '}
              <button 
                onClick={() => navigate('/datenschutz')}
                className="text-gray-400 hover:text-white transition-colors underline"
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
