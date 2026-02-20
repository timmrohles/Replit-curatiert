import { sanitizeHTML } from '../../utils/sanitize';

interface ContentBlock {
  id: string;
  type: 'heading' | 'text' | 'html' | 'books-grid' | 'books-carousel' | 'hero' | 'spacer';
  content: any;
  order: number;
}

interface DynamicPageContentRendererProps {
  content: string;
}

export function DynamicPageContentRenderer({ content }: DynamicPageContentRendererProps) {
  let blocks: ContentBlock[] = [];

  // Try to parse content as JSON blocks
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      blocks = parsed;
    }
  } catch {
    // If parsing fails, treat as plain HTML
    return (
      <div className="max-w-4xl mx-auto prose prose-invert">
        <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center text-white/60">
        <p>Inhalt wird bald hinzugefügt.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {blocks
        .sort((a, b) => a.order - b.order)
        .map((block) => (
          <ContentBlockRenderer key={block.id} block={block} />
        ))}
    </div>
  );
}

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      const HeadingTag = block.content?.level || 'h2';
      return (
        <HeadingTag
          className={`${HeadingTag === 'h1' ? 'text-5xl' : HeadingTag === 'h2' ? 'text-4xl' : 'text-3xl'}`}
          style={{
            fontFamily: 'Fjalla One',
            letterSpacing: '0.02em',
            color: '#3A3A3A',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
          }}
        >
          {block.content?.text || ''}
        </HeadingTag>
      );

    case 'text':
      return (
        <div className="prose prose-lg max-w-none">
          <p style={{ color: '#FFFFFF', lineHeight: '1.8' }}>
            {block.content?.text || ''}
          </p>
        </div>
      );

    case 'html':
      return (
        <div
          className="prose prose-lg max-w-none prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(block.content?.html || '') }}
        />
      );

    case 'hero':
      return (
        <div className="text-center py-12 px-4">
          <h2
            className="text-4xl md:text-5xl mb-6"
            style={{
              fontFamily: 'Fjalla One',
              letterSpacing: '0.02em',
              color: '#3A3A3A',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
            }}
          >
            {block.content?.title || ''}
          </h2>
          {block.content?.description && (
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              {block.content.description}
            </p>
          )}
        </div>
      );

    case 'spacer':
      const heightMap: Record<string, string> = {
        small: '2rem',
        medium: '4rem',
        large: '6rem',
        xlarge: '8rem'
      };
      const height = heightMap[block.content?.height || 'medium'] || '4rem';
      return <div style={{ height }} />;

    case 'books-grid':
      return (
        <div className="text-center text-white/60">
          <p>Bücher Grid (noch nicht implementiert)</p>
        </div>
      );

    case 'books-carousel':
      return (
        <div className="text-center text-white/60">
          <p>Bücher Carousel (noch nicht implementiert)</p>
        </div>
      );

    default:
      return null;
  }
}
