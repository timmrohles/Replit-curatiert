import { useState, useEffect } from 'react';
import { X, Cookie, Settings } from 'lucide-react';
import { Button } from '../ui/button';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(necessaryOnly));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const savedPreferences = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(savedPreferences));
    setIsVisible(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Necessary cookies can't be disabled
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {!showSettings ? (
          // Simple Banner View
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Cookie className="w-8 h-8" style={{ color: '#ffe066' }} />
              </div>
              
              <div className="flex-1">
                <h3
                  className="text-xl md:text-2xl mb-3"
                  style={{
                    fontFamily: 'Fjalla One, sans-serif',
                    color: '#3A3A3A',
                  }}
                >
                  Wir verwenden Cookies
                </h3>
                
                <p className="text-sm md:text-base mb-4" style={{ color: '#3A3A3A' }}>
                  Wir verwenden Cookies und ähnliche Technologien, um die Funktionalität unserer Website zu gewährleisten 
                  und Ihr Nutzererlebnis zu verbessern. Mit Ihrer Zustimmung analysieren wir die Nutzung unserer Website 
                  und können personalisierte Inhalte anzeigen. Sie können Ihre Einwilligung jederzeit widerrufen.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-none h-11 px-6 rounded-xl text-white transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: '#f25f5c',
                      fontFamily: 'Fjalla One, sans-serif',
                    }}
                  >
                    Alle akzeptieren
                  </Button>
                  
                  <Button
                    onClick={handleAcceptNecessary}
                    className="flex-1 sm:flex-none h-11 px-6 rounded-xl transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: '#247ba0',
                      color: 'white',
                      fontFamily: 'Fjalla One, sans-serif',
                    }}
                  >
                    Nur notwendige
                  </Button>
                  
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    className="flex-1 sm:flex-none h-11 px-6 rounded-xl border-2 transition-all hover:scale-105"
                    style={{ 
                      borderColor: '#3A3A3A',
                      color: '#3A3A3A',
                      fontFamily: 'Fjalla One, sans-serif',
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Einstellungen
                  </Button>
                </div>

                <div className="mt-4 text-xs" style={{ color: '#666' }}>
                  Mehr Informationen finden Sie in unserer{' '}
                  <a 
                    href="/datenschutz" 
                    className="underline hover:no-underline"
                    style={{ color: '#247ba0' }}
                  >
                    Datenschutzerklärung
                  </a>
                  {' '}und im{' '}
                  <a 
                    href="/impressum" 
                    className="underline hover:no-underline"
                    style={{ color: '#247ba0' }}
                  >
                    Impressum
                  </a>
                  .
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Detailed Settings View
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <h3
                className="text-xl md:text-2xl"
                style={{
                  fontFamily: 'Fjalla One, sans-serif',
                  color: '#3A3A3A',
                }}
              >
                Cookie-Einstellungen
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" style={{ color: '#3A3A3A' }} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary Cookies */}
              <div className="border-2 rounded-xl p-4" style={{ borderColor: '#E0E0E0' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4
                    className="text-lg"
                    style={{
                      fontFamily: 'Fjalla One, sans-serif',
                      color: '#3A3A3A',
                    }}
                  >
                    Notwendige Cookies
                  </h4>
                  <div
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: '#E0E0E0',
                      color: '#3A3A3A',
                      fontFamily: 'Fjalla One, sans-serif',
                    }}
                  >
                    Immer aktiv
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#666' }}>
                  Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden. 
                  Sie speichern z.B. Ihre Cookie-Präferenzen und Warenkorbinhalte.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="border-2 rounded-xl p-4" style={{ borderColor: '#E0E0E0' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4
                    className="text-lg"
                    style={{
                      fontFamily: 'Fjalla One, sans-serif',
                      color: '#3A3A3A',
                    }}
                  >
                    Analyse-Cookies
                  </h4>
                  <button
                    onClick={() => togglePreference('analytics')}
                    className="relative w-14 h-7 rounded-full transition-colors"
                    style={{
                      backgroundColor: preferences.analytics ? '#70c1b3' : '#E0E0E0',
                    }}
                  >
                    <div
                      className="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md"
                      style={{
                        transform: preferences.analytics ? 'translateX(30px)' : 'translateX(4px)',
                      }}
                    />
                  </button>
                </div>
                <p className="text-sm" style={{ color: '#666' }}>
                  Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, 
                  indem Informationen anonym gesammelt und analysiert werden.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="border-2 rounded-xl p-4" style={{ borderColor: '#E0E0E0' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4
                    className="text-lg"
                    style={{
                      fontFamily: 'Fjalla One, sans-serif',
                      color: '#3A3A3A',
                    }}
                  >
                    Marketing-Cookies
                  </h4>
                  <button
                    onClick={() => togglePreference('marketing')}
                    className="relative w-14 h-7 rounded-full transition-colors"
                    style={{
                      backgroundColor: preferences.marketing ? '#70c1b3' : '#E0E0E0',
                    }}
                  >
                    <div
                      className="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md"
                      style={{
                        transform: preferences.marketing ? 'translateX(30px)' : 'translateX(4px)',
                      }}
                    />
                  </button>
                </div>
                <p className="text-sm" style={{ color: '#666' }}>
                  Diese Cookies werden verwendet, um Werbung relevanter für Sie und Ihre Interessen zu machen. 
                  Sie werden auch verwendet, um die Häufigkeit von Werbeanzeigen zu begrenzen.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSavePreferences}
                className="flex-1 h-11 px-6 rounded-xl text-white transition-all hover:scale-105"
                style={{ 
                  backgroundColor: '#f25f5c',
                  fontFamily: 'Fjalla One, sans-serif',
                }}
              >
                Auswahl speichern
              </Button>
              
              <Button
                onClick={handleAcceptAll}
                className="flex-1 h-11 px-6 rounded-xl transition-all hover:scale-105"
                style={{ 
                  backgroundColor: '#247ba0',
                  color: 'white',
                  fontFamily: 'Fjalla One, sans-serif',
                }}
              >
                Alle akzeptieren
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
