import { useState } from 'react';
import { Gift, Plus, Edit, Trash2, Eye, EyeOff, Filter, X, FileText, Image, Music, Video } from 'lucide-react';

type ContentStatus = 'draft' | 'published';
type ContentType = 'text' | 'image' | 'audio' | 'video';

interface BonusContent {
  id: string;
  title: string;
  type: ContentType;
  description: string;
  status: ContentStatus;
  createdAt: string;
  publishedAt?: string;
  downloads: number;
}

export function AuthorBonuscontent() {
  const [contents, setContents] = useState<BonusContent[]>([
    {
      id: '1',
      title: 'Alternatives Ende - Kapitel 12',
      type: 'text',
      description: 'Eine alternative Fortsetzung für Kapitel 12',
      status: 'published',
      createdAt: '2025-01-10',
      publishedAt: '2025-01-12',
      downloads: 234
    },
    {
      id: '2',
      title: 'Charakterportraits - Skizzen',
      type: 'image',
      description: 'Handgezeichnete Charakterportraits',
      status: 'published',
      createdAt: '2025-01-15',
      publishedAt: '2025-01-16',
      downloads: 189
    },
    {
      id: '3',
      title: 'Playlist zum Roman',
      type: 'audio',
      description: 'Meine persönliche Playlist während des Schreibens',
      status: 'draft',
      createdAt: '2025-01-20',
      downloads: 0
    }
  ]);

  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ContentType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContent, setEditingContent] = useState<BonusContent | null>(null);

  const filteredContents = contents.filter(c => {
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    const typeMatch = typeFilter === 'all' || c.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const publishContent = (id: string) => {
    setContents(contents.map(c => 
      c.id === id ? { ...c, status: 'published', publishedAt: new Date().toISOString() } : c
    ));
  };

  const unpublishContent = (id: string) => {
    setContents(contents.map(c => 
      c.id === id ? { ...c, status: 'draft', publishedAt: undefined } : c
    ));
  };

  const deleteContent = (id: string) => {
    if (confirm('Möchtest du diesen Bonusinhalt wirklich löschen?')) {
      setContents(contents.filter(c => c.id !== id));
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
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

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'text': return <FileText className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'text': return 'Text';
      case 'image': return 'Bild';
      case 'audio': return 'Audio';
      case 'video': return 'Video';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Bonusinhalte
          </h1>
          <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
            Verwalte exklusive Inhalte für deine Community
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg touch-manipulation"
          style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
        >
          <Plus className="w-5 h-5" />
          Neuer Bonusinhalt
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {contents.length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Gesamt</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#10B981' }}>
            {contents.filter(c => c.status === 'published').length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Veröffentlicht</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#F59E0B' }}>
            {contents.filter(c => c.status === 'draft').length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Entwürfe</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#247ba0' }}>
            {contents.reduce((sum, c) => sum + c.downloads, 0)}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Downloads</div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} />
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: '#6B7280' }}>Status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: statusFilter === 'all' ? '#247ba0' : '#F3F4F6',
              color: statusFilter === 'all' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Alle ({contents.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: statusFilter === 'published' ? '#10B981' : '#F3F4F6',
              color: statusFilter === 'published' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Veröffentlicht ({contents.filter(c => c.status === 'published').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: statusFilter === 'draft' ? '#F59E0B' : '#F3F4F6',
              color: statusFilter === 'draft' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Entwürfe ({contents.filter(c => c.status === 'draft').length})
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} />
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: '#6B7280' }}>Typ:</span>
          <button
            onClick={() => setTypeFilter('all')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: typeFilter === 'all' ? '#247ba0' : '#F3F4F6',
              color: typeFilter === 'all' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Alle
          </button>
          {(['text', 'image', 'audio', 'video'] as ContentType[]).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
              style={{
                backgroundColor: typeFilter === type ? '#247ba0' : '#F3F4F6',
                color: typeFilter === type ? '#FFFFFF' : '#3A3A3A'
              }}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {filteredContents.length === 0 ? (
          <div className="rounded-lg p-12 text-center border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <Gift className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Keine Bonusinhalte
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Erstelle exklusive Inhalte für deine Community
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ backgroundColor: '#F59E0B' }}
            >
              Bonusinhalt erstellen
            </button>
          </div>
        ) : (
          filteredContents.map((content) => (
            <div 
              key={content.id}
              className="rounded-lg p-4 md:p-6 border hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}
                  >
                    {getTypeIcon(content.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base md:text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                        {content.title}
                      </h3>
                      {getStatusBadge(content.status)}
                      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                        {getTypeLabel(content.type)}
                      </span>
                    </div>
                    
                    <p className="text-xs md:text-sm mb-3" style={{ color: '#6B7280' }}>
                      {content.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                      <span>Erstellt: {new Date(content.createdAt).toLocaleDateString('de-DE')}</span>
                      {content.publishedAt && (
                        <span>Veröffentlicht: {new Date(content.publishedAt).toLocaleDateString('de-DE')}</span>
                      )}
                      {content.status === 'published' && (
                        <span>{content.downloads} Downloads</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => setEditingContent(content)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="md:hidden">Bearbeiten</span>
                  </button>
                  
                  {content.status === 'draft' ? (
                    <button
                      onClick={() => publishContent(content.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                      title="Veröffentlichen"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="md:hidden">Veröffentlichen</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => unpublishContent(content.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
                      title="Zurücknehmen"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span className="md:hidden">Zurücknehmen</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteContent(content.id)}
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
      {(showCreateModal || editingContent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingContent ? 'Bonusinhalt bearbeiten' : 'Neuer Bonusinhalt'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingContent(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Titel
                </label>
                <input
                  type="text"
                  defaultValue={editingContent?.title}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Alternatives Ende - Kapitel 12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Typ
                </label>
                <select
                  defaultValue={editingContent?.type || 'text'}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <option value="text">Text</option>
                  <option value="image">Bild</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Beschreibung
                </label>
                <textarea
                  defaultValue={editingContent?.description}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="Beschreibe den Bonusinhalt..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Datei hochladen
                </label>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-all"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <Gift className="w-12 h-12 mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    Klicke hier oder ziehe eine Datei hierher
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingContent(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingContent(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
                >
                  Als Entwurf speichern
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingContent(null);
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
