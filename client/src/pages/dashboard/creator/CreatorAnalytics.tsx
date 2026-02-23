import { useState, useEffect } from 'react';
import { TrendingUp, Eye, ShoppingCart, Euro, BarChart3, MousePointerClick, BookOpen, Clock, Loader2, Copy, CheckCircle, Link2, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../hooks/use-auth';

interface ClickStats {
  total_clicks: string;
  unique_books: string;
  unique_sessions: string;
  clicks_30d: string;
  clicks_7d: string;
}

interface OrderStats {
  total_orders: string;
  confirmed_orders: string;
  pending_orders: string;
  cancelled_orders: string;
  orders_30d: string;
}

interface EarningsStats {
  total_earnings: string;
  confirmed_earnings: string;
  pending_earnings: string;
  total_commission: string;
}

interface RecentClick {
  book_id: string;
  isbn13: string;
  merchant: string;
  click_timestamp: string;
  creator_slug: string;
}

interface StatsData {
  clicks: ClickStats;
  orders: OrderStats;
  earnings: EarningsStats;
  recentClicks: RecentClick[];
}

interface Commission {
  id: number;
  external_order_id: string | null;
  merchant: string;
  session_id: string;
  book_id: string;
  isbn: string | null;
  attribution_type: 'REFERRAL' | 'CURATION';
  commission_amount_net: string;
  share_rate: string;
  creator_payout_amount: string;
  occurred_at: string;
  status: string;
  created_at: string;
}

interface CommissionTotals {
  referral_confirmed: string;
  curation_confirmed: string;
  total_pending: string;
  confirmed_count: string;
  pending_count: string;
  cancelled_count: string;
  referral_count: string;
  curation_count: string;
}

interface CommissionData {
  commissions: Commission[];
  totals: CommissionTotals;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function CreatorAnalytics() {
  const { user: authUser } = useAuth();
  const userId = authUser?.id || 'demo-user-123';
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatorSlug, setCreatorSlug] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null);
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionLoading, setCommissionLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, profileRes] = await Promise.all([
          fetch(`/api/affiliate/creator-stats?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/bookstore/profile?userId=${encodeURIComponent(userId)}`)
        ]);
        const statsData = await statsRes.json();
        const profileData = await profileRes.json();

        if (statsData.ok) setStats(statsData.data);
        if (profileData.ok && profileData.data?.slug) setCreatorSlug(profileData.data.slug);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    async function loadCommissions() {
      setCommissionLoading(true);
      try {
        const res = await fetch(`/api/creator/commissions?userId=${encodeURIComponent(userId)}&page=${commissionPage}&limit=10`);
        const json = await res.json();
        if (json.ok) setCommissionData(json.data);
      } catch (err) {
        console.error('Failed to load commissions:', err);
      } finally {
        setCommissionLoading(false);
      }
    }
    loadCommissions();
  }, [userId, commissionPage]);

  const copyCreatorLink = (isbn?: string) => {
    const base = window.location.origin;
    const link = isbn
      ? `${base}/@${creatorSlug}/buch/${isbn}`
      : `${base}/${creatorSlug}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(isbn || 'profile');
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const copyReferralLink = () => {
    const base = window.location.origin;
    const link = `${base}/r/${creatorSlug}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink('referral');
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#247ba0' }} />
      </div>
    );
  }

  const clicks = stats?.clicks;
  const orders = stats?.orders;
  const earnings = stats?.earnings;
  const totals = commissionData?.totals;

  const kpis = [
    {
      label: 'Klicks gesamt',
      value: clicks?.total_clicks || '0',
      sub: `${clicks?.clicks_7d || '0'} letzte 7 Tage`,
      icon: MousePointerClick,
      color: '#247ba0',
    },
    {
      label: 'Unique Besucher',
      value: clicks?.unique_sessions || '0',
      sub: `${clicks?.unique_books || '0'} Buecher`,
      icon: Eye,
      color: '#059669',
    },
    {
      label: 'Bestellungen',
      value: orders?.total_orders || '0',
      sub: `${orders?.pending_orders || '0'} ausstehend`,
      icon: ShoppingCart,
      color: '#D97706',
    },
    {
      label: 'Einnahmen',
      value: `${parseFloat(earnings?.confirmed_earnings || '0').toFixed(2)} EUR`,
      sub: `${parseFloat(earnings?.pending_earnings || '0').toFixed(2)} EUR ausstehend`,
      icon: Euro,
      color: '#7C3AED',
    },
  ];

  const attributionKpis = [
    {
      label: 'Referral-Einnahmen',
      value: `${parseFloat(totals?.referral_confirmed || '0').toFixed(2)} EUR`,
      sub: `${totals?.referral_count || '0'} Referrals`,
      icon: Link2,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    {
      label: 'Kurations-Einnahmen',
      value: `${parseFloat(totals?.curation_confirmed || '0').toFixed(2)} EUR`,
      sub: `${totals?.curation_count || '0'} Kurationen`,
      icon: Award,
      color: '#059669',
      bg: '#F0FDF4',
    },
    {
      label: 'Ausstehend',
      value: `${parseFloat(totals?.total_pending || '0').toFixed(2)} EUR`,
      sub: `${totals?.pending_count || '0'} Provisionen`,
      icon: Clock,
      color: '#D97706',
      bg: '#FFFBEB',
    },
  ];

  const statusLabel = (s: string) => {
    if (s === 'confirmed') return 'Bestaetigt';
    if (s === 'cancelled') return 'Storniert';
    return 'Ausstehend';
  };
  const statusColor = (s: string) => {
    if (s === 'confirmed') return { bg: '#F0FDF4', color: '#166534' };
    if (s === 'cancelled') return { bg: '#FEF2F2', color: '#991B1B' };
    return { bg: '#FFFBEB', color: '#92400E' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }} data-testid="text-analytics-title">
          Affiliate Analytics
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Verfolge deine Klicks, Verkaeufe und Einnahmen
        </p>
      </div>

      {creatorSlug && (
        <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(36, 123, 160, 0.05)', borderColor: '#247ba040' }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Dein Creator-Link</p>
              <p className="text-xs font-mono" style={{ color: '#6B7280' }} data-testid="text-creator-link">
                {window.location.origin}/@{creatorSlug}/buch/[ISBN]
              </p>
            </div>
            <button
              onClick={() => copyCreatorLink()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{ borderColor: '#247ba0', color: '#247ba0' }}
              data-testid="button-copy-creator-link"
            >
              {copiedLink === 'profile' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Profil-Link kopieren
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {creatorSlug && (
        <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(37, 99, 235, 0.05)', borderColor: '#2563EB40' }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#3A3A3A' }} data-testid="text-referral-section-title">Dein Referral-Link</p>
              <p className="text-xs font-mono" style={{ color: '#6B7280' }} data-testid="text-referral-link">
                {window.location.origin}/r/{creatorSlug}
              </p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                Nutzer, die ueber diesen Link kommen, werden dir 7 Tage lang zugeordnet. Du erhaeltst Provision auf alle Kaeufe in diesem Zeitraum.
              </p>
            </div>
            <button
              onClick={copyReferralLink}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{ borderColor: '#2563EB', color: '#2563EB' }}
              data-testid="button-copy-referral-link"
            >
              {copiedLink === 'referral' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Referral-Link kopieren
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="rounded-lg p-5 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }} data-testid={`card-kpi-${index}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="text-2xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                {kpi.value}
              </div>
              <div className="text-sm" style={{ color: '#3A3A3A' }}>
                {kpi.label}
              </div>
              <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg mb-3" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }} data-testid="text-attribution-title">
          Attribution-Uebersicht
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {attributionKpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={index} className="rounded-lg p-5 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }} data-testid={`card-attribution-kpi-${index}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.bg }}>
                    <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                  </div>
                </div>
                <div className="text-2xl mb-1" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {kpi.value}
                </div>
                <div className="text-sm" style={{ color: '#3A3A3A' }}>
                  {kpi.label}
                </div>
                <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  {kpi.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg shadow-sm border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-semibold" style={{ color: '#3A3A3A' }} data-testid="text-commission-history-title">Provisions-Historie</h2>
        </div>
        {commissionLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#247ba0' }} />
          </div>
        ) : commissionData?.commissions && commissionData.commissions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th className="text-left px-5 py-3 font-medium" style={{ color: '#6B7280' }}>Datum</th>
                    <th className="text-left px-5 py-3 font-medium" style={{ color: '#6B7280' }}>Buch</th>
                    <th className="text-left px-5 py-3 font-medium" style={{ color: '#6B7280' }}>Typ</th>
                    <th className="text-right px-5 py-3 font-medium" style={{ color: '#6B7280' }}>Provision</th>
                    <th className="text-right px-5 py-3 font-medium" style={{ color: '#6B7280' }}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#F3F4F6' }}>
                  {commissionData.commissions.map((c) => {
                    const sc = statusColor(c.status);
                    return (
                      <tr key={c.id} data-testid={`row-commission-${c.id}`}>
                        <td className="px-5 py-3" style={{ color: '#3A3A3A' }}>
                          {c.occurred_at ? new Date(c.occurred_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-5 py-3" style={{ color: '#3A3A3A' }}>
                          {c.isbn || c.book_id || '-'}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: c.attribution_type === 'REFERRAL' ? '#EFF6FF' : '#F0FDF4',
                              color: c.attribution_type === 'REFERRAL' ? '#1D4ED8' : '#166534'
                            }}
                            data-testid={`badge-type-${c.id}`}
                          >
                            {c.attribution_type === 'REFERRAL' ? 'Referral' : 'Kuration'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right" style={{ color: '#3A3A3A' }}>
                          {parseFloat(c.creator_payout_amount || '0').toFixed(2)} EUR
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: sc.bg, color: sc.color }}
                            data-testid={`badge-status-${c.id}`}
                          >
                            {statusLabel(c.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {commissionData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>
                  Seite {commissionData.pagination.page} von {commissionData.pagination.totalPages} ({commissionData.pagination.total} Eintraege)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCommissionPage(p => Math.max(1, p - 1))}
                    disabled={commissionPage <= 1}
                    className="p-1.5 rounded-lg border disabled:opacity-40"
                    style={{ borderColor: '#E5E7EB' }}
                    data-testid="button-commission-prev"
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: '#6B7280' }} />
                  </button>
                  <button
                    onClick={() => setCommissionPage(p => Math.min(commissionData.pagination.totalPages, p + 1))}
                    disabled={commissionPage >= commissionData.pagination.totalPages}
                    className="p-1.5 rounded-lg border disabled:opacity-40"
                    style={{ borderColor: '#E5E7EB' }}
                    data-testid="button-commission-next"
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: '#6B7280' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-5 py-8 text-center">
            <Euro className="w-10 h-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Noch keine Provisionen erfasst</p>
            <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>
              Provisionen erscheinen hier, sobald Verkaeufe zugeordnet werden
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg shadow-sm border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-base font-semibold" style={{ color: '#3A3A3A' }}>Letzte Klicks</h2>
          </div>
          <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
            {stats?.recentClicks && stats.recentClicks.length > 0 ? (
              stats.recentClicks.slice(0, 8).map((click, idx) => (
                <div key={idx} className="flex items-center justify-between px-5 py-3" data-testid={`row-click-${idx}`}>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3A3A3A' }}>
                        ISBN: {click.isbn13 || click.book_id}
                      </p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        {click.merchant ? `via ${click.merchant}` : 'Seitenaufruf'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      {new Date(click.click_timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {creatorSlug && click.isbn13 && (
                      <button
                        onClick={() => copyCreatorLink(click.isbn13)}
                        className="p-1 rounded"
                        title="Link kopieren"
                        data-testid={`button-copy-click-${idx}`}
                      >
                        {copiedLink === click.isbn13 ? (
                          <CheckCircle className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                        ) : (
                          <Copy className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <MousePointerClick className="w-10 h-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Noch keine Klicks erfasst</p>
                <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>
                  Teile deinen Creator-Link, um Klicks zu erhalten
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg shadow-sm border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-base font-semibold" style={{ color: '#3A3A3A' }}>Bestell-Uebersicht</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Bestaetigte Bestellungen', value: orders?.confirmed_orders || '0', color: '#059669', bg: '#F0FDF4' },
              { label: 'Ausstehende Bestellungen', value: orders?.pending_orders || '0', color: '#D97706', bg: '#FFFBEB' },
              { label: 'Stornierte Bestellungen', value: orders?.cancelled_orders || '0', color: '#DC2626', bg: '#FEF2F2' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ backgroundColor: item.bg }} data-testid={`stat-order-${idx}`}>
                <span className="text-sm" style={{ color: '#3A3A3A' }}>{item.label}</span>
                <span className="text-lg font-bold" style={{ fontFamily: 'Fjalla One', color: item.color }}>{item.value}</span>
              </div>
            ))}

            <div className="border-t pt-4 mt-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>Gesamteinnahmen (bestaetigt)</span>
                <span className="text-xl font-bold" style={{ fontFamily: 'Fjalla One', color: '#059669' }} data-testid="text-total-earnings">
                  {parseFloat(earnings?.confirmed_earnings || '0').toFixed(2)} EUR
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Ausstehende Einnahmen</span>
                <span className="text-sm" style={{ color: '#D97706' }}>
                  {parseFloat(earnings?.pending_earnings || '0').toFixed(2)} EUR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-6 border text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <BarChart3 className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
        <h2 className="text-lg mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Detaillierte Charts kommen bald
        </h2>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Zeitreihen, Conversion-Raten und Vergleiche werden hier angezeigt.
        </p>
      </div>
    </div>
  );
}
