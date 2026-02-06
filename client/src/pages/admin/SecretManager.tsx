import React, { useState, useEffect } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Key, Eye, EyeOff, Copy, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Secret Manager
 * Zeigt die gesetzten Secrets und ermöglicht das Abrufen der aktuellen Werte
 */

export function SecretManager() {
  const navigate = useSafeNavigate();
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [copied, setCopied] = useState<string | null>(null);

  // Diese Secrets sind im System konfiguriert
  const configuredSecrets = [
    {
      name: 'ADMIN_PASSWORD',
      description: 'Das Standard-Admin-Passwort für den ersten Login',
      usage: 'Wird beim ersten Login verwendet und dann gehasht',
      required: true
    },
    {
      name: 'ADMIN_SETUP_SECRET',
      description: 'Notfall-Secret für Passwort-Reset',
      usage: 'Wird für den Notfall-Reset des Admin-Passworts benötigt',
      required: true
    },
    {
      name: 'SUPABASE_URL',
      description: 'Ihre Supabase Projekt-URL',
      usage: 'Automatisch konfiguriert',
      required: true
    },
    {
      name: 'SUPABASE_ANON_KEY',
      description: 'Supabase Public Anon Key',
      usage: 'Automatisch konfiguriert',
      required: true
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase Service Role Key (Backend)',
      usage: 'Automatisch konfiguriert - NICHT im Frontend verwenden!',
      required: true
    }
  ];

  const copyToClipboard = (text: string, secretName: string) => {
    navigator.clipboard.writeText(text);
    setCopied(secretName);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div 
      className="min-h-screen px-4 py-8"
      style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#247ba0' }}
              >
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 
                  className="text-3xl" 
                  style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
                >
                  Secret Manager
                </h1>
                <p style={{ color: '#666666' }}>
                  Umgebungsvariablen und Passwörter verwalten
                </p>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <div 
            className="mb-8 p-4 rounded-lg"
            style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6' }}
          >
            <h3 className="font-bold mb-2" style={{ color: '#1e40af' }}>
              📌 Wie Secrets in Figma Make funktionieren:
            </h3>
            <ul className="text-sm space-y-1 ml-4" style={{ color: '#1e40af' }}>
              <li>• Secrets werden über die Figma Make Umgebung verwaltet</li>
              <li>• Sie wurden bei der Ersteinrichtung automatisch generiert</li>
              <li>• Diese Werte sind im Backend verfügbar via <code>Deno.env.get()</code></li>
              <li>• Aus Sicherheitsgründen können Sie im Frontend nicht direkt gelesen werden</li>
            </ul>
          </div>

          {/* How to find your secrets */}
          <div 
            className="mb-8 p-4 rounded-lg"
            style={{ backgroundColor: '#fff3cd', border: '1px solid #f4a261' }}
          >
            <h3 className="font-bold mb-2" style={{ color: '#856404' }}>
              🔍 So finden Sie Ihre Secret-Werte:
            </h3>
            <div className="space-y-3 text-sm" style={{ color: '#856404' }}>
              <div>
                <strong>Option 1: Browser Entwickler-Tools</strong>
                <ol className="ml-4 mt-1 space-y-1">
                  <li>1. Öffnen Sie die Browser-Konsole (F12)</li>
                  <li>2. Gehen Sie zum "Application" oder "Storage" Tab</li>
                  <li>3. Suchen Sie nach gespeicherten Werten</li>
                </ol>
              </div>
              
              <div>
                <strong>Option 2: Neue Secrets setzen</strong>
                <p className="mt-1">
                  Wenn Sie die Werte nicht finden, können Sie neue Secrets setzen.
                  Das System wird Sie beim nächsten Neustart nach den fehlenden Werten fragen.
                </p>
              </div>

              <div>
                <strong>Option 3: Standard-Fallback verwenden</strong>
                <p className="mt-1">
                  Der Code verwendet Fallback-Werte, wenn keine Secrets gesetzt sind:
                </p>
                <ul className="ml-4 mt-1">
                  <li>• ADMIN_PASSWORD: <code className="bg-white px-2 py-1 rounded">temporarydefault2024</code></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Configured Secrets List */}
          <div className="mb-8">
            <h2 
              className="text-xl mb-4" 
              style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
            >
              Konfigurierte Secrets
            </h2>
            
            <div className="space-y-4">
              {configuredSecrets.map((secret) => (
                <div 
                  key={secret.name}
                  className="border rounded-lg p-4"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code 
                          className="font-mono text-sm font-bold px-2 py-1 rounded"
                          style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}
                        >
                          {secret.name}
                        </code>
                        {secret.required && (
                          <span 
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                          >
                            Erforderlich
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-1" style={{ color: '#666666' }}>
                        {secret.description}
                      </p>
                      <p className="text-xs" style={{ color: '#999999' }}>
                        Verwendung: {secret.usage}
                      </p>
                    </div>
                  </div>

                  {/* Fallback Value Info for ADMIN_PASSWORD */}
                  {secret.name === 'ADMIN_PASSWORD' && (
                    <div 
                      className="mt-3 p-3 rounded text-sm"
                      style={{ backgroundColor: '#d1fae5', border: '1px solid #10b981' }}
                    >
                      <p className="font-medium mb-1" style={{ color: '#065f46' }}>
                        ✅ Fallback-Wert verfügbar:
                      </p>
                      <div className="flex items-center gap-2">
                        <code 
                          className="flex-1 px-3 py-2 rounded font-mono"
                          style={{ backgroundColor: 'white', color: '#065f46' }}
                        >
                          temporarydefault2024
                        </code>
                        <button
                          onClick={() => copyToClipboard('temporarydefault2024', secret.name)}
                          className="p-2 rounded hover:bg-white transition-colors"
                          title="Kopieren"
                        >
                          {copied === secret.name ? (
                            <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                          ) : (
                            <Copy className="w-4 h-4" style={{ color: '#065f46' }} />
                          )}
                        </button>
                      </div>
                      <p className="text-xs mt-2" style={{ color: '#065f46' }}>
                        💡 Versuchen Sie sich mit diesem Passwort anzumelden!
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div 
            className="p-6 rounded-lg"
            style={{ backgroundColor: '#f9fafb', border: '1px solid #E5E7EB' }}
          >
            <h3 className="font-bold mb-4" style={{ color: '#3A3A3A' }}>
              🚀 Schnellaktionen
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/sys-mgmt-xK9/login')}
                className="w-full p-3 rounded-lg text-left hover:bg-white transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <strong style={{ color: '#3A3A3A' }}>→ Zum Login</strong>
                <p className="text-sm mt-1" style={{ color: '#666666' }}>
                  Versuchen Sie sich mit dem Fallback-Passwort anzumelden
                </p>
              </button>

              <button
                onClick={() => navigate('/sys-mgmt-xK9/password-reset')}
                className="w-full p-3 rounded-lg text-left hover:bg-white transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <strong style={{ color: '#3A3A3A' }}>→ Passwort zurücksetzen</strong>
                <p className="text-sm mt-1" style={{ color: '#666666' }}>
                  Wenn Sie Ihr ADMIN_SETUP_SECRET kennen
                </p>
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full p-3 rounded-lg text-left hover:bg-white transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <strong style={{ color: '#3A3A3A' }}>→ Zur Homepage</strong>
                <p className="text-sm mt-1" style={{ color: '#666666' }}>
                  Zurück zur Website
                </p>
              </button>
            </div>
          </div>

          {/* Security Warning */}
          <div 
            className="mt-6 p-4 rounded-lg"
            style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171' }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: '#dc2626' }} />
              <div>
                <p className="font-bold mb-1" style={{ color: '#dc2626' }}>
                  ⚠️ Sicherheitshinweis
                </p>
                <p className="text-sm" style={{ color: '#dc2626' }}>
                  Teilen Sie Ihre Secrets niemals mit anderen. Ändern Sie das Standard-Passwort 
                  sofort nach dem ersten Login über Content Manager → Einstellungen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecretManager;