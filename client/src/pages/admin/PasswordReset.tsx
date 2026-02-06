import React, { useState } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Lock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
/**
 * Emergency Password Reset Page
 * Ermöglicht das Zurücksetzen des Admin-Passworts mit dem ADMIN_SETUP_SECRET
 */

export function PasswordReset() {
  const navigate = useSafeNavigate();
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/emergency-reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ secret })
        }
      );

      // Check if response is ok first
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setError(data.error || `Server-Fehler: ${response.status}`);
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          setError(`Server-Fehler: ${response.status}. Bitte prüfen Sie die Server-Logs.`);
        }
        setLoading(false);
        return;
      }

      // Parse JSON response
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Clear all local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/sys-mgmt-xK9/login');
        }, 3000);
      } else {
        setError(data.error || 'Reset fehlgeschlagen');
      }
    } catch (err) {
      console.error('Reset error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(`Fehler: ${errorMessage}. Ist der Server erreichbar?`);
    } finally {
      setLoading(false);
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
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <h1 
              className="text-3xl mb-2" 
              style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
            >
              Passwort zurücksetzen
            </h1>
            <p style={{ color: '#666666' }}>
              Notfall-Reset des Admin-Passworts
            </p>
          </div>

          {!success ? (
            <>
              {/* Info Box */}
              <div 
                className="mb-6 p-4 rounded-lg"
                style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6' }}
              >
                <p className="text-sm" style={{ color: '#1e40af' }}>
                  <strong>ℹ️ So funktioniert's:</strong>
                </p>
                <ol className="text-sm mt-2 ml-4 space-y-1" style={{ color: '#1e40af' }}>
                  <li>1. Geben Sie Ihr ADMIN_SETUP_SECRET ein</li>
                  <li>2. Der Passwort-Hash wird gelöscht</li>
                  <li>3. Melden Sie sich mit ADMIN_PASSWORD an</li>
                </ol>
              </div>

              {/* Error Message */}
              {error && (
                <div 
                  className="mb-6 p-4 rounded-lg flex items-center gap-3"
                  style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171' }}
                >
                  <AlertCircle className="w-5 h-5" style={{ color: '#dc2626' }} />
                  <p style={{ color: '#dc2626' }}>{error}</p>
                </div>
              )}

              {/* Reset Form */}
              <form onSubmit={handleReset}>
                <div className="mb-6">
                  <label 
                    htmlFor="secret" 
                    className="block mb-2"
                    style={{ color: '#3A3A3A' }}
                  >
                    ADMIN_SETUP_SECRET
                  </label>
                  <input
                    id="secret"
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Setup-Secret eingeben"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: '#E5E7EB',
                      focusRingColor: '#f25f5c'
                    }}
                    disabled={loading}
                    autoFocus
                  />
                  <p className="text-xs mt-2" style={{ color: '#666666' }}>
                    Dieses Secret wurde bei der Ersteinrichtung gesetzt
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !secret}
                  className="w-full py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: '#f25f5c',
                    color: '#FFFFFF',
                    fontFamily: 'Fjalla One',
                    fontSize: '1.125rem'
                  }}
                >
                  {loading ? 'Wird zurückgesetzt...' : 'Passwort zurücksetzen'}
                </button>
              </form>
            </>
          ) : (
            /* Success Message */
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: '#10b981' }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 
                className="text-2xl mb-3" 
                style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
              >
                Erfolgreich zurückgesetzt!
              </h2>
              <p className="mb-4" style={{ color: '#666666' }}>
                Der Passwort-Hash wurde gelöscht.
              </p>
              <div 
                className="p-4 rounded-lg mb-4"
                style={{ backgroundColor: '#d1fae5', border: '1px solid #10b981' }}
              >
                <p className="text-sm font-medium" style={{ color: '#065f46' }}>
                  ✅ Nächster Schritt:
                </p>
                <p className="text-sm mt-2" style={{ color: '#065f46' }}>
                  Melden Sie sich mit dem Wert aus der<br />
                  <code className="bg-white px-2 py-1 rounded">ADMIN_PASSWORD</code><br />
                  Umgebungsvariable an.
                </p>
              </div>
              <p className="text-sm" style={{ color: '#666666' }}>
                Weiterleitung zum Login in 3 Sekunden...
              </p>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/sys-mgmt-xK9/login')}
              className="text-sm underline"
              style={{ color: '#247ba0' }}
            >
              Zurück zum Login
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-xs text-center" style={{ color: '#999999' }}>
              🔒 Dieser Vorgang wird protokolliert und alle aktiven Sessions werden beendet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;