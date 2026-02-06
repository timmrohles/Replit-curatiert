import { Lock, Unlock, MessageCircle, Users, Calendar, Download, Mail, ChevronDown, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Minimal Storefront interface (only fields used in this component)
interface StorefrontEvent {
  date: string;
  title: string;
  type?: string;
  description?: string;
  time?: string;
  location?: string;
}

interface MinimalStorefront {
  events?: StorefrontEvent[];
  creatorName?: string;
  colors?: {
    heroBackground?: string;
  };
  textColors?: {
    onHeroBackground?: string;
  };
}

interface BonusContentSectionProps {
  storefront?: MinimalStorefront;
}

// Community Topics Data
const communityTopics = [
  {
    id: '1',
    title: 'Fragen zum aktuellen Buch',
    description: 'Stelle deine Fragen zur aktuellen Lektüre und tausche dich mit anderen Lesenden aus.',
    icon: MessageCircle,
    memberCount: 234
  },
  {
    id: '2',
    title: 'Diskussion zu gesellschaftlichen Themen',
    description: 'Vertiefe die Themen aus den Büchern in spannenden Community-Diskussionen.',
    icon: Users,
    memberCount: 189
  },
  {
    id: '3',
    title: 'Hinter den Kulissen',
    description: 'Erhalte exklusive Einblicke in den Kurations- und Rechercheprozess.',
    icon: Unlock,
    memberCount: 156
  }
];

// Bonus Material Types
const bonusMaterials = [
  {
    id: '1',
    title: 'Zusätzliche Szenen & Deleted Scenes',
    type: 'Exklusiv',
    isFree: false
  },
  {
    id: '2',
    title: 'Hintergrundinfos & Notizen',
    type: 'Exklusiv',
    isFree: false
  },
  {
    id: '3',
    title: 'Weltkarten & Charakterübersichten',
    type: 'Frei',
    isFree: true
  },
  {
    id: '4',
    title: 'Download-Material (PDF, Audio, Bilder)',
    type: 'Exklusiv',
    isFree: false
  }
];

// FAQ Data
const faqs = [
  {
    id: '1',
    question: 'Wie kann ich am Buchclub teilnehmen?',
    answer: 'Als Mitglied erhältst du automatisch Zugang zum Buchclub-Bereich. Dort findest du alle Termine, das aktuelle Buch und kannst dich zu den Diskussionen anmelden.'
  },
  {
    id: '2',
    question: 'Wie funktioniert die Mitgliedschaft?',
    answer: 'Du wählst ein monatliches Modell (z.B. 5€/Monat) und erhältst sofortigen Zugang zu allen Mitglieder-Inhalten: Bonusmaterial, Buchclub, Community-Bereiche und exklusive Updates.'
  },
  {
    id: '3',
    question: 'Was bekomme ich als Unterstützer:in?',
    answer: 'Zugang zu allen Bonusinhalten, Teilnahme am Buchclub, exklusive Community-Bereiche, früher Zugang zu neuen Inhalten und die Möglichkeit, direkt Fragen zu stellen.'
  },
  {
    id: '4',
    question: 'Kann ich auch einmalig unterstützen?',
    answer: 'Ja! Du kannst auch einen einmaligen Betrag spenden, um die Arbeit zu unterstützen. Für dauerhaften Zugang zu allen Inhalten empfehlen wir jedoch die Mitgliedschaft.'
  }
];

export function BonusContentSection({ storefront }: BonusContentSectionProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  // Use heroBackground color from storefront, fallback to default
  const backgroundColor = storefront?.colors?.heroBackground || '#F5F5F0';
  const textColor = storefront?.textColors?.onHeroBackground || '#3A3A3A';
  const accentColor = '#247ba0'; // Cerulean for links and buttons

  // Find next upcoming event (prefer Buchclub events)
  const getNextEvent = () => {
    if (!storefront?.events || storefront.events.length === 0) return null;
    
    const now = new Date();
    const upcomingEvents = storefront.events
      .filter((event) => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Try to find a Buchclub event first
    const buchclubEvent = upcomingEvents.find((event) => 
      event.title?.toLowerCase().includes('buchclub') || 
      event.type?.toLowerCase().includes('buchclub')
    );
    
    return buchclubEvent || upcomingEvents[0] || null;
  };

  const nextEvent = getNextEvent();

  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    
    return `${days[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Newsletter subscription logic
    setEmail('');
    // Show success message (optional)
  };

  return (
    <div className="py-16 md:py-24" style={{ backgroundColor }}>
      <div className="max-w-[1440px] mx-auto px-8">
        
        {/* ==================== COMMUNITY & AUSTAUSCH ==================== */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-4" style={{ color: textColor }}>
              Community & Austausch
            </h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto" style={{ color: textColor, opacity: 0.8 }}>
              Stelle Fragen, diskutiere mit und erhalte Einblicke hinter die Kulissen.
            </p>
          </div>

          {/* Community Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {communityTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <div
                  key={topic.id}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: accentColor + '20' }}>
                      <Icon className="w-8 h-8" style={{ color: accentColor }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg mb-2 text-foreground">
                        {topic.title}
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-foreground-muted">
                      {topic.memberCount} Mitglieder
                    </span>
                    <button
                      className="text-xs px-3 py-1 rounded-full bg-coral"
                      style={{ color: '#ffffff' }}
                    >
                      Beitreten
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              className="inline-block px-6 py-3 rounded-lg transition-all shadow-md hover:bg-teal hover:-translate-y-0.5 text-white"
              style={{
                backgroundColor: accentColor,
              }}
            >
              Zur Community
            </button>
          </div>
        </section>

        {/* ==================== BUCHCLUB-BEREICH ==================== */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left: Text Content */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-8 h-8" style={{ color: accentColor }} />
                  <h2 className="text-3xl md:text-4xl" style={{ color: textColor }}>
                    Buchclub mit {storefront?.creatorName || '[Name]'}
                  </h2>
                </div>
                <p className="text-lg mb-6" style={{ color: textColor, opacity: 0.8 }}>
                  Gemeinsam lesen wir jeden Monat ein ausgewähltes Buch, diskutieren die wichtigsten Themen und tauschen uns in Live-Diskussionen aus. Perfekt für alle, die tiefer eintauchen möchten.
                </p>
                
                {/* Next Event Info */}
                {nextEvent && (
                  <div className="bg-white rounded-lg p-6 mb-6 border-l-4" style={{ borderColor: accentColor }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5" style={{ color: accentColor }} />
                      <span className="text-sm text-foreground-muted">Nächster Termin</span>
                    </div>
                    <p className="text-xl mb-1 text-foreground">
                      {formatEventDate(nextEvent.date)}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      {nextEvent.time} • {nextEvent.location}
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  className="w-full md:w-auto py-4 px-8 rounded-lg text-lg transition-all duration-300 hover:shadow-lg"
                  style={{
                    backgroundColor: accentColor,
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#70c1b3';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = accentColor;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Am Buchclub teilnehmen
                </button>
              </div>

              {/* Right: Current Book */}
              <div className="flex justify-center lg:justify-end">
                <div className="bg-white rounded-lg p-6 shadow-md max-w-sm">
                  <div className="aspect-[2/3] bg-gradient-to-br from-gray-200 to-gray-300 rounded mb-4 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs mb-2 text-foreground-muted">
                      Aktuelles Buchclub-Buch
                    </p>
                    <h3 className="text-xl mb-2 text-foreground">
                      Der Titel des Buches
                    </h3>
                    <p className="text-sm mb-4 text-foreground-muted">
                      von Autor:innenname
                    </p>
                    <p className="text-sm text-foreground-muted">
                      Eine packende Geschichte über...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== BONUSMATERIAL & EXTRAS ==================== */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: textColor }}>
              Bonusmaterial & Extras
            </h2>
            <p className="text-lg max-w-3xl mx-auto" style={{ color: textColor, opacity: 0.8 }}>
              Exklusive Downloads, Hintergrundinfos und zusätzliche Inhalte für Unterstützer:innen
            </p>
          </div>

          {/* Bonus Material Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {bonusMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-lg p-6 flex items-center justify-between hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center gap-4">
                  <Download className="w-6 h-6" style={{ color: accentColor }} />
                  <div>
                    <h3 className="text-base mb-1 text-foreground">
                      {material.title}
                    </h3>
                  </div>
                </div>
                <span 
                  className="text-xs px-3 py-1 rounded-full whitespace-nowrap bg-teal text-white"
                  style={{ 
                    backgroundColor: material.isFree ? 'var(--color-teal)' : 'var(--color-coral)',
                  }}
                >
                  {material.type}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              className="py-4 px-8 rounded-lg text-lg transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundColor: accentColor,
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#70c1b3';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = accentColor;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Alle Extras ansehen
            </button>
          </div>
        </section>

        {/* ==================== MITGLIEDSCHAFT / UNTERSTÜTZEN ==================== */}
        <section className="mb-20">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl mb-4" style={{ color: '#3A3A3A' }}>
                Unterstütze {storefront?.creatorName || '[Name]'}
              </h2>
              <p className="text-lg max-w-3xl mx-auto" style={{ color: '#3A3A3A', opacity: 0.7 }}>
                Deine Unterstützung ermöglicht unabhängige Recherche, hochwertige Buchkuration und mehr Zeit für die Community. Werde Teil dieser Arbeit!
              </p>
            </div>

            {/* Membership Models */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Monthly Membership */}
              <div className="border-2 rounded-xl p-8" style={{ borderColor: accentColor }}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl mb-2" style={{ color: '#3A3A3A' }}>
                    Mitglied werden
                  </h3>
                  <div className="text-4xl mb-4" style={{ color: accentColor }}>
                    5€<span className="text-xl">/Monat</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    </div>
                    <span style={{ color: '#3A3A3A' }}>Zugang zu allen Bonusinhalten</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    </div>
                    <span style={{ color: '#3A3A3A' }}>Teilnahme am monatlichen Buchclub</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    </div>
                    <span style={{ color: '#3A3A3A' }}>Exklusiver Zugang zur Community</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    </div>
                    <span style={{ color: '#3A3A3A' }}>Früher Zugang zu neuen Inhalten</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    </div>
                    <span style={{ color: '#3A3A3A' }}>Direkter Austausch & Q&A</span>
                  </li>
                </ul>
                <button
                  className="w-full py-4 px-6 rounded-lg text-lg transition-all duration-300 hover:shadow-lg"
                  style={{
                    backgroundColor: accentColor,
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#70c1b3';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = accentColor;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Mitglied werden
                </button>
              </div>

              {/* One-time Support */}
              <div className="border-2 border-gray-200 rounded-xl p-8 bg-gray-50">
                <div className="text-center mb-6">
                  <h3 className="text-2xl mb-2" style={{ color: '#3A3A3A' }}>
                    Einmalig unterstützen
                  </h3>
                  <div className="text-4xl mb-4" style={{ color: '#3A3A3A' }}>
                    3€+
                  </div>
                </div>
                <p className="text-center mb-8" style={{ color: '#3A3A3A', opacity: 0.7 }}>
                  Unterstütze diese Arbeit mit einem einmaligen Beitrag deiner Wahl. Jeder Betrag hilft!
                </p>
                <button
                  className="w-full py-4 px-6 rounded-lg text-lg border-2 transition-all duration-300 hover:shadow-lg"
                  style={{
                    borderColor: accentColor,
                    color: accentColor,
                    backgroundColor: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = accentColor;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = accentColor;
                  }}
                >
                  Einmalig unterstützen
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== NEWSLETTER / UPDATES ==================== */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="max-w-2xl mx-auto text-center">
              <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: accentColor }} />
              <h2 className="text-3xl md:text-4xl mb-4" style={{ color: '#3A3A3A' }}>
                Bleib auf dem Laufenden
              </h2>
              <p className="text-lg mb-8" style={{ color: '#3A3A3A', opacity: 0.7 }}>
                Erhalte Updates zu neuen Büchern, kommenden Events und exklusive Einblicke in den Kurations- und Rechercheprozess. Kein Spam, versprochen.
              </p>
              
              {/* Newsletter Form */}
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Deine E-Mail-Adresse"
                  className="flex-1 px-6 py-4 rounded-lg border-2 border-gray-200 focus:border-[#247ba0] outline-none transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:shadow-lg whitespace-nowrap"
                  style={{
                    backgroundColor: accentColor,
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#70c1b3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = accentColor;
                  }}
                >
                  Anmelden
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ==================== FAQ ==================== */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: textColor }}>
              Häufig gestellte Fragen
            </h2>
            <p className="text-lg max-w-3xl mx-auto" style={{ color: textColor, opacity: 0.8 }}>
              Hier findest du Antworten auf die wichtigsten Fragen rund um die Community und Mitgliedschaft.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg pr-4" style={{ color: '#3A3A3A' }}>
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180' : ''}`} 
                    style={{ color: accentColor }} 
                  />
                </button>
                {openFaq === faq.id && (
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-base" style={{ color: '#3A3A3A', opacity: 0.7 }}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}