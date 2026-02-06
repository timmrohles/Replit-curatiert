import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Container, Section, Heading, Text } from '../components/ui';

export default function Impressum() {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Impressum', href: '/impressum' }
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      {/* Canonical URL - SEO */}
      <link rel="canonical" href="https://coratiert.de/impressum/" />
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "@id": "https://coratiert.de/impressum/",
          "name": "Impressum",
          "description": "Angaben gemäß § 5 TMG – Rechtliche Informationen und Kontaktdaten",
          "url": "https://coratiert.de/impressum/"
        })}
      </script>

      {/* Hero Section - Text linksbündig */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="max-w-2xl">
            <Heading as="h1" variant="h1" className="mb-4 !text-white">
              IMPRESSUM
            </Heading>
            <Text variant="large" className="!text-white">
              Angaben gemäß § 5 TMG – Rechtliche Informationen und Kontaktdaten
            </Text>
          </div>
        </Container>
      </Section>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Content Section */}
      <Section variant="default">
        <Container>
          {/* Diensteanbieter */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              Diensteanbieter
            </Heading>
            <div className="space-y-1">
              <Text variant="body" className="font-semibold text-foreground">Timm Rohles</Text>
              <Text variant="body" className="text-foreground">Pfarrstr. 130</Text>
              <Text variant="body" className="text-foreground">10317 Berlin</Text>
              <Text variant="body" className="text-foreground">Deutschland</Text>
            </div>
          </div>

          {/* Kontaktmöglichkeiten */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              Kontaktmöglichkeiten
            </Heading>
            <div className="space-y-2">
              <Text variant="body" className="text-foreground">
                <span className="font-semibold">E-Mail-Adresse:</span>{' '}
                <a 
                  href="mailto:info@coratiert.de" 
                  className="hover:underline"
                  style={{ color: 'var(--color-blue)' }}
                >
                  info@coratiert.de
                </a>
              </Text>
              <Text variant="body" className="text-foreground">
                <span className="font-semibold">Telefon:</span>{' '}
                <a 
                  href="tel:+491752082594" 
                  className="hover:underline"
                  style={{ color: 'var(--color-blue)' }}
                >
                  +49 175 2082594
                </a>
              </Text>
            </div>
          </div>

          {/* Vertretungsberechtigte Person */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              Vertretungsberechtigte Person
            </Heading>
            <Text variant="body" className="text-foreground">Timm Rohles</Text>
          </div>

          {/* Verantwortlich für den Inhalt */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              Verantwortlich für den Inhalt
            </Heading>
            <Text variant="body" className="mb-2 text-foreground">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:
            </Text>
            <div className="mt-2 space-y-1">
              <Text variant="body" className="font-semibold text-foreground">Timm Rohles</Text>
              <Text variant="body" className="text-foreground">Pfarrstr. 130</Text>
              <Text variant="body" className="text-foreground">10317 Berlin</Text>
            </div>
          </div>

          {/* Haftungsausschluss */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              Haftungsausschluss
            </Heading>
            
            <Heading as="h3" variant="h3" className="mb-2 text-foreground">
              Haftung für Inhalte
            </Heading>
            <Text variant="small" className="mb-4 text-foreground leading-relaxed">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </Text>

            <Heading as="h3" variant="h3" className="mb-2 text-foreground">
              Haftung für Links
            </Heading>
            <Text variant="small" className="mb-4 text-foreground leading-relaxed">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </Text>

            <Heading as="h3" variant="h3" className="mb-2 text-foreground">
              Urheberrecht
            </Heading>
            <Text variant="small" className="text-foreground leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </Text>
          </div>

          {/* EU-Streitschlichtung */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              EU-Streitschlichtung
            </Heading>
            <Text variant="small" className="text-foreground leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a 
                href="https://ec.europa.eu/consumers/odr/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: 'var(--color-blue)' }}
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              <br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </Text>
          </div>

          {/* Verbraucherstreitbeilegung */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </Heading>
            <Text variant="small" className="text-foreground leading-relaxed">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </Text>
          </div>

          {/* Bildnachweise */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              Bildnachweise
            </Heading>
            <Text variant="small" className="text-foreground leading-relaxed">
              Die auf dieser Website verwendeten Bilder stammen von Unsplash.com und anderen lizenzierten Quellen. Alle Rechte liegen bei den jeweiligen Urhebern.
            </Text>
          </div>

          {/* Footer Note */}
          <div 
            className="pt-8 mt-10 text-center"
            style={{ borderTop: '1px solid var(--color-beige)' }}
          >
            <Text variant="small" className="text-foreground opacity-60">
              Stand: Januar 2026
            </Text>
            <Text variant="small" className="mt-2 text-foreground opacity-60">
              Quelle: Erstellt mit Unterstützung von{' '}
              <a 
                href="https://www.e-recht24.de" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: 'var(--color-blue)' }}
              >
                e-recht24.de
              </a>
            </Text>
          </div>
        </Container>
      </Section>
    </div>
  );
}