import { useState, useEffect, useCallback } from 'react';
import { Bell, Settings, Check, Trash2, Heart, MessageSquare, BookOpen, Award, Mail, Calendar, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/use-auth';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';
import { DashboardEmptyState } from '../../components/dashboard/DashboardEmptyState';

const API_BASE = '/api';

interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function getIconForType(type: string) {
  switch (type) {
    case 'review': return MessageSquare;
    case 'follow': return Heart;
    case 'book': return BookOpen;
    case 'award': return Award;
    case 'event_cancelled':
    case 'event_message':
    case 'event_rescheduled':
    case 'event_reminder': return Calendar;
    default: return Bell;
  }
}

function getIconColor(type: string): string {
  switch (type) {
    case 'review': return '#247ba0';
    case 'follow': return '#EF4444';
    case 'book': return '#10B981';
    case 'award': return '#F59E0B';
    case 'event_cancelled': return '#EF4444';
    case 'event_message': return '#3B82F6';
    case 'event_rescheduled': return '#F59E0B';
    case 'event_reminder': return '#8B5CF6';
    default: return '#6B7280';
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'gerade eben';
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'vor 1 Tag';
  if (diffDays < 30) return `vor ${diffDays} Tagen`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'vor 1 Monat';
  return `vor ${diffMonths} Monaten`;
}

export function DashboardNotifications() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const userId = authUser?.id || '';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/notifications?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        setNotifications([]);
      }
    } catch {
      setError('Benachrichtigungen konnten nicht geladen werden.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      // silently fail
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => fetch(`${API_BASE}/notifications/${n.id}/read`, { method: 'PUT' }).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title={t('dashboardPages.notificationsTitle', 'Benachrichtigungen')}
          description={t('dashboardPages.notificationsDesc', 'Deine Benachrichtigungen und Einstellungen.')}
        />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.notificationsTitle', 'Benachrichtigungen')}
        description={t('dashboardPages.notificationsDesc', 'Deine Benachrichtigungen und Einstellungen.')}
      />

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {t('dashboardPages.allNotifications', 'Alle Benachrichtigungen')}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#247ba0] text-white">
                {unreadCount}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:shadow-sm bg-muted text-[#247ba0]"
                data-testid="button-mark-all-read"
              >
                <Check className="w-4 h-4" />
                {t('dashboardPages.markAllRead', 'Alle als gelesen markieren')}
              </button>
            )}
          </div>
        </div>
      )}

      {notifications.length === 0 ? (
        <DashboardEmptyState
          icon={Bell}
          title={t('dashboardPages.noNotifications', 'Keine Benachrichtigungen')}
          description={t('dashboardPages.noNotificationsDesc', 'Du hast noch keine Benachrichtigungen. Wenn andere Nutzer:innen mit deinen Inhalten interagieren, wirst du hier benachrichtigt.')}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = getIconForType(notification.type);
            const iconColor = getIconColor(notification.type);
            return (
              <div
                key={notification.id}
                className={`rounded-lg p-4 border transition-colors ${notification.is_read ? 'bg-card border-border' : 'bg-[#247ba0]/5 border-[#247ba0]/20 dark:bg-[#247ba0]/10'}`}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${iconColor}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="mb-1 font-medium text-sm text-foreground">
                      {notification.title}
                    </h3>
                    {notification.message && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-muted"
                        title={t('dashboardPages.markRead', 'Als gelesen markieren')}
                        data-testid={`button-read-${notification.id}`}
                      >
                        <Check className="w-4 h-4 text-emerald-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border bg-card p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Settings className="w-5 h-5 text-[#247ba0]" />
          <h2 className="text-lg md:text-xl text-foreground" style={{ fontFamily: 'Fjalla One' }}>
            {t('dashboardPages.notifSettings', 'Benachrichtigungs-Einstellungen')}
          </h2>
        </div>

        <div className="space-y-3">
          {[
            { key: 'reviews', label: t('dashboardPages.notifReviews', 'Neue Rezensionen') },
            { key: 'followers', label: t('dashboardPages.notifFollowers', 'Neue Follower') },
            { key: 'books', label: t('dashboardPages.notifBooks', 'Neue Bücher in meinen Kategorien') },
            { key: 'awards', label: t('dashboardPages.notifAwards', 'Awards und Auszeichnungen') },
          ].map(setting => (
            <label key={setting.key} className="flex items-center justify-between p-3 rounded-lg cursor-pointer touch-manipulation bg-muted/50">
              <span className="text-sm text-foreground">{setting.label}</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#247ba0]" data-testid={`toggle-notif-${setting.key}`} />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Mail className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg md:text-xl text-foreground" style={{ fontFamily: 'Fjalla One' }}>
            {t('dashboardPages.newsletter', 'Newsletter & E-Mail')}
          </h2>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>{t('dashboardPages.privacy', 'Datenschutz')}:</strong>{' '}
            {t('dashboardPages.newsletterPrivacy', 'Deine E-Mail-Adresse wird ausschließlich für den Versand von Newslettern verwendet. Du kannst dich jederzeit abmelden.')}
          </p>
        </div>

        <div className="space-y-3">
          {[
            { key: 'weekly', label: t('dashboardPages.newsletterWeekly', 'Wöchentlicher Newsletter'), desc: t('dashboardPages.newsletterWeeklyDesc', 'Erhalte jeden Montag kuratierte Buchempfehlungen'), checked: true },
            { key: 'releases', label: t('dashboardPages.newsletterReleases', 'Neue Veröffentlichungen'), desc: t('dashboardPages.newsletterReleasesDesc', 'Benachrichtigungen über Neuerscheinungen deiner Lieblingsautoren'), checked: true },
            { key: 'recommendations', label: t('dashboardPages.newsletterRecommendations', 'Persönliche Empfehlungen'), desc: t('dashboardPages.newsletterRecommendationsDesc', 'Basierend auf deinen Bewertungen und Interessen'), checked: true },
            { key: 'events', label: t('dashboardPages.newsletterEvents', 'Events & Veranstaltungen'), desc: t('dashboardPages.newsletterEventsDesc', 'Informationen zu Lesungen, Buchvorstellungen und mehr'), checked: true },
            { key: 'marketing', label: t('dashboardPages.newsletterMarketing', 'Marketing & Angebote'), desc: t('dashboardPages.newsletterMarketingDesc', 'Spezielle Angebote und Werbeaktionen'), checked: false },
          ].map(nl => (
            <label key={nl.key} className="flex items-start justify-between p-3 rounded-lg cursor-pointer touch-manipulation bg-muted/50">
              <div>
                <div className="text-sm font-medium mb-1 text-foreground">{nl.label}</div>
                <div className="text-xs text-muted-foreground">{nl.desc}</div>
              </div>
              <input
                type="checkbox"
                defaultChecked={nl.checked}
                className="w-5 h-5 mt-1 accent-[#247ba0]"
                aria-label={nl.label}
                data-testid={`toggle-nl-${nl.key}`}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
