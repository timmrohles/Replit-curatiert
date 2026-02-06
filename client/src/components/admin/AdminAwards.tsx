/**
 * ==================================================================
 * ADMIN AWARDS - Tab für Awards-Verwaltung
 * ==================================================================
 * 
 * Features:
 * - Awards-Übersicht mit Suche
 * - CRUD für Awards, Editionen, Outcomes, Recipients
 * - Buchsuche-Modal mit Autocomplete
 * - Neon PostgreSQL Backend
 * 
 * UI: PROJECT_STANDARDS.md konform (UI Core, kein manuelles Styling)
 * 
 * ==================================================================
 */

import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Award, Edit2, Calendar, Trophy, Medal, Save, X, Upload } from 'lucide-react';
import { getErrorMessage, logError } from '../../utils/errorHelpers';

// ==================================================================
// TYPES
// ==================================================================

interface Award {
  id: number;
  name: string;
  slug: string;
  issuer_name?: string;
  website_url?: string;
  description?: string;
  logo_url?: string;
  editions_count?: string;
  latest_year?: number;
  created_at?: string;
  updated_at?: string;
}

interface AwardEdition {
  id: number;
  award_id: number;
  year: number;
  label?: string;
  status: 'active' | 'archived' | 'draft';
  starts_at?: string;
  ends_at?: string;
  outcomes_count?: string;
  created_at?: string;
  updated_at?: string;
}

interface AwardOutcome {
  id: number;
  award_edition_id: number;
  outcome_type: 'winner' | 'shortlist' | 'longlist' | 'nominee' | 'finalist' | 'special';
  title?: string;
  sort_order: number;
  recipients?: AwardRecipient[];
  created_at?: string;
  updated_at?: string;
}

interface AwardRecipient {
  id: number;
  award_outcome_id: number;
  recipient_type: 'book' | 'person';
  book_id?: number;
  person_id?: number;
  recipient_name?: string;
  role?: string;
  notes?: string;
  sort_order: number;
  book_title?: string;
  book_author?: string;
  book_cover_url?: string;
  person_name?: string;
}

interface Book {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  cover_url?: string;
  published_year?: number;
  publisher?: string;
}

// ==================================================================
// API CLIENT
// ==================================================================

class AwardsAPI {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = '/api';
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  private getAdminHeaders(): HeadersInit {
    const token = localStorage.getItem('admin_token');
    return {
      ...this.headers,
      'X-Admin-Token': token || '',
    };
  }

  // Safe JSON parsing helper
  private async safeJsonParse(response: Response): Promise<any> {
    const text = await response.text();
    console.log('📡 Raw response text:', text);
    
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('❌ JSON parse error:', error);
      console.error('❌ Response text:', text);
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  }

