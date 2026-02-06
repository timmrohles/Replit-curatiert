import { Megaphone, Calendar, CheckCircle } from 'lucide-react';

export function CreatorCampaigns() {
  const campaigns = [
    {
      id: '1',
      title: 'Suhrkamp Frühjahr 2026',
      publisher: 'Suhrkamp Verlag',
      status: 'active',
      deadline: '28.02.2026',
      reward: '€150',
      participants: 24
    },
    {
      id: '2',
      title: 'Hanser Literaturpreis',
      publisher: 'Hanser Verlag',
      status: 'pending',
      deadline: '15.03.2026',
      reward: '€200',
      participants: 18
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Werbekampagnen
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Nimm an Verlagskampagnen teil und verdiene Geld
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="rounded-lg p-6 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                    {campaign.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${campaign.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {campaign.status === 'active' ? 'Aktiv' : 'Ausstehend'}
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
                  {campaign.publisher}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#6B7280' }}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Deadline: {campaign.deadline}
                  </div>
                  <div>Belohnung: {campaign.reward}</div>
                  <div>{campaign.participants} Teilnehmer</div>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}>
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
