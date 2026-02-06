import { ArrowRight, Award } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Author {
  id: string;
  name: string;
  photo: string;
  bio: string;
  isManagedByPublisher?: boolean;
}

interface PublisherAuthorsModuleProps {
  authors: Author[];
  backgroundColor?: string;
  onAuthorClick?: (authorId: string) => void;
}

export function PublisherAuthorsModule({ 
  authors,
  backgroundColor = '#F5F5F5',
  onAuthorClick
}: PublisherAuthorsModuleProps) {
  
  return (
    <section 
      className="py-16 px-4 md:px-8"
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h2 
            className="mb-2"
            style={{ 
              fontFamily: 'Fjalla One',
              color: '#3A3A3A'
            }}
          >
            Unsere Autor:innen
          </h2>
          <p style={{ color: '#666666' }}>
            Entdecke die kreativen Köpfe hinter unseren Büchern
          </p>
        </div>

        {/* Authors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {authors.map((author) => (
            <div 
              key={author.id}
              onClick={() => onAuthorClick?.(author.id)}
              className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#247ba0] transition-all cursor-pointer group"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              {/* Author Photo */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {author.photo ? (
                  <ImageWithFallback
                    src={author.photo}
                    alt={author.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span 
                      style={{ 
                        fontFamily: 'Fjalla One',
                        fontSize: '48px',
                        color: '#999999'
                      }}
                    >
                      {author.name.charAt(0)}
                    </span>
                  </div>
                )}
                
                {/* Verified Badge */}
                {author.isManagedByPublisher && (
                  <div className="absolute top-3 right-3 bg-[#70c1b3] rounded-full p-2">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Author Info */}
              <div className="p-5">
                <h3 
                  className="mb-2 group-hover:text-[#247ba0] transition-colors"
                  style={{ 
                    fontFamily: 'Fjalla One',
                    color: '#3A3A3A',
                    fontSize: '18px'
                  }}
                >
                  {author.name}
                </h3>
                <p 
                  className="text-sm mb-3 line-clamp-2"
                  style={{ color: '#666666' }}
                >
                  {author.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}