import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Banknote, TrendingUp, Users, MousePointerClick, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardPageHeader } from '../../../components/dashboard/DashboardPageHeader';
import { useAuth } from '../../../hooks/use-auth';

export function EarningsOverview() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language || 'de-de';
  const { user: authUser } = useAuth();
  const userId = authUser?.id || 'demo-user-123';

  const [stats, setStats] = useState<{ totalEarnings: number; totalClicks: number; totalReferrals: number; conversionRate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [explanationOpen, setExplanationOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/creator-analytics?userId=${encodeURIComponent(userId)}`);
        const json = await res.json();
        if (json.ok && json.data) {
          setStats({
            totalEarnings: json.data.totalEarnings || 0,
            totalClicks: json.data.totalClicks || 0,
            totalReferrals: json.data.totalReferrals || 0,
            conversionRate: json.data.conversionRate || 0,
          });
        }
      } catch {}
      setLoading(false);
    })();
  }, [userId]);

  const kpiCards = [
    {
      label: t('dashboardOverview.totalEarnings', 'Einnahmen gesamt'),
      value: stats ? `${stats.totalEarnings.toFixed(2)} EUR` : '—',
      icon: Banknote,
      color: '#059669',
    },
    {
      label: t('dashboardOverview.totalClicks', 'Klicks gesamt'),
      value: stats ? stats.totalClicks.toLocaleString('de-DE') : '—',
      icon: MousePointerClick,
      color: '#247ba0',
    },
    {
      label: t('dashboardOverview.totalReferrals', 'Referrals'),
      value: stats ? stats.totalReferrals.toLocaleString('de-DE') : '—',
      icon: Users,
      color: '#7C3AED',
    },
    {
      label: t('dashboardOverview.conversionRate', 'Conversion'),
      value: stats ? `${stats.conversionRate.toFixed(1)}%` : '—',
      icon: TrendingUp,
      color: '#EA580C',
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t('dashboardNav.earningsOverview', 'Einnahmen')}
        description={t('dashboardNav.earningsDescription', 'Verfolge deine Einnahmen und verwalte dein Affiliate-Programm')}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border p-4"
              style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
              data-testid={`kpi-${card.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: card.color }} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-xl font-semibold" style={{ color: '#3A3A3A', fontFamily: 'Fjalla One' }}>
                {loading ? (
                  <span className="inline-block w-16 h-6 rounded animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
                ) : (
                  card.value
                )}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => navigate(`/${locale}/dashboard/einnahmen/affiliate`)}
          className="flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:border-[#247ba0]/40"
          style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
          data-testid="link-affiliate-program"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(36, 123, 160, 0.1)' }}>
            <Banknote className="w-5 h-5" style={{ color: '#247ba0' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>
              {t('dashboardNav.affiliate', 'Affiliate-Programm')}
            </p>
            <p className="text-xs text-muted-foreground">
              Registrierung, Identitaet & Auszahlung verwalten
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate(`/${locale}/dashboard/einnahmen/statistiken`)}
          className="flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:border-[#247ba0]/40"
          style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
          data-testid="link-earnings-statistics"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)' }}>
            <TrendingUp className="w-5 h-5" style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>
              {t('dashboardNav.statistics', 'Statistiken')}
            </p>
            <p className="text-xs text-muted-foreground">
              Klicks, Attribution & Umsatz im Detail
            </p>
          </div>
        </button>
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        <button
          onClick={() => setExplanationOpen(!explanationOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
          style={{ backgroundColor: explanationOpen ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
          data-testid="toggle-affiliate-explanation"
        >
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4" style={{ color: '#247ba0' }} />
            <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>So funktioniert deine Verguetung</span>
          </div>
          {explanationOpen ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
        </button>
        {explanationOpen && (
          <div className="px-4 pb-5 space-y-5 border-t" style={{ borderColor: '#E5E7EB' }}>
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>Grundprinzip</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                Als Kurator erhaeltst du eine Beteiligung an der Affiliate-Provision, die wir von Buchhaendlern erhalten - sofern ein Kauf eindeutig auf dich zurueckzufuehren ist. Die Verguetung basiert nicht auf dem Warenkorbwert, sondern auf der tatsaechlich von uns erhaltenen Provision des jeweiligen Haendlers.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>Wann du verguetet wirst</h3>
              <div className="space-y-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: '#EFF6FF' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#1D4ED8' }}>1. Referral - Du bringst neue Nutzer auf die Plattform</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#3B82F6' }}>
                    Wenn ein Nutzer ueber deinen persoenlichen Link erstmals auf unsere Plattform gelangt und innerhalb des jeweiligen Attributionszeitraums ein Buch ueber einen unserer Haendler kauft, erhaeltst du einen Anteil unserer Provision. Es spielt keine Rolle, welches Buch gekauft wird. Entscheidend ist, dass der Erstkontakt ueber deinen Link erfolgte. Deine Attribution hat Vorrang vor allen anderen.
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F0FDF4' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#166534' }}>2. Kuration - Ein Nutzer kauft ueber deine Kuration</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#15803D' }}>
                    Wenn ein Nutzer nicht ueber einen Kuratoren-Link auf die Plattform gekommen ist, sondern ein Buch direkt ueber deine Kuration entdeckt und gekauft hat, erhaeltst du ebenfalls eine Beteiligung. Das gilt nur dann, wenn kein anderer Kurator den Nutzer zuvor ueber einen persoenlichen Link auf die Plattform gebracht hat.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>Prioritaetsregel</h3>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>
                  Wenn ein Nutzer ueber den persoenlichen Link eines Kurators auf die Plattform gelangt ist, erhaelt ausschliesslich dieser Kurator die Verguetung - auch dann, wenn das gekaufte Buch aus einer Kuration eines anderen Kurators stammt. Eine doppelte Verguetung fuer denselben Kauf ist ausgeschlossen.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>Wann keine Verguetung erfolgt</h3>
              <ul className="space-y-1.5">
                {[
                  'Der Kauf ausserhalb des Attributionszeitraums erfolgt',
                  'Der Haendler keine Provision auszahlt',
                  'Der Kauf storniert oder rueckabgewickelt wird',
                  'Kein nachvollziehbarer Bezug zu deinem Link oder deiner Kuration besteht',
                  'Technische Tracking-Daten fehlen oder unvollstaendig sind',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: '#6B7280' }}>
                    <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#DC2626' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>Cookie-Laufzeiten</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                Die Attributionsdauer richtet sich nach den jeweiligen Affiliate-Bedingungen des Buchhaendlers. Jeder Haendler definiert eine eigene Cookie-Laufzeit (z.B. 24 Stunden, 7 Tage, 30 Tage). Diese Laufzeit bestimmt, wie lange ein Kauf einem vorherigen Klick zugeordnet werden kann. Wir uebernehmen diese Laufzeiten technisch und organisatorisch. Eine Verguetung kann nur erfolgen, wenn der Haendler den Kauf innerhalb seiner eigenen Attributionslogik anerkennt. Wir koennen keine laengere Laufzeit garantieren als die, die der jeweilige Haendler vorsieht.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>Berechnungsgrundlage</h3>
              <p className="text-xs leading-relaxed mb-2" style={{ color: '#6B7280' }}>
                Deine Verguetung berechnet sich ausschliesslich aus der tatsaechlich an uns ausgezahlten Netto-Provision des Haendlers.
              </p>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#3A3A3A' }}>Beispiel:</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs" style={{ color: '#6B7280' }}>
                    <span>Haendler zahlt Provision</span>
                    <span className="font-medium" style={{ color: '#3A3A3A' }}>8,00 EUR</span>
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: '#6B7280' }}>
                    <span>Vereinbarter Revenue Share</span>
                    <span className="font-medium" style={{ color: '#3A3A3A' }}>50 %</span>
                  </div>
                  <div className="border-t pt-1 mt-1 flex items-center justify-between text-xs" style={{ borderColor: '#E5E7EB' }}>
                    <span className="font-medium" style={{ color: '#059669' }}>Dein Anteil</span>
                    <span className="font-semibold" style={{ color: '#059669' }}>4,00 EUR</span>
                  </div>
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                Stornos oder Rueckgaben fuehren zu einer entsprechenden Anpassung.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#3A3A3A' }}>Zusammenfassung</h3>
              <div className="space-y-2">
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F0FDF4' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#166534' }}>Du wirst verguetet, wenn:</p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-2 text-xs" style={{ color: '#15803D' }}>
                      <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#059669' }} />
                      Du neue Nutzer bringst, die innerhalb der Haendler-Attributionsfrist kaufen
                    </li>
                    <li className="flex items-start gap-2 text-xs" style={{ color: '#15803D' }}>
                      <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#059669' }} />
                      Oder (wenn kein Referral vorliegt) ein Buch aus deiner Kuration gekauft wird
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: '#FEF2F2' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#991B1B' }}>Nicht verguetet wird, wenn:</p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-2 text-xs" style={{ color: '#B91C1C' }}>
                      <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#DC2626' }} />
                      Der Haendler keine Provision zahlt
                    </li>
                    <li className="flex items-start gap-2 text-xs" style={{ color: '#B91C1C' }}>
                      <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#DC2626' }} />
                      Der Kauf ausserhalb der Cookie-Laufzeit liegt
                    </li>
                    <li className="flex items-start gap-2 text-xs" style={{ color: '#B91C1C' }}>
                      <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#DC2626' }} />
                      Der Kauf storniert wird
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
