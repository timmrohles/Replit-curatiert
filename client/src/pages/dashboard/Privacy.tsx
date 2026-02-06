import { useState } from 'react';
import { Shield, Eye, Lock, Download, AlertCircle } from 'lucide-react';

export function DashboardPrivacy() {
  const [settings, setSettings] = useState({
    profilePublic: true,
    showEmail: false,
    showRatings: true,
    showReviews: true,
    showFollows: true,
    allowMessages: true,
    dataCollection: true,
    cookieConsent: true
  });

  const updateSetting = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Datenschutz
        </h1>
        <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
          Verwalte deine Privatsphäre-Einstellungen und Daten
        </p>
      </div>

      {/* DSGVO Info Banner */}
      <div 
        className="rounded-lg p-4 border"
        style={{ 
          backgroundColor: '#EFF6FF',
          borderColor: '#BFDBFE'
        }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
          <div>
            <h3 className="font-medium mb-1 text-sm md:text-base" style={{ color: '#1E3A8A' }}>
              Deine Daten, deine Kontrolle
            </h3>
            <p className="text-xs md:text-sm" style={{ color: '#1E40AF' }}>
              Wir respektieren deine Privatsphäre. Alle Einstellungen entsprechen der DSGVO. 
              Du hast jederzeit das Recht auf Auskunft, Berichtigung und Löschung deiner Daten.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="rounded-lg p-4 md:p-6 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#EEF2FF' }}>
            <Eye className="w-5 h-5" style={{ color: '#247ba0' }} />
          </div>
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Profil-Sichtbarkeit
          </h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-start md:items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer border touch-manipulation" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex-1 pr-3">
              <div className="text-xs md:text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Öffentliches Profil
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Andere Nutzer können dein Profil sehen
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.profilePublic}
              onChange={() => updateSetting('profilePublic')}
              className="w-5 h-5 flex-shrink-0" 
            />
          </label>

          <label className="flex items-start md:items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer border touch-manipulation" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex-1 pr-3">
              <div className="text-xs md:text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                E-Mail-Adresse anzeigen
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Zeige deine E-Mail-Adresse in deinem Profil
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.showEmail}
              onChange={() => updateSetting('showEmail')}
              className="w-5 h-5 flex-shrink-0" 
            />
          </label>

          <label className="flex items-start md:items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer border touch-manipulation" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex-1 pr-3">
              <div className="text-xs md:text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Bewertungen anzeigen
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Andere können deine Bewertungen sehen
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.showRatings}
              onChange={() => updateSetting('showRatings')}
              className="w-5 h-5 flex-shrink-0" 
            />
          </label>

          <label className="flex items-start md:items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer border touch-manipulation" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex-1 pr-3">
              <div className="text-xs md:text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Rezensionen anzeigen
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Andere können deine Rezensionen lesen
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.showReviews}
              onChange={() => updateSetting('showReviews')}
              className="w-5 h-5 flex-shrink-0" 
            />
          </label>

          <label className="flex items-start md:items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer border touch-manipulation" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex-1 pr-3">
              <div className="text-xs md:text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Favoriten anzeigen
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Zeige deine Favoriten öffentlich
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.showFollows}
              onChange={() => updateSetting('showFollows')}
              className="w-5 h-5 flex-shrink-0" 
            />
          </label>

          <label className="flex items-start md:items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer border touch-manipulation" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex-1 pr-3">
              <div className="text-xs md:text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Nachrichten erlauben
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Andere Nutzer können dir Nachrichten senden
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.allowMessages}
              onChange={() => updateSetting('allowMessages')}
              className="w-5 h-5 flex-shrink-0" 
            />
          </label>
        </div>
      </div>

      {/* Data Collection & Cookies */}
      <div className="rounded-lg p-4 md:p-6 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#DBEAFE' }}>
            <Shield className="w-5 h-5" style={{ color: '#3B82F6' }} />
          </div>
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Datenerfassung & Cookies
          </h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-start md:items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer border touch-manipulation" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex-1 pr-3">
              <div className="text-xs md:text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Funktionale Cookies
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Erforderlich für die Nutzung der Plattform (können nicht deaktiviert werden)
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={true}
              disabled
              className="w-5 h-5 flex-shrink-0 opacity-50" 
            />
          </label>

          <label className="flex items-start md:items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer border touch-manipulation" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex-1 pr-3">
              <div className="text-xs md:text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Analytische Cookies
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Helfen uns die Plattform zu verbessern (anonymisierte Daten)
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.dataCollection}
              onChange={() => updateSetting('dataCollection')}
              className="w-5 h-5 flex-shrink-0" 
            />
          </label>

          <label className="flex items-start md:items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer border touch-manipulation" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex-1 pr-3">
              <div className="text-xs md:text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Marketing Cookies
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Für personalisierte Werbung und Inhalte
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.cookieConsent}
              onChange={() => updateSetting('cookieConsent')}
              className="w-5 h-5 flex-shrink-0" 
            />
          </label>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-lg p-4 md:p-6 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
            <Lock className="w-5 h-5" style={{ color: '#F59E0B' }} />
          </div>
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Daten-Management (DSGVO)
          </h2>
        </div>

        <div className="space-y-3">
          <button
            className="w-full flex items-center justify-between p-3 md:p-4 rounded-lg border transition-all duration-200 hover:shadow-md touch-manipulation"
            style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5" style={{ color: '#247ba0' }} />
              <div className="text-left">
                <div className="text-xs md:text-sm font-medium" style={{ color: '#3A3A3A' }}>
                  Daten exportieren
                </div>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Lade eine vollständige Kopie deiner Daten herunter
                </div>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}>
              DSGVO
            </span>
          </button>

          <button
            className="w-full flex items-center justify-between p-3 md:p-4 rounded-lg border transition-all duration-200 hover:shadow-md touch-manipulation"
            style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: '#10B981' }} />
              <div className="text-left">
                <div className="text-xs md:text-sm font-medium" style={{ color: '#3A3A3A' }}>
                  Datenschutzerklärung ansehen
                </div>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Erfahre mehr über unsere Datenschutzrichtlinien
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
