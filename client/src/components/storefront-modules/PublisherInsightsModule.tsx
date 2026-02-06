import { TrendingUp, Users, BookOpen, BarChart3, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface PublisherInsightsModuleProps {
  isPremium?: boolean;
  backgroundColor?: string;
  onUpgrade?: () => void;
}

export function PublisherInsightsModule({ 
  isPremium = false,
  backgroundColor = '#247ba0',
  onUpgrade
}: PublisherInsightsModuleProps) {
  
  const insights = [
    {
      icon: TrendingUp,
      title: 'Trendkategorien',
      description: 'Welche Genres sind bei deiner Zielgruppe besonders gefragt',
      value: isPremium ? 'Fantasy +24%' : '—',
      locked: !isPremium
    },
    {
      icon: Users,
      title: 'Leserinteressen',
      description: 'Demografische Daten zu Interessent:innen deiner Titel',
      value: isPremium ? '2.847 aktive' : '—',
      locked: !isPremium
    },
    {
      icon: BookOpen,
      title: 'Vorbestellungen',
      description: 'Entwicklung der Pre-Orders für kommende Releases',
      value: isPremium ? '+156 diese Woche' : '—',
      locked: !isPremium
    }
  ];

  return (
    <section className="py-16 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 
                className="mb-2"
                style={{ 
                  fontFamily: 'Fjalla One',
                  color: '#3A3A3A'
                }}
              >
                Verlags-Insights
              </h2>
              <p style={{ color: '#666666' }}>
                {isPremium 
                  ? 'Datenbasierte Einblicke für bessere Entscheidungen'
                  : 'Premium-Feature: Schalte erweiterte Analytics frei'
                }
              </p>
            </div>
            
            {isPremium && (
              <div 
                className="px-4 py-2 rounded-full"
                style={{ 
                  backgroundColor: '#ffe066',
                  color: '#3A3A3A',
                  fontFamily: 'Fjalla One'
                }}
              >
                Premium aktiv
              </div>
            )}
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div 
                key={index}
                className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-200"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                {/* Lock overlay for non-premium */}
                {insight.locked && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                    <Lock className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className={`p-3 rounded-lg ${
                      insight.locked ? 'bg-gray-200' : 'bg-[#247ba0]'
                    }`}
                  >
                    <Icon 
                      className={`w-6 h-6 ${
                        insight.locked ? 'text-gray-400' : 'text-white'
                      }`} 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="mb-1"
                      style={{ 
                        fontFamily: 'Fjalla One',
                        color: '#3A3A3A',
                        fontSize: '18px'
                      }}
                    >
                      {insight.title}
                    </h3>
                    <p className="text-sm mb-3" style={{ color: '#666666' }}>
                      {insight.description}
                    </p>
                    {!insight.locked && (
                      <div 
                        className="text-2xl"
                        style={{ 
                          fontFamily: 'Fjalla One',
                          color: '#247ba0'
                        }}
                      >
                        {insight.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium CTA */}
        {!isPremium && (
          <div className="bg-gradient-to-br from-[#247ba0] to-[#70c1b3] rounded-2xl p-8 md:p-12 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" />
              <h3 
                className="mb-3"
                style={{ 
                  fontFamily: 'Fjalla One',
                  fontSize: '28px'
                }}
              >
                Schalte Premium-Analytics frei
              </h3>
              <p className="mb-6 text-lg opacity-90">
                Erhalte detaillierte Einblicke in Leserinteressen, Markttrends und 
                die Performance deiner Titel. Nutze Daten für bessere Marketingentscheidungen.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Echtzeit-Analysen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Zielgruppen-Insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Trend-Prognosen</span>
                </div>
              </div>

              <Button
                onClick={onUpgrade}
                className="bg-white text-[#247ba0] hover:bg-gray-100 px-8 py-6 text-lg"
                style={{ 
                  borderRadius: '12px',
                  fontFamily: 'Fjalla One'
                }}
              >
                Auf Premium upgraden
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}