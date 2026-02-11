import { useState } from 'react';
import { Store, Plus, Edit, Trash2, Eye, EyeOff, Filter, X, BookOpen, Settings } from 'lucide-react';

type StorefrontStatus = 'draft' | 'published';

interface Storefront {
  id: string;
  name: string;
  description: string;
  slug: string;
  bookCount: number;
  views: number;
  status: StorefrontStatus;
  createdAt: string;
  publishedAt?: string;
}

export function CreatorStorefront() {
  const [storefronts, setStorefronts] = useState<Storefront[]>([
    {
      id: '1',
      name: 'Meine Buchempfehlungen',
      description: 'Kuratierte Auswahl meiner Lieblingsbücher aus verschiedenen Genres',
      slug: 'meine-empfehlungen',
      bookCount: 24,
      views: 1234,
      status: 'published',
      createdAt: '2025-01-01',
      publishedAt: '2025-01-05'
    },
    {
      id: '2',
      name: 'Feministische Literatur 2025',
      description: 'Die wichtigsten feministischen Neuerscheinungen',
      slug: 'feministische-literatur',
      bookCount: 12,
      views: 567,
      status: 'published',
      createdAt: '2025-01-10',
      publishedAt: '2025-01-15'
    },
    {
      id: '3',
      name: 'Suhrkamp Highlights',
      description: 'Meine persönlichen Highlights aus dem Suhrkamp Verlag',
      slug: 'suhrkamp-highlights',
      bookCount: 8,
      views: 0,
      status: 'draft',
      createdAt: '2025-01-20'
    }
  ]);

  const [statusFilter, setStatusFilter] = useState<'all' | StorefrontStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStorefront, setEditingStorefront] = useState<Storefront | null>(null);

  const filteredStorefronts = storefronts.filter(s => 
    statusFilter === 'all' ? true : s.status === statusFilter
  );

  const publishStorefront = (id: string) => {
    setStorefronts(storefronts.map(s => 
      s.id === id ? { ...s, status: 'published', publishedAt: new Date().toISOString() } : s
    ));
  };

  const unpublishStorefront = (id: string) => {
    setStorefronts(storefronts.map(s => 
      s.id === id ? { ...s, status: 'draft', publishedAt: undefined } : s
    ));
  };

  const deleteStorefront = (id: string) => {
    if (confirm('Möchtest du diese Storefront wirklich löschen?')) {
      setStorefronts(storefronts.filter(s => s.id !== id));
    }
  };

  const getStatusBadge = (status: StorefrontStatus) => {
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
            Meine Storefronts
          </h1>
          <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
            Verwalte deine kuratierten Buchsammlungen
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg touch-manipulation"
          style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
        >
          <Plus className="w-5 h-5" />
          Neue Storefront
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {storefronts.length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Storefronts</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#10B981' }}>
            {storefronts.filter(s => s.status === 'published').length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Veröffentlicht</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#247ba0' }}>
            {storefronts.reduce((sum, s) => sum + s.bookCount, 0)}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Bücher gesamt</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#F59E0B' }}>
            {storefronts.reduce((sum, s) => sum + s.views, 0)}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Aufrufe gesamt</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} />
        <button
          onClick={() => setStatusFilter('all')}
          className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: statusFilter === 'all' ? '#10B981' : '#F3F4F6',
            color: statusFilter === 'all' ? '#FFFFFF' : '#3A3A3A'
          }}
        >
          Alle ({storefronts.length})
        </button>
        <button
          onClick={() => setStatusFilter('published')}
          className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: statusFilter === 'published' ? '#10B981' : '#F3F4F6',
            color: statusFilter === 'published' ? '#FFFFFF' : '#3A3A3A'
          }}
        >
          Veröffentlicht ({storefronts.filter(s => s.status === 'published').length})
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: statusFilter === 'draft' ? '#F59E0B' : '#F3F4F6',
            color: statusFilter === 'draft' ? '#92400e' : '#3A3A3A'
          }}
        >
          Entwürfe ({storefronts.filter(s => s.status === 'draft').length})
        </button>
      </div>

      {/* Storefronts List */}
      <div className="space-y-3">
        {filteredStorefronts.length === 0 ? (
          <div className="rounded-lg p-12 text-center border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <Store className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Keine Storefronts
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Erstelle deine erste kuratierte Buchsammlung
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ backgroundColor: '#10B981' }}
            >
              Storefront erstellen
            </button>
          </div>
        ) : (
          filteredStorefronts.map((storefront) => (
            <div 
              key={storefront.id}
              className="rounded-lg p-4 md:p-6 border hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}
                  >
                    <Store className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base md:text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                        {storefront.name}
                      </h3>
                      {getStatusBadge(storefront.status)}
                    </div>
                    
                    <p className="text-xs md:text-sm mb-3" style={{ color: '#6B7280' }}>
                      {storefront.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs mb-3" style={{ color: '#6B7280' }}>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {storefront.bookCount} Bücher
                      </div>
                      {storefront.status === 'published' && (
                        <>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {storefront.views} Aufrufe
                          </div>
                          <div>
                            URL: coratiert.de/{storefront.slug}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                      <span>Erstellt: {new Date(storefront.createdAt).toLocaleDateString('de-DE')}</span>
                      {storefront.publishedAt && (
                        <span>Veröffentlicht: {new Date(storefront.publishedAt).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => setEditingStorefront(storefront)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="md:hidden">Bearbeiten</span>
                  </button>

                  <button
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}
                    title="Bücher verwalten"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="md:hidden">Bücher</span>
                  </button>
                  
                  {storefront.status === 'draft' ? (
                    <button
                      onClick={() => publishStorefront(storefront.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                      title="Veröffentlichen"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="md:hidden">Veröffentlichen</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => unpublishStorefront(storefront.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
                      title="Zurücknehmen"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span className="md:hidden">Zurücknehmen</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteStorefront(storefront.id)}
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
      {(showCreateModal || editingStorefront) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingStorefront ? 'Storefront bearbeiten' : 'Neue Storefront'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingStorefront(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Name der Storefront
                </label>
                <input
                  type="text"
                  defaultValue={editingStorefront?.name}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Meine Buchempfehlungen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  URL-Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: '#6B7280' }}>coratiert.de/</span>
                  <input
                    type="text"
                    defaultValue={editingStorefront?.slug}
                    className="flex-1 px-4 py-2 rounded-lg border"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="meine-empfehlungen"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Beschreibung
                </label>
                <textarea
                  defaultValue={editingStorefront?.description}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="Beschreibe deine Storefront..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingStorefront(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingStorefront(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
                >
                  Als Entwurf speichern
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingStorefront(null);
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
