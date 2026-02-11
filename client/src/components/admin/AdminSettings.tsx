import { useState, useEffect } from 'react';
import { Lock, Check, AlertCircle, Shield, Plus, X, Wifi, Bot, Clock, Eye, MousePointer } from 'lucide-react';
const API_BASE_URL = '/api';

interface TrackingSettings {
  bot_user_agents: string[];
  rate_limit_window_minutes: number;
  rate_limit_max_views: number;
  rate_limit_max_clicks: number;
  excluded_admin_ips: string[];
  updated_at?: string;
}

function getAdminHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token') || '';
  return {
    'Content-Type': 'application/json',
    'X-Admin-Token': token,
  };
}

interface AdminSettingsProps {
  onClose?: () => void;
}

export function AdminSettings({ onClose }: AdminSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newBotAgent, setNewBotAgent] = useState('');
  const [newAdminIp, setNewAdminIp] = useState('');
  const [myIp, setMyIp] = useState<string | null>(null);

  useEffect(() => {
    loadTrackingSettings();
    fetchMyIp();
  }, []);

  const loadTrackingSettings = async () => {
    setTrackingLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/tracking-settings`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.ok && data.data) {
        setTrackingSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to load tracking settings:', err);
    } finally {
      setTrackingLoading(false);
    }
  };

  const fetchMyIp = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/my-ip`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.ok) setMyIp(data.ip);
    } catch { /* ignore */ }
  };

  const saveTrackingSettings = async (updates: Partial<TrackingSettings>) => {
    setTrackingSaving(true);
    setTrackingMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/tracking-settings`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.ok && data.data) {
        setTrackingSettings(data.data);
        setTrackingMessage({ type: 'success', text: 'Einstellungen gespeichert' });
        setTimeout(() => setTrackingMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      setTrackingMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fehler beim Speichern' });
    } finally {
      setTrackingSaving(false);
    }
  };

  const addBotAgent = () => {
    if (!newBotAgent.trim() || !trackingSettings) return;
    const updated = [...trackingSettings.bot_user_agents, newBotAgent.trim()];
    setTrackingSettings({ ...trackingSettings, bot_user_agents: updated });
    saveTrackingSettings({ bot_user_agents: updated });
    setNewBotAgent('');
  };

  const removeBotAgent = (agent: string) => {
    if (!trackingSettings) return;
    const updated = trackingSettings.bot_user_agents.filter(a => a !== agent);
    setTrackingSettings({ ...trackingSettings, bot_user_agents: updated });
    saveTrackingSettings({ bot_user_agents: updated });
  };

  const addAdminIp = (ip: string) => {
    if (!ip.trim() || !trackingSettings) return;
    if (trackingSettings.excluded_admin_ips.includes(ip.trim())) return;
    const updated = [...trackingSettings.excluded_admin_ips, ip.trim()];
    setTrackingSettings({ ...trackingSettings, excluded_admin_ips: updated });
    saveTrackingSettings({ excluded_admin_ips: updated });
    setNewAdminIp('');
  };

  const removeAdminIp = (ip: string) => {
    if (!trackingSettings) return;
    const updated = trackingSettings.excluded_admin_ips.filter(i => i !== ip);
    setTrackingSettings({ ...trackingSettings, excluded_admin_ips: updated });
    saveTrackingSettings({ excluded_admin_ips: updated });
  };

  const updateRateLimit = (field: keyof TrackingSettings, value: number) => {
    if (!trackingSettings) return;
    const updated = { ...trackingSettings, [field]: value };
    setTrackingSettings(updated);
    saveTrackingSettings({ [field]: value });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Bitte alle Felder ausfüllen' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Neue Passwörter stimmen nicht überein' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Passwort muss mindestens 8 Zeichen lang sein' });
      return;
    }
    if (newPassword === 'coratiert2024') {
      setMessage({ type: 'error', text: 'Bitte wähle ein sicheres Passwort, nicht das Standard-Passwort' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Keine aktive Session gefunden' });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, token }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fehler beim Ändern des Passworts');
      
      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert!' });
      localStorage.setItem('admin-password-changed', 'true');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => { if (onClose) onClose(); }, 2000);
    } catch (error) {
      console.error('Password change error:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Fehler beim Ändern des Passworts' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10">
      {/* Password Section */}
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6" style={{ color: '#247ba0' }} />
            <h2 className="text-2xl font-bold" style={{ color: '#2a2a2a', fontFamily: 'var(--font-heading)' }}>
              Sicherheitseinstellungen
            </h2>
          </div>
          <p className="text-sm" style={{ color: '#666666' }}>
            Hier kannst du dein Admin-Passwort ändern
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3a3a3a' }}>Aktuelles Passwort</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }} disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3a3a3a' }}>Neues Passwort</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }} disabled={loading} />
              <p className="text-xs mt-1" style={{ color: '#999999' }}>Mindestens 8 Zeichen</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3a3a3a' }}>Neues Passwort bestätigen</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }} disabled={loading} />
            </div>
          </div>

          {message && (
            <div className="p-4 rounded-lg flex items-start gap-3"
              style={{ backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2', borderLeft: `4px solid ${message.type === 'success' ? '#70c1b3' : '#f25f5c'}` }}>
              {message.type === 'success' ? <Check className="w-5 h-5 mt-0.5" style={{ color: '#70c1b3' }} /> : <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: '#f25f5c' }} />}
              <p className="text-sm" style={{ color: '#2a2a2a' }}>{message.text}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}>
            {loading ? 'Wird geändert...' : 'Passwort ändern'}
          </button>
        </form>
      </div>

      <hr style={{ borderColor: '#E5E7EB' }} />

      {/* Tracking Settings Section */}
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6" style={{ color: '#247ba0' }} />
            <h2 className="text-2xl font-bold" style={{ color: '#2a2a2a', fontFamily: 'var(--font-heading)' }}>
              Tracking-Schutz
            </h2>
          </div>
          <p className="text-sm" style={{ color: '#666666' }}>
            Bots, Crawler und eigene Admin-Klicks vom Impressions-Tracking ausschließen
          </p>
        </div>

        {trackingLoading ? (
          <div className="text-center py-8" style={{ color: '#999' }}>Lädt Tracking-Einstellungen...</div>
        ) : trackingSettings ? (
          <div className="space-y-8">

            {trackingMessage && (
              <div className="p-3 rounded-lg flex items-center gap-2"
                style={{ backgroundColor: trackingMessage.type === 'success' ? '#f0fdf4' : '#fef2f2', borderLeft: `4px solid ${trackingMessage.type === 'success' ? '#70c1b3' : '#f25f5c'}` }}>
                {trackingMessage.type === 'success' ? <Check className="w-4 h-4" style={{ color: '#70c1b3' }} /> : <AlertCircle className="w-4 h-4" style={{ color: '#f25f5c' }} />}
                <span className="text-sm" style={{ color: '#2a2a2a' }}>{trackingMessage.text}</span>
              </div>
            )}

            {/* Rate Limiting */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5" style={{ color: '#f4a261' }} />
                <h3 className="font-semibold" style={{ color: '#2a2a2a' }}>Rate Limiting</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: '#999' }}>
                Begrenzt wie oft eine IP-Adresse pro Section gezählt wird
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#666' }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Zeitfenster (Min)</span>
                  </label>
                  <input type="number" min={1} max={1440}
                    value={trackingSettings.rate_limit_window_minutes}
                    onChange={(e) => updateRateLimit('rate_limit_window_minutes', parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#E5E7EB' }} disabled={trackingSaving} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#666' }}>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Max Views / IP</span>
                  </label>
                  <input type="number" min={1} max={1000}
                    value={trackingSettings.rate_limit_max_views}
                    onChange={(e) => updateRateLimit('rate_limit_max_views', parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#E5E7EB' }} disabled={trackingSaving} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#666' }}>
                    <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" /> Max Klicks / IP</span>
                  </label>
                  <input type="number" min={1} max={1000}
                    value={trackingSettings.rate_limit_max_clicks}
                    onChange={(e) => updateRateLimit('rate_limit_max_clicks', parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#E5E7EB' }} disabled={trackingSaving} />
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: '#999' }}>
                Standard: Max 3 Views und 5 Klicks pro IP pro Section innerhalb von 60 Minuten
              </p>
            </div>

            {/* Admin IP Exclusion */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="w-5 h-5" style={{ color: '#70c1b3' }} />
                <h3 className="font-semibold" style={{ color: '#2a2a2a' }}>Admin-IPs ausschließen</h3>
              </div>
              <p className="text-xs mb-3" style={{ color: '#999' }}>
                Diese IP-Adressen werden komplett vom Tracking ausgeschlossen
              </p>

              {myIp && (
                <div className="mb-3 p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#0369a1' }}>Deine aktuelle IP: </span>
                    <span className="text-sm font-mono" style={{ color: '#0c4a6e' }}>{myIp}</span>
                  </div>
                  {!trackingSettings.excluded_admin_ips.includes(myIp) && (
                    <button type="button" onClick={() => addAdminIp(myIp)}
                      className="px-3 py-1 rounded text-xs font-medium transition-all hover:opacity-80"
                      style={{ backgroundColor: '#247ba0', color: '#fff' }} disabled={trackingSaving}>
                      Hinzufügen
                    </button>
                  )}
                  {trackingSettings.excluded_admin_ips.includes(myIp) && (
                    <span className="text-xs font-medium" style={{ color: '#70c1b3' }}>Bereits ausgeschlossen</span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {trackingSettings.excluded_admin_ips.map((ip) => (
                  <span key={ip} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono"
                    style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                    {ip}
                    <button type="button" onClick={() => removeAdminIp(ip)} className="ml-1 hover:opacity-60" disabled={trackingSaving}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {trackingSettings.excluded_admin_ips.length === 0 && (
                  <span className="text-xs" style={{ color: '#999' }}>Keine IPs ausgeschlossen</span>
                )}
              </div>

              <div className="flex gap-2">
                <input type="text" value={newAdminIp} onChange={(e) => setNewAdminIp(e.target.value)}
                  placeholder="z.B. 192.168.1.100"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E5E7EB' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAdminIp(newAdminIp); } }}
                  disabled={trackingSaving} />
                <button type="button" onClick={() => addAdminIp(newAdminIp)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center gap-1"
                  style={{ backgroundColor: '#247ba0', color: '#fff' }} disabled={trackingSaving || !newAdminIp.trim()}>
                  <Plus className="w-4 h-4" /> IP hinzufügen
                </button>
              </div>
            </div>

            {/* Bot User Agents */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5" style={{ color: '#f25f5c' }} />
                <h3 className="font-semibold" style={{ color: '#2a2a2a' }}>Bot-Erkennung</h3>
              </div>
              <p className="text-xs mb-3" style={{ color: '#999' }}>
                User-Agent-Strings die als Bot erkannt und vom Tracking ausgeschlossen werden (Teilübereinstimmung)
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4 max-h-48 overflow-y-auto p-3 rounded-lg" style={{ backgroundColor: '#fafafa', border: '1px solid #E5E7EB' }}>
                {trackingSettings.bot_user_agents.map((agent) => (
                  <span key={agent} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    {agent}
                    <button type="button" onClick={() => removeBotAgent(agent)} className="ml-0.5 hover:opacity-60" disabled={trackingSaving}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input type="text" value={newBotAgent} onChange={(e) => setNewBotAgent(e.target.value)}
                  placeholder="z.B. MyCustomBot"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E5E7EB' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBotAgent(); } }}
                  disabled={trackingSaving} />
                <button type="button" onClick={addBotAgent}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center gap-1"
                  style={{ backgroundColor: '#f25f5c', color: '#fff' }} disabled={trackingSaving || !newBotAgent.trim()}>
                  <Plus className="w-4 h-4" /> Bot hinzufügen
                </button>
              </div>
            </div>

            {trackingSettings.updated_at && (
              <p className="text-xs text-right" style={{ color: '#bbb' }}>
                Zuletzt geändert: {new Date(trackingSettings.updated_at).toLocaleString('de-DE')}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: '#f25f5c' }}>Tracking-Einstellungen konnten nicht geladen werden</div>
        )}
      </div>
    </div>
  );
}