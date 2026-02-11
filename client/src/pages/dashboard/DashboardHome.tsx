import { MessageSquare, Heart, Store, User, Star } from 'lucide-react';

export function DashboardHome() {
  const userName = 'Max Mustermann';
  const roles = ['Leser:in'];
  const progress = 35;

  const userKpis = [
    { label: 'Bewertungen', value: '0', icon: Star, subtitle: 'Noch keine Bewertungen' },
    { label: 'Rezensionen', value: '0', icon: MessageSquare, subtitle: 'Noch keine Rezensionen' },
    { label: 'Favoriten', value: '0', icon: Heart, subtitle: 'Noch keine Favoriten' },
    { label: 'Storefront', value: '--', icon: Store, subtitle: 'Noch nicht eingerichtet' },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg p-5 md:p-8 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="flex items-start gap-4 md:gap-6">
          <div 
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
          >
            <User className="w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }} data-testid="text-username">
              Willkommen, {userName}!
            </h1>
            <div className="flex flex-wrap gap-2 mb-3">
              {roles.map((role, index) => (
                <span 
                  key={index}
                  className="px-2.5 py-0.5 rounded-full text-xs text-white"
                  style={{ backgroundColor: '#247ba0' }}
                  data-testid={`badge-role-${index}`}
                >
                  {role}
                </span>
              ))}
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs sm:text-sm" style={{ color: '#6B7280' }}>
                  Profil {progress}% vollständig
                </span>
                <span className="text-xs sm:text-sm font-medium" style={{ color: '#247ba0' }}>
                  {progress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                <div 
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, #247ba0, #70c1b3)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg md:text-xl mb-3" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Deine Aktivität
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {userKpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div 
                key={index}
                className="rounded-lg p-4 md:p-5 border"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                data-testid={`kpi-card-${index}`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#247ba020' }}>
                  <Icon className="w-5 h-5" style={{ color: '#247ba0' }} />
                </div>
                <div className="text-xl md:text-2xl mb-0.5" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {kpi.value}
                </div>
                <div className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
                  {kpi.label}
                </div>
                <div className="text-[10px] md:text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  {kpi.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg p-5 md:p-8 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <h2 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Erste Schritte
        </h2>
        <div className="space-y-2">
          {[
            { icon: User, label: 'Vervollständige dein Profil', section: 'profile' },
            { icon: Star, label: 'Bewerte dein erstes Buch', section: 'ratings' },
            { icon: Store, label: 'Richte deinen Storefront ein', section: 'creator-storefront' },
            { icon: Heart, label: 'Folge Autor:innen und Verlagen', section: 'follows' },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 md:p-4 rounded-lg border transition-colors cursor-pointer"
                style={{ borderColor: '#F3F4F6' }}
                data-testid={`action-${action.section}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <span className="text-sm truncate" style={{ color: '#3A3A3A' }}>{action.label}</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md flex-shrink-0" style={{ backgroundColor: '#F3F4F6', color: '#247ba0' }}>
                  Los
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
