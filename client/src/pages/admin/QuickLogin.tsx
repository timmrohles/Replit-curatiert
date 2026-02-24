/**
 * ==================================================================
 * QUICK LOGIN - EMERGENCY BYPASS
 * ==================================================================
 * 
 * Ultra-simple login page die SOFORT ein Token setzt
 * Keine Validierung, kein Backend-Call
 * 
 * USAGE: Navigiere zu /admin/quick-login
 * 
 * ==================================================================
 */

import { useState } from 'react';
import { useSafeNavigate } from '../../utils/routing';

export function QuickLogin() {
  const [password, setPassword] = useState('');
  const navigate = useSafeNavigate();

  const handleLogin = () => {
    // Generate a fake token
    const fakeToken = `emergency_token_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
    
    // Set BOTH tokens to be safe
    localStorage.setItem('admin_token', fakeToken);
    localStorage.setItem('admin_neon_token', fakeToken);
    localStorage.setItem('admin_neon_expires', expiresAt);
    localStorage.setItem('admin_last_activity', Date.now().toString());
    
    // Redirect to content manager
    navigate('/sys-mgmt-xK9/content-manager');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🚨 Quick Login</h1>
          <p className="text-sm text-gray-600 mt-2">
            Emergency Bypass - Setzt sofort ein Token ohne Backend-Validierung
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passwort (beliebig)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Egal was..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🚀 Emergency Login (kein Backend)
          </button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-900">
              ⚠️ Dieser Login umgeht ALLE Sicherheitschecks!<br/>
              Nutze ihn nur zu Debug-Zwecken.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 Nach dem Login wirst du zum Content Manager weitergeleitet.<br/>
            Das Token ist 24h gültig.
          </p>
        </div>
      </div>
    </div>
  );
}

export default QuickLogin;