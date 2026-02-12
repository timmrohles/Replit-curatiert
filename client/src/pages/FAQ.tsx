import { useSafeNavigate } from '../utils/routing';
import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Container, Section, Heading, Text } from '../components/ui';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { InfoBar } from '../components/layout/InfoBar';
import { Helmet } from 'react-helmet-async';

interface FAQItemProps {
  question: string;
  answer: string | React.ReactNode;
  category: 'general' | 'orders' | 'curators' | 'technical';
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="border-2 rounded-2xl overflow-hidden transition-all"
      style={{ borderColor: isOpen ? 'var(--color-blue)' : 'var(--color-beige)' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
        aria-expanded={isOpen}
        aria-label={question}
      >
        <Heading as="h3" variant="h4" className="pr-4 text-foreground">
          {question}
        </Heading>
        <ChevronDown 
          className={`w-6 h-6 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: isOpen ? 'var(--color-blue)' : 'var(--color-foreground)' }}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-0">
          <Text variant="body" className="text-foreground leading-relaxed">
            {typeof answer === 'string' ? answer : <div>{answer}</div>}
          </Text>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const navigate = useSafeNavigate();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'FAQ', href: '/faq' }
  ];

  const faqs: FAQItemProps[] = [
    // Allgemein
    {
      question: "Was ist coratiert.de?",
      answer: "coratiert.de ist eine Community-Buchhandlung, die kuratierte Buchempfehlungen von vertrauenswürdigen Kurator*innen statt algorithmischen Empfehlungen bietet. Wir glauben an die Kraft persönlicher Empfehlungen und schaffen einen Raum, in dem Buchliebhaber*innen ihre Leidenschaft teilen können.",
      category: 'general'
    },
    {
      question: "Wie unterscheidet sich coratiert.de von anderen Online-Buchhandlungen?",
      answer: (
        <>
          <p className="mb-3">coratiert.de setzt auf menschliche Kuration statt Algorithmen. Unsere Besonderheiten:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Persönliche Empfehlungen:</strong> Jedes Buch wird von echten Menschen empfohlen</li>
            <li><strong>Community-getrieben:</strong> Jede*r kann Kurator*in werden</li>
            <li><strong>Transparenz:</strong> Klare Kennzeichnung von Affiliate-Links</li>
            <li><strong>Vielfalt:</strong> Von Mainstream bis Nische – alle Genres und Verlage</li>
          </ul>
        </>
      ),
      category: 'general'
    },
    {
      question: "Ist coratiert.de kostenlos?",
      answer: "Ja! Die Nutzung von coratiert.de ist komplett kostenlos. Du kannst Listen durchstöbern, Kurator*innen folgen und Bücher entdecken, ohne einen Cent zu bezahlen. Wir finanzieren uns durch Affiliate-Provisionen bei Buchkäufen – für dich entstehen dabei keine Mehrkosten.",
      category: 'general'
    },
    {
      question: "Wie funktionieren die Affiliate-Links?",
      answer: "Wenn du ein Buch über unsere Links kaufst, erhalten wir eine kleine Provision vom Händler. Der Preis für dich bleibt dabei gleich – es entstehen keine Mehrkosten. Diese Provisionen helfen uns, die Plattform zu betreiben und weiterzuentwickeln.",
      category: 'general'
    },

    // Bestellungen & Versand
    {
      question: "Kann ich Bücher direkt auf coratiert.de kaufen?",
      answer: "Nein, coratiert.de ist keine direkte Verkaufsplattform. Wir verlinken zu verschiedenen Online-Buchhändlern und Partnern, bei denen du die Bücher kaufen kannst. So hast du die Wahl, wo du bestellst – ob bei großen Plattformen oder kleinen Independent-Buchhandlungen.",
      category: 'orders'
    },
    {
      question: "Bei welchen Händlern kann ich bestellen?",
      answer: "Wir arbeiten mit verschiedenen Partnern zusammen, darunter große Online-Buchhändler, aber auch lokale und Independent-Buchhandlungen. Bei jedem Buch siehst du die verfügbaren Kaufoptionen und kannst selbst entscheiden, wo du bestellen möchtest.",
      category: 'orders'
    },
    {
      question: "Wie funktioniert der Versand?",
      answer: "Der Versand wird direkt vom jeweiligen Händler abgewickelt, bei dem du bestellst. Die Versandbedingungen (Kosten, Lieferzeit, etc.) findest du auf der Website des jeweiligen Händlers.",
      category: 'orders'
    },
    {
      question: "Kann ich Bestellungen zurückgeben?",
      answer: "Rückgaben und Reklamationen werden direkt mit dem Händler abgewickelt, bei dem du bestellt hast. Die Rückgabebedingungen variieren je nach Händler – bitte informiere dich auf deren Website.",
      category: 'orders'
    },

    // Kurator*innen
    {
      question: "Wer kann Kurator*in werden?",
      answer: "Jede*r, der/die Bücher liebt! Ob du Buchblogger*in, Bookstagrammer*in, Journalist*in oder einfach eine*r passionierte*r Leser*in bist – wenn du deine Buchempfehlungen teilen möchtest, bist du herzlich willkommen. Es gibt keine Mindestanforderungen oder Bewerbungsverfahren.",
      category: 'curators'
    },
    {
      question: "Wie werde ich Kurator*in?",
      answer: (
        <>
          <p className="mb-3">Es ist ganz einfach:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Registriere dich kostenlos auf coratiert.de</li>
            <li>Erstelle dein Kurator*innen-Profil</li>
            <li>Füge deine Buchempfehlungen hinzu und erstelle Listen</li>
            <li>Teile dein Profil mit deiner Community</li>
          </ol>
          <p className="mt-3">Aktuell arbeiten wir noch an der finalen Version der Kurator*innen-Funktion. Bald kannst du loslegen!</p>
        </>
      ),
      category: 'curators'
    },
    {
      question: "Verdiene ich als Kurator*in Geld?",
      answer: "Ja! Als Kurator*in kannst du an den Affiliate-Provisionen teilhaben. Wenn jemand ein Buch über deine Empfehlung kauft, erhältst du einen Anteil der Provision. Die genauen Konditionen findest du in deinem Kurator*innen-Dashboard.",
      category: 'curators'
    },
    {
      question: "Kann ich als Kurator*in auch Bücher aus meinem eigenen Verlag empfehlen?",
      answer: "Ja, das ist möglich! Wir setzen aber auf Transparenz: Bitte kennzeichne deutlich, wenn du Bücher empfiehlst, an denen du selbst beteiligt bist (als Autor*in, Verleger*in, etc.). Ehrlichkeit und Authentizität sind die Grundlage unserer Community.",
      category: 'curators'
    },

    // Technisches
    {
      question: "Brauche ich einen Account, um Bücher zu entdecken?",
      answer: "Nein! Du kannst alle Kurationen, Empfehlungen und Kurator*innen auch ohne Account durchstöbern. Ein Account ist nur nötig, wenn du selbst Kurator*in werden, Kurationen speichern oder Kurator*innen folgen möchtest.",
      category: 'technical'
    },
    {
      question: "Welche Daten sammelt coratiert.de?",
      answer: (
        <>
          <p className="mb-3">Wir nehmen Datenschutz ernst. Wir sammeln nur die notwendigsten Daten:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Bei der Registrierung: E-Mail, Name, Passwort</li>
            <li>Beim Besuch der Website: Technische Daten (IP-Adresse, Browser, etc.)</li>
            <li>Optional: Cookies für Analyse und Funktionalität (nur mit deiner Einwilligung)</li>
          </ul>
          <p className="mt-3">
            Details findest du in unserer{' '}
            <button 
              onClick={() => navigate('/datenschutz')}
              className="underline hover:no-underline"
              style={{ color: 'var(--color-blue)' }}
              aria-label="Zur Datenschutzerklärung"
            >
              Datenschutzerklärung
            </button>.
          </p>
        </>
      ),
      category: 'technical'
    },
    {
      question: "Gibt es eine App für coratiert.de?",
      answer: "Aktuell noch nicht, aber es steht auf unserer Roadmap! Im Moment ist unsere Website vollständig responsive und funktioniert perfekt auf allen mobilen Geräten. Eine dedizierte App ist für die Zukunft geplant.",
      category: 'technical'
    },
    {
      question: "Ich habe einen Fehler gefunden. Was soll ich tun?",
      answer: (
        <>
          <p className="mb-3">Vielen Dank, dass du uns helfen möchtest! Bitte sende uns eine E-Mail mit:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Beschreibung des Fehlers</li>
            <li>Welche Seite betroffen ist</li>
            <li>Optional: Screenshots</li>
          </ul>
          <p className="mt-3">
            E-Mail:{' '}
            <a 
              href="mailto:info@coratiert.de" 
              className="underline hover:no-underline"
              style={{ color: 'var(--color-blue)' }}
            >
              info@coratiert.de
            </a>
          </p>
        </>
      ),
      category: 'technical'
    },
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />

      <Helmet>
        <title>Häufig gestellte Fragen (FAQ) | coratiert.de</title>
        <meta name="description" content="Hier findest du Antworten auf die wichtigsten Fragen zu coratiert.de - von Kuratoren-Anmeldung bis zu Bestellungen und Datenschutz." />
        <link rel="canonical" href="https://coratiert.de/faq/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://coratiert.de/faq/",
            "name": "Häufig gestellte Fragen",
            "description": "Hier findest du Antworten auf die wichtigsten Fragen zu coratiert.de",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": typeof faq.answer === 'string' ? faq.answer : faq.question
              }
            }))
          })}
        </script>
      </Helmet>

      <Breadcrumb items={breadcrumbItems} />

      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading as="h1" variant="h1" className="mb-4 !text-foreground">
              HÄUFIG GESTELLTE FRAGEN
            </Heading>
            <Text variant="large" className="max-w-3xl !text-foreground">
              Hier findest du Antworten auf die wichtigsten Fragen zu coratiert.de
            </Text>
          </div>
        </Container>
      </Section>

        {/* Content Section */}
        <Section variant="default">
          <Container maxWidth="4xl">
            {/* Intro */}
            <div 
              className="flex items-start gap-3 mb-8 p-6 rounded-2xl"
              style={{ backgroundColor: 'var(--color-beige)' }}
            >
              <HelpCircle className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: 'var(--color-blue)' }} aria-hidden="true" />
              <Text variant="body" className="text-foreground leading-relaxed">
                Du hast eine Frage, die hier nicht beantwortet wird? Schreib uns gerne an{' '}
                <a 
                  href="mailto:info@coratiert.de"
                  className="underline hover:no-underline"
                  style={{ color: 'var(--color-blue)' }}
                >
                  info@coratiert.de
                </a>
              </Text>
            </div>

            {/* Allgemein */}
            <section className="mb-10">
              <Heading as="h2" variant="h2" className="mb-6 text-foreground">
                Allgemein
              </Heading>
              <div className="space-y-4">
                {faqs.filter(faq => faq.category === 'general').map((faq, index) => (
                  <FAQItem key={`general-${index}`} {...faq} />
                ))}
              </div>
            </section>

            {/* Bestellungen & Versand */}
            <section className="mb-10">
              <Heading as="h2" variant="h2" className="mb-6 text-foreground">
                Bestellungen & Versand
              </Heading>
              <div className="space-y-4">
                {faqs.filter(faq => faq.category === 'orders').map((faq, index) => (
                  <FAQItem key={`orders-${index}`} {...faq} />
                ))}
              </div>
            </section>

            {/* Kurator*innen */}
            <section className="mb-10">
              <Heading as="h2" variant="h2" className="mb-6 text-foreground">
                Kurator*innen
              </Heading>
              <div className="space-y-4">
                {faqs.filter(faq => faq.category === 'curators').map((faq, index) => (
                  <FAQItem key={`curators-${index}`} {...faq} />
                ))}
              </div>
            </section>

            {/* Technisches */}
            <section className="mb-10">
              <Heading as="h2" variant="h2" className="mb-6 text-foreground">
                Technisches & Datenschutz
              </Heading>
              <div className="space-y-4">
                {faqs.filter(faq => faq.category === 'technical').map((faq, index) => (
                  <FAQItem key={`technical-${index}`} {...faq} />
                ))}
              </div>
            </section>

            {/* CTA */}
            <div 
              className="mt-10 p-8 rounded-2xl text-center"
              style={{ backgroundColor: 'var(--color-blue)' }}
            >
              <Heading as="h3" variant="h3" className="mb-3 !text-white">
                Immer noch Fragen?
              </Heading>
              <Text variant="body" className="!text-white mb-6 leading-relaxed">
                Wir helfen dir gerne weiter! Kontaktiere uns per E-Mail oder schau in unsere 
                ausführlichen Hilfe-Artikel.
              </Text>
              <a
                href="mailto:info@coratiert.de"
                className="inline-block px-8 py-4 rounded-xl transition-all hover:scale-105 bg-white"
                style={{ 
                  color: 'var(--color-blue)',
                  fontFamily: 'var(--font-family-headline)',
                  letterSpacing: '0.02em'
                }}
                aria-label="Kontakt per E-Mail"
              >
                JETZT KONTAKTIEREN
              </a>
            </div>
          </Container>
        </Section>

      <Footer />
    </div>
  );
}