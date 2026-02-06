import React, { useState, useEffect } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { ArrowLeft, Database, BookOpen, Tag, ExternalLink } from 'lucide-react';
import { seedDemoData } from '../utils/seedDemoData';
import { seedDemoBooksWithONIXTags } from '../utils/seedDemoBooks';
import { seedExtendedONIXTags } from '../utils/seedExtendedONIXTags';
import { seedBooksWithExtendedTags } from '../utils/seedBooksWithExtendedTags';
import { seedDiscoveryTags } from '../utils/seedDiscoveryTags';
import { seedDiscoveryBooks } from '../utils/seedDiscoveryBooks';
import { seedAffiliates } from '../../utils/seedAffiliates';

/**
 * Admin Data Seeding Page
 * Allows seeding demo data for testing
 */
export function AdminDataSeeding() {
  const navigate = useSafeNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleSeedAll = async () => {
    setLoading(true);
    setResult('');
    try {
      const result = await seedDemoData();
      if (result.success) {
        setResult('✅ Alle Demo-Daten wurden erfolgreich angelegt!');
      } else {
        setResult(`❌ Fehler: ${result.error}`);
      }
    } catch (error) {
      setResult(`❌ Fehler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedBooks = async () => {
    setLoading(true);
    setResult('');
    try {
      const success = await seedDemoBooksWithONIXTags();
      if (success) {
        setResult('✅ Demo-Bücher mit ONIX-Tags wurden erfolgreich angelegt!');
      } else {
        setResult('❌ Fehler beim Anlegen der Demo-Bücher.');
      }
    } catch (error) {
      setResult(`❌ Fehler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedExtendedTags = async () => {
    setLoading(true);
    setResult('');
    try {
      const success = await seedExtendedONIXTags();
      if (success) {
        setResult('✅ Erweiterte ONIX-Tags (Serie, Band, Feeling, Status) erfolgreich angelegt!');
      } else {
        setResult('❌ Fehler beim Anlegen der erweiterten Tags.');
      }
    } catch (error) {
      setResult(`❌ Fehler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedExtendedBooks = async () => {
    setLoading(true);
    setResult('');
    try {
      const success = await seedBooksWithExtendedTags();
      if (success) {
        setResult('✅ Bücher mit erweiterten Tags (Serien, Bestseller, etc.) erfolgreich angelegt!');
      } else {
        setResult('❌ Fehler beim Anlegen der Bücher.');
      }
    } catch (error) {
      setResult(`❌ Fehler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDiscoveryTags = async () => {
    setLoading(true);
    setResult('');
    try {
      const success = await seedDiscoveryTags();
      if (success) {
        setResult('✅ Discovery-Tags (Genre, Zielgruppe, etc.) erfolgreich angelegt!');
      } else {
        setResult('❌ Fehler beim Anlegen der Discovery-Tags.');
      }
    } catch (error) {
      setResult(`❌ Fehler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDiscoveryBooks = async () => {
    setLoading(true);
    setResult('');
    try {
      const success = await seedDiscoveryBooks();
      if (success) {
        setResult('✅ Bücher mit Discovery-Tags (Genre, Zielgruppe, etc.) erfolgreich angelegt!');
      } else {
        setResult('❌ Fehler beim Anlegen der Bücher.');
      }
    } catch (error) {
      setResult(`❌ Fehler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedAffiliates = async () => {
    setLoading(true);
    setResult('');
    try {
      const success = await seedAffiliates();
      if (success) {
        setResult('✅ Affiliate-Daten erfolgreich angelegt!');
      } else {
        setResult('❌ Fehler beim Anlegen der Affiliate-Daten.');
      }
    } catch (error) {
      setResult(`❌ Fehler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndReseed = () => {
    // Clear localStorage flag
    localStorage.removeItem('coratiert_demo_seeded');
    setResult('🔄 LocalStorage gelöscht. Seite wird neu geladen...');
    
    // Reload page - auto-seed will trigger
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/admin')}
          className="mb-6 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: '#3A3A3A' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Admin
        </button>

        <div className="bg-white rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-8 h-8" style={{ color: '#f25f5c' }} />
            <div>
              <h1 className="text-3xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                Demo-Daten anlegen
              </h1>
              <p style={{ color: '#666666' }}>
                Erstelle Test-Daten für die Entwicklung
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD', border: '1px solid #FFC107' }}>
            <p style={{ color: '#856404' }}>
              ⚠️ <strong>Achtung:</strong> Diese Funktionen erstellen Test-Daten in der Datenbank. 
              Nur für Entwicklung und Testing verwenden!
            </p>
          </div>

          {/* Seed Options */}
          <div className="space-y-4 mb-6">
            {/* Seed All */}
            <div className="border rounded-lg p-6" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#f25f5c20' }}>
                  <Database className="w-6 h-6" style={{ color: '#f25f5c' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Alle Demo-Daten anlegen
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#666666' }}>
                    Erstellt komplettes Setup: Seiten, Navigation, Menü-Einträge und Demo-Bücher mit ONIX-Tags
                  </p>
                  <button
                    onClick={handleSeedAll}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
                  >
                    {loading ? 'Lädt...' : 'Alle Daten anlegen'}
                  </button>
                </div>
              </div>
            </div>

            {/* Seed Books Only */}
            <div className="border rounded-lg p-6" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#70c1b320' }}>
                  <BookOpen className="w-6 h-6" style={{ color: '#70c1b3' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Nur Demo-Bücher anlegen
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#666666' }}>
                    Erstellt 3 Beispiel-Bücher mit verschiedenen ONIX-Tag-Kombinationen
                  </p>
                  <ul className="text-sm mb-4 space-y-1" style={{ color: '#666666' }}>
                    <li>• Die Hauptstadt (Auszeichnung, Stil, Schauplatz)</li>
                    <li>• Betrachtungen über die Natur (Medienecho, Herkunft)</li>
                    <li>• Mitternachtsbibliothek (Ausstattung, Stil)</li>
                  </ul>
                  <button
                    onClick={handleSeedBooks}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
                  >
                    {loading ? 'Lädt...' : 'Demo-Bücher anlegen'}
                  </button>
                </div>
              </div>
            </div>

            {/* Seed Extended Tags */}
            <div className="border rounded-lg p-6" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#f25f5c20' }}>
                  <Tag className="w-6 h-6" style={{ color: '#f25f5c' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Erweiterte ONIX-Tags anlegen
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#666666' }}>
                    Erstellt erweiterte ONIX-Tags wie Serie, Band, Feeling, Status
                  </p>
                  <button
                    onClick={handleSeedExtendedTags}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
                  >
                    {loading ? 'Lädt...' : 'Erweiterte Tags anlegen'}
                  </button>
                </div>
              </div>
            </div>

            {/* Seed Books with Extended Tags */}
            <div className="border rounded-lg p-6" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#70c1b320' }}>
                  <BookOpen className="w-6 h-6" style={{ color: '#70c1b3' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Bücher mit erweiterten Tags anlegen
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#666666' }}>
                    Erstellt Bücher mit erweiterten Tags wie Serien, Bestseller, etc.
                  </p>
                  <button
                    onClick={handleSeedExtendedBooks}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
                  >
                    {loading ? 'Lädt...' : 'Bücher mit erweiterten Tags anlegen'}
                  </button>
                </div>
              </div>
            </div>

            {/* Seed Discovery Tags */}
            <div className="border rounded-lg p-6" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#f25f5c20' }}>
                  <Tag className="w-6 h-6" style={{ color: '#f25f5c' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Discovery-Tags anlegen
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#666666' }}>
                    Erstellt Discovery-Tags wie Genre, Zielgruppe, etc.
                  </p>
                  <button
                    onClick={handleSeedDiscoveryTags}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
                  >
                    {loading ? 'Lädt...' : 'Discovery-Tags anlegen'}
                  </button>
                </div>
              </div>
            </div>

            {/* Seed Books with Discovery Tags */}
            <div className="border rounded-lg p-6" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#70c1b320' }}>
                  <BookOpen className="w-6 h-6" style={{ color: '#70c1b3' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Bücher mit Discovery-Tags anlegen
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#666666' }}>
                    Erstellt Bücher mit Discovery-Tags wie Genre, Zielgruppe, etc.
                  </p>
                  <button
                    onClick={handleSeedDiscoveryBooks}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
                  >
                    {loading ? 'Lädt...' : 'Bücher mit Discovery-Tags anlegen'}
                  </button>
                </div>
              </div>
            </div>

            {/* Seed Affiliates */}
            <div className="border rounded-lg p-6" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#f25f5c20' }}>
                  <ExternalLink className="w-6 h-6" style={{ color: '#f25f5c' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    Affiliate-Daten anlegen
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#666666' }}>
                    Erstellt Affiliate-Partner für neue und gebrauchte Bücher (Bücher.de, Amazon, Medimops, etc.)
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSeedAffiliates}
                      disabled={loading}
                      className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
                    >
                      {loading ? 'Lädt...' : 'Affiliate-Daten anlegen'}
                    </button>
                    <button
                      onClick={() => navigate('/sys-mgmt-xK9/affiliate-management')}
                      className="px-6 py-2 rounded-lg transition-colors border"
                      style={{ borderColor: '#f25f5c', color: '#f25f5c', backgroundColor: '#FFFFFF' }}
                    >
                      Affiliates verwalten →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg ${result.startsWith('✅') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`} style={{ border: '1px solid' }}>
              <p style={{ color: result.startsWith('✅') ? '#059669' : '#DC2626' }}>
                {result}
              </p>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
            <h4 className="text-sm mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              💡 Hinweis zum ONIX-Tag-System
            </h4>
            <p className="text-sm" style={{ color: '#666666' }}>
              Die Demo-Bücher verwenden das neue ONIX-kompatible Tag-System mit 3 Sichtbarkeitsstufen:
            </p>
            <ul className="text-sm mt-2 space-y-1" style={{ color: '#666666' }}>
              <li>⭐ <strong>Prominent:</strong> Erscheinen auf Buchcovern (Auszeichnungen, Motive, Medienecho)</li>
              <li>🔍 <strong>Filter:</strong> In Seitenleiste/Filtern (Genres, Zielgruppen, Schauplätze)</li>
              <li>🔒 <strong>Internal:</strong> Nur Backend/SEO (Warengruppen, ISBN-Details)</li>
            </ul>
          </div>

          {/* Reset and Reseed */}
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
            <h4 className="text-sm mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              🔄 Reset und Reseed
            </h4>
            <p className="text-sm mb-3" style={{ color: '#666666' }}>
              Lösche die Demo-Daten aus dem LocalStorage und lade die Seite neu, um die Demo-Daten automatisch neu anzulegen.
            </p>
            <button
              onClick={handleResetAndReseed}
              className="px-6 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
            >
              🔄 Reset und Reseed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDataSeeding;