/**
 * ==================================================================
 * API HEALTH CHECK & SMOKE TESTS
 * ==================================================================
 * 
 * Testet alle kritischen API-Endpoints gegen den Canonical Contract
 * Zeigt sofort, wenn etwas 404t oder falsch konfiguriert ist
 * 
 * ==================================================================
 */

import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { CheckCircle2, XCircle, Loader2, Play, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS, apiFetch, API_BASE_URL } from '../../config/apiClient';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
  statusCode?: number;
}

export function ApiHealthCheck() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState({ total: 0, success: 0, error: 0, warning: 0 });

  // Define critical endpoints to test
  const criticalTests = [
    {
      name: 'Health Check',
      endpoint: API_ENDPOINTS.health,
      requiresAuth: false,
    },
    {
      name: 'Admin Login',
      endpoint: API_ENDPOINTS.auth.login,
      requiresAuth: false,
      method: 'POST' as const,
      body: { username: 'test', password: 'test' },
      expectError: true, // We expect this to fail with wrong credentials
    },
    {
      name: 'Books List',
      endpoint: `${API_ENDPOINTS.books.list}?limit=1`,
      requiresAuth: false,
    },
    {
      name: 'Categories List',
      endpoint: API_ENDPOINTS.categories.list,
      requiresAuth: false,
    },
    {
      name: 'Tags List',
      endpoint: API_ENDPOINTS.tags.list,
      requiresAuth: false,
    },
    {
      name: 'Navigation Items (Public)',
      endpoint: API_ENDPOINTS.navigation.public,
      requiresAuth: false,
    },
    {
      name: 'Navigation Items (Admin)',
      endpoint: API_ENDPOINTS.navigation.items,
      requiresAuth: true,
    },
    {
      name: 'Pages List',
      endpoint: API_ENDPOINTS.pages.list,
      requiresAuth: false,
    },
    {
      name: 'Awards List',
      endpoint: API_ENDPOINTS.awards.list,
      requiresAuth: false,
    },
    {
      name: 'Persons List',
      endpoint: API_ENDPOINTS.persons.list,
      requiresAuth: false,
    },
    {
      name: 'Curators List',
      endpoint: API_ENDPOINTS.curators.list,
      requiresAuth: false,
    },
  ];

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const testResults: TestResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    for (const test of criticalTests) {
      const startTime = performance.now();
      
      try {
        const response = await apiFetch(test.endpoint, {
          method: test.method || 'GET',
          body: test.body,
          isAdmin: test.requiresAuth,
        });
        
        const duration = Math.round(performance.now() - startTime);
        
        // Determine status
        let status: TestResult['status'] = 'success';
        let message = 'OK';
        
        if (test.expectError) {
          // For login test, we expect an error (wrong credentials)
          if (!response.success) {
            status = 'success';
            message = 'Expected error received (endpoint works)';
          } else {
            status = 'warning';
            message = 'Unexpected success with test credentials';
            warningCount++;
          }
        } else if (response.success) {
          status = 'success';
          message = `Success (${duration}ms)`;
          successCount++;
        } else {
          status = 'error';
          message = response.error || 'Unknown error';
          errorCount++;
        }
        
        testResults.push({
          name: test.name,
          endpoint: test.endpoint,
          status,
          message,
          duration,
          statusCode: 200,
        });
        
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        errorCount++;
        
        testResults.push({
          name: test.name,
          endpoint: test.endpoint,
          status: 'error',
          message: error instanceof Error ? error.message : 'Network error',
          duration,
        });
      }
      
      // Update results incrementally
      setResults([...testResults]);
    }
    
    setSummary({
      total: criticalTests.length,
      success: successCount,
      error: errorCount,
      warning: warningCount,
    });
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" style={{ color: '#16A34A' }} />;
      case 'error':
        return <XCircle className="w-5 h-5" style={{ color: '#DC2626' }} />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" style={{ color: '#F59E0B' }} />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6B7280' }} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#16A34A';
      case 'error':
        return '#DC2626';
      case 'warning':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--header-bg)' }}>
      <Header />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            API Health Check
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Testet kritische API-Endpoints gegen den Canonical Contract
          </p>
        </div>

        {/* Base URL Info */}
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB' }}>
          <div className="text-xs font-medium mb-1" style={{ color: '#6B7280' }}>BASE URL</div>
          <code className="text-sm" style={{ color: '#247ba0', fontFamily: 'monospace' }}>
            {API_BASE_URL}
          </code>
        </div>

        {/* Run Tests Button */}
        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: isRunning ? '#D1D5DB' : '#247ba0',
              color: '#FFFFFF',
              cursor: isRunning ? 'not-allowed' : 'pointer',
            }}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Tests laufen...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Tests starten
              </>
            )}
          </button>
        </div>

        {/* Summary */}
        {results.length > 0 && (
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#3A3A3A' }}>{summary.total}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>Total Tests</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#DCFCE7', border: '1px solid #86EFAC' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#16A34A' }}>{summary.success}</div>
              <div className="text-xs" style={{ color: '#15803D' }}>Erfolgreich</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#DC2626' }}>{summary.error}</div>
              <div className="text-xs" style={{ color: '#991B1B' }}>Fehler</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#F59E0B' }}>{summary.warning}</div>
              <div className="text-xs" style={{ color: '#B45309' }}>Warnungen</div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #D1D5DB' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#6B7280' }}>
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#6B7280' }}>
                    Test Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#6B7280' }}>
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#6B7280' }}>
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#6B7280' }}>
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: index < results.length - 1 ? '1px solid #E5E7EB' : 'none',
                    }}
                  >
                    <td className="px-4 py-3">
                      {getStatusIcon(result.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" style={{ color: '#3A3A3A' }}>
                        {result.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs" style={{ color: '#6B7280', fontFamily: 'monospace' }}>
                        {result.endpoint}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" style={{ color: getStatusColor(result.status) }}>
                        {result.message}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" style={{ color: '#6B7280' }}>
                        {result.duration ? `${result.duration}ms` : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !isRunning && (
          <div className="p-12 text-center rounded-lg" style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB' }}>
            <Play className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Klicke auf "Tests starten", um alle kritischen Endpoints zu testen
            </p>
          </div>
        )}

        {/* Documentation */}
        <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <h3 className="text-lg font-medium mb-3" style={{ color: '#1E3A8A' }}>
            📚 Canonical Contract
          </h3>
          <div className="space-y-2 text-sm" style={{ color: '#1E40AF' }}>
            <p>✅ <strong>BASE_URL:</strong> /functions/v1/make-server-6e4a36b4</p>
            <p>✅ <strong>Alle Routes:</strong> Beginnen mit /api/*</p>
            <p>✅ <strong>Auth:</strong> Bearer Token + X-Admin-Token für Admin-Routen</p>
            <p>✅ <strong>Publishing-Logik:</strong> deleted_at IS NULL AND status = 'published' AND visibility = 'visible'</p>
            <p className="mt-3 text-xs">
              Siehe: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#DBEAFE' }}>
                /NEON_CANONICAL_CONTRACT.md
              </code>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
