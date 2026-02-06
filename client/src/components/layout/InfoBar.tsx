import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
interface BannerConfig {
  visible: boolean;
  message: string;
  badge_text: string | null;
  button_text: string | null;
  button_url: string | null;
}

export function InfoBar() {
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBannerConfig = async () => {
      try {
        const response = await fetch(
          `/api/api/site-config/banner`,
          {
            headers: {
            },
          }
        );

        if (!response.ok) {
          console.warn('⚠️ Banner config not available, using defaults');
          setConfig({
            visible: true,
            message: 'Diese Seite befindet sich derzeit in der Beta-Phase',
            badge_text: 'NEU',
            button_text: null,
            button_url: null,
          });
          return;
        }

        const data = await response.json();
        
        if (data.ok && data.banner) {
          setConfig(data.banner);
        } else {
          // Fallback to defaults
          setConfig({
            visible: true,
            message: 'Diese Seite befindet sich derzeit in der Beta-Phase',
            badge_text: 'NEU',
            button_text: null,
            button_url: null,
          });
        }
      } catch (error) {
        console.error('❌ Error fetching banner config:', error);
        // Fallback to defaults
        setConfig({
          visible: true,
          message: 'Diese Seite befindet sich derzeit in der Beta-Phase',
          badge_text: 'NEU',
          button_text: null,
          button_url: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBannerConfig();
  }, []);

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Don't render if not visible or no config
  if (!config || !config.visible) {
    return null;
  }

  return (
    <div 
      className="w-full py-2 md:py-2.5 px-4 md:px-6 text-center bg-blue"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs md:text-sm flex-wrap">
        {config.badge_text && (
          <span 
            className="px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs mr-1 md:mr-2"
            style={{ 
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-black)',
              fontFamily: 'Fjalla One, sans-serif'
            }}
          >
            {config.badge_text}
          </span>
        )}
        
        <span className="text-white text-xs md:text-sm">
          {config.message}
        </span>

        {config.button_text && config.button_url && (
          <a
            href={config.button_url}
            className="ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80"
            style={{ 
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-black)',
            }}
          >
            {config.button_text}
            <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
