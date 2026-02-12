import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Container, Section, Heading, Text } from '../components/ui';

export default function Datenschutz() {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Datenschutz', href: '/datenschutz' }
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      {/* Canonical URL - SEO */}
      <link rel="canonical" href="https://coratiert.de/datenschutz/" />
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": "https://coratiert.de/datenschutz/",
          "name": "Datenschutzerklärung",
          "description": "Informationen zur Verarbeitung Ihrer personenbezogenen Daten gemäß DSGVO",
          "url": "https://coratiert.de/datenschutz/"
        })}
      </script>

      {/* Hero Section - Text linksbündig */}
      <Section variant="hero" className="bg-hero-blue !py-8">
        <Container>
          <div className="max-w-2xl">
            <Heading as="h1" variant="h1" className="mb-4 !text-foreground">
              DATENSCHUTZERKLÄRUNG
            </Heading>
            <Text variant="large" className="!text-foreground">
              Informationen zur Verarbeitung Ihrer personenbezogenen Daten gemäß DSGVO
            </Text>
          </div>
        </Container>
      </Section>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Content Section */}
      <Section variant="default">
        <Container>
          {/* 1. Datenschutz auf einen Blick */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              1. Datenschutz auf einen Blick
            </Heading>
            
            <Heading as="h3" variant="h3" className="mb-3 mt-6" style={{ color: 'var(--color-blue)' }}>
              Allgemeine Hinweise
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
              passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
              persönlich identifiziert werden können.
            </Text>

            <Heading as="h3" variant="h3" className="mb-3 mt-6" style={{ color: 'var(--color-blue)' }}>
              Datenerfassung auf dieser Website
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              <strong style={{ color: 'var(--vibrant-coral)' }}>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
              <br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
              können Sie dem Impressum entnehmen.
            </Text>

            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              <strong style={{ color: 'var(--vibrant-coral)' }}>Wie erfassen wir Ihre Daten?</strong>
              <br />
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um 
              Daten handeln, die Sie in ein Kontaktformular oder bei einer Registrierung eingeben.
            </Text>

            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor 
              allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung 
              dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
            </Text>

            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              <strong style={{ color: 'var(--vibrant-coral)' }}>Wofür nutzen wir Ihre Daten?</strong>
              <br />
              Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. 
              Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden (nur mit Ihrer Einwilligung).
            </Text>
          </div>

          {/* 2. Hosting und Content Delivery Networks */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              2. Hosting
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Diese Website wird bei einem externen Dienstleister (Hoster) gehostet. Die personenbezogenen Daten, 
              die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es 
              sich v.a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, 
              Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
            </Text>
            <Text variant="body" className="text-foreground leading-relaxed">
              Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und 
              bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und 
              effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
            </Text>
          </div>

          {/* 3. Allgemeine Hinweise und Pflichtinformationen */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              3. Allgemeine Hinweise und Pflichtinformationen
            </Heading>
            
            <Heading as="h3" variant="h3" className="mb-3 mt-6" style={{ color: 'var(--color-blue)' }}>
              Hinweis zur verantwortlichen Stelle
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              <br /><br />
              Timm Rohles<br />
              Pfarrstr. 130<br />
              10317 Berlin<br />
              Deutschland
              <br /><br />
              E-Mail:{' '}
              <a 
                href="mailto:info@coratiert.de"
                className="hover:underline"
                style={{ color: 'var(--color-blue)' }}
              >
                info@coratiert.de
              </a>
              <br />
              Telefon:{' '}
              <a 
                href="tel:+491752082594"
                className="hover:underline"
                style={{ color: 'var(--color-blue)' }}
              >
                +49 175 2082594
              </a>
            </Text>

            <Heading as="h3" variant="h3" className="mb-3 mt-6" style={{ color: 'var(--color-blue)' }}>
              Speicherdauer
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben 
              Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein 
              berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, 
              werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung 
              Ihrer personenbezogenen Daten haben (z.B. steuer- oder handelsrechtliche Aufbewahrungsfristen).
            </Text>

            <Heading as="h3" variant="h3" className="mb-3 mt-6" style={{ color: 'var(--color-blue)' }}>
              Ihre Rechte
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
              gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung 
              oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt 
              haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das 
              Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten 
              zu verlangen.
            </Text>

            <Heading as="h3" variant="h3" className="mb-3 mt-6" style={{ color: 'var(--color-blue)' }}>
              Widerspruch gegen Werbe-Mails
            </Heading>
            <Text variant="body" className="text-foreground leading-relaxed">
              Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von 
              nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. 
              Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten 
              Zusendung von Werbeinformationen, etwa durch Spam-E-Mails, vor.
            </Text>
          </div>

          {/* 4. Datenerfassung auf dieser Website */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              4. Datenerfassung auf dieser Website
            </Heading>
            
            <Heading as="h3" variant="h3" className="mb-3 mt-6" style={{ color: 'var(--color-blue)' }}>
              Server-Log-Dateien
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, 
              die Ihr Browser automatisch an uns übermittelt. Dies sind:
            </Text>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <Text as="li" variant="body" className="text-foreground">Browsertyp und Browserversion</Text>
              <Text as="li" variant="body" className="text-foreground">Verwendetes Betriebssystem</Text>
              <Text as="li" variant="body" className="text-foreground">Referrer URL</Text>
              <Text as="li" variant="body" className="text-foreground">Hostname des zugreifenden Rechners</Text>
              <Text as="li" variant="body" className="text-foreground">Uhrzeit der Serveranfrage</Text>
              <Text as="li" variant="body" className="text-foreground">IP-Adresse</Text>
            </ul>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser 
              Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes 
              Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website.
            </Text>

            <Heading as="h3" variant="h3" className="mb-3 mt-6" style={{ color: 'var(--color-blue)' }}>
              Kontaktformular
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular 
              inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall 
              von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
            </Text>
            <Text variant="body" className="text-foreground leading-relaxed">
              Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage 
              mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich 
              ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven 
              Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO).
            </Text>
          </div>

          {/* 5. Affiliate-Programme */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              5. Affiliate-Programme und externe Links
            </Heading>
            
            <Heading as="h3" variant="h3" className="mb-3 mt-6" style={{ color: 'var(--color-blue)' }}>
              Affiliate-Links
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Diese Website nutzt Affiliate-Links zu externen Online-Buchhändlern. Wenn Sie auf einen solchen Link 
              klicken und ein Produkt kaufen, erhalten wir eine Provision. Für Sie entstehen dabei keine zusätzlichen Kosten.
            </Text>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              <strong style={{ color: 'var(--vibrant-coral)' }}>Wichtig:</strong> Beim Klick auf Affiliate-Links 
              werden Sie an externe Websites weitergeleitet. Wir haben keinen Einfluss auf die Datenverarbeitung 
              dieser externen Anbieter. Bitte informieren Sie sich über die Datenschutzbestimmungen des jeweiligen 
              Anbieters, bevor Sie dort persönliche Daten eingeben.
            </Text>
            <Text variant="body" className="text-foreground leading-relaxed">
              Wir übermitteln <strong>keine personenbezogenen Daten</strong> (wie IP-Adressen oder Nutzerdaten) 
              an Affiliate-Partner. Die Provisionsabrechnung erfolgt über anonymisierte Tracking-IDs.
            </Text>
          </div>

          {/* 6. Cookies */}
          <div className="mb-10">
            <Heading as="h2" variant="h2" className="mb-4 text-foreground">
              6. Cookies
            </Heading>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die im Internetbrowser bzw. vom 
              Internetbrowser auf dem Computersystem eines Nutzers gespeichert werden. Ruft ein Nutzer eine Website auf, 
              so kann ein Cookie auf dem Betriebssystem des Nutzers gespeichert werden.
            </Text>
            <Text variant="body" className="mb-4 text-foreground leading-relaxed">
              Wir verwenden ausschließlich technisch notwendige Cookies, die für den Betrieb der Website erforderlich 
              sind (z.B. Session-Cookies). Diese Cookies werden automatisch nach Verlassen der Website gelöscht.
            </Text>
            <Text variant="body" className="text-foreground leading-relaxed">
              Analyse-Cookies oder Tracking-Cookies setzen wir nur mit Ihrer ausdrücklichen Einwilligung ein 
              (Art. 6 Abs. 1 lit. a DSGVO). Sie können Ihre Einwilligung jederzeit widerrufen.
            </Text>
          </div>

          {/* Footer */}
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
                href="https://www.e-recht24.de/impressum-generator.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: 'var(--color-blue)' }}
              >
                eRecht24
              </a>
            </Text>
          </div>
        </Container>
      </Section>
    </div>
  );
}