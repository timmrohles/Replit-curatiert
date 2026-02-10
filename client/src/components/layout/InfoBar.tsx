import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
interface BannerConfig {
  visible: boolean;
  message: string;
  badge_text: string | null;
  button_text: string | null;
  button_url: string | null;
  bg_color: string;
  text_color: string;
  badge_bg_color: string;
  badge_text_color: string;
}

const DEFAULT_BANNER: BannerConfig = {
  visible: true,
  message: 'Diese Seite befindet sich derzeit in der Beta-Phase',
  badge_text: 'NEU',
  button_text: null,
  button_url: null,
  bg_color: '#247ba0',
  text_color: '#ffffff',
  badge_bg_color: '#ffe066',
  badge_text_color: '#2a2a2a',
};

export function InfoBar() {
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBannerConfig = async () => {
      try {
        const response = await fetch(
          `/api/site-config/banner`,
          {
            headers: {
            },
          }
        );

        if (!response.ok) {
          setConfig(DEFAULT_BANNER);
          return;
        }

        const data = await response.json();
        
        if (data.ok && data.banner) {
          setConfig({
            ...data.banner,
            bg_color: data.banner.bg_color || DEFAULT_BANNER.bg_color,
            text_color: data.banner.text_color || DEFAULT_BANNER.text_color,
            badge_bg_color: data.banner.badge_bg_color || DEFAULT_BANNER.badge_bg_color,
            badge_text_color: data.banner.badge_text_color || DEFAULT_BANNER.badge_text_color,
          });
        } else {
          setConfig(DEFAULT_BANNER);
        }
      } catch (error) {
        console.error('Error fetching banner config:', error);
        setConfig(DEFAULT_BANNER);
      } finally {
        setLoading(false);
      }
    };

    fetchBannerConfig();
  }, []);

  if (loading) {
    return null;
  }

  if (!config || !config.visible) {
    return null;
  }

  return (
    <div 
      className="w-full py-2 md:py-2.5 px-4 md:px-6 text-center"
      style={{ backgroundColor: config.bg_color }}
      data-testid="site-banner"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs md:text-sm flex-wrap">
        {config.badge_text && (
          <span 
            className="px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs mr-1 md:mr-2"
            style={{ 
              backgroundColor: config.badge_bg_color,
              color: config.badge_text_color,
              fontFamily: 'Fjalla One, sans-serif'
            }}
          >
            {config.badge_text}
          </span>
        )}
        
        <span
          className="text-xs md:text-sm"
          style={{ color: config.text_color }}
        >
          {config.message}
        </span>

        {config.button_text && config.button_url && (
          <a
            href={config.button_url}
            className="ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: config.badge_bg_color,
              color: config.badge_text_color,
            }}
            data-testid="banner-cta-button"
          >
            {config.button_text}
            <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
