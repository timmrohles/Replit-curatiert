import { useSafeNavigate } from '../utils/routing';
import { Heart, Users, Lightbulb, Globe, Target, Compass, Sparkles } from 'lucide-react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Container, Section, Heading, Text } from '../components/ui';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { InfoBar } from '../components/layout/InfoBar';
import { Helmet } from 'react-helmet-async';

export default function Mission() {
  const navigate = useSafeNavigate();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Mission', href: '/mission' }
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />

      <Helmet>
        <title>Unsere Mission | coratiert.de</title>
        <meta name="description" content="Bücher entdecken durch persönliche Empfehlungen statt Algorithmen" />
        <link rel="canonical" href="https://coratiert.de/mission/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "@id": "https://coratiert.de/mission/",
            "name": "Unsere Mission",
            "description": "Bücher entdecken durch persönliche Empfehlungen statt Algorithmen",
            "url": "https://coratiert.de/mission/",
            "mainEntity": {
              "@type": "Organization",
              "@id": "https://coratiert.de/#organization",
              "name": "coratiert.de",
              "mission": "Bücher entdecken durch persönliche Empfehlungen statt Algorithmen. Wir glauben an die Kraft kuratierter Buchempfehlungen von echten Menschen."
            }
          })}
        </script>
      </Helmet>

      <Breadcrumb items={breadcrumbItems} />

      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="-mt-4">
            <Heading as="h1" variant="h1" className="mb-4 !text-foreground">
              UNSERE MISSION
            </Heading>
            <Text variant="large" className="max-w-3xl !text-foreground">
              Bücher entdecken durch persönliche Empfehlungen statt Algorithmen
            </Text>
          </div>
        </Container>
      </Section>

      {/* Content Section */}
      <Section variant="default">
        <Container>
          {/* Vision */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--vibrant-coral)' }}
                role="img"
                aria-label="Unsere Vision"
              >
                <Target className="w-6 h-6 text-white" />
              </div>
              <Heading as="h2" variant="h2" className="text-foreground">
                Unsere Vision
              </Heading>
            </div>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Wir glauben an die Kraft persönlicher Empfehlungen. In einer Zeit, in der Algorithmen entscheiden, 
              was wir lesen sollen, schaffen wir einen Raum für echte, kuratierte Buchempfehlungen von Menschen, 
              denen du vertraust.
            </Text>
            <Text variant="body" className="text-foreground leading-relaxed">
              coratiert.de ist mehr als nur eine Buchhandlung – es ist eine Community von Leser*innen, 
              Kurator*innen und Buchliebhaber*innen, die ihre Leidenschaft für großartige Literatur teilen.
            </Text>
          </div>

          {/* Unsere Werte */}
          <div className="mb-12">
            <Heading as="h2" variant="h2" className="mb-8 text-center text-foreground">
              Unsere Werte
            </Heading>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Kuration statt Algorithmen */}
              <div 
                className="p-6 rounded-2xl border-2"
                style={{ 
                  borderColor: 'var(--vibrant-coral)',
                  backgroundColor: 'var(--color-surface)'
                }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--vibrant-coral)' }}
                  role="img"
                  aria-label="Kuration statt Algorithmen"
                >
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <Heading as="h3" variant="h3" className="mb-3 text-foreground">
                  Kuration statt Algorithmen
                </Heading>
                <Text variant="body" className="text-foreground leading-relaxed">
                  Jede Empfehlung kommt von echten Menschen mit Expertise und Leidenschaft. 
                  Keine künstliche Intelligenz, keine anonymen Bestseller-Listen – nur authentische 
                  Empfehlungen von Kurator*innen, die ihre Bücher lieben.
                </Text>
              </div>

              {/* Community First */}
              <div 
                className="p-6 rounded-2xl border-2"
                style={{ 
                  borderColor: 'var(--color-blue)',
                  backgroundColor: 'var(--color-surface)'
                }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-blue)' }}
                  role="img"
                  aria-label="Community First"
                >
                  <Users className="w-7 h-7 text-white" />
                </div>
                <Heading as="h3" variant="h3" className="mb-3 text-foreground">
                  Community First
                </Heading>
                <Text variant="body" className="text-foreground leading-relaxed">
                  Wir sind eine Plattform von Leser*innen für Leser*innen. Jede*r kann Kurator*in werden, 
                  Listen erstellen und die eigene Bibliothek mit anderen teilen. Gemeinsam entdecken wir 
                  Bücher, die wirklich bewegen.
                </Text>
              </div>

              {/* Vielfalt & Diversität */}
              <div 
                className="p-6 rounded-2xl border-2"
                style={{ 
                  borderColor: 'var(--color-saffron)',
                  backgroundColor: 'var(--color-surface)'
                }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-saffron)' }}
                  role="img"
                  aria-label="Vielfalt & Diversität"
                >
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <Heading as="h3" variant="h3" className="mb-3 text-foreground">
                  Vielfalt & Diversität
                </Heading>
                <Text variant="body" className="text-foreground leading-relaxed">
                  Wir feiern die Vielfalt der Literatur. Von Mainstream bis Nische, von Klassikern bis 
                  zu Independent-Verlagen – bei uns findet jede*r die Bücher, die zu ihrem oder seinem 
                  Leben passen.
                </Text>
              </div>

              {/* Transparenz & Fair Trade */}
              <div 
                className="p-6 rounded-2xl border-2"
                style={{ 
                  borderColor: 'var(--color-teal)',
                  backgroundColor: 'var(--color-surface)'
                }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-teal)' }}
                  role="img"
                  aria-label="Transparenz & Fair Trade"
                >
                  <Lightbulb className="w-7 h-7 text-white" />
                </div>
                <Heading as="h3" variant="h3" className="mb-3 text-foreground">
                  Transparenz & Fair Trade
                </Heading>
                <Text variant="body" className="text-foreground leading-relaxed">
                  Wir arbeiten transparent mit Affiliate-Links und unterstützen faire Bedingungen für 
                  Autor*innen, Verlage und Buchhändler*innen. Deine Käufe helfen uns, diese Plattform 
                  zu betreiben – ohne versteckte Kosten für dich.
                </Text>
              </div>
            </div>
          </div>

          {/* Was uns antreibt */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-blue)' }}
                role="img"
                aria-label="Was uns antreibt"
              >
                <Compass className="w-6 h-6 text-white" />
              </div>
              <Heading as="h2" variant="h2" className="text-foreground">
                Was uns antreibt
              </Heading>
            </div>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Bücher haben die Kraft, Leben zu verändern. Sie öffnen neue Perspektiven, trösten in 
              schweren Zeiten, inspirieren zu großen Taten und begleiten uns ein Leben lang.
            </Text>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Doch in der Flut an Neuerscheinungen verlieren wir oft den Überblick. Algorithmen zeigen 
              uns nur, was wir bereits kennen. Bestseller-Listen spiegeln Marketingbudgets statt 
              literarische Qualität wider.
            </Text>
            <Text variant="body" className="text-foreground leading-relaxed">
              Deshalb haben wir coratiert.de gegründet: Um die persönliche Buchempfehlung zurückzubringen. 
              Um einen Ort zu schaffen, an dem du Bücher durch die Augen von Menschen entdeckst, die du 
              schätzt und denen du vertraust.
            </Text>
          </div>

          {/* Unsere Zukunft */}
          <div className="mb-8">
            <div 
              className="p-8 rounded-2xl"
              style={{ backgroundColor: 'var(--color-beige)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-8 h-8" style={{ color: 'var(--color-saffron)' }} aria-hidden="true" />
                <Heading as="h2" variant="h2" className="text-foreground">
                  Unsere Zukunft
                </Heading>
              </div>
              <Text variant="body" className="mb-4 text-foreground leading-relaxed">
                coratiert.de ist erst der Anfang. Wir arbeiten daran, die größte Community für 
                kuratierte Buchempfehlungen im deutschsprachigen Raum aufzubauen.
              </Text>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: 'var(--vibrant-coral)' }}
                    aria-hidden="true"
                  />
                  <Text variant="body" className="text-foreground leading-relaxed">
                    <strong>Mehr Kurator*innen:</strong> Wir laden Buchblogger*innen, Bookstagrammer*innen, 
                    Journalist*innen und alle Buchliebhaber*innen ein, ihre Empfehlungen zu teilen.
                  </Text>
                </div>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-blue)' }}
                    aria-hidden="true"
                  />
                  <Text variant="body" className="text-foreground leading-relaxed">
                    <strong>Mehr Features:</strong> Personalisierte Listen, Leseclubs, Live-Events mit 
                    Autor*innen und vieles mehr.
                  </Text>
                </div>
                <div className="flex items-start gap-3">
                  <div 
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-saffron)' }}
                    aria-hidden="true"
                  />
                  <Text variant="body" className="text-foreground leading-relaxed">
                    <strong>Mehr Zusammenarbeit:</strong> Partnerschaften mit Independent-Buchhandlungen, 
                    Verlagen und Lesefestivals.
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Heading as="h3" variant="h3" className="mb-4 text-foreground">
              Werde Teil unserer Mission
            </Heading>
            <Text variant="body" className="mb-6 max-w-2xl mx-auto text-foreground opacity-80 leading-relaxed">
              Ob als Leser*in oder Kurator*in – jede*r ist willkommen, die Zukunft des 
              Buchhandels mitzugestalten.
            </Text>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/curators')}
                className="px-8 py-4 rounded-xl text-white transition-all hover:scale-105 shadow-lg"
                style={{ 
                  backgroundColor: 'var(--vibrant-coral)',
                  fontFamily: 'var(--font-family-headline)',
                  fontSize: '18px'
                }}
                aria-label="Kurator*innen entdecken"
              >
                Kurator*innen entdecken
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 rounded-xl transition-all hover:scale-105 border-2 shadow-lg"
                style={{ 
                  borderColor: 'var(--color-blue)',
                  color: 'var(--color-blue)',
                  backgroundColor: 'var(--color-surface)',
                  fontFamily: 'var(--font-family-headline)',
                  fontSize: '18px'
                }}
                aria-label="Bücher entdecken"
              >
                Bücher entdecken
              </button>
            </div>
          </div>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}