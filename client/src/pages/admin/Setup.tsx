import { useSafeNavigate } from '../../utils/routing';
import { useState, useEffect } from 'react';
import { seedDemoData } from '../../utils/seedDemoData';
import { CheckCircle, AlertCircle, Database, Settings, LogOut, ExternalLink } from 'lucide-react';
// ✅ REMOVED: import { useAdminAuth } from '../../utils/useAdminAuth'; - Hook doesn't exist

/**
 * Setup Page - Admin Dashboard
 * Hier können Admins Demo-Daten erstellen
 */

export function Setup() {
  const navigate = useSafeNavigate();
  
  // ✅ CRASH-SAFE: Simple auth check without external hook
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      console.warn('❌ Setup: No token, redirecting to login');
      navigate('/sys-mgmt-xK9/login');
      return;
    }
    setIsAuthenticated(true);
    setAuthLoading(false);
  }, [navigate]);
  
  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_last_activity');
    navigate('/sys-mgmt-xK9/login');
  };
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}
      >
        <p style={{ color: '#3A3A3A' }}>Lade...</p>
      </div>
    );
  }

  const handleSeed = async () => {
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const result = await seedDemoData();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}
    >
      <div className="max-w-2xl w-full">
        {/* Quick Navigation */}
        <div className="flex gap-3 mb-6 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg transition-colors text-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#3A3A3A' }}
          >
            ← Zurück zur Website
          </button>
          <button
            onClick={() => navigate('/sys-mgmt-xK9/content-manager')}
            className="px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#3A3A3A' }}
          >
            <Settings className="w-4 h-4" />
            Content Manager
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#3A3A3A' }}
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#f25f5c20' }}
            >
              <Database className="w-10 h-10" style={{ color: '#f25f5c' }} />
            </div>
          </div>

          {/* Header */}
          <h1 
            className="text-4xl text-center mb-4"
            style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
          >
            Dynamische Datenbank Setup
          </h1>
          <p className="text-center mb-8" style={{ color: '#666666' }}>
            Erstelle Demo-Daten für coratiert.de
          </p>

          {/* Info Box */}
          <div 
            className="p-6 rounded-xl mb-8"
            style={{ backgroundColor: '#F5F5F0' }}
          >
            <h3 className="text-lg mb-3" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Was wird erstellt?
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span style={{ color: '#70c1b3' }}>✓</span>
                <span style={{ color: '#3A3A3A' }}>7 Tags (Belletristik, Sachbuch, Krimi, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#70c1b3' }}>✓</span>
                <span style={{ color: '#3A3A3A' }}>3 Kuratoren (Lisa, Maurice, Nina)</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#70c1b3' }}>✓</span>
                <span style={{ color: '#3A3A3A' }}>5 Bücher mit Covern und Details</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#70c1b3' }}>✓</span>
                <span style={{ color: '#3A3A3A' }}>3 Reviews mit Bewertungen</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          {!success && (
            <button
              onClick={handleSeed}
              disabled={loading}
              className="w-full py-4 rounded-xl transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50"
              style={{ 
                backgroundColor: '#f25f5c', 
                color: '#FFFFFF',
                fontFamily: 'Fjalla One'
              }}
            >
              {loading ? (
                <>
                  <div 
                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#FFFFFF', borderTopColor: 'transparent' }}
                  />
                  Demo-Daten werden erstellt...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  Demo-Daten erstellen
                </>
              )}
            </button>
          )}

          {/* Result */}
          {success && (
            <div className="space-y-4">
              <div 
                className="p-6 rounded-xl flex items-start gap-4"
                style={{ backgroundColor: '#70c1b320', borderLeft: '4px solid #70c1b3' }}
              >
                <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: '#70c1b3' }} />
                <div>
                  <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Erfolgreich!
                  </h3>
                  <p style={{ color: '#3A3A3A' }}>
                    Demo-Daten wurden erstellt:
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li style={{ color: '#666666' }}>• 7 Tags</li>
                    <li style={{ color: '#666666' }}>• 3 Kuratoren</li>
                    <li style={{ color: '#666666' }}>• 5 Bücher</li>
                    <li style={{ color: '#666666' }}>• 3 Reviews</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/sys-mgmt-xK9/content-manager')}
                  className="flex-1 py-3 rounded-xl transition-colors"
                  style={{ backgroundColor: '#247ba0', color: '#FFFFFF', fontFamily: 'Fjalla One' }}
                >
                  Zum Content Manager
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3 rounded-xl transition-colors"
                  style={{ backgroundColor: '#E5E7EB', color: '#3A3A3A', fontFamily: 'Fjalla One' }}
                >
                  Zurücksetzen
                </button>
              </div>
            </div>
          )}

          {error && (
            <div 
              className="p-6 rounded-xl flex items-start gap-4"
              style={{ backgroundColor: '#f25f5c20', borderLeft: '4px solid #f25f5c' }}
            >
              <AlertCircle className="w-6 h-6 flex-shrink-0" style={{ color: '#f25f5c' }} />
              <div>
                <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  Fehler
                </h3>
                <p style={{ color: '#3A3A3A' }}>
                  {error}
                </p>
                <button
                  onClick={() => setError('')}
                  className="mt-4 px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
                >
                  Erneut versuchen
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: '#999999' }}>
              Diese Funktion nutzt den Supabase KV-Store für flexible Datenspeicherung.
            </p>
          </div>
          
          {/* Admin Links Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-center mb-3" style={{ color: '#999999' }}>
              Admin-Bereiche
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/sys-mgmt-xK9/data-seeding')}
                className="px-3 py-2 rounded-lg transition-colors text-xs flex items-center gap-2"
                style={{ backgroundColor: '#F5F5F0', color: '#3A3A3A' }}
              >
                <Database className="w-3 h-3" />
                Data Seeding
              </button>
              <button
                onClick={() => navigate('/sys-mgmt-xK9/affiliate-management')}
                className="px-3 py-2 rounded-lg transition-colors text-xs flex items-center gap-2"
                style={{ backgroundColor: '#F5F5F0', color: '#3A3A3A' }}
              >
                <ExternalLink className="w-3 h-3" />
                Affiliate-Verwaltung
              </button>
              <button
                onClick={() => navigate('/sys-mgmt-xK9/content-manager')}
                className="px-3 py-2 rounded-lg transition-colors text-xs flex items-center gap-2"
                style={{ backgroundColor: '#F5F5F0', color: '#3A3A3A' }}
              >
                <Settings className="w-3 h-3" />
                Content Manager
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup;