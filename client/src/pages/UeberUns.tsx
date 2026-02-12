import { Heart, Users, BookOpen, Sparkles } from 'lucide-react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Container, Section, Heading, Text } from '../components/ui';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { InfoBar } from '../components/layout/InfoBar';
import { Helmet } from 'react-helmet-async';

export default function UeberUns() {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Über uns', href: '/ueber-uns' }
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />

      <Helmet>
        <title>Über uns | coratiert.de</title>
        <meta name="description" content="Die Community-Buchhandlung für kuratierte Empfehlungen" />
        <link rel="canonical" href="https://coratiert.de/ueber-uns/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "@id": "https://coratiert.de/ueber-uns/",
            "name": "Über uns",
            "description": "Die Community-Buchhandlung für kuratierte Empfehlungen",
            "url": "https://coratiert.de/ueber-uns/",
            "mainEntity": {
              "@type": "Organization",
              "@id": "https://coratiert.de/#organization",
              "name": "coratiert.de",
              "description": "Community-Plattform für kuratierte Buchempfehlungen",
              "url": "https://coratiert.de",
              "founder": {
                "@type": "Person",
                "name": "Timm Rohles"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "info@coratiert.de",
                "telephone": "+49-175-2082594",
                "contactType": "customer service"
              }
            }
          })}
        </script>
      </Helmet>

      <Breadcrumb items={breadcrumbItems} />

      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading as="h1" variant="h1" className="mb-4 !text-foreground">
              ÜBER UNS
            </Heading>
            <Text variant="large" className="max-w-3xl !text-foreground">
              Die Community-Buchhandlung für kuratierte Empfehlungen
            </Text>
          </div>
        </Container>
      </Section>

      {/* Content Section - Einfach ohne Hintergrund/Schatten */}
      <Section variant="default">
        <Container>
          {/* Intro */}
          <div className="mb-12">
            <Heading as="h2" variant="h2" className="mb-6 text-foreground">
              Was ist coratiert.de?
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              <strong style={{ color: 'var(--vibrant-coral)' }}>coratiert.de</strong> ist mehr als nur eine Buchhandlung – 
              wir sind eine <strong>Community-Plattform</strong>, die Leser*innen mit ihren Lieblings-Kurator*innen verbindet. 
              In einer Welt voller algorithmischer Empfehlungen setzen wir auf persönliche Expertise und echte Leidenschaft.
            </Text>
            <Text variant="body" className="text-foreground leading-relaxed">
              Unsere Kurator*innen – von Buchblogger*innen über Literaturkritiker*innen bis hin zu Autor*innen – 
              teilen ihre handverlesenen Empfehlungen auf ihren eigenen Storefronts. Jede Empfehlung ist durchdacht, 
              jede Liste ist mit Liebe zusammengestellt.
            </Text>
          </div>

          {/* Unsere Werte */}
          <div className="mb-12">
            <Heading as="h2" variant="h2" className="mb-8 text-foreground">
              Unsere Werte
            </Heading>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Value 1: Kuratierte Qualität */}
              <div 
                className="p-6 rounded-2xl border-l-4"
                style={{ 
                  backgroundColor: 'var(--color-beige)',
                  borderColor: 'var(--vibrant-coral)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--vibrant-coral)' }}
                    role="img"
                    aria-label="Kuratierte Qualität"
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <Heading as="h3" variant="h3" className="text-foreground">
                    Kuratierte Qualität
                  </Heading>
                </div>
                <Text variant="body" className="text-foreground leading-relaxed">
                  Keine Algorithmen, keine Masse – nur handverlesene Empfehlungen von Expert*innen, 
                  die ihre Leidenschaft teilen.
                </Text>
              </div>

              {/* Value 2: Community First */}
              <div 
                className="p-6 rounded-2xl border-l-4"
                style={{ 
                  backgroundColor: 'var(--color-beige)',
                  borderColor: 'var(--color-blue)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-blue)' }}
                    role="img"
                    aria-label="Community First"
                  >
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <Heading as="h3" variant="h3" className="text-foreground">
                    Community First
                  </Heading>
                </div>
                <Text variant="body" className="text-foreground leading-relaxed">
                  Wir glauben an die Kraft der Gemeinschaft. Jede*r Kurator*in bringt eine einzigartige 
                  Perspektive und baut eine eigene Leser*innen-Community auf.
                </Text>
              </div>

              {/* Value 3: Vielfalt fördern */}
              <div 
                className="p-6 rounded-2xl border-l-4"
                style={{ 
                  backgroundColor: 'var(--color-beige)',
                  borderColor: 'var(--color-saffron)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-saffron)' }}
                    role="img"
                    aria-label="Vielfalt fördern"
                  >
                    <BookOpen className="w-6 h-6 text-charcoal" />
                  </div>
                  <Heading as="h3" variant="h3" className="text-foreground">
                    Vielfalt fördern
                  </Heading>
                </div>
                <Text variant="body" className="text-foreground leading-relaxed">
                  Wir setzen auf literarische Vielfalt und geben auch kleinen Verlagen und unbekannten 
                  Autor*innen eine Bühne.
                </Text>
              </div>

              {/* Value 4: Kreativität unterstützen */}
              <div 
                className="p-6 rounded-2xl border-l-4"
                style={{ 
                  backgroundColor: 'var(--color-beige)',
                  borderColor: 'var(--color-teal)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-teal)' }}
                    role="img"
                    aria-label="Kreativität unterstützen"
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <Heading as="h3" variant="h3" className="text-foreground">
                    Kreativität unterstützen
                  </Heading>
                </div>
                <Text variant="body" className="text-foreground leading-relaxed">
                  Kurator*innen verdienen an ihren Empfehlungen – wir schaffen faire Bedingungen 
                  für Content Creator in der Buchbranche.
                </Text>
              </div>
            </div>
          </div>

          {/* Unsere Geschichte */}
          <div className="mb-12">
            <Heading as="h2" variant="h2" className="mb-6 text-foreground">
              Unsere Geschichte
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Die Idee zu coratiert.de entstand aus einer einfachen Beobachtung: Während Streaming-Plattformen 
              und Musik-Dienste längst auf Kurator*innen und personalisierte Playlists setzen, fehlte dieser 
              Ansatz in der Buchwelt.
            </Text>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Wir wollten eine Plattform schaffen, auf der Buchliebhaber*innen ihre Lieblingskurator*innen 
              folgen können – sei es die Buchbloggerin mit dem besten Geschmack für historische Romane, 
              der Literaturkritiker mit einem Faible für Science-Fiction oder die Autorin, die versteckte 
              Perlen aus kleinen Verlagen entdeckt.
            </Text>
            <Text variant="body" className="text-foreground leading-relaxed">
              Heute verbinden wir tausende Leser*innen mit ihren persönlichen Buchexpert*innen – und 
              ermöglichen es Kurator*innen gleichzeitig, ihre Leidenschaft zum Beruf zu machen.
            </Text>
          </div>

          {/* Wie funktioniert's? */}
          <div className="mb-12">
            <Heading as="h2" variant="h2" className="mb-6 text-foreground">
              Wie funktioniert's?
            </Heading>
            
            <div className="space-y-6">
              {/* Step 1 */}
              <div 
                className="flex gap-6 items-start p-6 rounded-2xl"
                style={{ backgroundColor: 'var(--color-beige)' }}
              >
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: 'var(--vibrant-coral)' }}
                  role="img"
                  aria-label="Schritt 1"
                >
                  <Heading as="span" variant="h3" className="!text-white">
                    1
                  </Heading>
                </div>
                <div>
                  <Heading as="h3" variant="h3" className="mb-2 text-foreground">
                    Kurator*innen entdecken
                  </Heading>
                  <Text variant="body" className="text-foreground leading-relaxed">
                    Stöbere durch unsere vielfältige Community von Buchexpert*innen und finde deine 
                    Lieblingskurator*innen – basierend auf Geschmack, Genre-Expertise oder Persönlichkeit.
                  </Text>
                </div>
              </div>

              {/* Step 2 */}
              <div 
                className="flex gap-6 items-start p-6 rounded-2xl"
                style={{ backgroundColor: 'var(--color-beige)' }}
              >
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: 'var(--color-blue)' }}
                  role="img"
                  aria-label="Schritt 2"
                >
                  <Heading as="span" variant="h3" className="!text-white">
                    2
                  </Heading>
                </div>
                <div>
                  <Heading as="h3" variant="h3" className="mb-2 text-foreground">
                    Listen durchstöbern
                  </Heading>
                  <Text variant="body" className="text-foreground leading-relaxed">
                    Jede*r Kurator*in erstellt thematische Listen – von „Sommerromane für den Strand" bis 
                    „Philosophie für Einsteiger*innen". Finde die perfekte Liste für deinen nächsten Lesemoment.
                  </Text>
                </div>
              </div>

              {/* Step 3 */}
              <div 
                className="flex gap-6 items-start p-6 rounded-2xl"
                style={{ backgroundColor: 'var(--color-beige)' }}
              >
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'var(--color-saffron)',
                    color: 'var(--color-charcoal)'
                  }}
                  role="img"
                  aria-label="Schritt 3"
                >
                  <Heading as="span" variant="h3" className="text-charcoal">
                    3
                  </Heading>
                </div>
                <div>
                  <Heading as="h3" variant="h3" className="mb-2 text-foreground">
                    Bücher kaufen & unterstützen
                  </Heading>
                  <Text variant="body" className="text-foreground leading-relaxed">
                    Kaufe deine Lieblingsbücher direkt über die Empfehlungen – und unterstütze dabei automatisch 
                    deine Kurator*innen durch faire Provisionen.
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Wer steckt dahinter? */}
          <div>
            <Heading as="h2" variant="h2" className="mb-6 text-foreground">
              Wer steckt dahinter?
            </Heading>
            <div 
              className="p-8 rounded-2xl"
              style={{ backgroundColor: 'var(--color-beige)' }}
            >
              <Text variant="body" className="mb-4 !text-foreground leading-relaxed">
                coratiert.de wird von <strong>Timm Rohles</strong> betrieben – einem Buchliebhaber, 
                der an die Kraft persönlicher Empfehlungen glaubt und die digitale Buchbranche 
                menschlicher gestalten möchte.
              </Text>
              <Text variant="body" className="!text-foreground leading-relaxed">
                Fragen, Anregungen oder Interesse an einer Kurator*innen-Partnerschaft?<br />
                <strong>E-Mail:</strong> <a href="mailto:info@coratiert.de" className="underline hover:opacity-80" style={{ color: 'var(--color-blue)' }}>info@coratiert.de</a><br />
                <strong>Telefon:</strong> <a href="tel:+491752082594" className="underline hover:opacity-80" style={{ color: 'var(--color-blue)' }}>+49 175 2082594</a>
              </Text>
            </div>
          </div>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}