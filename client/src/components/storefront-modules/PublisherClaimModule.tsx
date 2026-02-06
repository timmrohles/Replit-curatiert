import { CheckCircle, Shield, TrendingUp, Users } from 'lucide-react';
import { Button } from '../ui/button';

interface PublisherClaimModuleProps {
  backgroundColor?: string;
  onClaim?: () => void;
}

export function PublisherClaimModule({ 
  backgroundColor,
  onClaim
}: PublisherClaimModuleProps) {
  
  const benefits = [
    {
      icon: Shield,
      title: 'Profil verwalten',
      description: 'Daten aktualisieren und Inhalte pflegen'
    },
    {
      icon: TrendingUp,
      title: 'Marketing-Tools',
      description: 'Titel bewerben und Kampagnen starten'
    },
    {
      icon: Users,
      title: 'Analytics',
      description: 'Leserinteressen und Trends analysieren'
    }
  ];

  return (
    <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-[#ffe066]/20 to-[#f25f5c]/20">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl p-8 md:p-12 border-2 border-dashed border-[#f25f5c]" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-[#f25f5c]/10 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-[#f25f5c]" />
            </div>
            <h2 
              className="mb-3"
              style={{ 
                fontFamily: 'Fjalla One',
                color: '#3A3A3A'
              }}
            >
              Sind Sie Verlag oder Herausgeber?
            </h2>
            <p style={{ color: '#666666', fontSize: '18px' }}>
              Beanspruchen Sie Ihr Verlagsprofil und nutzen Sie alle Vorteile von coratiert.de
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index}
                  className="text-center"
                >
                  <div className="inline-block p-4 bg-[#247ba0]/10 rounded-xl mb-3">
                    <Icon className="w-8 h-8 text-[#247ba0]" />
                  </div>
                  <h3 
                    className="mb-2"
                    style={{ 
                      fontFamily: 'Fjalla One',
                      color: '#3A3A3A',
                      fontSize: '18px'
                    }}
                  >
                    {benefit.title}
                  </h3>
                  <p className="text-sm" style={{ color: '#666666' }}>
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={onClaim}
              style={{
                backgroundColor: '#f25f5c',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '14px 40px',
                fontSize: '18px',
                fontFamily: 'Fjalla One'
              }}
              className="hover:opacity-90 transition-opacity"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Profil beanspruchen
            </Button>
            <p className="mt-4 text-sm" style={{ color: '#999999' }}>
              Kostenlos und in wenigen Minuten eingerichtet
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}