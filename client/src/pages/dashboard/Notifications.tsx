import { useState } from 'react';
import { Bell, Settings, Check, Trash2, Heart, MessageSquare, BookOpen, Award, Mail } from 'lucide-react';

// Mock data
const mockNotifications = [
  {
    id: '1',
    type: 'review',
    icon: MessageSquare,
    title: 'Neue Rezension zu "Die Jahre"',
    message: 'Lena Kraus hat eine Rezension zu einem Buch geschrieben, das du auch bewertet hast.',
    time: '2 Stunden',
    read: false
  },
  {
    id: '2',
    type: 'follow',
    icon: Heart,
    title: 'Neuer Follower',
    message: 'Max Weber folgt dir jetzt.',
    time: '5 Stunden',
    read: false
  },
  {
    id: '3',
    type: 'book',
    icon: BookOpen,
    title: 'Neues Buch in deiner Kategorie',
    message: 'Ein neues Buch wurde in "Belletristik" veröffentlicht.',
    time: '1 Tag',
    read: true
  },
  {
    id: '4',
    type: 'award',
    icon: Award,
    title: 'Award gewonnen',
    message: 'Deine Rezension wurde als "Hilfreichste Rezension des Monats" ausgezeichnet!',
    time: '2 Tage',
    read: true
  }
];

export function DashboardNotifications() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'review': return '#247ba0';
      case 'follow': return '#EF4444';
      case 'book': return '#10B981';
      case 'award': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Benachrichtigungen
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          {unreadCount} ungelesene Benachrichtigung{unreadCount !== 1 ? 'en' : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5" style={{ color: '#247ba0' }} />
          <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>
            Alle Benachrichtigungen
          </span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:shadow-sm"
              style={{ backgroundColor: '#F3F4F6', color: '#247ba0' }}
            >
              <Check className="w-4 h-4" />
              Alle als gelesen markieren
            </button>
          )}
          <button
            className="p-2 rounded-lg transition-all duration-200"
            style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
            title="Einstellungen"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Keine Benachrichtigungen
            </h3>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Du hast keine neuen Benachrichtigungen.
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div 
                key={notification.id} 
                className="rounded-lg p-4"
                style={{ 
                  backgroundColor: notification.read ? 'transparent' : '#F0F9FF'
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${getIconColor(notification.type)}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: getIconColor(notification.type) }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="mb-1 font-medium" style={{ color: '#3A3A3A' }}>
                      {notification.title}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                      {notification.message}
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      vor {notification.time}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: '#F3F4F6' }}
                        title="Als gelesen markieren"
                      >
                        <Check className="w-4 h-4" style={{ color: '#10B981' }} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: '#F3F4F6' }}
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Settings Card */}
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Settings className="w-5 h-5" style={{ color: '#247ba0' }} />
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Benachrichtigungs-Einstellungen
          </h2>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer touch-manipulation" style={{ backgroundColor: '#F9FAFB' }}>
            <span className="text-sm" style={{ color: '#3A3A3A' }}>Neue Rezensionen</span>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer touch-manipulation" style={{ backgroundColor: '#F9FAFB' }}>
            <span className="text-sm" style={{ color: '#3A3A3A' }}>Neue Follower</span>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer touch-manipulation" style={{ backgroundColor: '#F9FAFB' }}>
            <span className="text-sm" style={{ color: '#3A3A3A' }}>Neue Bücher in meinen Kategorien</span>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer touch-manipulation" style={{ backgroundColor: '#F9FAFB' }}>
            <span className="text-sm" style={{ color: '#3A3A3A' }}>Awards und Auszeichnungen</span>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </label>
        </div>
      </div>

      {/* Newsletter Settings */}
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Mail className="w-5 h-5" style={{ color: '#F59E0B' }} />
          <h2 className="text-lg md:text-xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Newsletter & E-Mail
          </h2>
        </div>
        
        {/* DSGVO Hinweis */}
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
          <p className="text-xs" style={{ color: '#1E40AF' }}>
            <strong>Datenschutz:</strong> Deine E-Mail-Adresse wird ausschließlich für den Versand von Newslettern verwendet. 
            Du kannst dich jederzeit abmelden. Weitere Informationen findest du in unserer{' '}
            <a href="/datenschutz" className="underline hover:no-underline">Datenschutzerklärung</a>.
          </p>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-start justify-between p-3 rounded-lg cursor-pointer touch-manipulation" style={{ backgroundColor: '#F9FAFB' }}>
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Wöchentlicher Newsletter
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Erhalte jeden Montag kuratierte Buchempfehlungen
              </div>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="w-5 h-5 mt-1" 
              aria-label="Wöchentlichen Newsletter abonnieren"
            />
          </label>
          <label className="flex items-start justify-between p-3 rounded-lg cursor-pointer touch-manipulation" style={{ backgroundColor: '#F9FAFB' }}>
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Neue Veröffentlichungen
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Benachrichtigungen über Neuerscheinungen deiner Lieblingsautoren
              </div>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="w-5 h-5 mt-1"
              aria-label="Neue Veröffentlichungen abonnieren"
            />
          </label>
          <label className="flex items-start justify-between p-3 rounded-lg cursor-pointer touch-manipulation" style={{ backgroundColor: '#F9FAFB' }}>
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Persönliche Empfehlungen
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Basierend auf deinen Bewertungen und Interessen
              </div>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="w-5 h-5 mt-1"
              aria-label="Persönliche Empfehlungen abonnieren"
            />
          </label>
          <label className="flex items-start justify-between p-3 rounded-lg cursor-pointer touch-manipulation" style={{ backgroundColor: '#F9FAFB' }}>
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Events & Veranstaltungen
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Informationen zu Lesungen, Buchvorstellungen und mehr
              </div>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="w-5 h-5 mt-1"
              aria-label="Events & Veranstaltungen abonnieren"
            />
          </label>
          <label className="flex items-start justify-between p-3 rounded-lg cursor-pointer touch-manipulation" style={{ backgroundColor: '#F9FAFB' }}>
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>
                Marketing & Angebote
              </div>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Spezielle Angebote und Werbeaktionen
              </div>
            </div>
            <input 
              type="checkbox" 
              className="w-5 h-5 mt-1"
              aria-label="Marketing & Angebote abonnieren"
            />
          </label>
        </div>
      </div>
    </div>
  );
}