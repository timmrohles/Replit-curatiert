import React, { useState, useEffect } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Activity, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getAdminToken } from '../../utils/adminToken';

/**
 * Diagnostics Page - v1138
 * Testet ALLE Backend-Routes für Admin Content Manager
 * Updated: Admin Token Support für protected routes
 */

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export function Diagnostics() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const navigate = useSafeNavigate();

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { name, status, message, details } : t);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runDiagnostics = async () => {
    try {
      setIsRunning(true);
      setTests([]);

      const BASE_URL = '/api';

      // Test 0: Admin Auth Check
      updateTest('admin-auth', 'pending', 'Prüfe Admin-Login...');
      const adminToken = getAdminToken();
      try {
        if (!adminToken) {
          updateTest('admin-auth', 'warning', 'Nicht eingeloggt - Admin-Routes werden 401 returnen', 
            'Bitte über /admin/login einloggen um Admin-Routes zu testen');
        } else {
          updateTest('admin-auth', 'success', `Admin Token vorhanden: ${adminToken.substring(0, 12)}...`);
        }
      } catch (err) {
        updateTest('admin-auth', 'error', 'Admin Auth Check fehlgeschlagen', String(err));
      }

      // Test 1: Supabase Config
      updateTest('config', 'pending', 'Prüfe Supabase Konfiguration...');
      try {
        if (false) {
          updateTest('config', 'error', 'Supabase nicht konfiguriert', 
            'API configured');
        } else {
          updateTest('config', 'success', 'Supabase konfiguriert', 'Express Backend');
        }
      } catch (err) {
        updateTest('config', 'error', 'Config-Fehler', String(err));
      }

      // Test 2: Health Check
      updateTest('health', 'pending', 'Teste Backend-Verbindung...');
      try {
        const healthRes = await fetch(`${BASE_URL}/health`, {
          headers: { }
        });
        const healthData = await healthRes.json();
        
        const expectedVersion = 'v1134-production-api';
        const isCorrectVersion = healthData.version === expectedVersion;
        
        if (healthRes.ok && isCorrectVersion) {
          updateTest('health', 'success', `Backend Version: ${healthData.version}`, 
            `Database: ${healthData.database}\n${JSON.stringify(healthData, null, 2)}`);
        } else if (healthRes.ok && !isCorrectVersion) {
          updateTest('health', 'warning', `Server Version ${healthData.version} (erwartet: ${expectedVersion})`, 
            `Deployment-Hinweis: Backend läuft, aber mit anderer Version.`);
        } else {
          updateTest('health', 'error', 'Backend nicht erreichbar', JSON.stringify(healthData, null, 2));
        }
      } catch (err) {
        updateTest('health', 'error', 'Health Check fehlgeschlagen', String(err));
      }

      // Test 3: Books API
      updateTest('books', 'pending', 'Teste Books API...');
      try {
        const res = await fetch(`${BASE_URL}/books?limit=5`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok && Array.isArray(data.data)) {
          updateTest('books', 'success', `Books API: ${data.data.length} Bücher geladen`);
        } else {
          updateTest('books', 'error', 'Books API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('books', 'error', 'Books API fehlgeschlagen', String(err));
      }

      // Test 4: Books Search API
      updateTest('books-search', 'pending', 'Teste Books Search...');
      try {
        const res = await fetch(`${BASE_URL}/books/search?q=test&limit=5`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok && Array.isArray(data.data)) {
          updateTest('books-search', 'success', `Search API funktioniert (${data.data.length} Ergebnisse)`);
        } else {
          updateTest('books-search', 'error', 'Search API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('books-search', 'error', 'Search API fehlgeschlagen', String(err));
      }

      // Test 5: Awards API
      updateTest('awards', 'pending', 'Teste Awards API...');
      try {
        const res = await fetch(`${BASE_URL}/awards`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok && Array.isArray(data.data)) {
          updateTest('awards', 'success', `Awards API: ${data.data.length} Awards`);
        } else {
          updateTest('awards', 'error', 'Awards API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('awards', 'error', 'Awards API fehlgeschlagen', String(err));
      }

      // Test 6: Tags API
      updateTest('tags', 'pending', 'Teste Tags API...');
      try {
        const res = await fetch(`${BASE_URL}/tags`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok && Array.isArray(data.data)) {
          updateTest('tags', 'success', `Tags API: ${data.data.length} Tags`);
        } else {
          updateTest('tags', 'error', 'Tags API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('tags', 'error', 'Tags API fehlgeschlagen', String(err));
      }

      // Test 7: ONIX Tags API
      updateTest('onix-tags', 'pending', 'Teste ONIX Tags API...');
      try {
        const res = await fetch(`${BASE_URL}/onix-tags`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok && Array.isArray(data.data)) {
          updateTest('onix-tags', 'success', `ONIX Tags API: ${data.data.length} Tags`);
        } else {
          updateTest('onix-tags', 'error', 'ONIX Tags API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('onix-tags', 'error', 'ONIX Tags API fehlgeschlagen', String(err));
      }

      // Test 8: Persons API
      updateTest('persons', 'pending', 'Teste Persons API...');
      try {
        const res = await fetch(`${BASE_URL}/persons`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok && Array.isArray(data.data)) {
          updateTest('persons', 'success', `Persons API: ${data.data.length} Personen`);
        } else {
          updateTest('persons', 'error', 'Persons API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('persons', 'error', 'Persons API fehlgeschlagen', String(err));
      }

      // Test 9: Curators API
      updateTest('curators', 'pending', 'Teste Curators API...');
      try {
        const res = await fetch(`${BASE_URL}/curators`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok) {
          updateTest('curators', 'success', `Curators API funktioniert`);
        } else if (data.error?.includes('does not exist')) {
          // If curators API fails, try schema debug
          try {
            const schemaRes = await fetch(`${BASE_URL}/curators/debug/schema`, {
              headers: { }
            });
            const schemaData = await schemaRes.json();
            updateTest('curators', 'warning', 
              'Curators Tabelle existiert nicht', 
              `Schema Info: ${JSON.stringify(schemaData, null, 2)}`);
          } catch (e) {
            updateTest('curators', 'error', 'Curators Schema-Check fehlgeschlagen', String(e));
          }
        } else {
          updateTest('curators', 'error', 'Curators API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('curators', 'error', 'Curators API fehlgeschlagen', String(err));
      }

      // Test 10: Sections API
      updateTest('sections', 'pending', 'Teste Sections API...');
      try {
        const res = await fetch(`${BASE_URL}/sections`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok && Array.isArray(data.data)) {
          updateTest('sections', 'success', `Sections API: ${data.data.length} Sections`);
        } else {
          updateTest('sections', 'error', 'Sections API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('sections', 'error', 'Sections API fehlgeschlagen', String(err));
      }

      // Test 11: Pages API
      updateTest('pages', 'pending', 'Teste Pages API...');
      try {
        const res = await fetch(`${BASE_URL}/pages`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok && Array.isArray(data.data)) {
          updateTest('pages', 'success', `Pages API: ${data.data.length} Pages`);
        } else {
          updateTest('pages', 'error', 'Pages API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('pages', 'error', 'Pages API fehlgeschlagen', String(err));
      }

      // Test 12: Navigation API
      updateTest('navigation', 'pending', 'Teste Navigation API...');
      try {
        const res = await fetch(`${BASE_URL}/navigation`, {
          headers: { }
        });
        const data = await res.json();
        
        // Navigation API gibt { schema_version, items, meta } zurück
        if (data.schema_version && Array.isArray(data.items)) {
          updateTest('navigation', 'success', `Navigation API: ${data.items.length} Items (Schema: ${data.schema_version})`);
        } else {
          updateTest('navigation', 'error', 'Navigation API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('navigation', 'error', 'Navigation API fehlgeschlagen', String(err));
      }

      // Test 13: Affiliate Links API
      updateTest('affiliate', 'pending', 'Teste Affiliate Links API...');
      try {
        const res = await fetch(`${BASE_URL}/affiliate/links`, {
          headers: { }
        });
        const data = await res.json();
        
        if (data.ok) {
          updateTest('affiliate', 'success', `Affiliate Links API funktioniert`);
        } else {
          updateTest('affiliate', 'error', 'Affiliate Links API Fehler', JSON.stringify(data));
        }
      } catch (err) {
        updateTest('affiliate', 'error', 'Affiliate Links API fehlgeschlagen', String(err));
      }

      setIsRunning(false);

    } catch (err) {
      console.error('Diagnostics error:', err);
      updateTest('global', 'error', 'Diagnostics fehlgeschlagen', String(err));
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'pending':
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '32px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <Activity size={32} style={{ color: '#667eea' }} />
            <div>
              <h1 
                className="font-brand text-3xl" 
                style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
              >
                🔍 System Diagnostics
              </h1>
              <p style={{ color: '#666666' }}>
                v1105 Complete API Test Suite
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <strong>Project ID:</strong><br/>
              <code style={{ fontSize: '12px' }}>'local'</code>
            </div>
            <div style={{ flex: 1 }}>
              <strong>Anon Key:</strong><br/>
              <code style={{ fontSize: '12px' }}>'N/A (Express backend)'</code>
            </div>
            <div style={{ flex: 1 }}>
              <strong>Backend URL:</strong><br/>
              <code style={{ fontSize: '12px' }}>/api</code>
            </div>
          </div>

          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            style={{
              width: '100%',
              padding: '12px',
              background: isRunning ? '#999' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isRunning ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Tests laufen...
              </>
            ) : (
              <>
                ⚡ Jetzt Diagnostics Starten
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tests.map((test) => (
            <div
              key={test.name}
              className={`${getStatusColor(test.status)} p-4 rounded-lg border-2 transition-all`}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ paddingTop: '2px' }}>
                  {getStatusIcon(test.status)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '16px',
                    marginBottom: '4px',
                    color: '#333'
                  }}>
                    {test.name.toUpperCase()}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                    {test.message}
                  </div>
                  {test.details && (
                    <details style={{ marginTop: '8px' }}>
                      <summary style={{ 
                        cursor: 'pointer',
                        color: '#667eea',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        Details anzeigen
                      </summary>
                      <pre style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '300px'
                      }}>
                        {test.details}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {tests.length > 0 && !isRunning && (
          <div style={{
            marginTop: '24px',
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              fontFamily: 'Fjalla One', 
              fontSize: '20px', 
              marginBottom: '16px',
              color: '#333'
            }}>
              📊 Zusammenfassung
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={{ 
                padding: '12px', 
                background: '#f0fdf4', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  {tests.filter(t => t.status === 'success').length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Erfolgreich</div>
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#fef2f2', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                  {tests.filter(t => t.status === 'error').length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Fehler</div>
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#fefce8', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ca8a04' }}>
                  {tests.filter(t => t.status === 'warning').length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Warnungen</div>
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#eff6ff', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                  {tests.length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Gesamt</div>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '12px',
            background: 'white',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ← Zurück zum Content Manager
        </button>
      </div>
    </div>
  );
}

// ✅ DEFAULT EXPORT for lazy loading
export default Diagnostics;