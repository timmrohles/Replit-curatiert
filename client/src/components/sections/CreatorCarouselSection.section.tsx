import { useState, useEffect, useMemo } from 'react';
import { CuratedBookSection } from '../book/CuratedBookSection';
import { getAllONIXTags, type ONIXTag } from '../../utils/api/tags';

interface CreatorCarouselSectionProps {
  section: any;
  books?: any[];
  className?: string;
  categoryId?: number | null;
}

function mapBookForCarousel(book: any) {
  return {
    id: book.id,
    cover: book.cover || book.cover_url || '',
    title: book.title || '',
    author: book.author || '',
    publisher: book.publisher || '',
    year: book.year || '',
    price: book.price || '',
    category: book.category || '',
    tags: book.tags || [],
    isbn: book.isbn13 || book.isbn || '',
    klappentext: book.description || book.klappentext || '',
    reviews: book.reviews || [],
    is_indie: book.is_indie,
    indie_type: book.indie_type,
    is_hidden_gem: book.is_hidden_gem,
    award_count: book.award_count,
    nomination_count: book.nomination_count,
    award_details: book.award_details || [],
    awards: book.award_count || 0,
    shortlists: book.nomination_count || 0,
  };
}

export function CreatorCarouselSection({ section, books = [], className = '', categoryId }: CreatorCarouselSectionProps) {
  const config = section.config || {};
  const title = section.title || config.title || '';
  const description = section.content?.description || config.description || '';
  const curatorReason = config.curatorReason || config.curationReason || description || '';

  const curatorAvatar = config.curatorAvatar || '';
  const curatorName = config.curatorName || 'coratiert Redaktion';
  const curatorFocus = config.curatorFocus || title;
  const curatorBio = config.curatorBio || '';

  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);

  useEffect(() => {
    let isMounted = true;
    getAllONIXTags()
      .then(tags => { if (isMounted) setOnixTags(tags); })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const resolvedTagNames = useMemo(() => {
    const tagIds: number[] = config.books?.query?.include?.tagIds || [];
    if (tagIds.length === 0 || onixTags.length === 0) return [];
    return tagIds
      .map(id => {
        const tag = onixTags.find(t => String(t.id) === String(id));
        return tag ? (tag as any).displayName || tag.name : null;
      })
      .filter(Boolean) as string[];
  }, [config.books?.query?.include?.tagIds, onixTags]);

  const resolvedCategoryName = useMemo(() => {
    if (config.category) return config.category;
    if (!categoryId || onixTags.length === 0) return undefined;
    const tag = onixTags.find(t => String(t.id) === String(categoryId));
    return tag ? (tag as any).displayName || tag.name : undefined;
  }, [config.category, categoryId, onixTags]);

  const mappedBooks = books.map(mapBookForCarousel);

  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto">
        <CuratedBookSection
          curator={{
            avatar: curatorAvatar,
            name: curatorName,
            focus: curatorFocus,
            bio: curatorBio,
            occasion: config.occasion || title || '',
            curationReason: curatorReason,
            showSocials: false,
            isVerified: config.isVerified || config.verified || false,
          }}
          books={mappedBooks}
          category={resolvedCategoryName}
          tags={resolvedTagNames.length > 0 ? resolvedTagNames : undefined}
          showHeader={true}
          showCta={false}
          showVideo={config.showVideo || false}
          videoUrl={config.videoUrl}
          videoTitle={config.videoTitle}
          videoThumbnail={config.videoThumbnail}
          backgroundColor="white"
          sectionBackgroundColor="transparent"
          bookCardBgColor="beige"
          useEditorialLayout={config.useEditorialLayout !== false}
        />
      </div>
    </section>
  );
}
