import React from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { CoRatiertLogo } from '../common/CoRatiertLogo';
import { Text } from '../ui/typography';
import { Facebook, Twitter, Instagram, Youtube, Settings } from 'lucide-react';

export function Footer() {
  const navigate = useSafeNavigate();
  
  return (
    <>
      {/* Affiliate Disclaimer */}
      <div 
        className="py-4 px-6 text-center border-t border-b bg-surface-elevated border-[var(--color-border)]"
      >
        <Text variant="sm" className="max-w-4xl mx-auto text-content-muted">
          <strong>Hinweis zu Affiliate-Links:</strong> Bei Käufen über unsere Links erhalten wir eine Provision. Für dich entstehen keine Mehrkosten. 
          Die Provision hilft uns, diese Plattform zu betreiben und weiterhin kuratierte Buchempfehlungen anzubieten.
        </Text>
      </div>

      {/* Footer bleibt immer dunkel */}
      <footer className="bg-[#2a2a2a] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-8">
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
                      className="origin-left text-[#247ba0]"
                      style={{ transform: 'scaleX(0.93)' }}
                    >
                      Ausgezeichnete Bücher
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
                Kuratierte Buchempfehlungen von deinen Lieblings-Kurator*innen
              </p>
              
              {/* Social Icons */}
              <div className="flex items-center gap-2">
                <button
                  className="hover:bg-white/10 text-white p-2 rounded-lg transition-colors"
                  aria-label="Facebook folgen"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button
                  className="hover:bg-white/10 text-white p-2 rounded-lg transition-colors"
                  aria-label="Twitter folgen"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button
                  className="hover:bg-white/10 text-white p-2 rounded-lg transition-colors"
                  aria-label="Instagram folgen"
                >
                  <Instagram className="w-5 h-5" />
                </button>
                <button
                  className="hover:bg-white/10 text-white p-2 rounded-lg transition-colors"
                  aria-label="YouTube folgen"
                >
                  <Youtube className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Kuratiert */}
            <div>
              <h3 className="headline mb-4">Kuratiert</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => navigate('/ueber-uns')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Über uns
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/mission')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Mission
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/faq')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/sys-mgmt-xK9/login')}
                    className="text-gray-400 transition-colors hover:text-white text-left flex items-center gap-1.5"
                    title="Admin Login"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Admin
                  </button>
                </li>
              </ul>
            </div>

            {/* Entdecken */}
            <div>
              <h3 className="headline mb-4">Entdecken</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => navigate('/curators')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Alle Kurator*innen
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/storefronts')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Alle Kurationen
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/events')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Events
                  </button>
                </li>
              </ul>
            </div>

            {/* Alle Seiten - NEU */}
            <div>
              <h3 className="headline mb-4">Alle Seiten</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => navigate('/')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Startseite
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/bücher')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Alle Bücher
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/authors')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Autor*innen
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/publishers')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Verlage
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/series')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Buchreihen
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/curators')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Kurator*innen
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/storefronts')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Storefronts
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/events')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Events
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/ueber-uns')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Über uns
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/mission')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Mission
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/faq')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/creator-dashboard')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Creator Dashboard
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
                <li>
                  <button 
                    onClick={() => navigate('/backend-health')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Backend Health
                  </button>
                </li>
              </ul>
            </div>

            {/* Rechtliches */}
            <div>
              <h3 className="headline mb-4">Rechtliches</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => navigate('/impressum')} 
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Impressum
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/datenschutz')}
                    className="text-gray-400 transition-colors hover:text-white text-left"
                  >
                    Datenschutz
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 text-center text-sm text-gray-400">
            <p className="flex items-center justify-center gap-2 flex-wrap">
              © 2025 <CoRatiertLogo size="sm" />. Alle Rechte vorbehalten.
              {' '}
              <span className="hidden md:inline">·</span>
              {' '}
              <button 
                onClick={() => navigate('/impressum')} 
                className="text-gray-400 hover:text-white transition-colors underline"
              >
                Impressum
              </button>
              {' '}
              <span className="hidden md:inline">·</span>
              {' '}
              <button 
                onClick={() => navigate('/datenschutz')}
                className="text-gray-400 hover:text-white transition-colors underline"
              >
                Datenschutz
              </button>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}