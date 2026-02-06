import { Search, ExternalLink } from 'lucide-react';
import { SEOMetadata, isMetaTitleValid, isMetaDescriptionValid } from '../seo/SEOHead';
import { useState } from 'react';

interface SEOPreviewProps {
  metadata: SEOMetadata;
  url?: string;
}

export function SEOPreview({ metadata, url }: SEOPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile'); // Default: Mobile-First!
  
  const displayUrl = url || metadata.canonicalUrl || 'coratiert.de/page';
  const domain = displayUrl.replace(/^https?:\/\//, '').split('/')[0];
  const path = displayUrl.replace(/^https?:\/\/[^/]+/, '');

  const titleValidation = isMetaTitleValid(metadata.metaTitle || metadata.title || '');
  const descriptionValidation = isMetaDescriptionValid(metadata.metaDescription || '');

  // Truncate for mobile
  const mobileTitle = (metadata.metaTitle || metadata.title || 'Seitentitel fehlt').substring(0, 50);
  const mobileDescription = (metadata.metaDescription || 'Meta-Beschreibung fehlt...').substring(0, 120);

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('mobile')}
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{
            backgroundColor: viewMode === 'mobile' ? '#247ba0' : '#E5E7EB',
            color: viewMode === 'mobile' ? '#FFFFFF' : '#666666'
          }}
        >
          📱 Mobile (50 Zeichen)
        </button>
        <button
          onClick={() => setViewMode('desktop')}
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{
            backgroundColor: viewMode === 'desktop' ? '#247ba0' : '#E5E7EB',
            color: viewMode === 'desktop' ? '#FFFFFF' : '#666666'
          }}
        >
          💻 Desktop (60 Zeichen)
        </button>
      </div>

      {/* Google Search Preview */}
      <div 
        className="border rounded-lg p-4" 
        style={{ 
          borderColor: '#E5E7EB', 
          backgroundColor: '#FFFFFF',
          maxWidth: viewMode === 'mobile' ? '375px' : '600px'
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4" style={{ color: '#70c1b3' }} />
          <span className="text-sm" style={{ color: '#666666' }}>
            Google Vorschau ({viewMode === 'mobile' ? 'Mobile' : 'Desktop'})
          </span>
        </div>
        
        <div className="max-w-2xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mb-1 text-sm" style={{ color: '#5F6368' }}>
            <span>{domain}</span>
            <span>›</span>
            <span className="truncate">{path}</span>
          </div>

          {/* Title */}
          <div 
            className="text-xl mb-1 hover:underline cursor-pointer"
            style={{ color: '#1A0DAB' }}
          >
            {viewMode === 'mobile' ? mobileTitle : metadata.metaTitle || metadata.title || 'Seitentitel fehlt'}
          </div>

          {/* Description */}
          <div className="text-sm" style={{ color: '#4D5156', lineHeight: '1.58' }}>
            {viewMode === 'mobile' ? mobileDescription : metadata.metaDescription || 'Meta-Beschreibung fehlt – Diese wird in den Google-Suchergebnissen angezeigt und sollte 120-160 Zeichen lang sein.'}
          </div>
        </div>
      </div>

      {/* Validation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Title Validation */}
        <div 
          className="p-3 rounded-lg border"
          style={{ 
            borderColor: titleValidation.valid ? '#70c1b3' : '#f25f5c',
            backgroundColor: titleValidation.valid ? '#70c1b310' : '#f25f5c10'
          }}
        >
          <div className="text-sm mb-1" style={{ color: '#3A3A3A', fontWeight: 600 }}>
            Meta-Titel
          </div>
          <div 
            className="text-xs"
            style={{ color: titleValidation.valid ? '#70c1b3' : '#f25f5c' }}
          >
            {titleValidation.message}
          </div>
        </div>

        {/* Description Validation */}
        <div 
          className="p-3 rounded-lg border"
          style={{ 
            borderColor: descriptionValidation.valid ? '#70c1b3' : '#f25f5c',
            backgroundColor: descriptionValidation.valid ? '#70c1b310' : '#f25f5c10'
          }}
        >
          <div className="text-sm mb-1" style={{ color: '#3A3A3A', fontWeight: 600 }}>
            Meta-Description
          </div>
          <div 
            className="text-xs"
            style={{ color: descriptionValidation.valid ? '#70c1b3' : '#f25f5c' }}
          >
            {descriptionValidation.message}
          </div>
        </div>
      </div>

      {/* Social Media Preview (Open Graph) */}
      {metadata.ogImage && (
        <div className="border rounded-lg p-4" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-4 h-4" style={{ color: '#247ba0' }} />
            <span className="text-sm" style={{ color: '#666666' }}>Social Media Vorschau (Facebook, LinkedIn)</span>
          </div>
          
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
            {metadata.ogImage && (
              <img 
                src={metadata.ogImage} 
                alt="OG Preview" 
                className="w-full h-48 object-cover"
                style={{ backgroundColor: '#F5F5F5' }}
              />
            )}
            <div className="p-3" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="text-xs mb-1" style={{ color: '#65676B', textTransform: 'uppercase' }}>
                {domain}
              </div>
              <div className="text-sm mb-1" style={{ color: '#1C1E21', fontWeight: 600 }}>
                {metadata.ogTitle || metadata.metaTitle || metadata.title || 'Titel'}
              </div>
              <div className="text-xs" style={{ color: '#65676B' }}>
                {metadata.ogDescription || metadata.metaDescription || 'Beschreibung'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}