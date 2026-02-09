import { ArrowRight, Sparkles, BookOpen, Users } from 'lucide-react';
import { DSButton } from '../design-system/DSButton';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface HeroSectionProps {
  onNavigateToCreatorDashboard?: () => void;
}

export function HeroSection({ onNavigateToCreatorDashboard }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-[var(--color-brand-beige)] via-[var(--color-brand-beige)] to-[#f0e9df] overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large circle top right */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--color-brand-blue-light)] opacity-5 rounded-full blur-3xl"></div>
        {/* Small circle bottom left */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[var(--charcoal)] opacity-5 rounded-full blur-3xl"></div>
        {/* Decorative lines */}
        <svg className="absolute top-20 left-10 w-24 h-24 text-[var(--color-brand-blue-light)] opacity-10" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="10" cy="10" r="2" fill="currentColor" />
          <circle cx="30" cy="10" r="2" fill="currentColor" />
          <circle cx="50" cy="10" r="2" fill="currentColor" />
          <circle cx="10" cy="30" r="2" fill="currentColor" />
          <circle cx="30" cy="30" r="2" fill="currentColor" />
          <circle cx="50" cy="30" r="2" fill="currentColor" />
          <circle cx="10" cy="50" r="2" fill="currentColor" />
          <circle cx="30" cy="50" r="2" fill="currentColor" />
          <circle cx="50" cy="50" r="2" fill="currentColor" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20 relative">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-10 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            {/* Main Headline */}
            <div className="space-y-3">
              <h1 
                className="text-[var(--charcoal)] leading-tight text-[2rem] md:text-[2.75rem] lg:text-[3rem]"
                style={{ 
                  fontFamily: 'Fjalla One',
                  letterSpacing: '0.02em'
                }}
              >
                DEINE KURATIERTE<br />
                <span className="text-[var(--color-brand-blue-light)]">BUCHHANDLUNG</span>
              </h1>
              <p className="text-sm md:text-base text-[var(--color-brand-gray)] dark:text-foreground-muted max-w-xl" style={{ fontFamily: 'Inter' }}>
                Entdecke handverlesene Bücher – empfohlen von Kurator:innen, die ihre Leidenschaft teilen. 
                Nicht Algorithmen, sondern Menschen mit echtem Wissen und Begeisterung.
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 md:gap-6 pt-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-9 md:h-9 bg-[var(--charcoal)] rounded-full flex items-center justify-center">
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <div 
                    className="text-[var(--charcoal)] text-lg md:text-[1.5rem]"
                    style={{ fontFamily: 'Fjalla One' }}
                  >
                    2.847+
                  </div>
                  <div className="text-xs md:text-sm text-[var(--color-brand-gray)] dark:text-foreground-muted" style={{ fontFamily: 'Inter' }}>Kuratierte Bücher</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-9 md:h-9 bg-[var(--color-brand-blue-light)] rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <div 
                    className="text-[var(--charcoal)] text-lg md:text-[1.5rem]"
                    style={{ fontFamily: 'Fjalla One' }}
                  >
                    142+
                  </div>
                  <div className="text-xs md:text-sm text-[var(--color-brand-gray)] dark:text-foreground-muted" style={{ fontFamily: 'Inter' }}>Expert:innen</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <DSButton variant="primary" size="large" onClick={onNavigateToCreatorDashboard}>
                Kurator*in werden
                <ArrowRight className="w-5 h-5 ml-2" />
              </DSButton>
            </div>
          </div>

          {/* Right: Visual Grid */}
          <div className="relative">
            {/* Main large image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1755696923192-50f747eac1c5?w=800"
                alt="Kuratierte Bücher"
                className="w-full h-[350px] md:h-[500px] object-cover"
                loading="eager"
                fetchPriority="high"
              />
              {/* Overlay badge */}
              <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <ImageWithFallback 
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
                    alt="Curator"
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-[var(--color-brand-blue-light)]"
                  />
                  <div className="flex-1">
                    <div className="text-xs md:text-sm font-medium text-[var(--charcoal)]" style={{ fontFamily: 'Inter' }}>Lisa Weber</div>
                    <div className="text-[10px] md:text-xs text-[var(--color-brand-gray)] dark:text-foreground-muted" style={{ fontFamily: 'Inter' }}>Literaturkritikerin • 234 kuratierte Bücher</div>
                  </div>
                  <div className="text-[var(--color-brand-blue-light)]">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -top-8 -right-8 w-32 h-40 bg-white dark:bg-surface rounded-lg shadow-xl overflow-hidden border-2 border-[var(--color-brand-blue-light)] rotate-6 hidden lg:block" aria-hidden="true">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1547056358-c0c75aca6c5b?w=300"
                alt="Book"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 w-32 h-40 bg-white dark:bg-surface rounded-lg shadow-xl overflow-hidden border-2 border-[var(--charcoal)] -rotate-6 hidden lg:block" aria-hidden="true">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1703236079592-4d2f222e8d2f?w=300"
                alt="Book"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Decorative quote mark */}
            <div className="absolute -top-6 -left-6 w-16 h-16 text-[var(--color-brand-blue-light)] opacity-20 hidden lg:block" aria-hidden="true">
              <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
                <path d="M25,50 Q25,25 40,25 L40,35 Q30,35 30,50 L40,50 L40,75 L25,75 Z M60,50 Q60,25 75,25 L75,35 Q65,35 65,50 L75,50 L75,75 L60,75 Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/30 to-transparent"></div>
    </section>
  );
}