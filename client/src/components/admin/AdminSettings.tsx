import { useState, useEffect } from 'react';
import { Lock, Check, AlertCircle, Shield, Plus, X, Wifi, Bot, Clock, Eye, MousePointer, BookOpen, Pen } from 'lucide-react';
const API_BASE_URL = '/api';

interface IndiePublisher {
  id: number;
  name: string;
  focus?: string | null;
  source: string;
  created_at: string;
}

interface FuzzyMatchResult {
  id: number;
  indie_name: string;
  focus: string | null;
  matches: Array<{ publisher: string; book_count: number; match_type: string }>;
  match_count: number;
  total_books: number;
}

interface SelfpublisherPattern {
  id: number;
  pattern: string;
  match_type: string;
  created_at: string;
}

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
    'Content-Type': 'application/json' };
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

  const [indiePublishers, setIndiePublishers] = useState<IndiePublisher[]>([]);
  const [indieLoading, setIndieLoading] = useState(true);
  const [newIndieName, setNewIndieName] = useState('');
  const [indieMessage, setIndieMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [fuzzyResults, setFuzzyResults] = useState<FuzzyMatchResult[] | null>(null);
  const [fuzzyLoading, setFuzzyLoading] = useState(false);
  const [fuzzySummary, setFuzzySummary] = useState<any>(null);
  const [fuzzyFilter, setFuzzyFilter] = useState<'all' | 'matched' | 'unmatched'>('all');

  const [spPatterns, setSpPatterns] = useState<SelfpublisherPattern[]>([]);
  const [spLoading, setSpLoading] = useState(true);
  const [newSpPattern, setNewSpPattern] = useState('');
  const [spMessage, setSpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTrackingSettings();
    fetchMyIp();
    loadIndiePublishers();
    loadSpPatterns();
  }, []);

  const loadTrackingSettings = async () => {
    setTrackingLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/tracking-settings`, { credentials: 'include', headers: getAdminHeaders() });
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
      const res = await fetch(`${API_BASE_URL}/admin/my-ip`, { credentials: 'include', headers: getAdminHeaders() });
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
          credentials: 'include',
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

  const loadIndiePublishers = async () => {
    setIndieLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/indie-publishers`, { credentials: 'include', headers: getAdminHeaders() });
      const data = await res.json();
      if (data.ok) setIndiePublishers(data.data || []);
    } catch (err) {
      console.error('Failed to load indie publishers:', err);
    } finally {
      setIndieLoading(false);
    }
  };

  const addIndiePublisher = async () => {
    if (!newIndieName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/indie-publishers`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify({ name: newIndieName.trim(), source: 'manual' }),
      });
      const data = await res.json();
      if (data.ok) {
        setIndiePublishers(prev => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewIndieName('');
        setIndieMessage({ type: 'success', text: 'Verlag hinzugefügt' });
        setTimeout(() => setIndieMessage(null), 3000);
      } else {
        setIndieMessage({ type: 'error', text: data.error || 'Fehler' });
      }
    } catch (err) {
      setIndieMessage({ type: 'error', text: 'Fehler beim Hinzufügen' });
    }
  };

  const removeIndiePublisher = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/indie-publishers/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.ok) setIndiePublishers(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to remove indie publisher:', err);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>, replace: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (replace && !confirm('Achtung: Alle bestehenden Indie-Verlage werden gelöscht und durch die Excel-Daten ersetzt. Fortfahren?')) {
      e.target.value = '';
      return;
    }
    setBulkUploading(true);
    setIndieMessage(null);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      const publishers = rows.map((r: any) => {
        const name = r['Verlag (PublisherName für SQL)'] || r['name'] || r['Name'] || r['Verlag'] || Object.values(r)[0];
        const focus = r['Fokus / Besonderheit'] || r['focus'] || r['Fokus'] || null;
        return { name: String(name || '').trim(), focus, source: 'excel-import' };
      }).filter(p => p.name);

      const res = await fetch(`${API_BASE_URL}/admin/indie-publishers/bulk`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify({ publishers, replace }),
      });
      const data = await res.json();
      if (data.ok) {
        setIndieMessage({ type: 'success', text: `${data.imported} importiert, ${data.skipped} übersprungen (bereits vorhanden)` });
        loadIndiePublishers();
      } else {
        setIndieMessage({ type: 'error', text: data.error || 'Import fehlgeschlagen' });
      }
    } catch (err) {
      setIndieMessage({ type: 'error', text: 'Excel-Datei konnte nicht gelesen werden' });
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  const runFuzzyMatch = async () => {
    setFuzzyLoading(true);
    setFuzzyResults(null);
    setFuzzySummary(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/indie-publishers/fuzzy-match`, { credentials: 'include', headers: getAdminHeaders() });
      const data = await res.json();
      if (data.ok) {
        setFuzzyResults(data.results);
        setFuzzySummary(data.summary);
      } else {
        setIndieMessage({ type: 'error', text: data.error || 'Fuzzy-Match fehlgeschlagen' });
      }
    } catch (err) {
      setIndieMessage({ type: 'error', text: 'Fehler beim Fuzzy-Matching' });
    } finally {
      setFuzzyLoading(false);
    }
  };

  const loadSpPatterns = async () => {
    setSpLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/selfpublisher-patterns`, { credentials: 'include', headers: getAdminHeaders() });
      const data = await res.json();
      if (data.ok) setSpPatterns(data.data || []);
    } catch (err) {
      console.error('Failed to load selfpublisher patterns:', err);
    } finally {
      setSpLoading(false);
    }
  };

  const addSpPattern = async () => {
    if (!newSpPattern.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/selfpublisher-patterns`, {
          method: 'POST',
          credentials: 'include',
          headers: getAdminHeaders(),
        body: JSON.stringify({ pattern: newSpPattern.trim(), match_type: 'contains' }),
      });
      const data = await res.json();
      if (data.ok) {
        setSpPatterns(prev => [...prev, data.data].sort((a, b) => a.pattern.localeCompare(b.pattern)));
        setNewSpPattern('');
        setSpMessage({ type: 'success', text: 'Pattern hinzugefügt' });
        setTimeout(() => setSpMessage(null), 3000);
      } else {
        setSpMessage({ type: 'error', text: data.error || 'Fehler' });
      }
    } catch (err) {
      setSpMessage({ type: 'error', text: 'Fehler beim Hinzufügen' });
    }
  };

  const removeSpPattern = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/selfpublisher-patterns/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.ok) setSpPatterns(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to remove selfpublisher pattern:', err);
    }
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
            credentials: 'include',
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

      {/* Indie Publishers Section */}
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6" style={{ color: '#70c1b3' }} />
            <h2 className="text-2xl font-bold" style={{ color: '#2a2a2a', fontFamily: 'var(--font-heading)' }}>
              Indie-Verlage
            </h2>
          </div>
          <p className="text-sm" style={{ color: '#666666' }}>
            Whitelist unabhängiger Verlage (z.B. Kurt-Wolff-Stiftung Mitglieder). Bücher dieser Verlage erhalten das Indie-Badge.
          </p>
        </div>

        {indieMessage && (
          <div className="p-3 rounded-lg flex items-center gap-2 mb-4"
            style={{ backgroundColor: indieMessage.type === 'success' ? '#f0fdf4' : '#fef2f2', borderLeft: `4px solid ${indieMessage.type === 'success' ? '#70c1b3' : '#f25f5c'}` }}>
            {indieMessage.type === 'success' ? <Check className="w-4 h-4" style={{ color: '#70c1b3' }} /> : <AlertCircle className="w-4 h-4" style={{ color: '#f25f5c' }} />}
            <span className="text-sm" style={{ color: '#2a2a2a' }}>{indieMessage.text}</span>
          </div>
        )}

        {indieLoading ? (
          <div className="text-center py-4" style={{ color: '#999' }}>Lädt Indie-Verlage...</div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-1.5 mb-4 max-h-64 overflow-y-auto p-3 rounded-lg" style={{ backgroundColor: '#fafafa', border: '1px solid #E5E7EB' }}>
              {indiePublishers.map((pub) => (
                <span key={pub.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                  style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                  title={pub.focus ? `Fokus: ${pub.focus}` : undefined}>
                  {pub.name}
                  {pub.focus && <span className="text-[10px] opacity-60">({pub.focus})</span>}
                  <button type="button" onClick={() => removeIndiePublisher(pub.id)} className="ml-0.5 hover:opacity-60">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {indiePublishers.length === 0 && (
                <span className="text-xs" style={{ color: '#999' }}>Keine Indie-Verlage konfiguriert</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium" style={{ color: '#666' }}>{indiePublishers.length} Verlage</span>
            </div>
            <div className="flex gap-2">
              <input type="text" value={newIndieName} onChange={(e) => setNewIndieName(e.target.value)}
                placeholder="z.B. Matthes & Seitz Berlin"
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#E5E7EB' }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIndiePublisher(); } }} />
              <button type="button" onClick={addIndiePublisher}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center gap-1"
                style={{ backgroundColor: '#70c1b3', color: '#fff' }}
                disabled={!newIndieName.trim()}>
                <Plus className="w-4 h-4" /> Verlag hinzufügen
              </button>
            </div>

            <div className="flex gap-2 mt-3 flex-wrap">
              <label className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: '#247ba0', color: '#fff' }}>
                {bulkUploading ? 'Importiere...' : 'Excel importieren (ergänzen)'}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleExcelUpload(e, false)} className="hidden" disabled={bulkUploading} />
              </label>
              <label className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}>
                {bulkUploading ? 'Importiere...' : 'Excel importieren (ersetzen)'}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleExcelUpload(e, true)} className="hidden" disabled={bulkUploading} />
              </label>
              <button type="button" onClick={runFuzzyMatch} disabled={fuzzyLoading || indiePublishers.length === 0}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center gap-1"
                style={{ backgroundColor: '#f4a261', color: '#fff' }}>
                {fuzzyLoading ? 'Matching...' : 'Fuzzy-Match mit Datenbank'}
              </button>
            </div>

            {fuzzySummary && (
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div className="text-sm font-medium mb-2" style={{ color: '#0369a1' }}>Fuzzy-Match Ergebnis</div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center p-2 rounded" style={{ backgroundColor: '#fff' }}>
                    <div className="font-bold text-lg" style={{ color: '#2a2a2a' }}>{fuzzySummary.total_indie}</div>
                    <div style={{ color: '#666' }}>Indie-Verlage</div>
                  </div>
                  <div className="text-center p-2 rounded" style={{ backgroundColor: '#fff' }}>
                    <div className="font-bold text-lg" style={{ color: '#16a34a' }}>{fuzzySummary.matched}</div>
                    <div style={{ color: '#666' }}>Gefunden</div>
                  </div>
                  <div className="text-center p-2 rounded" style={{ backgroundColor: '#fff' }}>
                    <div className="font-bold text-lg" style={{ color: '#dc2626' }}>{fuzzySummary.unmatched}</div>
                    <div style={{ color: '#666' }}>Nicht gefunden</div>
                  </div>
                  <div className="text-center p-2 rounded" style={{ backgroundColor: '#fff' }}>
                    <div className="font-bold text-lg" style={{ color: '#2a2a2a' }}>{fuzzySummary.total_db_publishers}</div>
                    <div style={{ color: '#666' }}>DB-Verlage</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {(['all', 'matched', 'unmatched'] as const).map(f => (
                    <button key={f} type="button" onClick={() => setFuzzyFilter(f)}
                      className="px-2 py-1 rounded text-xs font-medium transition-all"
                      style={{ backgroundColor: fuzzyFilter === f ? '#247ba0' : '#e5e7eb', color: fuzzyFilter === f ? '#fff' : '#666' }}>
                      {f === 'all' ? 'Alle' : f === 'matched' ? 'Gefunden' : 'Nicht gefunden'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fuzzyResults && (
              <div className="mt-3 max-h-96 overflow-y-auto rounded-lg" style={{ border: '1px solid #E5E7EB' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: '#374151' }}>Indie-Verlag</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: '#374151' }}>DB-Match</th>
                      <th className="text-right px-3 py-2 font-medium" style={{ color: '#374151' }}>Typ</th>
                      <th className="text-right px-3 py-2 font-medium" style={{ color: '#374151' }}>Titel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuzzyResults
                      .filter(r => fuzzyFilter === 'all' || (fuzzyFilter === 'matched' ? r.match_count > 0 : r.match_count === 0))
                      .map(r => (
                        r.match_count > 0 ? r.matches.map((m, i) => (
                          <tr key={`${r.id}-${i}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            {i === 0 && (
                              <td className="px-3 py-1.5 font-medium" style={{ color: '#2a2a2a' }} rowSpan={r.matches.length}>
                                {r.indie_name}
                                {r.focus && <span className="block text-[10px]" style={{ color: '#999' }}>{r.focus}</span>}
                              </td>
                            )}
                            <td className="px-3 py-1.5" style={{ color: '#374151' }}>{m.publisher}</td>
                            <td className="px-3 py-1.5 text-right">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{
                                  backgroundColor: m.match_type === 'exact' ? '#dcfce7' : m.match_type === 'contains' ? '#fef9c3' : '#fce7f3',
                                  color: m.match_type === 'exact' ? '#166534' : m.match_type === 'contains' ? '#854d0e' : '#9d174d'
                                }}>
                                {m.match_type}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono" style={{ color: '#374151' }}>{m.book_count}</td>
                          </tr>
                        )) : (
                          <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#fef2f2' }}>
                            <td className="px-3 py-1.5 font-medium" style={{ color: '#991b1b' }}>
                              {r.indie_name}
                              {r.focus && <span className="block text-[10px]" style={{ color: '#999' }}>{r.focus}</span>}
                            </td>
                            <td className="px-3 py-1.5" style={{ color: '#991b1b' }} colSpan={3}>Kein Match in der Datenbank</td>
                          </tr>
                        )
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <hr style={{ borderColor: '#E5E7EB' }} />

      {/* Self-Publisher Patterns Section */}
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Pen className="w-6 h-6" style={{ color: '#f4a261' }} />
            <h2 className="text-2xl font-bold" style={{ color: '#2a2a2a', fontFamily: 'var(--font-heading)' }}>
              Self-Publisher-Erkennung
            </h2>
          </div>
          <p className="text-sm" style={{ color: '#666666' }}>
            Muster im Verlagsnamen, die auf Self-Publishing hinweisen. Zusätzlich wird geprüft ob Autor = Verlag.
          </p>
        </div>

        {spMessage && (
          <div className="p-3 rounded-lg flex items-center gap-2 mb-4"
            style={{ backgroundColor: spMessage.type === 'success' ? '#f0fdf4' : '#fef2f2', borderLeft: `4px solid ${spMessage.type === 'success' ? '#70c1b3' : '#f25f5c'}` }}>
            {spMessage.type === 'success' ? <Check className="w-4 h-4" style={{ color: '#70c1b3' }} /> : <AlertCircle className="w-4 h-4" style={{ color: '#f25f5c' }} />}
            <span className="text-sm" style={{ color: '#2a2a2a' }}>{spMessage.text}</span>
          </div>
        )}

        {spLoading ? (
          <div className="text-center py-4" style={{ color: '#999' }}>Lädt Self-Publisher-Patterns...</div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-1.5 mb-4 p-3 rounded-lg" style={{ backgroundColor: '#fafafa', border: '1px solid #E5E7EB' }}>
              {spPatterns.map((pat) => (
                <span key={pat.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                  style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                  {pat.pattern}
                  <span className="text-[10px] opacity-60">({pat.match_type})</span>
                  <button type="button" onClick={() => removeSpPattern(pat.id)} className="ml-0.5 hover:opacity-60">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {spPatterns.length === 0 && (
                <span className="text-xs" style={{ color: '#999' }}>Keine Patterns konfiguriert</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium" style={{ color: '#666' }}>{spPatterns.length} Patterns</span>
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSpPattern} onChange={(e) => setNewSpPattern(e.target.value)}
                placeholder="z.B. BoD, epubli, tredition"
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#E5E7EB' }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpPattern(); } }} />
              <button type="button" onClick={addSpPattern}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center gap-1"
                style={{ backgroundColor: '#f4a261', color: '#fff' }}
                disabled={!newSpPattern.trim()}>
                <Plus className="w-4 h-4" /> Pattern hinzufügen
              </button>
            </div>
            <p className="text-xs mt-3" style={{ color: '#999' }}>
              Zusätzlich wird automatisch geprüft, ob der Autorname mit dem Verlagsnamen übereinstimmt (= Self-Publisher).
            </p>
          </div>
        )}
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