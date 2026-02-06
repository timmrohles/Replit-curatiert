import { Megaphone, TrendingUp, Users, ArrowRight, Lock } from 'lucide-react';
import { Button } from '../ui/button';

interface PublisherMarketingModuleProps {
  isVerified?: boolean;
  backgroundColor?: string;
  onLearnMore?: () => void;
}

export function PublisherMarketingModule({ 
  isVerified = false,
  backgroundColor = '#247ba0',
  onLearnMore
}: PublisherMarketingModuleProps) {
  
  const marketingFeatures = [
    {
      icon: Megaphone,
      title: 'Titel bewerben',
      description: 'Platziere deine Bücher prominent auf der Plattform',
      isPremium: false
    },
    {
      icon: TrendingUp,
      title: 'Listen boosten',
      description: 'Erhöhe die Sichtbarkeit deiner Kurationen',
      isPremium: true
    },
    {
      icon: Users,
      title: 'Creator-Kampagnen',
      description: 'Kooperiere mit Kurator:innen für gezielte Promotion',
      isPremium: true
    }
  ];

  return (
    <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-[#247ba0]/10 to-[#70c1b3]/10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 
            className="mb-3"
            style={{ 
              fontFamily: 'Fjalla One',
              color: '#3A3A3A'
            }}
          >
            Marketing & Promotion
          </h2>
          <p style={{ color: '#666666', fontSize: '18px' }}>
            {isVerified 
              ? 'Nutze diese Tools, um deine Titel erfolgreich zu vermarkten'
              : 'Beanspruche dein Profil, um Zugang zu Marketing-Tools zu erhalten'
            }
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {marketingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            const isLocked = !isVerified || (feature.isPremium && !isVerified);

            return (
              <div 
                key={index}
                className={`bg-white rounded-xl p-8 border-2 transition-all relative ${
                  isLocked 
                    ? 'border-gray-200 opacity-75' 
                    : 'border-[#247ba0] hover:shadow-xl cursor-pointer'
                }`}
              >
                {/* Premium Badge */}
                {feature.isPremium && (
                  <div 
                    className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: '#ffe066',
                      color: '#3A3A3A'
                    }}
                  >
                    Premium
                  </div>
                )}

                {/* Lock Icon for locked features */}
                {isLocked && (
                  <div className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  <div 
                    className={`p-4 rounded-xl mb-4 ${
                      isLocked ? 'bg-gray-100' : 'bg-[#247ba0]'
                    }`}
                  >
                    <Icon 
                      className={`w-8 h-8 ${
                        isLocked ? 'text-gray-400' : 'text-white'
                      }`} 
                    />
                  </div>

                  <h3 
                    className="mb-2"
                    style={{ 
                      fontFamily: 'Fjalla One',
                      color: isLocked ? '#999999' : '#3A3A3A',
                      fontSize: '20px'
                    }}
                  >
                    {feature.title}
                  </h3>

                  <p 
                    className="mb-4"
                    style={{ color: isLocked ? '#999999' : '#666666' }}
                  >
                    {feature.description}
                  </p>

                  {!isLocked && (
                    <Button
                      variant="ghost"
                      className="text-[#247ba0] hover:bg-[#247ba0]/10"
                    >
                      Mehr erfahren
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA for non-verified publishers */}
        {!isVerified && (
          <div className="text-center">
            <Button
              onClick={onLearnMore}
              style={{
                backgroundColor: '#247ba0',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '14px 40px',
                fontSize: '18px',
                fontFamily: 'Fjalla One'
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Profil beanspruchen & Tools freischalten
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}