import { TrendingUp, Eye, ShoppingCart, Euro, BarChart3 } from 'lucide-react';

export function CreatorAnalytics() {
  const kpis = [
    { label: 'Storefront Views', value: '2,834', icon: Eye, change: '+12%', trend: 'up' },
    { label: 'Buchverkäufe', value: '47', icon: ShoppingCart, change: '+8%', trend: 'up' },
    { label: 'Einnahmen', value: '€142,50', icon: Euro, change: '+15%', trend: 'up' },
    { label: 'Engagement', value: '8.4/10', icon: TrendingUp, change: '+0.3', trend: 'up' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Analytics
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Verfolge deine Performance und Einnahmen
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="rounded-lg p-6 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#247ba020' }}>
                  <Icon className="w-6 h-6" style={{ color: '#247ba0' }} />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${kpi.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {kpi.change}
                </span>
              </div>
              <div className="text-2xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {kpi.value}
              </div>
              <div className="text-sm" style={{ color: '#6B7280' }}>
                {kpi.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg p-8 text-center border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <BarChart3 className="w-16 h-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
        <h2 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Detaillierte Analytics kommen bald
        </h2>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Hier werden bald Charts und Statistiken verfügbar sein.
        </p>
      </div>
    </div>
  );
}
