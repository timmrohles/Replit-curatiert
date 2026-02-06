interface VideoEmbedProps {
  url: string;
  className?: string;
}

// Helper function to extract video ID and type from URL
function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo' | 'direct'; id?: string; embedUrl?: string } | null {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/
  ];
  
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        type: 'youtube',
        id: match[1],
        embedUrl: `https://www.youtube.com/embed/${match[1]}`
      };
    }
  }
  
  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ];
  
  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        type: 'vimeo',
        id: match[1],
        embedUrl: `https://player.vimeo.com/video/${match[1]}`
      };
    }
  }
  
  // Direct video URL (uploaded videos)
  if (url.match(/\.(mp4|webm|ogg)$/i) || url.includes('supabase.co/storage')) {
    return {
      type: 'direct',
      embedUrl: url
    };
  }
  
  return null;
}

export function VideoEmbed({ url, className = '' }: VideoEmbedProps) {
  const videoData = parseVideoUrl(url);
  
  if (!videoData) {
    return null;
  }
  
  if (videoData.type === 'direct') {
    return (
      <div className={`relative w-full ${className}`}>
        <video 
          controls 
          className="w-full h-full rounded-lg"
          style={{ objectFit: 'cover' }}
        >
          <source src={videoData.embedUrl} type="video/mp4" />
          Ihr Browser unterstützt das Video-Tag nicht.
        </video>
      </div>
    );
  }
  
  // YouTube or Vimeo iframe
  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={videoData.embedUrl}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 'none' }}
      />
    </div>
  );
}
