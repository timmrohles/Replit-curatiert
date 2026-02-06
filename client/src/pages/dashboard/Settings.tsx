import { User, AlertTriangle } from 'lucide-react';

export function DashboardSettings() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Einstellungen
        </h1>
        <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
          Verwalte deine Account-Einstellungen
        </p>
      </div>

      {/* Account Settings */}
      <div className="rounded-lg p-4 md:p-6 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <User className="w-5 h-5" style={{ color: '#247ba0' }} />
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Account-Einstellungen
          </h2>
        </div>
        
        <div className="space-y-3 md:space-y-4">
          <div className="p-3 md:p-4 rounded-lg hover:shadow-sm transition-all cursor-pointer" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium mb-1 text-sm md:text-base" style={{ color: '#3A3A3A' }}>
                  E-Mail-Adresse
                </div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
                  anna.mueller@example.com
                </div>
              </div>
              <button className="text-xs md:text-sm whitespace-nowrap" style={{ color: '#247ba0' }}>
                Ändern →
              </button>
            </div>
          </div>

          <div className="p-3 md:p-4 rounded-lg hover:shadow-sm transition-all cursor-pointer" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium mb-1 text-sm md:text-base" style={{ color: '#3A3A3A' }}>
                  Passwort
                </div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
                  Zuletzt geändert vor 3 Monaten
                </div>
              </div>
              <button className="text-xs md:text-sm whitespace-nowrap" style={{ color: '#247ba0' }}>
                Ändern →
              </button>
            </div>
          </div>

          <div className="p-3 md:p-4 rounded-lg hover:shadow-sm transition-all cursor-pointer" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium mb-1 text-sm md:text-base" style={{ color: '#3A3A3A' }}>
                  Sprache
                </div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
                  Deutsch
                </div>
              </div>
              <button className="text-xs md:text-sm whitespace-nowrap" style={{ color: '#247ba0' }}>
                Ändern →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg p-4 md:p-6 shadow-sm border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <AlertTriangle className="w-5 h-5" style={{ color: '#EF4444' }} />
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#991B1B' }}>
            Gefahrenbereich
          </h2>
        </div>
        
        <div className="space-y-3 md:space-y-4">
          <div className="p-3 md:p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-medium mb-1 text-sm md:text-base" style={{ color: '#991B1B' }}>
                  Account deaktivieren
                </div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
                  Dein Account wird vorübergehend deaktiviert und kann später wiederhergestellt werden
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg text-xs md:text-sm border whitespace-nowrap" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
                Deaktivieren
              </button>
            </div>
          </div>

          <div className="p-3 md:p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-medium mb-1 text-sm md:text-base" style={{ color: '#991B1B' }}>
                  Account löschen
                </div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
                  Alle deine Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                </div>
              </div>
              <button 
                className="px-4 py-2 rounded-lg text-xs md:text-sm text-white whitespace-nowrap"
                style={{ backgroundColor: '#EF4444' }}
                onClick={() => {
                  if (confirm('Möchtest du deinen Account wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
                    // Delete account logic
                    alert('Account-Löschung würde hier ausgeführt werden');
                  }
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>

        {/* DSGVO Info */}
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
          <p className="text-xs" style={{ color: '#1E40AF' }}>
            <strong>Deine Rechte:</strong> Nach DSGVO hast du das Recht auf Auskunft, Berichtigung und Löschung deiner Daten. 
            Weitere Informationen findest du in unserer{' '}
            <a href="/datenschutz" className="underline hover:no-underline">Datenschutzerklärung</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
