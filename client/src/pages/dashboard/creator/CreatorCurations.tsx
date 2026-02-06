import { Plus, Eye, EyeOff, TrendingUp, Edit, Trash2 } from 'lucide-react';

export function CreatorCurations() {
  const lists = [
    {
      id: '1',
      title: 'Feministische Klassiker 2024',
      subtitle: 'Must-Reads für alle',
      visible: true,
      featured: true,
      bookCount: 12,
      clicks: 234,
      sales: 18,
      category: 'Politik & Gesellschaft',
      tags: ['Feminismus', 'Sachbuch']
    },
    {
      id: '2',
      title: 'Die besten Debüts des Jahres',
      subtitle: 'Neue Stimmen entdecken',
      visible: true,
      featured: false,
      bookCount: 8,
      clicks: 156,
      sales: 12,
      category: 'Literatur',
      tags: ['Debüt', 'Neuerscheinungen']
    },
    {
      id: '3',
      title: 'Klima & Umwelt verstehen',
      subtitle: 'Wissenschaft trifft Aktivismus',
      visible: false,
      featured: false,
      bookCount: 15,
      clicks: 89,
      sales: 7,
      category: 'Wissenschaft',
      tags: ['Klima']
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Kuratierte Listen
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Erstelle thematische Buchsammlungen für deine Community
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white transition-colors" style={{ backgroundColor: '#10B981' }}>
          <Plus className="w-4 h-4" />
          Neue Liste
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg p-4 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-sm mb-1" style={{ color: '#6B7280' }}>Gesamt Listen</div>
          <div className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>3</div>
        </div>
        <div className="rounded-lg p-4 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-sm mb-1" style={{ color: '#6B7280' }}>Gesamt Klicks</div>
          <div className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>479</div>
        </div>
        <div className="rounded-lg p-4 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-sm mb-1" style={{ color: '#6B7280' }}>Verkäufe</div>
          <div className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>37</div>
        </div>
      </div>

      {/* Lists */}
      <div className="space-y-4">
        {lists.map((list) => (
          <div key={list.id} className="rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    {list.title}
                  </h3>
                  {list.featured && (
                    <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
                  {list.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#3A3A3A' }}>
                    {list.category}
                  </span>
                  {list.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button className="p-2 rounded-lg transition-colors" style={{ backgroundColor: '#F3F4F6' }}>
                  {list.visible ? <Eye className="w-4 h-4" style={{ color: '#10B981' }} /> : <EyeOff className="w-4 h-4" style={{ color: '#6B7280' }} />}
                </button>
                <button className="p-2 rounded-lg transition-colors" style={{ backgroundColor: '#F3F4F6' }}>
                  <Edit className="w-4 h-4" style={{ color: '#6B7280' }} />
                </button>
                <button className="p-2 rounded-lg transition-colors" style={{ backgroundColor: '#F3F4F6' }}>
                  <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
              <div>
                <div className="text-xs mb-1" style={{ color: '#6B7280' }}>Bücher</div>
                <div className="font-medium" style={{ color: '#3A3A3A' }}>{list.bookCount}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#6B7280' }}>Klicks</div>
                <div className="font-medium" style={{ color: '#3A3A3A' }}>{list.clicks}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#6B7280' }}>Verkäufe</div>
                <div className="font-medium text-green-600">{list.sales}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
