import { useState } from 'react';
import { Plus, Trash2, Copy, GripVertical, Type, Image as ImageIcon, BookOpen, Sparkles, Code } from 'lucide-react';
import { Page } from '../../utils/api';

// ===================================================================
// CONTENT BLOCK TYPES (Type-Safe)
// ===================================================================

type HeadingContent = {
  text: string;
  level: 'h1' | 'h2' | 'h3';
};

type TextContent = {
  text: string;
};

type HtmlContent = {
  html: string;
};

type HeroContent = {
  title: string;
  description: string;
};

type BooksGridContent = {
  bookIds: number[];
};

type BooksCarouselContent = {
  bookIds: number[];
};

type SpacerContent = {
  height: 'small' | 'medium' | 'large' | 'xlarge';
};

// Discriminated Union for Type Safety
type ContentBlock =
  | { id: string; type: 'heading'; content: HeadingContent; order: number }
  | { id: string; type: 'text'; content: TextContent; order: number }
  | { id: string; type: 'html'; content: HtmlContent; order: number }
  | { id: string; type: 'hero'; content: HeroContent; order: number }
  | { id: string; type: 'books-grid'; content: BooksGridContent; order: number }
  | { id: string; type: 'books-carousel'; content: BooksCarouselContent; order: number }
  | { id: string; type: 'spacer'; content: SpacerContent; order: number };

interface PageContentEditorProps {
  page: Partial<Page>;
  onUpdate: (page: Partial<Page>) => void;
}

