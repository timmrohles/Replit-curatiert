import React, { useState, useEffect } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Health Check Page
 * Prüft ob alle Komponenten und Imports korrekt geladen werden
 */

interface HealthStatus {
  component: string;
  status: 'ok' | 'error' | 'warning';
  message: string;
}

export function HealthCheck() {
  const [checks, setChecks] = useState<HealthStatus[]>([]);

  useEffect(() => {
    runHealthChecks();
  }, []);

  const runHealthChecks = () => {
    const results: HealthStatus[] = [];

    // Check 1: React Router
    try {
      const location = window.location;
      results.push({
        component: 'React Router',
        status: 'ok',
        message: `Current path: ${location.pathname}`
      });
    } catch (err) {
      results.push({
        component: 'React Router',
        status: 'error',
        message: String(err)
      });
    }

    // Check 2: LocalStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      results.push({
        component: 'LocalStorage',
        status: 'ok',
        message: 'Working'
      });
    } catch (err) {
      results.push({
        component: 'LocalStorage',
        status: 'error',
        message: String(err)
      });
    }

    // Check 3: Supabase Config
    try {
      const token = localStorage.getItem('admin_token');
      results.push({
        component: 'Admin Token',
        status: token ? 'ok' : 'warning',
        message: token ? 'Token found' : 'No token (not logged in)'
      });
    } catch (err) {
      results.push({
        component: 'Admin Token',
        status: 'error',
        message: String(err)
      });
    }

    // Check 4: API Module
    try {
      // @ts-ignore - just checking if module exists
      import('../../utils/api').then(() => {
        results.push({
          component: 'API Module',
          status: 'ok',
          message: 'Loaded successfully'
        });
        setChecks([...results]);
      }).catch(err => {
        results.push({
          component: 'API Module',
          status: 'error',
          message: String(err)
        });
        setChecks([...results]);
      });
    } catch (err) {
      results.push({
        component: 'API Module',
        status: 'error',
        message: String(err)
      });
    }

    // Check 5: Auth Hook
    try {
      // @ts-ignore
      import('../../utils/useAdminAuth').then(() => {
        results.push({
          component: 'Auth Hook',
          status: 'ok',
          message: 'Loaded successfully'
        });
        setChecks([...results]);
      }).catch(err => {
        results.push({
          component: 'Auth Hook',
          status: 'error',
          message: String(err)
        });
        setChecks([...results]);
      });
    } catch (err) {
      results.push({
        component: 'Auth Hook',
        status: 'error',
        message: String(err)
      });
    }

    setChecks(results);
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: '#3A3A3A' }}>
            🏥 Frontend Health Check
          </h1>

          <div className="space-y-4">
            {checks.map((check, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-2"
                style={{
                  borderColor:
                    check.status === 'ok'
                      ? '#10b981'
                      : check.status === 'warning'
                      ? '#f59e0b'
                      : '#ef4444',
                  backgroundColor:
                    check.status === 'ok'
                      ? '#d1fae5'
                      : check.status === 'warning'
                      ? '#fef3c7'
                      : '#fee2e2',
                }}
              >
                <div className="flex items-center gap-3">
                  {getIcon(check.status)}
                  <div>
                    <h3 className="font-bold" style={{ color: '#3A3A3A' }}>
                      {check.component}
                    </h3>
                    <p className="text-sm" style={{ color: '#666666' }}>
                      {check.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Console Errors */}
          <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: '#fff3cd' }}>
            <h3 className="font-bold mb-2" style={{ color: '#856404' }}>
              📋 Nächste Schritte:
            </h3>
            <ol className="text-sm space-y-2" style={{ color: '#856404' }}>
              <li>1. Öffnen Sie die Browser Console (F12)</li>
              <li>2. Schauen Sie nach roten Fehlermeldungen</li>
              <li>3. Versuchen Sie den Login erneut</li>
              <li>4. Kopieren Sie alle Console-Logs</li>
            </ol>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => window.location.href = '/sys-mgmt-xK9/login'}
              className="px-6 py-3 rounded-lg text-white font-bold"
              style={{ backgroundColor: '#3b82f6' }}
            >
              Zum Login
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                alert('LocalStorage cleared! Seite wird neu geladen...');
                window.location.reload();
              }}
              className="px-6 py-3 rounded-lg text-white font-bold"
              style={{ backgroundColor: '#dc2626' }}
            >
              LocalStorage Leeren
            </button>
            <button
              onClick={() => runHealthChecks()}
              className="px-6 py-3 rounded-lg text-white font-bold"
              style={{ backgroundColor: '#10b981' }}
            >
              Erneut Prüfen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthCheck;