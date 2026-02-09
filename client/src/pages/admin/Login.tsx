import { useState, useEffect } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/apiClient';

type AuthMode = 'loading' | 'login' | 'setup';

export function AdminLogin() {
  const [mode, setMode] = useState<AuthMode>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useSafeNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const existingToken = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
        if (existingToken) {
          const verifyRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.verify}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Token': existingToken },
          });
          const verifyData = await verifyRes.json();
          if (verifyData.ok && verifyData.data?.valid) {
            navigate('/sys-mgmt-xK9/content-manager');
            return;
          }
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_neon_token');
        }

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.status}`);
        const data = await response.json();
        setMode(data.initialized ? 'login' : 'setup');
      } catch {
        setMode('login');
      }
    };
    checkAuthStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Bitte gib ein Passwort ein');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.needsSetup) {
        setMode('setup');
        setError('');
        return;
      }

      if (result.success && result.token) {
        localStorage.setItem('admin_neon_token', result.token);
        localStorage.setItem('admin_token', result.token);
        localStorage.setItem('admin_last_activity', String(Date.now()));
        setTimeout(() => {
          navigate('/sys-mgmt-xK9/content-manager');
        }, 0);
      } else {
        setError(result.error || 'Login fehlgeschlagen');
      }
    } catch (err) {
      setError('Verbindungsfehler: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!setupKey) {
      setError('Setup-Schluessel ist erforderlich');
      return;
    }
    if (!password || password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwoerter stimmen nicht ueberein');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.setup}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, setup_key: setupKey }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Admin-Passwort wurde eingerichtet! Du kannst dich jetzt anmelden.');
        setPassword('');
        setConfirmPassword('');
        setSetupKey('');
        setTimeout(() => {
          setMode('login');
          setSuccess('');
        }, 2000);
      } else {
        setError(result.error || 'Setup fehlgeschlagen');
      }
    } catch (err) {
      setError('Verbindungsfehler: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-admin-gradient"
      >
        <div className="text-white text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-admin-gradient"
      data-testid="admin-login-page"
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${mode === 'setup' ? 'bg-admin-setup' : 'bg-coral'}`}
            >
              {mode === 'setup' ? (
                <Shield className="w-8 h-8 text-white" />
              ) : (
                <Lock className="w-8 h-8 text-white" />
              )}
            </div>
            <h1
              className="text-3xl mb-2 font-headline text-[#1a1a2e]"
              data-testid="text-login-title"
            >
              {mode === 'setup' ? 'Admin einrichten' : 'Admin Login'}
            </h1>
            <p className="text-gray-500 text-sm">
              {mode === 'setup'
                ? 'Erstelle dein Admin-Passwort fuer den Zugang'
                : 'coratiert.de Content Management'}
            </p>
          </div>

          {error && (
            <div
              className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200"
              data-testid="text-error-message"
            >
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div
              className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200"
              data-testid="text-success-message"
            >
              <p className="text-green-600 text-sm font-medium">{success}</p>
            </div>
          )}

          {mode === 'setup' ? (
            <form onSubmit={handleSetup}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="setup-key" className="block text-sm font-medium text-gray-700 mb-1">
                    Setup-Schluessel
                  </label>
                  <input
                    id="setup-key"
                    type="password"
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    placeholder="Setup-Schluessel eingeben"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    disabled={loading}
                    data-testid="input-setup-key"
                  />
                  <p className="text-xs text-gray-400 mt-1">SESSION_SECRET aus den Umgebungsvariablen</p>
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Neues Admin-Passwort
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mindestens 8 Zeichen"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm pr-12"
                      disabled={loading}
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort bestaetigen
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    disabled={loading}
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword || !setupKey}
                className="w-full mt-6 py-3 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-admin-setup"
                data-testid="button-setup-submit"
              >
                {loading ? 'Wird eingerichtet...' : 'Passwort einrichten'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Admin-Passwort eingeben"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm pr-12"
                    disabled={loading}
                    autoFocus
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-admin-login"
                data-testid="button-login-submit"
              >
                {loading ? 'Anmelden...' : 'Anmelden'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="link-back-home"
            >
              Zurueck zur Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
