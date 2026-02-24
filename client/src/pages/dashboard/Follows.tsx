import { useState } from 'react';
import { Heart, UserMinus, Users, BookOpen, Building2, Tag, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardPageHeader } from '../../components/dashboard/DashboardPageHeader';

// Mock data
const mockFollows = {
  curators: [
    {
      id: '1',
      name: 'Lena Kraus',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      focus: 'Literatur & Belletristik',
      description: 'Literaturkritikerin mit Schwerpunkt auf deutschsprachiger Gegenwartsliteratur'
    },
    {
      id: '2',
      name: 'Max Weber',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      focus: 'Sachbuch & Politik',
      description: 'Journalist und Politikwissenschaftler'
    }
  ],
  authors: [
    {
      id: '1',
      name: 'Annie Ernaux',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
      description: 'Französische Autorin, Nobelpreis für Literatur 2022'
    },
    {
      id: '2',
      name: 'Olga Tokarczuk',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      description: 'Polnische Schriftstellerin, Nobelpreis für Literatur 2018'
    }
  ],
  publishers: [
    {
      id: '1',
      name: 'Suhrkamp Verlag',
      logo: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
      description: 'Renommierter deutscher Literaturverlag'
    }
  ],
  categories: [
    { id: '1', name: 'Belletristik', count: 342 },
    { id: '2', name: 'Sachbuch', count: 218 },
    { id: '3', name: 'Politik & Gesellschaft', count: 156 }
  ],
  tags: [
    { id: '1', name: 'Feminismus', count: 89 },
    { id: '2', name: 'Philosophie', count: 134 },
    { id: '3', name: 'Queere Literatur', count: 67 }
  ],
  curations: [
    {
      id: '1',
      title: 'Literarische Entdeckungen 2024',
      curator: 'Lena Kraus',
      bookCount: 12,
      cover: 'https://i.ibb.co/chrm0Tbt/die-jahre.jpg'
    }
  ]
};

type TabType = 'curators' | 'authors' | 'publishers' | 'categories' | 'tags' | 'curations';

export function DashboardFollows() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('curators');

  const tabs = [
    { id: 'curators' as TabType, label: 'Kurator:innen', icon: Users, count: mockFollows.curators.length },
    { id: 'authors' as TabType, label: 'Autor:innen', icon: BookOpen, count: mockFollows.authors.length },
    { id: 'publishers' as TabType, label: 'Verlage', icon: Building2, count: mockFollows.publishers.length },
    { id: 'categories' as TabType, label: 'Kategorien', icon: Tag, count: mockFollows.categories.length },
    { id: 'tags' as TabType, label: 'Themen', icon: Tag, count: mockFollows.tags.length },
    { id: 'curations' as TabType, label: 'Kurationen', icon: List, count: mockFollows.curations.length },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t('dashboardPages.followsTitle', 'Follower')}
        description={t('dashboardPages.followsDesc', 'Verwalte wen du verfolgst und wer dir folgt.')}
      />

      {/* Tabs */}
      <div className="rounded-lg p-4 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: isActive ? '#247ba0' : '#F3F4F6',
                  color: isActive ? '#FFFFFF' : '#3A3A3A'
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
                    color: isActive ? '#FFFFFF' : '#6B7280'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'curators' && mockFollows.curators.map((curator) => (
          <div key={curator.id} className="rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="flex items-start gap-4">
              <img 
                src={curator.avatar} 
                alt={curator.name}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {curator.name}
                </h3>
                <p className="text-sm mb-2" style={{ color: '#247ba0', fontWeight: '500' }}>
                  {curator.focus}
                </p>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {curator.description}
                </p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}
              >
                <UserMinus className="w-4 h-4" />
                <span className="hidden sm:inline">Entfolgen</span>
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'authors' && mockFollows.authors.map((author) => (
          <div key={author.id} className="rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="flex items-start gap-4">
              <img 
                src={author.avatar} 
                alt={author.name}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {author.name}
                </h3>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {author.description}
                </p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}
              >
                <UserMinus className="w-4 h-4" />
                <span className="hidden sm:inline">Entfolgen</span>
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'publishers' && mockFollows.publishers.map((publisher) => (
          <div key={publisher.id} className="rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="flex items-start gap-4">
              <img 
                src={publisher.logo} 
                alt={publisher.name}
                className="w-16 h-16 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {publisher.name}
                </h3>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {publisher.description}
                </p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}
              >
                <UserMinus className="w-4 h-4" />
                <span className="hidden sm:inline">Entfolgen</span>
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'categories' && mockFollows.categories.map((category) => (
          <div key={category.id} className="rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#EEF2FF' }}>
                  <Tag className="w-5 h-5" style={{ color: '#247ba0' }} />
                </div>
                <div>
                  <h3 className="mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    {category.name}
                  </h3>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    {category.count} Bücher
                  </p>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}
              >
                <UserMinus className="w-4 h-4" />
                <span className="hidden sm:inline">Entfolgen</span>
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'tags' && mockFollows.tags.map((tag) => (
          <div key={tag.id} className="rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                  <Tag className="w-5 h-5" style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <h3 className="mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    {tag.name}
                  </h3>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    {tag.count} Bücher
                  </p>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}
              >
                <UserMinus className="w-4 h-4" />
                <span className="hidden sm:inline">Entfolgen</span>
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'curations' && mockFollows.curations.map((curation) => (
          <div key={curation.id} className="rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="flex items-start gap-4">
              <img 
                src={curation.cover} 
                alt={curation.title}
                className="w-16 h-24 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {curation.title}
                </h3>
                <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
                  von {curation.curator}
                </p>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {curation.bookCount} Bücher
                </p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}
              >
                <UserMinus className="w-4 h-4" />
                <span className="hidden sm:inline">Entfolgen</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
