import { useState } from 'react';
import { User, Globe, Save, BookOpen, Mail, Phone, Lock, AlertTriangle } from 'lucide-react';

export function DashboardProfile() {
  const [profile, setProfile] = useState({
    firstName: 'Anna',
    lastName: 'Müller',
    email: 'anna.mueller@example.com',
    phone: '+49 151 12345678',
    language: 'de',
    country: 'DE'
  });

  const [preferredGenres, setPreferredGenres] = useState<string[]>(['Belletristik', 'Sachbuch', 'Politik']);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const availableGenres = [
    'Belletristik',
    'Sachbuch',
    'Politik & Gesellschaft',
    'Queere Literatur',
    'Fantasy & Science Fiction',
    'Kinder & Jugend',
    'Lyrik',
    'Biografien',
    'Geschichte',
    'Philosophie'
  ];

  const handleSave = () => {
    console.log('Profil gespeichert:', profile, preferredGenres);
    alert('Profil gespeichert!');
  };

  const toggleGenre = (genre: string) => {
    if (preferredGenres.includes(genre)) {
      setPreferredGenres(preferredGenres.filter(g => g !== genre));
    } else {
      setPreferredGenres([...preferredGenres, genre]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Meine Daten
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Verwalte deine persönlichen Informationen und Einstellungen
        </p>
      </div>

      <div 
        className="rounded-lg p-6"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#EEF2FF' }}>
            <User className="w-5 h-5" style={{ color: '#247ba0' }} />
          </div>
          <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Persönliche Informationen
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="firstName" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Vorname
            </label>
            <input
              id="firstName"
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="lastName" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Nachname
            </label>
            <input
              id="lastName"
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              E-Mail
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2 pl-10 rounded-lg border transition-colors"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            </div>
          </div>

          <div>
            <label 
              htmlFor="phone" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Telefon
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2 pl-10 rounded-lg border transition-colors"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            </div>
          </div>
        </div>
      </div>

      <div 
        className="rounded-lg p-6"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
            <Globe className="w-5 h-5" style={{ color: '#F59E0B' }} />
          </div>
          <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Sprache & Region
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="language" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Sprache
            </label>
            <select
              id="language"
              value={profile.language}
              onChange={(e) => setProfile({ ...profile, language: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label 
              htmlFor="country" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#3A3A3A' }}
            >
              Land
            </label>
            <select
              id="country"
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
            >
              <option value="DE">Deutschland</option>
              <option value="AT">Österreich</option>
              <option value="CH">Schweiz</option>
            </select>
          </div>
        </div>
      </div>

      <div 
        className="rounded-lg p-6"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#DBEAFE' }}>
            <BookOpen className="w-5 h-5" style={{ color: '#247ba0' }} />
          </div>
          <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Lieblingsgenres
          </h2>
        </div>

        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
          Wähle deine bevorzugten Genres aus, um personalisierte Empfehlungen zu erhalten.
        </p>

        <div className="flex flex-wrap gap-2">
          {availableGenres.map((genre) => {
            const isSelected = preferredGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? '#247ba0' : '#F3F4F6',
                  color: isSelected ? '#FFFFFF' : '#3A3A3A',
                  border: `1px solid ${isSelected ? '#247ba0' : '#E5E7EB'}`
                }}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <p className="text-xs mt-4" style={{ color: '#9CA3AF' }}>
          {preferredGenres.length} Genre{preferredGenres.length !== 1 ? 's' : ''} ausgewählt
        </p>
      </div>

      <div 
        className="rounded-lg p-6"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
              <Lock className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <h2 className="text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Passwort ändern
            </h2>
          </div>
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: showPasswordSection ? '#F3F4F6' : '#247ba0',
              color: showPasswordSection ? '#3A3A3A' : '#FFFFFF'
            }}
          >
            {showPasswordSection ? 'Abbrechen' : 'Passwort ändern'}
          </button>
        </div>

        {showPasswordSection && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="currentPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#3A3A3A' }}
              >
                Aktuelles Passwort
              </label>
              <input
                id="currentPassword"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="newPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#3A3A3A' }}
              >
                Neues Passwort
              </label>
              <input
                id="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#3A3A3A' }}
              >
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  borderColor: '#D1D5DB',
                  color: '#3A3A3A'
                }}
              />
              <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                Mindestens 8 Zeichen, Groß- und Kleinbuchstaben, Zahlen
              </p>
            </div>
          </div>
        )}

        {!showPasswordSection && (
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Klicke auf "Passwort ändern", um dein Passwort zu aktualisieren.
          </p>
        )}
      </div>

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
              <button
                data-testid="button-deactivate-account"
                className="px-4 py-2 rounded-lg text-xs md:text-sm border whitespace-nowrap"
                style={{ borderColor: '#EF4444', color: '#EF4444' }}
              >
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
                data-testid="button-delete-account"
                className="px-4 py-2 rounded-lg text-xs md:text-sm text-white whitespace-nowrap"
                style={{ backgroundColor: '#EF4444' }}
                onClick={() => {
                  if (confirm('Möchtest du deinen Account wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
                    alert('Account-Löschung würde hier ausgeführt werden');
                  }
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
          <p className="text-xs" style={{ color: '#1E40AF' }}>
            <strong>Deine Rechte:</strong> Nach DSGVO hast du das Recht auf Auskunft, Berichtigung und Löschung deiner Daten. 
            Weitere Informationen findest du in unserer{' '}
            <a href="/datenschutz" className="underline hover:no-underline" data-testid="link-datenschutz">Datenschutzerklärung</a>.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
          style={{
            backgroundColor: '#247ba0',
            color: '#FFFFFF'
          }}
        >
          <Save className="w-5 h-5" />
          Änderungen speichern
        </button>
      </div>
    </div>
  );
}