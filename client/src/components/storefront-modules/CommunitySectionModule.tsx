import { MessageCircle, Eye, Users } from 'lucide-react';
import { Button } from '../ui/button';

interface CommunitySectionModuleProps {
  authorName: string;
  backgroundColor?: string;
  isPublic?: boolean;
  onJoinCommunity?: () => void;
}

export function CommunitySectionModule({ 
  authorName, 
  backgroundColor = '#FFFFFF',
  isPublic = false,
  onJoinCommunity
}: CommunitySectionModuleProps) {
  
  const communityTopics = [
    {
      icon: MessageCircle,
      title: 'Fragen & Antworten',
      description: 'Stellt eure Fragen direkt an die Autor:in',
      memberCount: 234
    },
    {
      icon: Eye,
      title: 'Hinter den Kulissen',
      description: 'Exklusive Einblicke in den Schreibprozess',
      memberCount: 189
    },
    {
      icon: Users,
      title: 'Diskussion zum Buch',
      description: 'Tauscht euch mit anderen Leser:innen aus',
      memberCount: 312
    }
  ];

  return (
    <section 
      className="py-16 px-4 md:px-8"
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 
            className="mb-2"
            style={{ 
              fontFamily: 'Fjalla One',
              color: '#3A3A3A'
            }}
          >
            Community mit {authorName}
          </h2>
          <p style={{ color: '#666666' }}>
            {isPublic ? 'Öffentliche Community' : 'Nur für registrierte Nutzer:innen'}
          </p>
        </div>

        {/* Community Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {communityTopics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#247ba0] transition-all cursor-pointer group"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-[#247ba0]/10 group-hover:bg-[#247ba0]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#247ba0]" />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="mb-1"
                      style={{ 
                        fontFamily: 'Fjalla One',
                        color: '#3A3A3A'
                      }}
                    >
                      {topic.title}
                    </h3>
                    <p className="text-sm" style={{ color: '#666666' }}>
                      {topic.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#999999' }}>
                  <Users className="w-4 h-4" />
                  <span>{topic.memberCount} Mitglieder</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={onJoinCommunity}
            style={{
              backgroundColor: '#247ba0',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '12px 32px'
            }}
            className="hover:opacity-90 transition-opacity"
          >
            Zur Community
          </Button>
          {!isPublic && (
            <p className="mt-3 text-sm" style={{ color: '#999999' }}>
              Nur für Mitglieder · Registrierung erforderlich
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
