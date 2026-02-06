import { useState } from "react";
import { useSafeNavigate } from "../utils/routing";
import mauriceAvatar from "figma:asset/b2fa68f812ab798c5b422fbfedb4357358b1fa0d.png";
import { LikeButton } from "../favorites/LikeButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

interface OwnBook {
  id: string | number;
  cover: string;
  title: string;
  author: string;
  subtitle?: string;
  publisher: string;
  publisherUrl: string;
  year: string;
  price: string;
  availability: 'lieferbar' | 'nicht-lieferbar' | 'vorbestellung';
  bookBand?: string;
  isbn?: string;
}

interface OwnBooksSectionProps {
  creatorAvatar: string;
  creatorName: string;
  creatorFocus: string;
  books: OwnBook[];
  backgroundColor?: 'white' | 'beige';
}

export function OwnBooksSection({
  creatorAvatar,
  creatorName,
  creatorFocus,
  books,
  backgroundColor = 'white'
}: OwnBooksSectionProps) {
  const navigate = useSafeNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareBookData, setShareBookData] = useState<{ title: string; author: string } | null>(null);

  const bookCardBgColor = backgroundColor;

  return (
    <section className={backgroundColor === 'beige' ? 'py-16' : 'py-16 bg-white'} style={{ backgroundColor: backgroundColor === 'beige' ? 'var(--color-gray-50)' : undefined }}>
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl p-8" style={{ backgroundColor: backgroundColor === 'beige' ? 'var(--color-gray-50)' : 'white' }}>
          {/* Header with Creator Info */}
          <div className="flex items-start justify-between mb-6 md:mb-8 gap-4 md:gap-8">
            <div className="flex items-start gap-4 md:gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-offset-2" style={{ ringColor: 'var(--cerulean)' }}>
                  <ImageWithFallback
                    src={mauriceAvatar}
                    alt={creatorName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-3 mb-1 w-fit">
                  <h3 className="text-foreground" style={{ fontSize: '32px' }}>{creatorName}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{creatorFocus}</p>
                <div className="mb-3">
                  <p className="text-[#4A6FA5] mb-1">Eigene Publikationen</p>
                  <p className="text-sm text-gray-700 italic">Als Autor veröffentlichte Bücher</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="flex gap-2 mb-8">
            <a 
              href="/tags/wirtschaft" 
              className="px-4 py-2 text-sm text-white border border-transparent rounded-full hover:border-[var(--creator-accent)] transition-all duration-200"
              style={{ backgroundColor: 'var(--creator-dark-bg)' }}
            >
              Wirtschaft
            </a>
            <a 
              href="/tags/geldpolitik" 
              className="px-4 py-2 text-sm text-white border border-transparent rounded-full hover:border-[var(--creator-accent)] transition-all duration-200"
              style={{ backgroundColor: 'var(--creator-dark-bg)' }}
            >
              Geldpolitik
            </a>
            <a 
              href="/tags/mmt" 
              className="px-4 py-2 text-sm text-white border border-transparent rounded-full hover:border-[var(--creator-accent)] transition-all duration-200"
              style={{ backgroundColor: 'var(--creator-dark-bg)' }}
            >
              MMT
            </a>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className={`${bookCardBgColor === 'beige' ? 'bg-[#F7F4EF]' : 'bg-white'} rounded-lg flex flex-col group cursor-pointer`}
              >
                {/* Book Cover */}
                <div className="aspect-[2/3] bg-transparent overflow-hidden relative rounded-t-lg" style={{ boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)', border: '1px solid #e5e5e5' }}>
                  <ImageWithFallback
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>

                {/* Book Info */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-foreground mb-1 line-clamp-2 leading-snug h-[3rem]">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{book.author}</p>
                  
                  {/* Additional Info */}
                  <div className="flex flex-col flex-1">
                    <p className="text-xs text-gray-500 mb-3">{book.publisher}, {book.year}</p>
                    
                    {/* Price and Details Link */}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[#4A6FA5] font-semibold">{book.price}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-[#4A6FA5] p-0 h-auto text-foreground"
                        onClick={(e) => {
                          e.preventDefault();
                          // Details functionality would go here
                        }}
                      >
                        Details
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Action Icons Row */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(42,42,42,0.2)' }}>
                    <div className="flex items-center gap-2">
                      <LikeButton
                        entityId={`book-${book.id}`}
                        entityType="book"
                        entityTitle={book.title}
                        entitySubtitle={book.author}
                        entityImage={book.cover}
                        variant="minimal"
                        size="sm"
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1.5 px-2 py-1 h-auto text-gray-600 hover:text-[#4A6FA5]"
                        onClick={(e) => {
                          e.preventDefault();
                          // Comment functionality would go here
                        }}
                      >
                        <MessageCircle className="w-5 h-5 stroke-2" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setShareBookData({ title: book.title, author: book.author });
                          setShareDialogOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 h-auto text-gray-600 hover:text-[#4A6FA5]"
                      >
                        <Share2 className="w-5 h-5 stroke-2" />
                      </Button>
                    </div>

                    {/* External Link to Bookstore Template */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1.5 px-2 py-1 h-auto text-[#4A6FA5] hover:text-[var(--charcoal)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/bookstore/${book.id}`);
                      }}
                      title="Kaufoptionen anzeigen"
                    >
                      <ExternalLink className="w-5 h-5 stroke-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teilen</DialogTitle>
            <DialogDescription>
              {shareBookData && (
                <span>
                  Teile "{shareBookData.title}" von {shareBookData.author} mit anderen.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Teile dieses Buch über deine bevorzugte Plattform.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}