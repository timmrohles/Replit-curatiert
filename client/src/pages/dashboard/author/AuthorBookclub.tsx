import { useState } from 'react';
import { Users, Plus, Edit, Trash2, Eye, EyeOff, Filter, X, Calendar, BookOpen } from 'lucide-react';

type BookclubStatus = 'draft' | 'published';

interface Bookclub {
  id: string;
  name: string;
  description: string;
  book: string;
  nextMeeting: string;
  members: number;
  maxMembers: number;
  status: BookclubStatus;
  createdAt: string;
  publishedAt?: string;
}

export function AuthorBookclub() {
  const [bookclubs, setBookclubs] = useState<Bookclub[]>([
    {
      id: '1',
      name: 'Monatlicher Buchclub',
      description: 'Diskussionen über meine neuesten Werke',
      book: 'Der Sommerroman',
      nextMeeting: '2025-02-15',
      members: 45,
      maxMembers: 50,
      status: 'published',
      createdAt: '2024-12-01',
      publishedAt: '2024-12-05'
    },
    {
      id: '2',
      name: 'Exklusiver VIP-Buchclub',
      description: 'Für Unterstützer und treue Leser',
      book: 'Unveröffentlichtes Manuskript',
      nextMeeting: '2025-02-20',
      members: 12,
      maxMembers: 20,
      status: 'published',
      createdAt: '2025-01-05',
      publishedAt: '2025-01-10'
    },
    {
      id: '3',
      name: 'Frühlings-Lektüre',
      description: 'Gemeinsam durch den Frühling lesen',
      book: 'Noch nicht festgelegt',
      nextMeeting: '2025-03-01',
      members: 0,
      maxMembers: 30,
      status: 'draft',
      createdAt: '2025-01-20'
    }
  ]);

  const [statusFilter, setStatusFilter] = useState<'all' | BookclubStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBookclub, setEditingBookclub] = useState<Bookclub | null>(null);

  const filteredBookclubs = bookclubs.filter(b => 
    statusFilter === 'all' ? true : b.status === statusFilter
  );

  const publishBookclub = (id: string) => {
    setBookclubs(bookclubs.map(b => 
      b.id === id ? { ...b, status: 'published', publishedAt: new Date().toISOString() } : b
    ));
  };

  const unpublishBookclub = (id: string) => {
    setBookclubs(bookclubs.map(b => 
      b.id === id ? { ...b, status: 'draft', publishedAt: undefined } : b
    ));
  };

  const deleteBookclub = (id: string) => {
    if (confirm('Möchtest du diesen Buchclub wirklich löschen?')) {
      setBookclubs(bookclubs.filter(b => b.id !== id));
    }
  };

  const getStatusBadge = (status: BookclubStatus) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
          <Eye className="w-3 h-3" />
          Veröffentlicht
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
        <EyeOff className="w-3 h-3" />
        Entwurf
      </span>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Buchklub
          </h1>
          <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
            Organisiere Buchclub-Treffen mit deinen Lesern
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg touch-manipulation"
          style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
        >
          <Plus className="w-5 h-5" />
          Neuer Buchklub
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {bookclubs.length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Buchklubs</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#10B981' }}>
            {bookclubs.filter(b => b.status === 'published').length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Aktiv</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#247ba0' }}>
            {bookclubs.reduce((sum, b) => sum + b.members, 0)}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Mitglieder gesamt</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#F59E0B' }}>
            {bookclubs.reduce((sum, b) => sum + b.maxMembers, 0)}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Max. Kapazität</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} />
        <button
          onClick={() => setStatusFilter('all')}
          className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: statusFilter === 'all' ? '#F59E0B' : '#F3F4F6',
            color: statusFilter === 'all' ? '#92400e' : '#3A3A3A'
          }}
        >
          Alle ({bookclubs.length})
        </button>
        <button
          onClick={() => setStatusFilter('published')}
          className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: statusFilter === 'published' ? '#10B981' : '#F3F4F6',
            color: statusFilter === 'published' ? '#FFFFFF' : '#3A3A3A'
          }}
        >
          Aktiv ({bookclubs.filter(b => b.status === 'published').length})
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: statusFilter === 'draft' ? '#F59E0B' : '#F3F4F6',
            color: statusFilter === 'draft' ? '#92400e' : '#3A3A3A'
          }}
        >
          Entwürfe ({bookclubs.filter(b => b.status === 'draft').length})
        </button>
      </div>

      {/* Bookclubs List */}
      <div className="space-y-3">
        {filteredBookclubs.length === 0 ? (
          <div className="rounded-lg p-12 text-center border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Keine Buchklubs
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Erstelle deinen ersten Buchclub
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
            >
              Buchklub erstellen
            </button>
          </div>
        ) : (
          filteredBookclubs.map((bookclub) => (
            <div 
              key={bookclub.id}
              className="rounded-lg p-4 md:p-6 border hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}
                  >
                    <Users className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base md:text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                        {bookclub.name}
                      </h3>
                      {getStatusBadge(bookclub.status)}
                    </div>
                    
                    <p className="text-xs md:text-sm mb-3" style={{ color: '#6B7280' }}>
                      {bookclub.description}
                    </p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs md:text-sm" style={{ color: '#6B7280' }}>
                        <BookOpen className="w-4 h-4" />
                        Aktuelles Buch: {bookclub.book}
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm" style={{ color: '#6B7280' }}>
                        <Calendar className="w-4 h-4" />
                        Nächstes Treffen: {new Date(bookclub.nextMeeting).toLocaleDateString('de-DE', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      {bookclub.status === 'published' && (
                        <div className="flex items-center gap-2 text-xs md:text-sm" style={{ color: '#6B7280' }}>
                          <Users className="w-4 h-4" />
                          {bookclub.members} / {bookclub.maxMembers} Mitglieder
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                      <span>Erstellt: {new Date(bookclub.createdAt).toLocaleDateString('de-DE')}</span>
                      {bookclub.publishedAt && (
                        <span>Veröffentlicht: {new Date(bookclub.publishedAt).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => setEditingBookclub(bookclub)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="md:hidden">Bearbeiten</span>
                  </button>
                  
                  {bookclub.status === 'draft' ? (
                    <button
                      onClick={() => publishBookclub(bookclub.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                      title="Veröffentlichen"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="md:hidden">Veröffentlichen</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => unpublishBookclub(bookclub.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
                      title="Zurücknehmen"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span className="md:hidden">Zurücknehmen</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteBookclub(bookclub.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="md:hidden">Löschen</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingBookclub) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingBookclub ? 'Buchklub bearbeiten' : 'Neuer Buchklub'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingBookclub(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Name des Buchklubs
                </label>
                <input
                  type="text"
                  defaultValue={editingBookclub?.name}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Monatlicher Buchclub"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Beschreibung
                </label>
                <textarea
                  defaultValue={editingBookclub?.description}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="Beschreibe deinen Buchklub..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Aktuelles Buch
                </label>
                <input
                  type="text"
                  defaultValue={editingBookclub?.book}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Der Sommerroman"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                    Nächstes Treffen
                  </label>
                  <input
                    type="date"
                    defaultValue={editingBookclub?.nextMeeting}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                    Max. Mitglieder
                  </label>
                  <input
                    type="number"
                    defaultValue={editingBookclub?.maxMembers || 50}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingBookclub(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingBookclub(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
                >
                  Als Entwurf speichern
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingBookclub(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                >
                  Veröffentlichen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
