import React, { useState, useEffect } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { adminLogin } from '../../utils/api';
import { Lock, AlertCircle, Info } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/apiClient';
/**
 * Admin Login Page
 * Passwortschutz für den Admin-Bereich
 * 🔒 SECURITY: Rate-Limited, Obfuskated Route, Session Timeout
 */

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [passwordHint, setPasswordHint] = useState<string>('');
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const navigate = useSafeNavigate();

  // Check server status on mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.health}`, {
          headers: {
          }
        });
        if (response.ok) {
          setServerStatus('online');
          console.log('✅ Server is online');
        } else {
          setServerStatus('offline');
          console.error('❌ Server returned error:', response.status);
        }
      } catch (err) {
        setServerStatus('offline');
        console.error('❌ Server is offline:', err);
      }
    };
    checkServer();
  }, []);

  const handleDebugLogin = async () => {
    if (!password) {
      setError('Bitte gib ein Passwort ein');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setDebugInfo(null);

      console.log('🔍 [DEBUG] Starting debug login...');
      console.log('🔍 [DEBUG] Password length:', password.length);
      console.log('🔍 [DEBUG] Password first 3 chars:', password.substring(0, 3));

      // ✅ USE API_BASE_URL + API_ENDPOINTS
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      console.log('🔍 [DEBUG] Response status:', response.status);
      console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
      
      // 🔧 FIX: Get raw text first to debug JSON errors
      const responseText = await response.text();
      console.log('🔍 [DEBUG] Raw response text:', responseText.substring(0, 500));

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('🔍 [DEBUG] Parsed JSON:', result);
      } catch (parseError) {
        console.error('❌ [DEBUG] JSON parse error:', parseError);
        setDebugInfo({
          status: response.status,
          error: 'JSON Parse Error',
          rawResponse: responseText.substring(0, 200),
          parseError: String(parseError)
        });
        setError(`❌ Server returned invalid JSON! Response: ${responseText.substring(0, 100)}`);
        return;
      }

      setDebugInfo({
        status: response.status,
        result: result,
        passwordLength: password.length,
        passwordStart: password.substring(0, 3)
      });

      if (result.success && result.token) {
        setError('✅ Login würde funktionieren! Token erhalten: ' + result.token.substring(0, 20) + '...');
      } else {
        setError(`❌ Login fehlgeschlagen: ${result.error || result.message || 'Unbekannter Fehler'}`);
      }
    } catch (err) {
      console.error('🔍 [DEBUG] Error:', err);
      setDebugInfo({ error: String(err) });
      setError('Fehler: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFixDatabase = async () => {
    try {
      setLoading(true);
      setError('');
      setDebugInfo(null);

      console.log('🔧 [FIX] Calling fix-table endpoint...');

      const response = await fetch(`/api/admin/auth/neon/fix-table`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔧 [FIX] Response status:', response.status);
      const result = await response.json();
      console.log('🔧 [FIX] Response data:', result);

      setDebugInfo({
        status: response.status,
        result: result
      });

      if (result.ok) {
        setError(`✅ ${result.data.message}`);
      } else {
        setError(`❌ Fix fehlgeschlagen: ${result.error?.message || 'Unbekannter Fehler'}`);
      }
    } catch (err) {
      console.error('🔧 [FIX] Error:', err);
      setDebugInfo({ error: String(err) });
      setError('Fehler: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Bitte gib ein Passwort ein');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setDebugInfo(null);

      const loginUrl = `${API_BASE_URL}${API_ENDPOINTS.auth.login}`;
      console.log('🔐 [LOGIN] Starting login...');
      console.log('🔐 [LOGIN] URL:', loginUrl);
      console.log('🔐 [LOGIN] Password length:', password.length);
      console.log('🔐 [LOGIN] Password first 3 chars:', password.substring(0, 3));

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      console.log('🔐 [LOGIN] Response status:', response.status);
      console.log('🔐 [LOGIN] Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('🔐 [LOGIN] Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('🔐 [LOGIN] Response data:', result);
      } catch (parseError) {
        console.error('❌ [LOGIN] JSON parse error:', parseError);
        setError(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
        return;
      }

      if (result.success && result.token) {
        // Store token in localStorage
        localStorage.setItem('admin_neon_token', result.token);
        localStorage.setItem('admin_token', result.token); // Legacy fallback
        localStorage.setItem('admin_last_activity', String(Date.now()));
        
        console.log('✅ [LOGIN] Token stored:', result.token.substring(0, 20) + '...');
        console.log('✅ [LOGIN] Redirecting to Content Manager...');
        
        // 🔧 FIX: Delayed navigation to avoid React Error #306 (Suspense + lazy loading)
        // Wait for next tick so navigation happens asynchronously
        setTimeout(() => {
          navigate('/sys-mgmt-xK9/content-manager');
        }, 0);
      } else {
        console.error('❌ [LOGIN] Login failed:', result.error);
        setError(result.error || result.message || 'Login fehlgeschlagen');
      }
    } catch (err) {
      console.error('❌ [LOGIN] Error:', err);
      setError('Fehler: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchPasswordHint = async () => {
    try {
      const response = await fetch(`/api/admin/auth/neon/debug-password`, {
        method: 'GET',
        headers: {
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.data) {
          setPasswordHint(data.data.instruction || data.data.message);
        } else {
          setPasswordHint('Konnte Passworthinweis nicht abrufen.');
        }
      } else {
        console.error('❌ Failed to fetch password hint:', response.statusText);
        setPasswordHint('Konnte den Passworthinweis nicht abrufen.');
      }
    } catch (err) {
      console.error('❌ Error fetching password hint:', err);
      setPasswordHint('Ein Fehler ist aufgetreten: ' + String(err));
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: '#f25f5c' }}
            >
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 
              className="text-3xl mb-2" 
              style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
            >
              Admin Login
            </h1>
            <p style={{ color: '#666666' }}>
              Bitte gib das Admin-Passwort ein
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-6 p-4 rounded-lg"
              style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171' }}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" style={{ color: '#dc2626' }} />
                <p style={{ color: '#dc2626' }}><strong>{error}</strong></p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label 
                htmlFor="password" 
                className="block mb-2"
                style={{ color: '#3A3A3A' }}
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: '#E5E7EB',
                  focusRingColor: '#f25f5c'
                }}
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#f25f5c',
                color: '#FFFFFF',
                fontFamily: 'Fjalla One',
                fontSize: '1.125rem'
              }}
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>

          {/* Security Reminder */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#fff3cd', border: '1px solid #f4a261' }}>
              <p className="text-sm text-center font-medium" style={{ color: '#856404' }}>
                ⚠️ Ändere dein Passwort sofort nach dem ersten Login!
              </p>
              <p className="text-xs text-center mt-1" style={{ color: '#856404' }}>
                Gehe zu: Content Manager → Einstellungen
              </p>
            </div>
          </div>

          {/* Password Hint */}
          {passwordHint && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#ecf7ff', border: '1px solid #60a5fa' }}>
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5" style={{ color: '#1d4ed8' }} />
                <p style={{ color: '#1d4ed8' }}><strong>Passworthinweis:</strong> {passwordHint}</p>
              </div>
            </div>
          )}

          {/* Show Password Hint Button */}
          {!passwordHint && (
            <div className="mt-4 text-center">
              <button
                onClick={fetchPasswordHint}
                className="text-sm underline"
                style={{ color: '#247ba0' }}
              >
                Passworthinweis anzeigen
              </button>
            </div>
          )}

          {/* Debug Login Button */}
          <div className="mt-4 text-center">
            <button
              onClick={handleDebugLogin}
              className="text-sm underline"
              style={{ color: '#247ba0' }}
            >
              Debug Login
            </button>
          </div>

          {/* Fix Database Button */}
          <div className="mt-4 text-center">
            <button
              onClick={handleFixDatabase}
              className="text-sm underline"
              style={{ color: '#247ba0' }}
            >
              Datenbank reparieren
            </button>
          </div>

          {/* Debug Info */}
          {debugInfo && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#ecf7ff', border: '1px solid #60a5fa' }}>
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5" style={{ color: '#1d4ed8' }} />
                <p style={{ color: '#1d4ed8' }}>
                  <strong>Debug Info:</strong> 
                  Status: {debugInfo.status}, 
                  Result: {JSON.stringify(debugInfo.result)}, 
                  Password Length: {debugInfo.passwordLength}, 
                  Password Start: {debugInfo.passwordStart}
                </p>
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm underline"
              style={{ color: '#247ba0' }}
            >
              Zurück zur Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;