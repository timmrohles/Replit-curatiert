import { TrendingUp, Eye, ShoppingCart, Euro, Heart, Plus, FileText, List, MessageSquare, BookOpen, Award } from 'lucide-react';

export function DashboardHome() {
  // Mock data
  const userName = 'Anna Müller';
  const userAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna';
  const progress = 75;
  const roles = ['Leser:in'];
  
  const kpis = [
    { label: 'Gelesene Bücher', value: '42', icon: BookOpen, change: '+5 diesen Monat', trend: 'up' },
    { label: 'Bewertungen', value: '38', icon: Award, change: '+3 diese Woche', trend: 'up' },
    { label: 'Rezensionen', value: '12', icon: MessageSquare, change: '+2 diese Woche', trend: 'up' },
    { label: 'Lieblingsautoren', value: '8', icon: Heart, change: '+1 neu', trend: 'up' },
  ];

  const recentBooks = [
    { title: 'Die Jahre', author: 'Annie Ernaux', rating: 5, dateRead: '15.01.2026' },
    { title: 'Kleine Feuer überall', author: 'Celeste Ng', rating: 4, dateRead: '08.01.2026' },
    { title: 'Dune', author: 'Frank Herbert', rating: 5, dateRead: '02.01.2026' },
  ];

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <section className="rounded-lg p-6 md:p-8 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          <img 
            src={userAvatar} 
            alt={userName}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
          />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
              Willkommen zurück, {userName}!
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {roles.map((role, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-sm text-white"
                  style={{ backgroundColor: '#247ba0' }}
                >
                  {role}
                </span>
              ))}
            </div>
            
            {/* Fortschrittsbalken */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#6B7280' }}>
                  Dein Profil ist zu {progress}% vollständig
                </span>
                <span className="text-sm font-medium" style={{ color: '#247ba0' }}>
                  {progress}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                <div 
                  className="h-full transition-all duration-500"
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

      {/* KPIs */}
      <section>
        <h2 className="text-xl md:text-2xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Deine Aktivität
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div 
                key={index}
                className="rounded-lg p-4 md:p-6 shadow-sm border hover:shadow-md transition-shadow"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#247ba020' }}>
                    <Icon className="w-6 h-6" style={{ color: '#247ba0' }} />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
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
      </section>

      {/* Zuletzt gelesene Bücher */}
      <section className="rounded-lg p-6 md:p-8 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <h2 className="text-xl md:text-2xl mb-6" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Zuletzt gelesen
        </h2>
        <div className="space-y-4">
          {recentBooks.map((book, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 rounded-lg hover:shadow-sm transition-shadow"
              style={{ backgroundColor: '#F9FAFB' }}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style={{ 
                  background: 'linear-gradient(135deg, #D6A847, #0B1F33)' 
                }}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1" style={{ color: '#3A3A3A' }}>
                    {book.title}
                  </div>
                  <div className="text-sm" style={{ color: '#6B7280' }}>
                    {book.author}
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: i < book.rating ? '#F59E0B' : '#E5E7EB' }}>★</span>
                  ))}
                </div>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  {book.dateRead}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Empfohlene Aktionen */}
      <section className="rounded-lg p-6 md:p-8 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <h2 className="text-xl md:text-2xl mb-6" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Empfohlene Aktionen
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-all cursor-pointer group" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5" style={{ color: '#6B7280' }} />
              <span style={{ color: '#3A3A3A' }}>Bewerte ein neues Buch</span>
            </div>
            <button className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ backgroundColor: '#F3F4F6', color: '#247ba0' }}>
              Los geht's
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-all cursor-pointer group" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" style={{ color: '#6B7280' }} />
              <span style={{ color: '#3A3A3A' }}>Schreibe eine Rezension</span>
            </div>
            <button className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ backgroundColor: '#F3F4F6', color: '#247ba0' }}>
              Los geht's
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-all cursor-pointer group" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5" style={{ color: '#6B7280' }} />
              <span style={{ color: '#3A3A3A' }}>Folge einem Autor</span>
            </div>
            <button className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ backgroundColor: '#F3F4F6', color: '#247ba0' }}>
              Los geht's
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
