import { Calendar, Sparkles } from 'lucide-react';

export function CreatorTopics() {
  const topics = [
    {
      id: '1',
      title: 'Queer Books Month',
      description: 'Kuratiere eine Liste mit den besten LGBTQ+ Büchern für den Pride Month',
      deadline: '2025-06-15',
      status: 'open'
    },
    {
      id: '2',
      title: 'Politische Sachbücher zur EU-Wahl',
      description: 'Empfehlungen zu europäischer Politik, Demokratie und aktuellen Herausforderungen',
      deadline: '2025-05-20',
      status: 'open'
    },
    {
      id: '3',
      title: 'Neue feministische Literatur 2025',
      description: 'Die wichtigsten feministischen Neuerscheinungen des Jahres',
      deadline: '2025-03-31',
      status: 'featured'
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Themenaufrufe & Redaktionsbriefing
        </h1>
        <p className="text-xs md:text-sm" style={{ color: '#6B7280' }}>
          Nimm an kuratierten Themenaktionen teil und verdiene Bonuszahlungen
        </p>
      </div>

      {/* Featured Topic */}
      <div 
        className="rounded-lg p-6 md:p-8"
        style={{ 
          background: 'linear-gradient(135deg, #247ba0 0%, #1a6b8a 100%)',
          color: '#ffffff'
        }}
      >
        <div className="flex items-start gap-4 mb-4">
          <div 
            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1">
            <span className="text-xs md:text-sm font-medium opacity-90">THEMA DER WOCHE</span>
            <h3 className="text-xl md:text-2xl mt-1" style={{ fontFamily: 'Fjalla One' }}>
              Neue feministische Literatur 2025
            </h3>
          </div>
        </div>
        <p className="text-sm md:text-base mb-6" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Die wichtigsten feministischen Neuerscheinungen des Jahres - kuratiere deine Favoriten und teile sie mit der Community
        </p>
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs md:text-sm">Bis 31. März 2025</span>
          </div>
        </div>
        <button
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg text-sm md:text-base touch-manipulation"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#247ba0'
          }}
        >
          Jetzt teilnehmen
        </button>
      </div>

      {/* Open Topics */}
      <div>
        <h3 className="text-lg md:text-xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Offene Themenaufrufe
        </h3>
        <div className="space-y-4">
          {topics.filter(t => t.status === 'open').map((topic) => (
            <div 
              key={topic.id}
              className="rounded-lg p-4 md:p-6 border transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB'
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-base md:text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    {topic.title}
                  </h4>
                  <p className="text-xs md:text-sm mb-4" style={{ color: '#6B7280' }}>
                    {topic.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs md:text-sm" style={{ color: '#6B7280' }}>
                    <Calendar className="w-4 h-4" />
                    Bis {new Date(topic.deadline).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md text-sm touch-manipulation"
                  style={{
                    backgroundColor: '#247ba0',
                    color: '#FFFFFF'
                  }}
                >
                  Teilnehmen
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div 
        className="rounded-lg p-4 md:p-6 border"
        style={{ 
          backgroundColor: '#EFF6FF',
          borderColor: '#BFDBFE'
        }}
      >
        <h4 className="font-medium mb-2" style={{ color: '#1E3A8A' }}>
          💡 Wie funktionieren Themenaufrufe?
        </h4>
        <p className="text-xs md:text-sm" style={{ color: '#1E40AF' }}>
          Das coratiert-Team gibt regelmäßig Themen vor, zu denen Kurator:innen Listen erstellen oder Rezensionen schreiben können. 
          Nimm an diesen kuratierten Aktionen teil und profitiere von zusätzlicher Sichtbarkeit auf der Plattform.
        </p>
      </div>
    </div>
  );
}
