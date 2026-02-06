import { useState } from 'react';
import { Lock, Check, AlertCircle } from 'lucide-react';
const API_BASE_URL = '/api';

interface AdminSettingsProps {
  onClose?: () => void;
}

export function AdminSettings({ onClose }: AdminSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
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
      const token = localStorage.getItem('admin_token'); // Fixed: Changed from 'adminToken' to 'admin_token'
      
      if (!token) {
        setMessage({ type: 'error', text: 'Keine aktive Session gefunden' });
        return;
      }
      
      // ✅ MIGRATED: Use canonical /api/admin/change-password endpoint
      const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          token
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Ändern des Passworts');
      }
      
      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert!' });
      
      // Mark password as changed
      localStorage.setItem('admin-password-changed', 'true');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto close after 2 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Password change error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Fehler beim Ändern des Passworts' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
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

      {/* Password Change Form */}
      <form onSubmit={handleChangePassword} className="space-y-6">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#3a3a3a' }}>
            Aktuelles Passwort
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
            style={{ 
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF'
            }}
            disabled={loading}
          />
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#3a3a3a' }}>
            Neues Passwort
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
            style={{ 
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF'
            }}
            disabled={loading}
          />
          <p className="text-xs mt-1" style={{ color: '#999999' }}>
            Mindestens 8 Zeichen
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#3a3a3a' }}>
            Neues Passwort bestätigen
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
            style={{ 
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF'
            }}
            disabled={loading}
          />
        </div>

        {/* Message */}
        {message && (
          <div 
            className="p-4 rounded-lg flex items-start gap-3"
            style={{ 
              backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              borderLeft: `4px solid ${message.type === 'success' ? '#70c1b3' : '#f25f5c'}`
            }}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5 mt-0.5" style={{ color: '#70c1b3' }} />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: '#f25f5c' }} />
            )}
            <p className="text-sm" style={{ color: '#2a2a2a' }}>
              {message.text}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
          style={{ 
            backgroundColor: '#247ba0',
            color: '#FFFFFF'
          }}
        >
          {loading ? 'Wird geändert...' : 'Passwort ändern'}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: '#F5F5F0' }}>
        <h3 className="font-medium mb-2" style={{ color: '#2a2a2a' }}>
          💡 Sicherheits-Tipps
        </h3>
        <ul className="text-sm space-y-1" style={{ color: '#666666' }}>
          <li>• Verwende ein sicheres, einzigartiges Passwort</li>
          <li>• Mindestens 8 Zeichen, besser 12+</li>
          <li>• Mischung aus Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen</li>
          <li>• NICHT das Standard-Passwort "coratiert2024" verwenden</li>
        </ul>
      </div>
    </div>
  );
}