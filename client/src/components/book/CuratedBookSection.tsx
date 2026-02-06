import { CreatorCarousel } from './CreatorCarousel';

/**
 * 📚 CuratedBookSection - Single Source of Truth
 * 
 * Wiederverwendbare Section für kuratierte Buchsammlungen
 * Kann mit oder ohne Curator/Creator-Info verwendet werden
 * 
 * @example Mit Creator
 * <CuratedBookSection
 *   curator={{
 *     avatar: "https://...",
 *     name: "Maurice Mayr",
 *     focus: "Debüts",
 *     occasion: "Neue Stimmen 2024"
 *   }}
 *   books={[...]}
 * />
 * 
 * @example Ohne Creator (nur Bücher)
 * <CuratedBookSection
 *   books={[...]}
 *   showHeader={false}
 * />
 */

interface Book {
  id: string | number;
  cover: string;
  title: string;
  author: string;
  price: string;
  newPrice?: string;
  usedPrice?: string;
  publisher?: string;
  year?: string;
  category?: string;
  tags?: string[];
  isbn?: string; // ISBN-13 or ISBN-10
  onixTagIds?: string[];
  shortDescription?: string;
  klappentext?: string;
  followCount?: number;
  awards?: number;
  reviewCount?: number;
  shortlists?: number;
  longlists?: number;
  releaseDate?: string;
  reviews?: Array<{ source: string; quote: string }>; // Pressestimmen
}

interface CuratorInfo {
  avatar: string;
  name: string;
  focus: string;
  occasion?: string;
  curationReason?: string;
  bio?: string;
  websiteUrl?: string;
  isAmbassador?: boolean;
  showSocials?: boolean;
}

interface CuratedBookSectionProps {
  // 📚 Pflicht: Bücher
  books: Book[];
  
  // 👤 Optional: Curator/Creator Info
  curator?: CuratorInfo;
  
  // 🎨 Optional: Kontext
  occasion?: string;
  curationReason?: string;
  category?: string;
  categories?: string[];
  tags?: string[];
  
  // 🎭 Optional: Anzeige-Optionen
  showHeader?: boolean;
  showCta?: boolean;
  ctaText?: string;
  onCtaClick?: () => void;
  showVideo?: boolean;
  videoThumbnail?: string;
  videoUrl?: string;
  videoTitle?: string;
  
  // 🎨 Optional: Styling
  backgroundColor?: 'white' | 'beige';
  sectionBackgroundColor?: string;
  bookCardBgColor?: 'white' | 'beige' | 'transparent';
  applyBackgroundToContent?: boolean;
  isStorefront?: boolean;
  
  // 🎨 Optional: Farb-Customization
  textColor?: string;
  iconColor?: string;
  borderColor?: string;
  tagBorderColor?: string;
  tagHoverBg?: string;
  selectBg?: string;
  selectBorder?: string;
  buttonBg?: string;
  buttonHoverBg?: string;
  arrowBg?: string;
  arrowHoverBg?: string;
  videoCardBg?: string;
  
  // ⚡ Optional: Performance
  isLCP?: boolean;
  
  // 📖 Optional: Layout
  useEditorialLayout?: boolean; // Use minimalist editorial card layout with klappentext
}

export function CuratedBookSection({
  books,
  curator,
  occasion,
  curationReason,
  category,
  categories,
  tags,
  showHeader = true,
  showCta = false,
  ctaText = "Alle Bücher ansehen",
  onCtaClick,
  showVideo = false,
  videoThumbnail,
  videoUrl,
  videoTitle,
  backgroundColor = 'white',
  sectionBackgroundColor = 'transparent',
  bookCardBgColor = 'beige',
  applyBackgroundToContent = false,
  isStorefront = false,
  textColor = 'var(--creator-text-dark)',
  iconColor = 'var(--creator-text-dark)',
  borderColor = 'var(--creator-dark-bg)/20',
  tagBorderColor = 'var(--creator-dark-bg)/20',
  tagHoverBg = 'var(--creator-accent)/5',
  selectBg = 'transparent',
  selectBorder = 'var(--creator-dark-bg)/20',
  buttonBg = 'var(--creator-dark-bg)',
  buttonHoverBg = 'var(--creator-accent)',
  arrowBg = 'var(--creator-dark-bg)',
  arrowHoverBg = 'var(--creator-accent)',
  videoCardBg = '#F5F5F5',
  isLCP = false,
  useEditorialLayout = false,
}: CuratedBookSectionProps) {
  // Default Curator wenn nicht angegeben
  const defaultCurator: CuratorInfo = {
    avatar: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400',
    name: 'coratiert Redaktion',
    focus: '',
    occasion: occasion || '',
    curationReason: curationReason || '',
    showSocials: false,
  };

  const effectiveCurator = curator || defaultCurator;

  return (
    <section>
      <div className="max-w-7xl mx-auto">
        <CreatorCarousel
          creatorAvatar={effectiveCurator.avatar}
          creatorName={effectiveCurator.name}
          creatorFocus={effectiveCurator.focus}
          occasion={effectiveCurator.occasion || occasion || ''}
          curationReason={effectiveCurator.curationReason || curationReason || ''}
          showSocials={effectiveCurator.showSocials || false}
          creatorBio={effectiveCurator.bio}
          creatorWebsiteUrl={effectiveCurator.websiteUrl}
          isAmbassador={effectiveCurator.isAmbassador || false}
          showHeader={showHeader}
          books={books}
          category={category}
          categories={categories}
          tags={tags}
          showCta={showCta}
          ctaText={ctaText}
          onCtaClick={onCtaClick}
          backgroundColor={backgroundColor}
          sectionBackgroundColor={sectionBackgroundColor}
          bookCardBgColor={bookCardBgColor}
          applyBackgroundToContent={applyBackgroundToContent}
          isStorefront={isStorefront}
          showVideo={showVideo}
          videoThumbnail={videoThumbnail}
          videoUrl={videoUrl}
          videoTitle={videoTitle}
          textColor={textColor}
          iconColor={iconColor}
          borderColor={borderColor}
          tagBorderColor={tagBorderColor}
          tagHoverBg={tagHoverBg}
          selectBg={selectBg}
          selectBorder={selectBorder}
          buttonBg={buttonBg}
          buttonHoverBg={buttonHoverBg}
          arrowBg={arrowBg}
          arrowHoverBg={arrowHoverBg}
          videoCardBg={videoCardBg}
          isLCP={isLCP}
          useEditorialLayout={useEditorialLayout}
        />
      </div>
    </section>
  );
}