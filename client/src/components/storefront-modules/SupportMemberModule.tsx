import { Heart, Star, Zap, Gift, Check } from 'lucide-react';
import { Button } from '../ui/button';

interface SupportMemberModuleProps {
  authorName: string;
  backgroundColor?: string;
  onBecomeMember?: () => void;
  onOneTimeSupport?: () => void;
}

export function SupportMemberModule({ 
  authorName,
  backgroundColor = '#F5F5F5',
  onBecomeMember,
  onOneTimeSupport
}: SupportMemberModuleProps) {
  
  const benefits = [
    {
      icon: Star,
      text: 'Zugang zu exklusiven Bonusinhalten'
    },
    {
      icon: Zap,
      text: 'Teilnahme an Q&A Sessions'
    },
    {
      icon: Gift,
      text: 'Early Access zu neuen Kapiteln'
    },
    {
      icon: Heart,
      text: 'Community-Zugang & Diskussionen'
    }
  ];

  return (
    <section 
      className="py-16 px-4 md:px-8"
      style={{ backgroundColor }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#247ba0] to-[#70c1b3] rounded-2xl p-8 md:p-12 text-white">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-white/20 rounded-full mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h2 
              className="mb-3"
              style={{ 
                fontFamily: 'Fjalla One',
                fontSize: '32px'
              }}
            >
              Unterstütze {authorName}
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Deine Unterstützung ermöglicht es mir, weiterhin Geschichten zu schreiben 
              und exklusive Inhalte mit dir zu teilen
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index}
                  className="flex items-start gap-3 bg-white/10 rounded-lg p-4 backdrop-blur-sm"
                >
                  <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{benefit.text}</span>
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={onBecomeMember}
              className="bg-white text-[#247ba0] hover:bg-gray-100 px-8 py-6 text-lg"
              style={{ 
                borderRadius: '12px',
                fontFamily: 'Fjalla One'
              }}
            >
              <Star className="w-5 h-5 mr-2" />
              Mitglied werden
            </Button>
            <Button
              onClick={onOneTimeSupport}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
              style={{ 
                borderRadius: '12px',
                fontFamily: 'Fjalla One'
              }}
            >
              <Heart className="w-5 h-5 mr-2" />
              Einmalig unterstützen
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm opacity-75">
            <p>Alle Mitgliedschaften können jederzeit gekündigt werden</p>
          </div>
        </div>
      </div>
    </section>
  );
}
