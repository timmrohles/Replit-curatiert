import { FileText, Image as ImageIcon, Headphones, Lock, Eye, Download } from 'lucide-react';
import { Button } from '../ui/button';

interface BonusItem {
  id: string;
  title: string;
  type: 'pdf' | 'image' | 'audio' | 'text';
  accessLevel: 'free' | 'member' | 'bookclub';
  thumbnail?: string;
  size?: string;
}

interface BonusExtrasModuleProps {
  backgroundColor?: string;
  onViewAll?: () => void;
}

export function BonusExtrasModule({ 
  backgroundColor = '#FFFFFF',
  onViewAll
}: BonusExtrasModuleProps) {
  
  const bonusItems: BonusItem[] = [
    {
      id: '1',
      title: 'Kapitel 1 - Alternativer Anfang',
      type: 'pdf',
      accessLevel: 'free',
      size: '2.4 MB'
    },
    {
      id: '2',
      title: 'Character Design Sketches',
      type: 'image',
      accessLevel: 'member',
      size: '15 Bilder'
    },
    {
      id: '3',
      title: 'Audiokommentar zur Entstehung',
      type: 'audio',
      accessLevel: 'bookclub',
      size: '45 Min'
    },
    {
      id: '4',
      title: 'Gelöschte Szenen',
      type: 'text',
      accessLevel: 'member',
      size: '8 Seiten'
    },
    {
      id: '5',
      title: 'Playlist zur Geschichte',
      type: 'audio',
      accessLevel: 'free',
      size: '24 Songs'
    },
    {
      id: '6',
      title: 'World Building Guide',
      type: 'pdf',
      accessLevel: 'bookclub',
      size: '12 MB'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return FileText;
      case 'image':
        return ImageIcon;
      case 'audio':
        return Headphones;
      default:
        return FileText;
    }
  };

  const getAccessBadge = (level: string) => {
    const badges = {
      free: { text: 'Frei', color: '#70c1b3' },
      member: { text: 'Mitglieder', color: '#ffe066' },
      bookclub: { text: 'Buchclub', color: '#f25f5c' }
    };
    return badges[level as keyof typeof badges] || badges.free;
  };

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
            Bonusmaterial & Extras
          </h2>
          <p style={{ color: '#666666' }}>
            Exklusive Inhalte für Leser:innen und Mitglieder
          </p>
        </div>

        {/* Bonus Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {bonusItems.map((item) => {
            const Icon = getTypeIcon(item.type);
            const badge = getAccessBadge(item.accessLevel);
            const isLocked = item.accessLevel !== 'free';

            return (
              <div 
                key={item.id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#247ba0] transition-all cursor-pointer group relative overflow-hidden"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                {/* Access Badge */}
                <div 
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs"
                  style={{ 
                    backgroundColor: badge.color,
                    color: badge.color === '#ffe066' ? '#3A3A3A' : '#FFFFFF'
                  }}
                >
                  {badge.text}
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="p-3 rounded-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: '#247ba0' }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 pr-20">
                    <h3 
                      className="mb-1 line-clamp-2"
                      style={{ 
                        fontFamily: 'Fjalla One',
                        color: '#3A3A3A',
                        fontSize: '16px'
                      }}
                    >
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm" style={{ color: '#999999' }}>
                    {item.size}
                  </span>
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Download className="w-4 h-4 text-[#247ba0] group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={onViewAll}
            variant="outline"
            style={{
              borderColor: '#247ba0',
              color: '#247ba0',
              borderRadius: '8px',
              padding: '12px 32px'
            }}
            className="hover:bg-[#247ba0] hover:text-white transition-all"
          >
            <Eye className="w-4 h-4 mr-2" />
            Alle Extras ansehen
          </Button>
        </div>
      </div>
    </section>
  );
}