import { CuratedBookSection } from '../book/CuratedBookSection';

interface CreatorCarouselSectionProps {
  section: any;
  books?: any[];
  className?: string;
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
  };
}

export function CreatorCarouselSection({ section, books = [], className = '' }: CreatorCarouselSectionProps) {
  const config = section.config || {};
  const title = section.title || config.title || '';
  const description = section.content?.description || config.description || '';
  const curatorReason = config.curatorReason || config.curationReason || description || '';

  const curatorAvatar = config.curatorAvatar || '';
  const curatorName = config.curatorName || 'coratiert Redaktion';
  const curatorFocus = config.curatorFocus || title;

  const mappedBooks = books.map(mapBookForCarousel);

  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto">
        <CuratedBookSection
          curator={{
            avatar: curatorAvatar,
            name: curatorName,
            focus: curatorFocus,
            occasion: config.occasion || '',
            curationReason: curatorReason,
            showSocials: false,
          }}
          books={mappedBooks}
          category={config.category || title}
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
