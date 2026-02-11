import { useState } from 'react';
import { Users, Plus, Edit, Trash2, Eye, EyeOff, Filter, X, MessageSquare, Heart } from 'lucide-react';

type PostStatus = 'draft' | 'published';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'discussion' | 'update';
  likes: number;
  comments: number;
  status: PostStatus;
  createdAt: string;
  publishedAt?: string;
}

export function AuthorCommunity() {
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      title: 'Neues Buch kommt im März!',
      content: 'Ich freue mich, euch mitteilen zu können, dass mein neues Buch "Frühlingserwachen" im März erscheint...',
      type: 'announcement',
      likes: 234,
      comments: 45,
      status: 'published',
      createdAt: '2025-01-15',
      publishedAt: '2025-01-15'
    },
    {
      id: '2',
      title: 'Frage: Welches Thema für nächstes Buch?',
      content: 'Ich überlege für mein nächstes Projekt zwischen zwei Themen. Was würdet ihr lieber lesen?',
      type: 'discussion',
      likes: 156,
      comments: 89,
      status: 'published',
      createdAt: '2025-01-10',
      publishedAt: '2025-01-10'
    },
    {
      id: '3',
      title: 'Update zum Schreibprozess',
      content: 'Kleine Einblicke in meine Schreibroutine und den aktuellen Stand des Manuskripts...',
      type: 'update',
      likes: 0,
      comments: 0,
      status: 'draft',
      createdAt: '2025-01-22'
    }
  ]);

  const [statusFilter, setStatusFilter] = useState<'all' | PostStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'announcement' | 'discussion' | 'update'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

  const filteredPosts = posts.filter(p => {
    const statusMatch = statusFilter === 'all' || p.status === statusFilter;
    const typeMatch = typeFilter === 'all' || p.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const publishPost = (id: string) => {
    setPosts(posts.map(p => 
      p.id === id ? { ...p, status: 'published', publishedAt: new Date().toISOString() } : p
    ));
  };

  const unpublishPost = (id: string) => {
    setPosts(posts.map(p => 
      p.id === id ? { ...p, status: 'draft', publishedAt: undefined } : p
    ));
  };

  const deletePost = (id: string) => {
    if (confirm('Möchtest du diesen Post wirklich löschen?')) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const getStatusBadge = (status: PostStatus) => {
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

  const getTypeBadge = (type: string) => {
    const styles = {
      announcement: { bg: '#DBEAFE', color: '#1E40AF', label: 'Ankündigung' },
      discussion: { bg: '#FCE7F3', color: '#9F1239', label: 'Diskussion' },
      update: { bg: '#DCFCE7', color: '#166534', label: 'Update' }
    };
    const style = styles[type as keyof typeof styles];
    return (
      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: style.bg, color: style.color }}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Community
          </h1>
          <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
            Interagiere mit deinen Lesern und teile Updates
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg touch-manipulation"
          style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
        >
          <Plus className="w-5 h-5" />
          Neuer Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {posts.length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Posts</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#10B981' }}>
            {posts.filter(p => p.status === 'published').length}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Veröffentlicht</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#EF4444' }}>
            {posts.reduce((sum, p) => sum + p.likes, 0)}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Likes gesamt</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-2xl md:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#247ba0' }}>
            {posts.reduce((sum, p) => sum + p.comments, 0)}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Kommentare</div>
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
              backgroundColor: statusFilter === 'all' ? '#F59E0B' : '#F3F4F6',
              color: statusFilter === 'all' ? '#92400e' : '#3A3A3A'
            }}
          >
            Alle ({posts.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: statusFilter === 'published' ? '#10B981' : '#F3F4F6',
              color: statusFilter === 'published' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Veröffentlicht ({posts.filter(p => p.status === 'published').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: statusFilter === 'draft' ? '#F59E0B' : '#F3F4F6',
              color: statusFilter === 'draft' ? '#92400e' : '#3A3A3A'
            }}
          >
            Entwürfe ({posts.filter(p => p.status === 'draft').length})
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} />
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: '#6B7280' }}>Typ:</span>
          <button
            onClick={() => setTypeFilter('all')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: typeFilter === 'all' ? '#F59E0B' : '#F3F4F6',
              color: typeFilter === 'all' ? '#92400e' : '#3A3A3A'
            }}
          >
            Alle
          </button>
          {(['announcement', 'discussion', 'update'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap capitalize"
              style={{
                backgroundColor: typeFilter === type ? '#F59E0B' : '#F3F4F6',
                color: typeFilter === type ? '#92400e' : '#3A3A3A'
              }}
            >
              {type === 'announcement' ? 'Ankündigung' : type === 'discussion' ? 'Diskussion' : 'Update'}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="rounded-lg p-12 text-center border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Keine Posts
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Erstelle deinen ersten Community-Post
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
            >
              Post erstellen
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div 
              key={post.id}
              className="rounded-lg p-4 md:p-6 border hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-base md:text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                      {post.title}
                    </h3>
                    {getStatusBadge(post.status)}
                    {getTypeBadge(post.type)}
                  </div>
                  
                  <p className="text-xs md:text-sm mb-3" style={{ color: '#6B7280' }}>
                    {post.content}
                  </p>
                  
                  {post.status === 'published' && (
                    <div className="flex items-center gap-4 text-xs mb-3" style={{ color: '#6B7280' }}>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.likes} Likes
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {post.comments} Kommentare
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                    <span>Erstellt: {new Date(post.createdAt).toLocaleDateString('de-DE')}</span>
                    {post.publishedAt && (
                      <span>Veröffentlicht: {new Date(post.publishedAt).toLocaleDateString('de-DE')}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => setEditingPost(post)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                    style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="md:hidden">Bearbeiten</span>
                  </button>
                  
                  {post.status === 'draft' ? (
                    <button
                      onClick={() => publishPost(post.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                      title="Veröffentlichen"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="md:hidden">Veröffentlichen</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => unpublishPost(post.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:shadow-md touch-manipulation"
                      style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
                      title="Zurücknehmen"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span className="md:hidden">Zurücknehmen</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => deletePost(post.id)}
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
      {(showCreateModal || editingPost) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {editingPost ? 'Post bearbeiten' : 'Neuer Post'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPost(null);
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
                  defaultValue={editingPost?.title}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="z.B. Neues Buch kommt im März!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Post-Typ
                </label>
                <select
                  defaultValue={editingPost?.type || 'announcement'}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <option value="announcement">Ankündigung</option>
                  <option value="discussion">Diskussion</option>
                  <option value="update">Update</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>
                  Inhalt
                </label>
                <textarea
                  defaultValue={editingPost?.content}
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="Teile deine Gedanken mit der Community..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPost(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPost(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                  style={{ backgroundColor: '#F59E0B', color: '#92400e' }}
                >
                  Als Entwurf speichern
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPost(null);
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