  // Admin Auth
  async login(password: string): Promise<{ token: string; expiresAt: string }> {
    const response = await fetch(`${this.baseUrl}/admin/auth/neon/login`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ password })
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.error?.message || 'Login failed');
    return data.data;
  }

  // Public endpoints
  async getAwards(search?: string): Promise<Award[]> {
    const url = search 
      ? `${this.baseUrl}/awards?search=${encodeURIComponent(search)}`
      : `${this.baseUrl}/awards`;
    
    const response = await fetch(url, { headers: this.headers });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error?.message || 'Failed to fetch awards');
    return data.data.awards;
  }

  async getAwardEditions(awardId: number): Promise<AwardEdition[]> {
    const response = await fetch(`${this.baseUrl}/awards/${awardId}/editions`, {
      headers: this.headers
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error?.message || 'Failed to fetch editions');
    return data.data.editions;
  }

  async getEditionOutcomes(editionId: number): Promise<AwardOutcome[]> {
    const response = await fetch(`${this.baseUrl}/awards/editions/${editionId}/outcomes`, {
      headers: this.headers
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error?.message || 'Failed to fetch outcomes');
    return data.data.outcomes;
  }

  async searchBooks(query: string): Promise<Book[]> {
    console.log('🔍 Frontend searchBooks called with query:', query);
    const url = `${this.baseUrl}/awards/search/books?q=${encodeURIComponent(query)}&limit=10`;
    console.log('📡 Fetching URL:', url);
    
    const response = await fetch(url, { headers: this.headers });
    const data = await response.json();
    
    console.log('📦 Search response:', data);
    
    if (!data.ok) {
      console.error('❌ Search failed with error:', data.error);
      console.error('   Error code:', data.error?.code);
      console.error('   Error message:', data.error?.message);
      console.error('   Error details:', data.error?.details);
      throw new Error(data.error?.message || 'Search failed');
    }
    
    console.log(`✅ Found ${data.data.books.length} books`);
    return data.data.books;
  }

  // Admin endpoints
  async checkAwardDuplicate(name: string, slug?: string): Promise<{ exists: boolean; award: Award | null }> {
    const response = await fetch(`${this.baseUrl}/admin/awards/check-duplicate`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify({ name, slug })
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.error?.message || 'Duplicate check failed');
    return data.data;
  }

  async checkBookRecipient(bookId: number, awardId: number): Promise<{ exists: boolean; recipient: any | null }> {
    const response = await fetch(`${this.baseUrl}/admin/awards/check-book-recipient`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify({ book_id: bookId, award_id: awardId })
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.error?.message || 'Recipient check failed');
    return data.data;
  }

  async createAward(award: Partial<Award>): Promise<Award> {
    console.log('🚀 createAward called with:', award);
    
    const response = await fetch(`${this.baseUrl}/admin/awards`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(award)
    });
    
    console.log('📡 Response received, status:', response.status);
    
    // Use safe JSON parsing
    const data = await this.safeJsonParse(response);
    
    if (!data.ok) throw new Error(data.error?.message || 'Failed to create award');
    return data.data.award;
  }

  async updateAward(id: number, award: Partial<Award>): Promise<Award> {
    const response = await fetch(`${this.baseUrl}/admin/awards/${id}`, {
      method: 'PUT',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(award)
    });
    
    console.log('📡 Response received, status:', response.status);
    
    // Use safe JSON parsing
    const data = await this.safeJsonParse(response);
    
    if (!data.ok) throw new Error(data.error?.message || 'Failed to update award');
    return data.data.award;
  }

  async deleteAward(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/admin/awards/${id}`, {
      method: 'DELETE',
      headers: this.getAdminHeaders()
    });
    
    console.log('📡 deleteAward response status:', response.status);
    
    // Use safe JSON parsing
    const data = await this.safeJsonParse(response);
    
    if (!data.ok) throw new Error(data.error?.message || 'Failed to delete award');
  }

  async createEdition(awardId: number, edition: Partial<AwardEdition>): Promise<AwardEdition> {
    const response = await fetch(`${this.baseUrl}/admin/awards/${awardId}/editions`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(edition)
    });
    
    console.log('📡 createEdition response status:', response.status);
    
    // Use safe JSON parsing
    const data = await this.safeJsonParse(response);
    
    if (!data.ok) throw new Error(data.error?.message || 'Failed to create edition');
    return data.data.edition;
  }

  async createOutcome(editionId: number, outcome: Partial<AwardOutcome>): Promise<AwardOutcome> {
    const response = await fetch(`${this.baseUrl}/admin/awards/editions/${editionId}/outcomes`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(outcome)
    });
    
    console.log('📡 createOutcome response status:', response.status);
    
    // Use safe JSON parsing
    const data = await this.safeJsonParse(response);
    
    if (!data.ok) throw new Error(data.error?.message || 'Failed to create outcome');
    return data.data.outcome;
  }

  async addRecipient(outcomeId: number, recipient: Partial<AwardRecipient>): Promise<AwardRecipient> {
    console.log('🚀 addRecipient called with:', { outcomeId, recipient });
    
    const response = await fetch(`${this.baseUrl}/admin/awards/outcomes/${outcomeId}/recipients`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(recipient)
    });
    
    console.log('📡 Response received, status:', response.status);
    
    // Use safe JSON parsing
    const data = await this.safeJsonParse(response);
    
    if (!data.ok) throw new Error(data.error?.message || 'Failed to add recipient');
    return data.data.recipient;
  }

  async removeRecipient(recipientId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/admin/awards/recipients/${recipientId}`, {
      method: 'DELETE',
      headers: this.getAdminHeaders()
    });
    
    console.log('📡 removeRecipient response status:', response.status);
    
    // Use safe JSON parsing
    const data = await this.safeJsonParse(response);
    
    if (!data.ok) throw new Error(data.error?.message || 'Failed to remove recipient');
  }
}