export function PageContentEditor({ page, onUpdate }: PageContentEditorProps) {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(() => {
    // Parse existing content into blocks
    if (page.content && typeof page.content === 'string') {
      try {
        const parsed = JSON.parse(page.content);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // If content is plain HTML/text, wrap it in a single block
        return [{
          id: `block-${Date.now()}`,
          type: 'html',
          content: { html: page.content },
          order: 0
        }];
      }
    }
    return [];
  });

  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  // Update parent when blocks change
  const updateContent = (blocks: ContentBlock[]) => {
    setContentBlocks(blocks);
    onUpdate({
      ...page,
      content: JSON.stringify(blocks)
    });
  };

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock = createDefaultBlock(type, contentBlocks.length);
    updateContent([...contentBlocks, newBlock]);
  };

  const updateBlock = <T extends ContentBlock['type']>(
    id: string,
    content: Extract<ContentBlock, { type: T }>['content']
  ) => {
    updateContent(
      contentBlocks.map((block) =>
        block.id === id ? { ...block, content } as ContentBlock : block
      )
    );
  };

  const deleteBlock = (id: string) => {
    if (confirm('Block wirklich löschen?')) {
      updateContent(contentBlocks.filter(block => block.id !== id));
    }
  };

  const duplicateBlock = (id: string) => {
    const block = contentBlocks.find(b => b.id === id);
    if (block) {
      const newBlock = {
        ...block,
        id: `block-${Date.now()}`,
        order: contentBlocks.length
      };
      updateContent([...contentBlocks, newBlock]);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedBlock(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedBlock || draggedBlock === targetId) return;

    const draggedIdx = contentBlocks.findIndex(b => b.id === draggedBlock);
    const targetIdx = contentBlocks.findIndex(b => b.id === targetId);

    const newBlocks = [...contentBlocks];
    const [removed] = newBlocks.splice(draggedIdx, 1);
    newBlocks.splice(targetIdx, 0, removed);

    // Update order
    const reordered = newBlocks.map((block, idx) => ({ ...block, order: idx }));
    setContentBlocks(reordered);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
    // Save final order
    updateContent(contentBlocks);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
          Content Blocks ({contentBlocks.length})
        </h4>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => addBlock('heading')}
            className="px-3 py-1 rounded-lg flex items-center gap-2 text-sm transition-colors"
            style={{ backgroundColor: '#70c1b3', color: '#FFFFFF' }}
            title="Überschrift"
          >
            <Type className="w-4 h-4" />
            Überschrift
          </button>
          <button
            onClick={() => addBlock('text')}
            className="px-3 py-1 rounded-lg flex items-center gap-2 text-sm transition-colors"
            style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
            title="Text"
          >
            <Type className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => addBlock('html')}
            className="px-3 py-1 rounded-lg flex items-center gap-2 text-sm transition-colors"
            style={{ backgroundColor: '#dfc58d', color: '#3A3A3A' }}
            title="HTML"
          >
            <Code className="w-4 h-4" />
            HTML
          </button>
          <button
            onClick={() => addBlock('hero')}
            className="px-3 py-1 rounded-lg flex items-center gap-2 text-sm transition-colors"
            style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
            title="Hero Section"
          >
            <Sparkles className="w-4 h-4" />
            Hero
          </button>
          <button
            onClick={() => addBlock('spacer')}
            className="px-3 py-1 rounded-lg flex items-center gap-2 text-sm transition-colors"
            style={{ backgroundColor: '#E5E7EB', color: '#3A3A3A' }}
            title="Abstand"
          >
            <Plus className="w-4 h-4" />
            Abstand
          </button>
        </div>
      </div>

      {contentBlocks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: '#E5E7EB' }}>
          <p style={{ color: '#999999' }}>Noch keine Content Blocks.</p>
          <p className="text-sm mt-2" style={{ color: '#CCCCCC' }}>Füge einen Block hinzu, um zu beginnen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contentBlocks
            .sort((a, b) => a.order - b.order)
            .map((block) => (
              <div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(block.id)}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDragEnd={handleDragEnd}
                className="border rounded-lg p-4 cursor-move transition-all hover:shadow-md"
                style={{ 
                  borderColor: '#E5E7EB',
                  backgroundColor: draggedBlock === block.id ? '#F5F5F0' : '#FFFFFF'
                }}
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 mt-2 flex-shrink-0" style={{ color: '#999999' }} />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#F5F5F0', color: '#666666' }}>
                        {getBlockTypeLabel(block.type)}
                      </span>
                    </div>
                    
                    <BlockEditor block={block} onChange={(content) => updateBlock(block.id, content)} />
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => duplicateBlock(block.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: '#247ba0', color: '#FFFFFF' }}
                      title="Duplizieren"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: '#f25f5c', color: '#FFFFFF' }}
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: ContentBlock; onChange: (content: ContentBlock['content']) => void }) {
  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Überschrift..."
            value={block.content.text || ''}
            onChange={(e) => onChange({ ...block.content, text: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-xl"
            style={{ borderColor: '#E5E7EB', fontFamily: 'Fjalla One' }}
          />
          <select
            value={block.content.level || 'h2'}
            onChange={(e) => onChange({ ...block.content, level: e.target.value as HeadingContent['level'] })}
            className="px-3 py-2 border rounded-lg text-sm"
            style={{ borderColor: '#E5E7EB' }}
          >
            <option value="h1">H1 (Hauptüberschrift)</option>
            <option value="h2">H2 (Unterüberschrift)</option>
            <option value="h3">H3 (Klein)</option>
          </select>
        </div>
      );

    case 'text':
      return (
        <textarea
          placeholder="Text eingeben..."
          value={block.content.text || ''}
          onChange={(e) => onChange({ ...block.content, text: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          style={{ borderColor: '#E5E7EB' }}
          rows={4}
        />
      );

    case 'html':
      return (
        <div className="space-y-2">
          <textarea
            placeholder="HTML Code..."
            value={block.content.html || ''}
            onChange={(e) => onChange({ ...block.content, html: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
            style={{ borderColor: '#E5E7EB' }}
            rows={6}
          />
          <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#F5F5F0', color: '#666666' }}>
            💡 Tipp: Nutze HTML für komplexe Layouts und Formatierungen
          </div>
        </div>
      );

    case 'hero':
      return (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Hero Titel..."
            value={block.content.title || ''}
            onChange={(e) => onChange({ ...block.content, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-lg"
            style={{ borderColor: '#E5E7EB', fontFamily: 'Fjalla One' }}
          />
          <textarea
            placeholder="Hero Beschreibung..."
            value={block.content.description || ''}
            onChange={(e) => onChange({ ...block.content, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            style={{ borderColor: '#E5E7EB' }}
            rows={3}
          />
        </div>
      );

    case 'spacer':
      return (
        <div className="space-y-2">
          <label className="text-sm" style={{ color: '#666666' }}>Höhe:</label>
          <select
            value={block.content.height || 'medium'}
            onChange={(e) => onChange({ ...block.content, height: e.target.value as SpacerContent['height'] })}
            className="w-full px-3 py-2 border rounded-lg"
            style={{ borderColor: '#E5E7EB' }}
          >
            <option value="small">Klein (2rem)</option>
            <option value="medium">Mittel (4rem)</option>
            <option value="large">Groß (6rem)</option>
            <option value="xlarge">Extra Groß (8rem)</option>
          </select>
        </div>
      );

    case 'books-grid':
    case 'books-carousel':
      return (
        <div className="text-sm" style={{ color: '#999999' }}>
          Editor für "{block.type}" nicht verfügbar (wird später implementiert)
        </div>
      );
  }
}

function getBlockTypeLabel(type: ContentBlock['type']): string {
  const labels: Record<ContentBlock['type'], string> = {
    'heading': 'Überschrift',
    'text': 'Text',
    'html': 'HTML',
    'books-grid': 'Bücher Grid',
    'books-carousel': 'Bücher Carousel',
    'hero': 'Hero Section',
    'spacer': 'Abstand'
  };
  return labels[type] || type;
}

function createDefaultBlock(type: ContentBlock['type'], order: number): ContentBlock {
  const id = `block-${Date.now()}`;
  switch (type) {
    case 'heading':
      return { id, type, content: { text: '', level: 'h2' }, order };
    case 'text':
      return { id, type, content: { text: '' }, order };
    case 'html':
      return { id, type, content: { html: '' }, order };
    case 'hero':
      return { id, type, content: { title: '', description: '' }, order };
    case 'books-grid':
      return { id, type, content: { bookIds: [] }, order };
    case 'books-carousel':
      return { id, type, content: { bookIds: [] }, order };
    case 'spacer':
      return { id, type, content: { height: 'medium' }, order };
  }
}