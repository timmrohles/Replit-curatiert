import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSafeNavigate } from '../../utils/routing';
import { getAllONIXTags, getAllBooks, ONIXTag, Book } from '../../utils/api';
import { Helmet } from 'react-helmet';
import { X } from 'lucide-react';
import { BookCard } from '../book/BookCard';
import { Breadcrumb } from '../layout/Breadcrumb';

/**
 * Tag Combination Page - /tags/:combo
 * Shows books with multiple tags (e.g. /tags/auszeichnung+berlin)
 */
export function TagCombinationPage() {
  const params = useParams<{ combo?: string; param?: string }>();
  const combo = params.combo || params.param || '';
  const navigate = useSafeNavigate();
  
  const [tags, setTags] = useState<ONIXTag[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!combo) return;
    loadData(combo);
  }, [combo]);

  async function loadData(comboStr: string) {
    setLoading(true);
    try {
      const [allTags, allBooks] = await Promise.all([
        getAllONIXTags(),
        getAllBooks()
      ]);

      // Parse combination (e.g. "auszeichnung+berlin" or "tag1+tag2+tag3")
      const tagSlugs = comboStr.split('+').map(s => s.trim());
      
      // Find tags by slug
      const foundTags = tagSlugs
        .map(slug => 
          allTags.find(t => 
            (t.slug && t.slug === slug) ||
            t.displayName.toLowerCase().replace(/\s+/g, '-') === slug
          )
        )
        .filter(Boolean) as ONIXTag[];

      if (foundTags.length === 0) {
        setLoading(false);
        return;
      }

      setTags(foundTags);

      // Find books that have ALL selected tags
      const tagIds = foundTags.map(t => t.id);
      const matchingBooks = allBooks.filter(book => 
        tagIds.every(tagId => book.onixTagIds?.includes(tagId))
      );

      // Sort by newest first
      matchingBooks.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setBooks(matchingBooks);
    } catch (error) {
      console.error('Error loading tag combination:', error);
    } finally {
      setLoading(false);
    }
  }

  const removeTag = (tagToRemove: ONIXTag) => {
    const remainingTags = tags.filter(t => t.id !== tagToRemove.id);
    
    if (remainingTags.length === 0) {
      navigate('/tags');
    } else if (remainingTags.length === 1) {
      const slug = remainingTags[0].slug || 
        remainingTags[0].displayName.toLowerCase().replace(/\s+/g, '-');
      navigate(`/tag/${slug}`);
    } else {
      const slugs = remainingTags.map(t => 
        t.slug || t.displayName.toLowerCase().replace(/\s+/g, '-')
      );
      navigate(`/tags/${slugs.join('+')}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p style={{ color: '#3A3A3A' }}>Lädt...</p>
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p style={{ color: '#3A3A3A' }}>Tags nicht gefunden</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{tags.map(t => t.displayName).join(' + ')} - Bücher bei coratiert.de</title>
        <meta 
          name="description" 
          content={`${books.length} Bücher mit ${tags.map(t => t.displayName).join(' und ')}`} 
        />
      </Helmet>

      <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Themen', href: '/tags' },
              { label: 'Kombination' }
            ]}
          />

          {/* Header */}
          <div className="mt-6 mb-8">
            <div className="bg-white rounded-xl p-8">
              <h1 
                className="text-4xl mb-4"
                style={{ 
                  fontFamily: 'Fjalla One',
                  color: '#3A3A3A',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
                }}
              >
                Bücher mit mehreren Tags
              </h1>

              {/* Selected Tags */}
              <div className="flex flex-wrap gap-3 mb-4">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className="px-4 py-2 rounded-full flex items-center gap-2 text-sm"
                    style={{ 
                      backgroundColor: tag.color || '#70c1b3',
                      color: '#FFFFFF'
                    }}
                  >
                    <span>{tag.displayName}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:opacity-75 transition-opacity"
                      aria-label={`${tag.displayName} entfernen`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-lg" style={{ color: '#666666' }}>
                {books.length} {books.length === 1 ? 'Buch gefunden' : 'Bücher gefunden'}
              </p>
            </div>
          </div>

          {/* Books Grid */}
          {books.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-lg mb-4" style={{ color: '#666666' }}>
                Keine Bücher mit dieser Kombination gefunden.
              </p>
              <button
                onClick={() => navigate('/tags')}
                className="px-6 py-3 rounded-lg text-white"
                style={{ backgroundColor: '#247ba0' }}
              >
                Zu allen Tags
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {books.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  viewMode="grid"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}