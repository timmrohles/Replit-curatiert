import React, { useState } from 'react';
import { useSafeNavigate } from '../utils/routing';
import { ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Helmet } from 'react-helmet-async';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Container } from '../components/ui/container';
import { Section } from '../components/ui/section';
import { Heading, Text } from '../components/ui/typography';

export default function DashboardLanding() {
  const navigate = useSafeNavigate();
  const [userModules] = useState({
    storefront: true, // Always available
    author: true, // Vorläufig freigeschaltet
    publisher: true // Vorläufig freigeschaltet
  });

  return (
    <>
      <Helmet>
        <title>Dashboard | coratiert.de</title>
        <meta name="description" content="Verwalte deine Creator Storefront, Autor-Profile und Verlagsinhalte - alles an einem Ort." />
      </Helmet>
      
      <Header />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Start", href: "/", onClick: () => navigate('/') },
          { label: "Dashboard" }
        ]}
      />

      {/* Hero Section */}
      <Section variant="hero" className="!py-8 !bg-[var(--color-beige,#f7f4ef)]">
        <Container>
          <div className="-mt-4">
            <Heading 
              as="h1" 
              variant="h1" 
              className="mb-4"
              style={{ color: 'var(--charcoal, #2a2a2a)' }}
            >
              Willkommen in deinem Dashboard
            </Heading>
            
            <Text variant="large" className="max-w-3xl" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
              Erstelle deine eigene Storefront, verwalte deine Bücher als Autor oder präsentiere dein Verlagsprogramm - alles an einem Ort.
            </Text>
          </div>
        </Container>
      </Section>
      
      <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Storefront - Always Available */}
            <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  Creator Storefront
                </h3>
                
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>
                    <CheckCircle className="w-4 h-4" />
                    Aktiv
                  </span>
                </div>

                <p className="text-sm md:text-base mb-6" style={{ color: '#6B7280' }}>
                  Deine persönliche Storefront ist bereits freigeschaltet. Erstelle Reviews, teile Empfehlungen und baue deine Community auf.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    Creator Reviews erstellen
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    Dashboard Ratings verwalten
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    Events & Veranstaltungen
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    Analytics & Statistiken
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard/home')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                >
                  Zum Creator Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Author Access */}
            <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  Autor Dashboard
                </h3>
                
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#FED7AA', color: '#F97316' }}>
                    <CheckCircle className="w-4 h-4" />
                    Aktiv
                  </span>
                </div>

                <p className="text-sm md:text-base mb-6" style={{ color: '#6B7280' }}>
                  Als verifizierter Autor erhältst du erweiterte Features für die Verwaltung deiner Bücher und die Interaktion mit deinen Lesern.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    Eigene Bücher verwalten
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    Bonuscontent veröffentlichen
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    Bookclub & Community
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    Lesungen & Events
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard/home')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#F97316', color: '#FFFFFF' }}
                >
                  Zum Autor Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Publisher Access */}
            <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  Verlags Dashboard
                </h3>
                
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#DBEAFE', color: '#247ba0' }}>
                    <CheckCircle className="w-4 h-4" />
                    Aktiv
                  </span>
                </div>

                <p className="text-sm md:text-base mb-6" style={{ color: '#6B7280' }}>
                  Als Verlag erhältst du professionelle Tools zur Verwaltung deines Programms und zur Präsentation deiner Autor:innen.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#247ba0' }}></div>
                    Verlagsprogramm verwalten
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#247ba0' }}></div>
                    Autor:innen präsentieren
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#247ba0' }}></div>
                    Veranstaltungen planen
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#247ba0' }}></div>
                    Analytics & Insights
                  </div>
                </div>

                <button
                  onClick={() => navigate('/publisher-dashboard')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                >
                  Zum Verlags Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 rounded-xl p-6 md:p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <div className="flex items-start gap-4">
              <div>
                <h3 className="text-lg md:text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  Wie funktioniert die Freischaltung?
                </h3>
                <div className="space-y-3 text-sm md:text-base" style={{ color: '#6B7280' }}>
                  <p>
                    <strong style={{ color: '#3A3A3A' }}>Creator Storefront:</strong> Ist für alle Nutzer sofort verfügbar. 
                    Du kannst direkt loslegen und deine eigene Storefront erstellen.
                  </p>
                  <p>
                    <strong style={{ color: '#3A3A3A' }}>Autor Dashboard:</strong> Beantrage den Zugang mit einem Klick. 
                    Wir prüfen deine Anfrage und schalten dich als Autor frei, sobald wir deine Identität verifiziert haben.
                  </p>
                  <p>
                    <strong style={{ color: '#3A3A3A' }}>Verlags Dashboard:</strong> Für Verlage bieten wir umfangreiche 
                    Verwaltungstools. Nach Prüfung deiner Anfrage erhältst du Zugang zum vollständigen Verlags-Backend.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
              style={{ backgroundColor: '#FFFFFF', color: '#247ba0', border: '1px solid #E5E7EB' }}
            >
              Zurück zur Startseite
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}