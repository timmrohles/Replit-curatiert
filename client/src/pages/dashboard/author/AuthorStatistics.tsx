import { BarChart3, Eye, BookOpen, Users } from 'lucide-react';

export function AuthorStatistics() {
  const stats = [
    { label: 'Profil-Besuche', value: '5,234', icon: Eye, change: '+18%' },
    { label: 'Buch-Klicks', value: '1,847', icon: BookOpen, change: '+12%' },
    { label: 'Neue Follower', value: '342', icon: Users, change: '+24%' },
    { label: 'Engagement', value: '7.8/10', icon: BarChart3, change: '+0.5' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Statistiken
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Verfolge deine Performance als Autor
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="rounded-lg p-6 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F59E0B20' }}>
                  <Icon className="w-6 h-6" style={{ color: '#F59E0B' }} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: '#6B7280' }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
