import { Mail, Plus, Send } from 'lucide-react';

export function AuthorNewsletter() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
            Newsletter
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Halte deine Leser auf dem Laufenden
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#F59E0B', color: '#92400e' }}>
          <Plus className="w-4 h-4 inline mr-2" />
          Neuer Newsletter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg p-4 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-sm mb-1" style={{ color: '#6B7280' }}>Abonnenten</div>
          <div className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>1,234</div>
        </div>
        <div className="rounded-lg p-4 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-sm mb-1" style={{ color: '#6B7280' }}>Öffnungsrate</div>
          <div className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>42%</div>
        </div>
        <div className="rounded-lg p-4 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="text-sm mb-1" style={{ color: '#6B7280' }}>Versendet</div>
          <div className="text-2xl" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>8</div>
        </div>
      </div>
    </div>
  );
}
