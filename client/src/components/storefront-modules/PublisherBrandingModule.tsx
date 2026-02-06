import { Building2, Globe, MapPin } from 'lucide-react';

interface SocialMedia {
  youtube?: string;
  spotify?: string;
  podcast?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
}

interface PublisherBrandingModuleProps {
  publisherName: string;
  tagline?: string;
  logoUrl?: string;
  headerImage?: string;
  mission: string;
  themes?: string[];
  imprints?: string[];
  location?: string;
  backgroundColor?: string;
  socialMedia?: SocialMedia;
  isPremium?: boolean;
}

export function PublisherBrandingModule({ 
  publisherName,
  tagline,
  logoUrl,
  headerImage,
  mission,
  themes,
  imprints = [],
  location,
  backgroundColor,
  socialMedia,
  isPremium = false
}: PublisherBrandingModuleProps) {
  
  return (
    <section className="relative">
      {/* Premium Header Image */}
      {isPremium && headerImage && (
        <div className="relative w-full h-64 md:h-96 overflow-hidden">
          <img 
            src={headerImage} 
            alt={publisherName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Logo on Header */}
          {logoUrl && (
            <div className="absolute bottom-8 left-8">
              <img 
                src={logoUrl} 
                alt={publisherName}
                className="h-20 md:h-28 bg-white p-4 rounded-xl shadow-2xl"
              />
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Logo for non-premium */}
          {!isPremium && logoUrl && (
            <div className="mb-8">
              <img 
                src={logoUrl} 
                alt={publisherName}
                className="h-16 md:h-20"
              />
            </div>
          )}

          {/* Publisher Info */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Description */}
            <div className="md:col-span-2">
              <h2 
                className="mb-4"
                style={{ 
                  fontFamily: 'Fjalla One',
                  color: '#3A3A3A'
                }}
              >
                Über {publisherName}
              </h2>
              <p 
                className="mb-6 leading-relaxed"
                style={{ color: '#666666' }}
              >
                {mission}
              </p>

              {/* Themes */}
              {themes && (
                <div className="mb-6">
                  <h3 
                    className="mb-3 text-sm uppercase tracking-wide"
                    style={{ color: '#999999' }}
                  >
                    Schwerpunktthemen
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {themes.map((theme, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-full text-sm"
                        style={{ 
                          backgroundColor: '#247ba0',
                          color: '#FFFFFF'
                        }}
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Imprints */}
              {imprints.length > 0 && (
                <div>
                  <h3 
                    className="mb-3 text-sm uppercase tracking-wide"
                    style={{ color: '#999999' }}
                  >
                    Imprints
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {imprints.map((imprint, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-lg text-sm border"
                        style={{ 
                          borderColor: '#247ba0',
                          color: '#247ba0'
                        }}
                      >
                        {imprint}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Location */}
              {location && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-[#247ba0] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 
                        className="mb-1"
                        style={{ 
                          fontFamily: 'Fjalla One',
                          color: '#3A3A3A'
                        }}
                      >
                        Standort
                      </h4>
                      <p style={{ color: '#666666' }}>{location}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Website */}
              {socialMedia?.website && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-[#247ba0] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 
                        className="mb-1"
                        style={{ 
                          fontFamily: 'Fjalla One',
                          color: '#3A3A3A'
                        }}
                      >
                        Website
                      </h4>
                      <a 
                        href={socialMedia.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#247ba0] hover:underline break-all"
                      >
                        {socialMedia.website.replace('https://', '').replace('http://', '')}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Premium Badge */}
              {isPremium && (
                <div className="bg-gradient-to-br from-[#ffe066] to-[#f25f5c] rounded-xl p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5" />
                    <span 
                      style={{ 
                        fontFamily: 'Fjalla One',
                        fontSize: '18px'
                      }}
                    >
                      Premium Verlag
                    </span>
                  </div>
                  <p className="text-sm opacity-90">
                    Verifiziertes Profil mit erweiterten Features
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}