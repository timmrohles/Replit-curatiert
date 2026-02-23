import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Save, Banknote, Shield, CreditCard, FileText, BarChart3, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardPageHeader } from '../../../components/dashboard/DashboardPageHeader';
import { useAuth } from '../../../hooks/use-auth';

export function EarningsAffiliate() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const userId = authUser?.id || 'demo-user-123';

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [affiliate, setAffiliate] = useState({
    firstName: '', lastName: '', artistName: '', birthDate: '',
    nationality: '', street: '', city: '', postalCode: '', country: 'DE',
    email: '', phone: '',
    taxStatus: '' as '' | 'kleinunternehmer' | 'umsatzsteuerpflichtig',
    taxNumber: '', taxId: '', vatId: '', taxCountry: 'DE', taxSelfResponsible: false,
    accountHolder: '', iban: '', bic: '', payoutCountry: 'DE', currency: 'EUR', minPayoutAccepted: false,
    acceptCreatorContract: false, acceptRevenueShare: false,
    acceptAdDisclosure: false, acceptNoThirdPartyRights: false,
    acceptTracking: false,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      (async () => {
        try {
          const res = await fetch(`/api/affiliate-creator-profile?userId=${encodeURIComponent(userId)}`);
          const json = await res.json();
          if (json.ok && json.data) {
            const d = json.data;
            setAffiliate({
              firstName: d.first_name || '', lastName: d.last_name || '',
              artistName: d.artist_name || '', birthDate: d.birth_date ? d.birth_date.substring(0, 10) : '',
              nationality: d.nationality || '', street: d.street || '',
              city: d.city || '', postalCode: d.postal_code || '',
              country: d.country || 'DE', email: d.email || '', phone: d.phone || '',
              taxStatus: d.tax_status || '', taxNumber: d.tax_number || '',
              taxId: d.tax_id || '', vatId: d.vat_id || '',
              taxCountry: d.tax_country || 'DE', taxSelfResponsible: d.tax_self_responsible || false,
              accountHolder: d.account_holder || '', iban: d.iban || '',
              bic: d.bic || '', payoutCountry: d.payout_country || 'DE',
              currency: d.currency || 'EUR', minPayoutAccepted: d.min_payout_accepted || false,
              acceptCreatorContract: d.accept_creator_contract || false,
              acceptRevenueShare: d.accept_revenue_share || false,
              acceptAdDisclosure: d.accept_ad_disclosure || false,
              acceptNoThirdPartyRights: d.accept_no_third_party_rights || false,
              acceptTracking: d.accept_tracking || false,
            });
          }
        } catch {}
        setLoaded(true);
      })();
    }
  }, [loaded]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/affiliate-creator-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...affiliate }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage({ type: 'success', text: 'Affiliate-Daten erfolgreich gespeichert!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: json.error || 'Fehler beim Speichern' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Verbindungsfehler beim Speichern' });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t('dashboardNav.affiliate', 'Affiliate-Programm')}
        description="Registriere dich als Creator und verwalte deine Identitaet, Steuerdaten und Auszahlungsinformationen."
      />

      <div className="space-y-3">
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <button
            onClick={() => toggle('identity')}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
            style={{ backgroundColor: expanded.identity ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
            data-testid="toggle-affiliate-identity"
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" style={{ color: '#247ba0' }} />
              <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Account & Identitaet</span>
            </div>
            {expanded.identity ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
          </button>
          {expanded.identity && (
            <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                Zur eindeutigen Identifikation als Vertragspartner und fuer steuerliche Zwecke.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Vorname *</label>
                  <input type="text" value={affiliate.firstName} onChange={(e) => setAffiliate({ ...affiliate, firstName: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-firstname" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Nachname *</label>
                  <input type="text" value={affiliate.lastName} onChange={(e) => setAffiliate({ ...affiliate, lastName: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-lastname" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Kuenstler-/Profilname</label>
                  <input type="text" value={affiliate.artistName} onChange={(e) => setAffiliate({ ...affiliate, artistName: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-artistname" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Geburtsdatum *</label>
                  <input type="date" value={affiliate.birthDate} onChange={(e) => setAffiliate({ ...affiliate, birthDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-birthdate" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Staatsangehoerigkeit *</label>
                  <input type="text" value={affiliate.nationality} onChange={(e) => setAffiliate({ ...affiliate, nationality: e.target.value })} placeholder="z.B. deutsch" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-nationality" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Land *</label>
                  <select value={affiliate.country} onChange={(e) => setAffiliate({ ...affiliate, country: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="select-aff-country">
                    <option value="DE">Deutschland</option>
                    <option value="AT">Oesterreich</option>
                    <option value="CH">Schweiz</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Strasse und Hausnummer *</label>
                  <input type="text" value={affiliate.street} onChange={(e) => setAffiliate({ ...affiliate, street: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-street" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>PLZ *</label>
                  <input type="text" value={affiliate.postalCode} onChange={(e) => setAffiliate({ ...affiliate, postalCode: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-postalcode" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Stadt *</label>
                  <input type="text" value={affiliate.city} onChange={(e) => setAffiliate({ ...affiliate, city: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-city" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>E-Mail *</label>
                  <input type="email" value={affiliate.email} onChange={(e) => setAffiliate({ ...affiliate, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-email" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Telefonnummer</label>
                  <input type="tel" value={affiliate.phone} onChange={(e) => setAffiliate({ ...affiliate, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-phone" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <button
            onClick={() => toggle('tax')}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
            style={{ backgroundColor: expanded.tax ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
            data-testid="toggle-affiliate-tax"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" style={{ color: '#247ba0' }} />
              <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Steuerliche Angaben</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}>Wichtig</span>
            </div>
            {expanded.tax ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
          </button>
          {expanded.tax && (
            <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                Steuerliche Informationen sind fuer die korrekte Abrechnung erforderlich.
              </p>
              <div className="space-y-3">
                <label className="block text-sm font-medium mb-2" style={{ color: '#3A3A3A' }}>Umsatzsteuer-Status *</label>
                <label
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                  style={{
                    borderColor: affiliate.taxStatus === 'kleinunternehmer' ? '#247ba0' : '#D1D5DB',
                    backgroundColor: affiliate.taxStatus === 'kleinunternehmer' ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                  }}
                  data-testid="radio-kleinunternehmer"
                  onClick={() => setAffiliate({ ...affiliate, taxStatus: 'kleinunternehmer' })}
                >
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: affiliate.taxStatus === 'kleinunternehmer' ? '#247ba0' : '#D1D5DB' }}>
                    {affiliate.taxStatus === 'kleinunternehmer' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#247ba0' }} />}
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>Ich bin Kleinunternehmer (§19 UStG)</span>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Keine Umsatzsteuer auf Rechnungen</p>
                  </div>
                </label>
                <label
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                  style={{
                    borderColor: affiliate.taxStatus === 'umsatzsteuerpflichtig' ? '#247ba0' : '#D1D5DB',
                    backgroundColor: affiliate.taxStatus === 'umsatzsteuerpflichtig' ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                  }}
                  data-testid="radio-umsatzsteuerpflichtig"
                  onClick={() => setAffiliate({ ...affiliate, taxStatus: 'umsatzsteuerpflichtig' })}
                >
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: affiliate.taxStatus === 'umsatzsteuerpflichtig' ? '#247ba0' : '#D1D5DB' }}>
                    {affiliate.taxStatus === 'umsatzsteuerpflichtig' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#247ba0' }} />}
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: '#3A3A3A' }}>Ich bin umsatzsteuerpflichtig</span>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Umsatzsteuer wird ausgewiesen</p>
                  </div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Steuernummer</label>
                  <input type="text" value={affiliate.taxNumber} onChange={(e) => setAffiliate({ ...affiliate, taxNumber: e.target.value })} placeholder="z.B. 12/345/67890" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-taxnumber" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Steuer-ID</label>
                  <input type="text" value={affiliate.taxId} onChange={(e) => setAffiliate({ ...affiliate, taxId: e.target.value })} placeholder="z.B. 12 345 678 901" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-taxid" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>USt-IdNr. (falls vorhanden)</label>
                  <input type="text" value={affiliate.vatId} onChange={(e) => setAffiliate({ ...affiliate, vatId: e.target.value })} placeholder="z.B. DE123456789" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-vatid" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Steuerland</label>
                  <select value={affiliate.taxCountry} onChange={(e) => setAffiliate({ ...affiliate, taxCountry: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="select-aff-taxcountry">
                    <option value="DE">Deutschland</option>
                    <option value="AT">Oesterreich</option>
                    <option value="CH">Schweiz</option>
                  </select>
                </div>
              </div>
              <label
                className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer mt-3"
                style={{
                  borderColor: affiliate.taxSelfResponsible ? '#247ba0' : '#D1D5DB',
                  backgroundColor: affiliate.taxSelfResponsible ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                }}
                data-testid="checkbox-aff-tax-responsible"
                onClick={() => setAffiliate({ ...affiliate, taxSelfResponsible: !affiliate.taxSelfResponsible })}
              >
                <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: affiliate.taxSelfResponsible ? '#247ba0' : '#D1D5DB', backgroundColor: affiliate.taxSelfResponsible ? '#247ba0' : 'transparent' }}>
                  {affiliate.taxSelfResponsible && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm" style={{ color: '#3A3A3A' }}>Ich bestaetige, dass ich fuer meine steuerlichen Verpflichtungen selbst verantwortlich bin. *</span>
              </label>
            </div>
          )}
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <button
            onClick={() => toggle('payout')}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
            style={{ backgroundColor: expanded.payout ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
            data-testid="toggle-affiliate-payout"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4" style={{ color: '#247ba0' }} />
              <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Auszahlungsdaten</span>
            </div>
            {expanded.payout ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
          </button>
          {expanded.payout && (
            <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                Bankverbindung fuer die Auszahlung deiner Affiliate-Provisionen.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Kontoinhaber *</label>
                  <input type="text" value={affiliate.accountHolder} onChange={(e) => setAffiliate({ ...affiliate, accountHolder: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-accountholder" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>IBAN *</label>
                  <input type="text" value={affiliate.iban} onChange={(e) => setAffiliate({ ...affiliate, iban: e.target.value })} placeholder="DE89 3704 0044 0532 0130 00" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-iban" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>BIC</label>
                  <input type="text" value={affiliate.bic} onChange={(e) => setAffiliate({ ...affiliate, bic: e.target.value })} placeholder="COBADEFFXXX" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="input-aff-bic" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Auszahlungsland</label>
                  <select value={affiliate.payoutCountry} onChange={(e) => setAffiliate({ ...affiliate, payoutCountry: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="select-aff-payoutcountry">
                    <option value="DE">Deutschland</option>
                    <option value="AT">Oesterreich</option>
                    <option value="CH">Schweiz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#3A3A3A' }}>Waehrung</label>
                  <select value={affiliate.currency} onChange={(e) => setAffiliate({ ...affiliate, currency: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', color: '#3A3A3A' }} data-testid="select-aff-currency">
                    <option value="EUR">EUR</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
              </div>
              <label
                className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer"
                style={{
                  borderColor: affiliate.minPayoutAccepted ? '#247ba0' : '#D1D5DB',
                  backgroundColor: affiliate.minPayoutAccepted ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                }}
                data-testid="checkbox-aff-minpayout"
                onClick={() => setAffiliate({ ...affiliate, minPayoutAccepted: !affiliate.minPayoutAccepted })}
              >
                <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: affiliate.minPayoutAccepted ? '#247ba0' : '#D1D5DB', backgroundColor: affiliate.minPayoutAccepted ? '#247ba0' : 'transparent' }}>
                  {affiliate.minPayoutAccepted && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm" style={{ color: '#3A3A3A' }}>Ich akzeptiere den Mindest-Auszahlungsbetrag von 50,00 EUR</span>
              </label>
            </div>
          )}
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" style={{ color: '#247ba0' }} />
              <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Profil-Daten</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#166534' }}>Bereits ausgefuellt</span>
          </div>
          <div className="px-4 pb-3 border-t" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
              Deine Profil-Daten (Profilname, Kurzbeschreibung, Themenschwerpunkte, Social-Links, Profilbild) werden aus deinem Bookstore-Profil uebernommen. Du kannst sie oben in deinen Profileinstellungen aendern.
            </p>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <button
            onClick={() => toggle('legal')}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
            style={{ backgroundColor: expanded.legal ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
            data-testid="toggle-affiliate-legal"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4" style={{ color: '#247ba0' }} />
              <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Vertrags- & Rechtliches</span>
            </div>
            {expanded.legal ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
          </button>
          {expanded.legal && (
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                Bitte bestaetige die folgenden Vereinbarungen, um am Affiliate-Programm teilzunehmen.
              </p>
              {([
                { key: 'acceptCreatorContract' as const, label: 'Ich akzeptiere den Creator-Vertrag *' },
                { key: 'acceptRevenueShare' as const, label: 'Ich akzeptiere die Revenue-Share-Regelung *' },
                { key: 'acceptAdDisclosure' as const, label: 'Ich verpflichte mich zur Kennzeichnung von Werbung *' },
                { key: 'acceptNoThirdPartyRights' as const, label: 'Ich bestaetige, keine Rechte Dritter zu verletzen *' },
              ]).map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                  style={{
                    borderColor: affiliate[item.key] ? '#247ba0' : '#D1D5DB',
                    backgroundColor: affiliate[item.key] ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                  }}
                  data-testid={`checkbox-aff-${item.key}`}
                  onClick={() => setAffiliate({ ...affiliate, [item.key]: !affiliate[item.key] })}
                >
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: affiliate[item.key] ? '#247ba0' : '#D1D5DB', backgroundColor: affiliate[item.key] ? '#247ba0' : 'transparent' }}>
                    {affiliate[item.key] && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm" style={{ color: '#3A3A3A' }}>{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <button
            onClick={() => toggle('tracking')}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
            style={{ backgroundColor: expanded.tracking ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF' }}
            data-testid="toggle-affiliate-tracking"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4" style={{ color: '#247ba0' }} />
              <span className="text-sm font-semibold" style={{ color: '#3A3A3A' }}>Tracking-Zustimmung</span>
            </div>
            {expanded.tracking ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
          </button>
          {expanded.tracking && (
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                Fuer die Zuordnung deiner Provisionen ist die Erfassung von Klick- und Umsatzdaten erforderlich.
              </p>
              <label
                className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                style={{
                  borderColor: affiliate.acceptTracking ? '#247ba0' : '#D1D5DB',
                  backgroundColor: affiliate.acceptTracking ? 'rgba(36, 123, 160, 0.05)' : '#FFFFFF',
                }}
                data-testid="checkbox-aff-tracking"
                onClick={() => setAffiliate({ ...affiliate, acceptTracking: !affiliate.acceptTracking })}
              >
                <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: affiliate.acceptTracking ? '#247ba0' : '#D1D5DB', backgroundColor: affiliate.acceptTracking ? '#247ba0' : 'transparent' }}>
                  {affiliate.acceptTracking && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm" style={{ color: '#3A3A3A' }}>Ich stimme der Erfassung von Klick- und Umsatzdaten zu. *</span>
              </label>
            </div>
          )}
        </div>

        {message && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{
              backgroundColor: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
              color: message.type === 'success' ? '#166534' : '#991B1B',
              border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`
            }}
            data-testid="text-affiliate-message"
          >
            {message.text}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            data-testid="button-save-affiliate"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: saving ? '#9CA3AF' : '#247ba0',
              color: '#FFFFFF'
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#FFFFFF40', borderTopColor: '#FFFFFF' }} />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Affiliate-Daten speichern
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
