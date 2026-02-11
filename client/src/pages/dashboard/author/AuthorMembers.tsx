import { useState } from 'react';
import { Heart, Users, Mail, UserCheck, Crown, Calendar, Filter, Search, TrendingUp } from 'lucide-react';

type MemberType = 'all' | 'followers' | 'premium' | 'newsletter';

interface Member {
  id: string;
  name: string;
  avatar: string;
  type: 'follower' | 'premium';
  joinedDate: string;
  newsletter: boolean;
  engagement: number; // 1-100
  lastActive: string;
}

const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Anna Schmidt',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    type: 'premium',
    joinedDate: '2024-06-15',
    newsletter: true,
    engagement: 95,
    lastActive: '2025-01-27'
  },
  {
    id: '2',
    name: 'Max Müller',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    type: 'follower',
    joinedDate: '2024-09-20',
    newsletter: true,
    engagement: 72,
    lastActive: '2025-01-26'
  },
  {
    id: '3',
    name: 'Laura Weber',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    type: 'premium',
    joinedDate: '2024-03-10',
    newsletter: true,
    engagement: 88,
    lastActive: '2025-01-28'
  },
  {
    id: '4',
    name: 'Tom Becker',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    type: 'follower',
    joinedDate: '2024-11-05',
    newsletter: false,
    engagement: 45,
    lastActive: '2025-01-20'
  },
  {
    id: '5',
    name: 'Sophie Klein',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    type: 'follower',
    joinedDate: '2025-01-10',
    newsletter: true,
    engagement: 63,
    lastActive: '2025-01-28'
  }
];

export function AuthorMembers() {
  const [filterType, setFilterType] = useState<MemberType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'followers') return matchesSearch && member.type === 'follower';
    if (filterType === 'premium') return matchesSearch && member.type === 'premium';
    if (filterType === 'newsletter') return matchesSearch && member.newsletter;
    
    return matchesSearch;
  });

  const totalFollowers = mockMembers.filter(m => m.type === 'follower').length;
  const totalPremium = mockMembers.filter(m => m.type === 'premium').length;
  const totalNewsletter = mockMembers.filter(m => m.newsletter).length;
  const newThisWeek = mockMembers.filter(m => {
    const joined = new Date(m.joinedDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return joined >= weekAgo;
  }).length;

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return '#10B981';
    if (engagement >= 50) return '#F59E0B';
    return '#6B7280';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Mitglieder
        </h1>
        <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
          Verwalte deine treuen Leser und Unterstützer
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" style={{ color: '#247ba0' }} />
            <div className="text-xs" style={{ color: '#6B7280' }}>Gesamt</div>
          </div>
          <div className="text-2xl md:text-3xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {mockMembers.length}
          </div>
        </div>

        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4" style={{ color: '#EF4444' }} />
            <div className="text-xs" style={{ color: '#6B7280' }}>Follower</div>
          </div>
          <div className="text-2xl md:text-3xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {totalFollowers}
          </div>
        </div>

        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4" style={{ color: '#F59E0B' }} />
            <div className="text-xs" style={{ color: '#6B7280' }}>Premium</div>
          </div>
          <div className="text-2xl md:text-3xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            {totalPremium}
          </div>
        </div>

        <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#10B981' }} />
            <div className="text-xs" style={{ color: '#6B7280' }}>Neu (7 Tage)</div>
          </div>
          <div className="text-2xl md:text-3xl" style={{ fontFamily: 'Fjalla One', color: '#10B981' }}>
            +{newThisWeek}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Mitglieder suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
              style={{ 
                backgroundColor: '#F9FAFB',
                borderColor: '#D1D5DB',
                color: '#3A3A3A'
              }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: '#6B7280' }} />
          <button
            onClick={() => setFilterType('all')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: filterType === 'all' ? '#247ba0' : '#F3F4F6',
              color: filterType === 'all' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Alle ({mockMembers.length})
          </button>
          <button
            onClick={() => setFilterType('followers')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: filterType === 'followers' ? '#EF4444' : '#F3F4F6',
              color: filterType === 'followers' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Follower ({totalFollowers})
          </button>
          <button
            onClick={() => setFilterType('premium')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: filterType === 'premium' ? '#F59E0B' : '#F3F4F6',
              color: filterType === 'premium' ? '#92400e' : '#3A3A3A'
            }}
          >
            Premium ({totalPremium})
          </button>
          <button
            onClick={() => setFilterType('newsletter')}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: filterType === 'newsletter' ? '#10B981' : '#F3F4F6',
              color: filterType === 'newsletter' ? '#FFFFFF' : '#3A3A3A'
            }}
          >
            Newsletter ({totalNewsletter})
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="rounded-lg p-12 text-center border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Keine Mitglieder gefunden
            </h3>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {searchQuery ? 'Versuche einen anderen Suchbegriff' : 'Du hast noch keine Mitglieder'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div 
              key={member.id}
              className="rounded-lg p-4 md:p-6 border hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover flex-shrink-0"
                />

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base md:text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                      {member.name}
                    </h3>
                    {member.type === 'premium' && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                      >
                        <Crown className="w-3 h-3" />
                        Premium
                      </span>
                    )}
                    {member.newsletter && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                      >
                        <Mail className="w-3 h-3" />
                        Newsletter
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs" style={{ color: '#6B7280' }}>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Seit {new Date(member.joinedDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      Aktiv: {new Date(member.lastActive).toLocaleDateString('de-DE')}
                    </div>
                  </div>

                  {/* Engagement Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: '#6B7280' }}>Engagement</span>
                      <span className="text-xs font-medium" style={{ color: getEngagementColor(member.engagement) }}>
                        {member.engagement}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${member.engagement}%`,
                          backgroundColor: getEngagementColor(member.engagement)
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{ backgroundColor: '#F3F4F6', color: '#247ba0' }}
                >
                  <Mail className="w-4 h-4" />
                  Nachricht
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}