const api = new AwardsAPI();

// ==================================================================
// MAIN COMPONENT
// ==================================================================

export function AdminAwards() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAward, setEditingAward] = useState<Partial<Award> | null>(null);
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    loadAwards();
  }, []);

  const loadAwards = async () => {
    setLoading(true);
    try {
      const data = await api.getAwards(searchQuery);
      setAwards(data);
    } catch (error: unknown) {
      logError('Failed to load awards', error);
      alert('Fehler beim Laden der Awards: ' + getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadAwards();
  };

  const handleTestEndpoint = async () => {
    if (!confirm('🧪 Test-Endpoint ausführen?\n\nErstellt: Award → Edition → Outcome → Recipient')) {
      return;
    }

    setTesting(true);
    try {
      const result = await api.testCreateOutcome();
      console.log('✅ Test Result:', result);
      
      alert(`✅ Test erfolgreich!\n\n` +
        `Award: ${result.data.award.name}\n` +
        `Edition: ${result.data.edition.year}\n` +
        `Outcome: ${result.data.outcome.title}\n` +
        `Buch: ${result.data.book?.title || 'Kein Buch'}\n\n` +
        `Check Console für Details!`);
      
      loadAwards(); // Reload to show new test data
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      alert('❌ Test fehlgeschlagen:\n' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleTestPublicEndpoint = async () => {
    if (!confirm('🧪 PUBLIC Test ausführen?\n\n(KEIN Login erforderlich)\n\nErstellt: Award → Edition → Outcome → Recipient')) {
      return;
    }

    setTesting(true);
    try {
      const result = await api.testCreateOutcomePublic();
      console.log('✅ PUBLIC Test Result:', result);
      
      // Check if this is diagnostic data or actual test data
      if (result.data.enum_values) {
        // Diagnostic response
        alert(`🔍 DIAGNOSE-ERGEBNIS:\\n\\n` +
          `ENUM Werte: ${JSON.stringify(result.data.enum_values)}\\n\\n` +
          `Column Info: ${JSON.stringify(result.data.column_info, null, 2)}\\n\\n` +
          `Check Console für Details!`);
      } else {
        // Actual test response
        alert(`✅ PUBLIC Test erfolgreich!\\n\\n` +
          `Award: ${result.data.award?.name || 'N/A'}\\n` +
          `Edition: ${result.data.edition?.year || 'N/A'}\\n` +
          `Outcome: ${result.data.outcome?.title || 'N/A'}\\n` +
          `Buch: ${result.data.book?.title || 'Kein Buch'}\\n\\n` +
          `Check Console für Details!`);
      }
      
      loadAwards(); // Reload to show new test data
    } catch (error: any) {
      console.error('❌ PUBLIC Test failed:', error);
      alert('❌ PUBLIC Test fehlgeschlagen:\\n' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAward = async () => {
    if (!editingAward?.name) {
      alert('Bitte Award-Name eingeben');
      return;
    }

    try {
      // Check for duplicates before creating (only for new awards)
      if (!editingAward.id) {
        const duplicate = await api.checkAwardDuplicate(editingAward.name, editingAward.slug);
        
        if (duplicate.exists && duplicate.award) {
          const confirmed = confirm(
            `⚠️ DUPLIKAT GEFUNDEN!\n\n` +
            `Award "${duplicate.award.name}" existiert bereits.\n` +
            `Herausgeber: ${duplicate.award.issuer_name || 'N/A'}\n\n` +
            `Trotzdem fortfahren und neuen Award anlegen?`
          );
          
          if (!confirmed) {
            return;
          }
        }
      }

      if (editingAward.id) {
        await api.updateAward(editingAward.id, editingAward);
      } else {
        await api.createAward(editingAward);
      }
      alert('✅ Award gespeichert!');
      setEditingAward(null);
      loadAwards();
    } catch (error: any) {
      alert('❌ Fehler: ' + error.message);
    }
  };

  const handleDeleteAward = async (id: number) => {
    if (!confirm('Award wirklich löschen?')) return;

    try {
      await api.deleteAward(id);
      alert('✅ Award gelöscht!');
      loadAwards();
    } catch (error: any) {
      alert('❌ Fehler: ' + error.message);
    }
  };

  const handleViewDetail = (award: Award) => {
    setSelectedAward(award);
    setView('detail');
  };

  if (view === 'detail' && selectedAward) {
    return (
      <AwardDetailView 
        award={selectedAward} 
        onBack={() => {
          setView('list');
          setSelectedAward(null);
          loadAwards();
        }}
      />
    );
  }

  return (
    <div className="p-6 bg-background">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-headline mb-2">Auszeichnungen</h2>
        <p className="text-foreground/70">Verwalte Awards, Editionen und Preisträger</p>
      </div>

      {/* Test Button (DEBUG) */}
      <div className="mb-4 p-4 bg-yellow/10 border border-yellow/30 rounded-lg">
        <button
          onClick={handleTestEndpoint}
          disabled={testing}
          className="px-4 py-2 bg-yellow text-background rounded-lg hover:bg-yellow/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {testing ? '⏳ Test läuft...' : '🧪 Test-Endpoint ausführen'}
        </button>
        <p className="text-sm text-foreground/60 mt-2">
          Erstellt Award → Edition → Outcome → Recipient (Test-Daten)
        </p>
      </div>

      {/* Test Button (PUBLIC) */}
      <div className="mb-4 p-4 bg-yellow/10 border border-yellow/30 rounded-lg">
        <button
          onClick={handleTestPublicEndpoint}
          disabled={testing}
          className="px-4 py-2 bg-yellow text-background rounded-lg hover:bg-yellow/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {testing ? '⏳ Test läuft...' : '🧪 PUBLIC Test ausführen'}
        </button>
        <p className="text-sm text-foreground/60 mt-2">
          Erstellt Award → Edition → Outcome → Recipient (Test-Daten, KEIN Login erforderlich)
        </p>
      </div>

      {/* Search & Create */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Awards durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-teal transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Suchen
          </button>
        </div>
        <button
          onClick={() => setEditingAward({ name: '' })}
          className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neuer Award
        </button>
      </div>

      {/* Awards List */}
      {loading ? (
        <div className="text-center py-12">Lade Awards...</div>
      ) : awards.length === 0 ? (
        <div className="text-center py-12 text-foreground/50">
          Keine Awards gefunden
        </div>
      ) : (
        <div className="grid gap-4">
          {awards.map((award) => (
            <div
              key={award.id}
              className="p-4 border border-foreground/10 rounded-lg bg-muted hover:border-foreground/30 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer" onClick={() => handleViewDetail(award)}>
                  <h3 className="text-xl font-headline mb-1">{award.name}</h3>
                  {award.issuer_name && (
                    <p className="text-sm text-foreground/70 mb-2">{award.issuer_name}</p>
                  )}
                  <div className="flex gap-4 text-sm text-foreground/60">
                    <span>{award.editions_count || 0} Editionen</span>
                    {award.latest_year && <span>Letztes Jahr: {award.latest_year}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingAward(award)}
                    className="p-2 hover:bg-background/50 rounded transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAward(award.id)}
                    className="p-2 hover:bg-background/50 rounded transition-colors text-coral"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingAward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-headline">
                {editingAward.id ? 'Award bearbeiten' : 'Neuer Award'}
              </h3>
              <button onClick={() => setEditingAward(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={editingAward.name || ''}
                  onChange={(e) => setEditingAward({ ...editingAward, name: e.target.value })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                  placeholder="z.B. Deutscher Buchpreis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={editingAward.slug || ''}
                  onChange={(e) => setEditingAward({ ...editingAward, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                  placeholder="deutscher-buchpreis (automatisch generiert)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Herausgeber</label>
                <input
                  type="text"
                  value={editingAward.issuer_name || ''}
                  onChange={(e) => setEditingAward({ ...editingAward, issuer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                  placeholder="z.B. Börsenverein des Deutschen Buchhandels"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Website-URL</label>
                <input
                  type="url"
                  value={editingAward.website_url || ''}
                  onChange={(e) => setEditingAward({ ...editingAward, website_url: e.target.value })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Logo-URL</label>
                <input
                  type="url"
                  value={editingAward.logo_url || ''}
                  onChange={(e) => setEditingAward({ ...editingAward, logo_url: e.target.value })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea
                  value={editingAward.description || ''}
                  onChange={(e) => setEditingAward({ ...editingAward, description: e.target.value })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                  rows={4}
                  placeholder="Kurze Beschreibung des Awards..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveAward}
                className="flex-1 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
              <button
                onClick={() => setEditingAward(null)}
                className="px-4 py-2 border border-foreground/20 rounded-lg hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================================================================
// AWARD DETAIL VIEW (Editionen & Outcomes)
// ==================================================================

interface AwardDetailViewProps {
  award: Award;
  onBack: () => void;
}

function AwardDetailView({ award, onBack }: AwardDetailViewProps) {
  const [editions, setEditions] = useState<AwardEdition[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEdition, setEditingEdition] = useState<Partial<AwardEdition> | null>(null);
  const [selectedEdition, setSelectedEdition] = useState<AwardEdition | null>(null);

  useEffect(() => {
    loadEditions();
  }, [award.id]);

  const loadEditions = async () => {
    setLoading(true);
    try {
      const data = await api.getAwardEditions(award.id);
      setEditions(data);
    } catch (error: any) {
      alert('Fehler beim Laden: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdition = async () => {
    if (!editingEdition?.year) {
      alert('Bitte Jahr eingeben');
      return;
    }

    try {
      await api.createEdition(award.id, editingEdition);
      alert('✅ Edition gespeichert!');
      setEditingEdition(null);
      loadEditions();
    } catch (error: any) {
      alert('❌ Fehler: ' + error.message);
    }
  };

  if (selectedEdition) {
    return (
      <EditionDetailView
        edition={selectedEdition}
        award={award}
        onBack={() => {
          setSelectedEdition(null);
          loadEditions();
        }}
      />
    );
  }

  return (
    <div className="p-6 bg-background">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 text-blue hover:text-teal transition-colors flex items-center gap-2"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
          Zurück zur Übersicht
        </button>
        <h2 className="text-3xl font-headline mb-2">{award.name}</h2>
        {award.issuer_name && (
          <p className="text-foreground/70">{award.issuer_name}</p>
        )}
      </div>

      {/* Create Edition Button */}
      <div className="mb-6">
        <button
          onClick={() => setEditingEdition({ 
            award_id: award.id, 
            year: new Date().getFullYear(),
            status: 'draft' 
          })}
          className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neue Edition
        </button>
      </div>

      {/* Editions List */}
      {loading ? (
        <div className="text-center py-12">Lade Editionen...</div>
      ) : editions.length === 0 ? (
        <div className="text-center py-12 text-foreground/50">
          Keine Editionen vorhanden
        </div>
      ) : (
        <div className="grid gap-4">
          {editions.map((edition) => (
            <div
              key={edition.id}
              className="p-4 border border-foreground/10 rounded-lg bg-muted hover:border-foreground/30 transition-colors cursor-pointer"
              onClick={() => setSelectedEdition(edition)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-headline">{edition.label || edition.year}</h3>
                  <div className="flex gap-4 text-sm text-foreground/60 mt-1">
                    <span>{edition.outcomes_count || 0} Outcomes</span>
                    <span className="px-2 py-0.5 bg-background rounded text-xs">
                      {edition.status}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 -rotate-90" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Edition Modal */}
      {editingEdition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-headline">Neue Edition</h3>
              <button onClick={() => setEditingEdition(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jahr *</label>
                <input
                  type="number"
                  value={editingEdition.year || ''}
                  onChange={(e) => setEditingEdition({ ...editingEdition, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                  min="1900"
                  max="2100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  value={editingEdition.label || ''}
                  onChange={(e) => setEditingEdition({ ...editingEdition, label: e.target.value })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                  placeholder="z.B. 2025 oder Frühjahr 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingEdition.status || 'draft'}
                  onChange={(e) => setEditingEdition({ ...editingEdition, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdition}
                className="flex-1 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
              <button
                onClick={() => setEditingEdition(null)}
                className="px-4 py-2 border border-foreground/20 rounded-lg hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================================================================
// EDITION DETAIL VIEW (Outcomes & Recipients)
// ==================================================================

interface EditionDetailViewProps {
  edition: AwardEdition;
  award: Award;
  onBack: () => void;
}

function EditionDetailView({ edition, award, onBack }: EditionDetailViewProps) {
  const [outcomes, setOutcomes] = useState<AwardOutcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<Partial<AwardOutcome> | null>(null);
  const [expandedOutcome, setExpandedOutcome] = useState<number | null>(null);
  const [showBookSearch, setShowBookSearch] = useState<number | null>(null);

  useEffect(() => {
    loadOutcomes();
  }, [edition.id]);

  const loadOutcomes = async () => {
    setLoading(true);
    try {
      const data = await api.getEditionOutcomes(edition.id);
      setOutcomes(data);
    } catch (error: any) {
      alert('Fehler beim Laden: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOutcome = async () => {
    if (!editingOutcome?.outcome_type) {
      alert('Bitte Outcome-Typ auswählen');
      return;
    }

    try {
      await api.createOutcome(edition.id, editingOutcome);
      alert('✅ Outcome gespeichert!');
      setEditingOutcome(null);
      loadOutcomes();
    } catch (error: any) {
      alert('❌ Fehler: ' + error.message);
    }
  };

  const handleAddBook = async (outcomeId: number, book: Book) => {
    try {
      await api.addRecipient(outcomeId, {
        recipient_type: 'book',
        book_id: book.id,
        role: 'author',
        sort_order: 0
      });
      alert('✅ Buch hinzugefügt!');
      setShowBookSearch(null);
      loadOutcomes();
    } catch (error: any) {
      alert('❌ Fehler: ' + error.message);
    }
  };

  const handleDeleteRecipient = async (recipientId: number) => {
    if (!confirm('Preisträger entfernen?')) return;

    try {
      await api.removeRecipient(recipientId);
      alert('✅ Entfernt!');
      loadOutcomes();
    } catch (error: any) {
      alert('❌ Fehler: ' + error.message);
    }
  };

  const outcomeTypeLabels: Record<string, string> = {
    winner: 'Gewinner',
    shortlist: 'Shortlist',
    longlist: 'Longlist',
    nominee: 'Nominiert',
    finalist: 'Finalist',
    special: 'Sonderpreis'
  };

  return (
    <div className="p-6 bg-background">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 text-blue hover:text-teal transition-colors flex items-center gap-2"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
          Zurück zu {award.name}
        </button>
        <h2 className="text-3xl font-headline mb-2">
          {award.name} {edition.label || edition.year}
        </h2>
      </div>

      {/* Create Outcome Button */}
      <div className="mb-6">
        <button
          onClick={() => setEditingOutcome({ 
            award_edition_id: edition.id,
            outcome_type: 'shortlist',
            sort_order: 0
          })}
          className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neues Outcome
        </button>
      </div>

      {/* Outcomes List */}
      {loading ? (
        <div className="text-center py-12">Lade Outcomes...</div>
      ) : outcomes.length === 0 ? (
        <div className="text-center py-12 text-foreground/50">
          Keine Outcomes vorhanden
        </div>
      ) : (
        <div className="grid gap-4">
          {outcomes.map((outcome) => (
            <div
              key={outcome.id}
              className="border border-foreground/10 rounded-lg bg-muted"
            >
              <div
                className="p-4 cursor-pointer hover:bg-background/50 transition-colors"
                onClick={() => setExpandedOutcome(expandedOutcome === outcome.id ? null : outcome.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-headline">
                      {outcome.title || outcomeTypeLabels[outcome.outcome_type]}
                    </h3>
                    <p className="text-sm text-foreground/60 mt-1">
                      {outcome.recipients?.length || 0} Preisträger
                    </p>
                  </div>
                  {expandedOutcome === outcome.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>

              {expandedOutcome === outcome.id && (
                <div className="p-4 pt-0 border-t border-foreground/10">
                  <div className="mb-4">
                    <button
                      onClick={() => setShowBookSearch(outcome.id)}
                      className="px-3 py-1.5 bg-blue text-white rounded text-sm hover:bg-teal transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      Buch hinzufügen
                    </button>
                  </div>

                  {/* Recipients */}
                  {outcome.recipients && outcome.recipients.length > 0 ? (
                    <div className="space-y-2">
                      {outcome.recipients.map((recipient) => (
                        <div
                          key={recipient.id}
                          className="p-3 bg-background rounded-lg flex justify-between items-center"
                        >
                          <div className="flex gap-3">
                            {recipient.book_cover_url && (
                              <img
                                src={recipient.book_cover_url}
                                alt={recipient.book_title}
                                className="w-12 h-16 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{recipient.book_title}</p>
                              <p className="text-sm text-foreground/70">{recipient.book_author}</p>
                              {recipient.role && (
                                <p className="text-xs text-foreground/50 mt-1">{recipient.role}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteRecipient(recipient.id)}
                            className="p-2 hover:bg-muted rounded transition-colors text-coral"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/50">Noch keine Preisträger</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Book Search Modal */}
      {showBookSearch !== null && (
        <BookSearchModal
          onSelect={(book) => handleAddBook(showBookSearch, book)}
          onClose={() => setShowBookSearch(null)}
          existingBookIds={
            outcomes
              .find(o => o.id === showBookSearch)
              ?.recipients
              ?.map(r => r.book_id)
              .filter((id): id is number => id !== undefined) || []
          }
        />
      )}

      {/* Edit Outcome Modal */}
      {editingOutcome && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-headline">Neues Outcome</h3>
              <button onClick={() => setEditingOutcome(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Typ *</label>
                <select
                  value={editingOutcome.outcome_type || 'shortlist'}
                  onChange={(e) => setEditingOutcome({ ...editingOutcome, outcome_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                >
                  <option value="winner">Gewinner</option>
                  <option value="shortlist">Shortlist</option>
                  <option value="longlist">Longlist</option>
                  <option value="nominee">Nominiert</option>
                  <option value="finalist">Finalist</option>
                  <option value="special">Sonderpreis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titel (optional)</label>
                <input
                  type="text"
                  value={editingOutcome.title || ''}
                  onChange={(e) => setEditingOutcome({ ...editingOutcome, title: e.target.value })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                  placeholder="z.B. Shortlist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sortierung</label>
                <input
                  type="number"
                  value={editingOutcome.sort_order || 0}
                  onChange={(e) => setEditingOutcome({ ...editingOutcome, sort_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveOutcome}
                className="flex-1 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
              <button
                onClick={() => setEditingOutcome(null)}
                className="px-4 py-2 border border-foreground/20 rounded-lg hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================================================================
// BOOK SEARCH MODAL
// ==================================================================

interface BookSearchModalProps {
  onSelect: (book: Book) => void;
  onClose: () => void;
  existingBookIds?: number[];  // Prevent duplicates
}

function BookSearchModal({ onSelect, onClose, existingBookIds = [] }: BookSearchModalProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [query, setQuery] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query || query.length < 2) {
      alert('Bitte mindestens 2 Zeichen eingeben');
      return;
    }

    setLoading(true);
    try {
      const results = await api.searchBooks(query);
      setBooks(results);
    } catch (error: any) {
      alert('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkInput.trim()) {
      alert('Bitte mindestens eine ISBN13 oder Titel eingeben');
      return;
    }

    const lines = bulkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      alert('Keine gültigen Einträge gefunden');
      return;
    }

    setLoading(true);
    const foundBooks: Book[] = [];
    const notFound: string[] = [];

    try {
      for (const line of lines) {
        const results = await api.searchBooks(line);
        
        if (results.length > 0) {
          // Take first match
          foundBooks.push(results[0]);
        } else {
          notFound.push(line);
        }
      }

      setBooks(foundBooks);
      
      if (notFound.length > 0) {
        alert(`${foundBooks.length} Bücher gefunden.\n\nNicht gefunden:\n${notFound.join('\n')}`);
      }
    } catch (error: any) {
      alert('Fehler beim Bulk-Import: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isBookAlreadyAdded = (bookId: number) => {
    return existingBookIds.includes(bookId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-headline">Buch suchen</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="mb-4 flex gap-2 border-b border-foreground/10">
          <button
            onClick={() => setMode('single')}
            className={`px-4 py-2 font-medium transition-colors ${
              mode === 'single'
                ? 'border-b-2 border-coral text-foreground'
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            Einzelsuche
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`px-4 py-2 font-medium transition-colors ${
              mode === 'bulk'
                ? 'border-b-2 border-coral text-foreground'
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            Massenupload
          </button>
        </div>

        {mode === 'single' ? (
          <>
            {/* Single Search Input */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Titel, Autor oder ISBN..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-teal transition-colors disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Bulk Import */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                ISBN13 oder Titel (eine pro Zeile):
              </label>
              <textarea
                placeholder="9783518471616&#10;Die Verwandlung&#10;9783150081365&#10;Kafka"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-foreground/20 rounded-lg bg-background text-foreground font-mono text-sm"
              />
              <p className="text-xs text-foreground/50 mt-1">
                Tipp: Bei mehreren Ergebnissen wird das erste Buch ausgewählt
              </p>
              <button
                onClick={handleBulkImport}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-blue text-white rounded-lg hover:bg-teal transition-colors disabled:opacity-50"
              >
                {loading ? 'Suche läuft...' : 'Bücher suchen'}
              </button>
            </div>
          </>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-8">Suche...</div>
        ) : books.length === 0 ? (
          <div className="text-center py-8 text-foreground/50">
            {query || bulkInput ? 'Keine Bücher gefunden' : 'Suche starten...'}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-foreground/70 mb-2">
              {books.length} {books.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
            </p>
            {books.map((book) => {
              const alreadyAdded = isBookAlreadyAdded(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => {
                    if (alreadyAdded) {
                      alert(`"${book.title}" ist bereits in diesem Outcome vorhanden!`);
                      return;
                    }
                    onSelect(book);
                  }}
                  disabled={alreadyAdded}
                  className={`w-full p-3 border rounded-lg text-left flex gap-3 transition-colors ${
                    alreadyAdded
                      ? 'border-foreground/10 bg-foreground/5 opacity-50 cursor-not-allowed'
                      : 'border-foreground/10 hover:border-foreground/30'
                  }`}
                >
                  {book.cover_url && (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-foreground/70">{book.author}</p>
                    {alreadyAdded && (
                      <p className="text-xs text-coral mt-1">✓ Bereits hinzugefügt</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}