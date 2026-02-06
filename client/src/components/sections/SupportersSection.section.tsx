// ============================================================================
// Supporters Section - Frontend Render Component
// ============================================================================

import querverlagLogo from "figma:asset/d01817481afdab02c7098f64c557add4e12cab5a.png";
import { SupportersSectionProps, Supporter } from './SupportersSection.schema';

export function SupportersSection({ supporters: propSupporters }: SupportersSectionProps = {}) {
  const supporters: Supporter[] = propSupporters || [
    {
      name: "Querverlag",
      logo: querverlagLogo,
      quote: "Wir unterstützen die Idee von coratiert"
    }
  ];

  return (
    <section className="py-8 md:py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto" style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.5rem' }}>
        <h2 
          className="mb-8 md:mb-12 text-center leading-tight text-[2rem] md:text-[2.5rem] lg:text-[3rem]"
          style={{ 
            fontFamily: 'Fjalla One',
            letterSpacing: '0.02em',
            color: '#2a2a2a'
          }}
        >
          UNSERE UNTERSTÜTZER
        </h2>
        
        {supporters.map((supporter, index) => (
          <div 
            key={index}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 h-24 flex items-center justify-center">
              <img 
                src={supporter.logo} 
                alt={supporter.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            
            <p 
              className="italic text-base md:text-lg lg:text-xl leading-relaxed max-w-4xl mx-auto"
              style={{ fontFamily: 'Inter', color: '#2a2a2a' }}
            >
              "{supporter.quote}"
            </p>
            
            <p 
              className="mt-4 text-sm md:text-base"
              style={{ fontFamily: 'Inter', fontWeight: 600, color: '#2a2a2a' }}
            >
              — Jim Baker, Geschäftsführer, {supporter.name}
            </p>
          </div>
        ))}

      </div>
    </section>
  );
}
