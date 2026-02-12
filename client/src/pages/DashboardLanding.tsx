import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useSafeNavigate();
  const [userModules] = useState({
    storefront: true,
    author: true,
    publisher: true
  });

  return (
    <>
      <Helmet>
        <title>{t('dashboardLanding.title')}</title>
        <meta name="description" content={t('dashboardLanding.metaDescription')} />
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
              {t('dashboardLanding.heroTitle')}
            </Heading>
            
            <Text variant="large" className="max-w-3xl" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
              {t('dashboardLanding.heroDescription')}
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
                  {t('dashboardLanding.creatorTitle')}
                </h3>
                
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>
                    <CheckCircle className="w-4 h-4" />
                    {t('common.active')}
                  </span>
                </div>

                <p className="text-sm md:text-base mb-6" style={{ color: '#6B7280' }}>
                  {t('dashboardLanding.creatorDescription')}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    {t('dashboardLanding.creatorFeature1')}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    {t('dashboardLanding.creatorFeature2')}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    {t('dashboardLanding.creatorFeature3')}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                    {t('dashboardLanding.creatorFeature4')}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard/home')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                >
                  {t('dashboardLanding.creatorCta')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Author Access */}
            <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {t('dashboardLanding.authorTitle')}
                </h3>
                
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#FED7AA', color: '#F97316' }}>
                    <CheckCircle className="w-4 h-4" />
                    {t('common.active')}
                  </span>
                </div>

                <p className="text-sm md:text-base mb-6" style={{ color: '#6B7280' }}>
                  {t('dashboardLanding.authorDescription')}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    {t('dashboardLanding.authorFeature1')}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    {t('dashboardLanding.authorFeature2')}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    {t('dashboardLanding.authorFeature3')}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    {t('dashboardLanding.authorFeature4')}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard/home')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#F97316', color: '#FFFFFF' }}
                >
                  {t('dashboardLanding.authorCta')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Publisher Access */}
            <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {t('dashboardLanding.publisherTitle')}
                </h3>
                
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#DBEAFE', color: '#247ba0' }}>
                    <CheckCircle className="w-4 h-4" />
                    {t('common.active')}
                  </span>
                </div>

                <p className="text-sm md:text-base mb-6" style={{ color: '#6B7280' }}>
                  {t('dashboardLanding.publisherDescription')}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#247ba0' }}></div>
                    {t('dashboardLanding.publisherFeature1')}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#247ba0' }}></div>
                    {t('dashboardLanding.publisherFeature2')}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#247ba0' }}></div>
                    {t('dashboardLanding.publisherFeature3')}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#247ba0' }}></div>
                    {t('dashboardLanding.publisherFeature4')}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/publisher-dashboard')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                >
                  {t('dashboardLanding.publisherCta')}
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
                  {t('dashboardLanding.infoTitle')}
                </h3>
                <div className="space-y-3 text-sm md:text-base" style={{ color: '#6B7280' }}>
                  <p>
                    <strong style={{ color: '#3A3A3A' }}>{t('dashboardLanding.infoCreatorLabel')}</strong> {t('dashboardLanding.infoCreatorText')}
                  </p>
                  <p>
                    <strong style={{ color: '#3A3A3A' }}>{t('dashboardLanding.infoAuthorLabel')}</strong> {t('dashboardLanding.infoAuthorText')}
                  </p>
                  <p>
                    <strong style={{ color: '#3A3A3A' }}>{t('dashboardLanding.infoPublisherLabel')}</strong> {t('dashboardLanding.infoPublisherText')}
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
              {t('dashboardLanding.backToHome')}
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
