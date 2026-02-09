import { Heart, ArrowRight, CheckCircle2, ShoppingCart } from "lucide-react";
import { useSafeNavigate } from "../../utils/routing";
import { useFavorites } from "../favorites/FavoritesContext";
import { useCart } from "../shop/CartContext";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { motion } from "motion/react";

interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  price: string;
  cover: string;
  description: string;
  tags: string[];
}

interface Curator {
  id: string;
  name: string;
  avatar: string;
  theme: string;
  focus: string;
  tags: string[];
  description: string;
  curationsCount: number;
  booksCount: number;
}

interface BookMatch {
  book: Book;
  score: number;
  matchedTags: string[];
}

interface CuratorMatch {
  curator: Curator;
  score: number;
}

interface MatchingResultsProps {
  bookMatches: BookMatch[];
  curatorMatches: CuratorMatch[];
  userSelectionLabels: string[];
  allTags: string[];
  onRestart: () => void;
}

export function MatchingResults({
  bookMatches,
  curatorMatches,
  userSelectionLabels,
  allTags,
  onRestart,
}: MatchingResultsProps) {
  const navigate = useSafeNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, isInCart } = useCart();

  const handleAddToCart = (book: Book) => {
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      coverImage: book.cover,
    });
  };

  const handleToggleFavorite = (book: Book) => {
    toggleFavorite({
      id: book.id,
      type: 'book',
      title: book.title,
      subtitle: book.author,
      image: book.cover,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-[#A0CEC8]/20 px-4 py-2 rounded-full mb-6">
          <CheckCircle2 className="w-5 h-5 text-[#5a9690]" />
          <span className="text-sm text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
            MATCHING ABGESCHLOSSEN
          </span>
        </div>

        <h2
          className="text-4xl md:text-5xl mb-4 text-[var(--charcoal)]"
          style={{ fontFamily: 'Fjalla One' }}
        >
          DEINE BUCHMATCHES
        </h2>

        <p className="text-lg text-gray-600 mb-6">
          Basierend auf deinen Antworten haben wir passende Bücher für dich gefunden.
        </p>

        {/* User Selection Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {userSelectionLabels.map((label) => (
            <span
              key={label}
              className="px-3 py-1 bg-white border border-[#A0CEC8] text-[var(--charcoal)] rounded-full text-sm"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Kuratierte Reihe - Empfohlene Bücher */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-3xl text-[var(--charcoal)] mb-2"
              style={{ fontFamily: 'Fjalla One' }}
            >
              KURATIERTE EMPFEHLUNGEN
            </h3>
            <p className="text-sm text-gray-600">
              {bookMatches.length} {bookMatches.length === 1 ? 'Treffer' : 'Treffer'} basierend auf deinen Antworten
            </p>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {bookMatches.map((match, index) => {
            const matchPercentage = Math.min(
              Math.round((match.score / allTags.length) * 100),
              100
            );

            return (
              <motion.div
                key={match.book.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0"
              >
                <div className="relative w-44 md:w-60 min-h-[400px] md:min-h-[520px] bg-transparent flex flex-col group cursor-pointer">
                  <div className="pl-2 pb-2 pt-1 pr-1 md:pl-4 md:pb-4 md:pt-2 md:pr-2">
                    {/* Book Cover */}
                    <div 
                      className="aspect-[2/3] bg-transparent rounded-[1px] overflow-hidden relative" 
                      style={{ boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)', border: '1px solid #e5e5e5' }}
                    >
                      <ImageWithFallback
                        src={match.book.cover}
                        alt={match.book.title}
                        className="w-full h-full rounded-[1px]"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="p-2 md:p-3 flex flex-col flex-1">
                    {/* Title */}
                    <h3 
                      className="mb-0.5 line-clamp-2 leading-snug h-[2.5rem] text-sm md:text-base text-[var(--charcoal)]" 
                    >
                      {match.book.title}
                    </h3>

                    {/* Author */}
                    <p className="text-[10px] md:text-xs mb-2 line-clamp-1 mt-1.5 text-[var(--charcoal)] font-semibold">
                      {match.book.author}
                    </p>

                    {/* Publisher & Year */}
                    <div className="h-[1.25rem] mb-2">
                      <p className="text-[10px] md:text-xs text-[var(--charcoal)]">
                        {match.book.publisher && <span>{match.book.publisher}</span>}
                        {match.book.publisher && match.book.year && <span>, </span>}
                        {match.book.year && <span>{match.book.year}</span>}
                      </p>
                    </div>

                    {/* Match Percentage */}
                    <p className="text-[10px] md:text-xs mb-1 text-left text-teal">
                      {matchPercentage}% Match
                    </p>

                    {/* Price */}
                    <p 
                      className="text-sm md:text-base mb-2 text-right text-[var(--charcoal)]"
                    >
                      ab {match.book.price}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(match.book);
                        }}
                        className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                        title={isFavorite(match.book.id) ? 'Von Merkliste entfernen' : 'Zur Merkliste'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFavorite(match.book.id) ? 'fill-[#5a9690] text-[#5a9690]' : 'text-[var(--charcoal)]'
                          }`}
                          style={{ strokeWidth: 1.5 }}
                        />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(match.book);
                        }}
                        className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                        title={isInCart(match.book.id) ? 'Im Warenkorb' : 'Zum Warenkorb hinzufügen'}
                      >
                        <ShoppingCart className="w-4 h-4 text-[var(--charcoal)]" style={{ strokeWidth: 1.5 }} />
                      </button>

                      <button
                        className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors ml-auto"
                      >
                        <ArrowRight className="w-4 h-4 text-[var(--charcoal)]" style={{ strokeWidth: 1.5 }} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Self-Publisher Section */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-3xl text-[var(--charcoal)] mb-2"
              style={{ fontFamily: 'Fjalla One' }}
            >
              VON SELFPUBLISHERN
            </h3>
            <p className="text-sm text-gray-600">
              Entdecke unabhängige Autor*innen
            </p>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {bookMatches.slice(0, 4).map((match, index) => (
            <motion.div
              key={`self-${match.book.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex-shrink-0"
            >
              <div className="relative w-44 md:w-60 min-h-[400px] md:min-h-[520px] bg-transparent flex flex-col group cursor-pointer">
                <div className="pl-2 pb-2 pt-1 pr-1 md:pl-4 md:pb-4 md:pt-2 md:pr-2">
                  <div 
                    className="aspect-[2/3] bg-transparent rounded-[1px] overflow-hidden relative" 
                    style={{ boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)', border: '1px solid #e5e5e5' }}
                  >
                    <ImageWithFallback
                      src={match.book.cover}
                      alt={match.book.title}
                      className="w-full h-full object-cover rounded-[1px]"
                    />
                    <div 
                      className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      INDIE
                    </div>
                  </div>

                  <div className="pt-2 md:pt-3">
                    <h3 
                      className="text-sm md:text-base mb-1 line-clamp-2 text-[var(--charcoal)]" 
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      {match.book.title}
                    </h3>
                    <p className="text-xs md:text-sm text-[var(--charcoal)] mb-1">
                      {match.book.author}
                    </p>
                    <p className="text-xs text-gray-400 mb-2">
                      Selfpublished, {match.book.year}
                    </p>
                    <div className="mb-3">
                      <span 
                        className="text-base md:text-lg text-[var(--charcoal)]"
                        style={{ fontFamily: 'Fjalla One' }}
                      >
                        {match.book.price}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(match.book);
                        }}
                        className={`p-2 rounded-lg border transition-all ${
                          isFavorite(match.book.id)
                            ? 'border-[#5a9690] bg-[#A0CEC8]/10'
                            : 'border-gray-300 hover:border-[#5a9690]'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFavorite(match.book.id) ? 'fill-[#5a9690] text-[#5a9690]' : 'text-gray-400'
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(match.book);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs transition-all ${
                          isInCart(match.book.id)
                            ? 'bg-[#F5F5F0] border border-[#5a9690] text-[#5a9690]'
                            : 'bg-[#5a9690] text-white hover:bg-[#4a8580]'
                        }`}
                        style={{ fontFamily: 'Fjalla One' }}
                      >
                        <ShoppingCart className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Curator Recommendations */}
      {curatorMatches.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className="text-3xl text-[var(--charcoal)] mb-2"
                style={{ fontFamily: 'Fjalla One' }}
              >
                PASSENDE KURATOR*INNEN
              </h3>
              <p className="text-sm text-gray-600">
                Expert*innen, die deinen Geschmack teilen
              </p>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {curatorMatches.map((match, index) => (
              <motion.div
                key={match.curator.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex-shrink-0 w-72"
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all h-full flex flex-col">
                  <div className="aspect-square relative">
                    <ImageWithFallback
                      src={match.curator.avatar}
                      alt={match.curator.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-xl mb-1" style={{ fontFamily: 'Fjalla One' }}>
                        {match.curator.name}
                      </h3>
                      <p className="text-sm text-[#A0CEC8]">{match.curator.theme}</p>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                      {match.curator.description}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <span>{match.curator.booksCount} Bücher</span>
                      <span>{match.curator.curationsCount} Kurationen</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite({
                            id: match.curator.id,
                            type: 'creator',
                            title: match.curator.name,
                            subtitle: match.curator.theme,
                            image: match.curator.avatar,
                          });
                        }}
                        className={`p-2 rounded-lg border transition-all ${
                          isFavorite(match.curator.id)
                            ? 'border-[#5a9690] bg-[#A0CEC8]/10'
                            : 'border-gray-300 hover:border-[#5a9690]'
                        }`}
                        title={isFavorite(match.curator.id) ? 'Nicht mehr folgen' : 'Folgen'}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFavorite(match.curator.id) ? 'fill-[#5a9690] text-[#5a9690]' : 'text-gray-400'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => navigate(`/curators?highlight=${match.curator.id}`)}
                        className="flex-1 bg-[#5a9690] text-white py-2 rounded-lg hover:bg-[#4a8580] transition-colors flex items-center justify-center gap-2"
                        style={{ fontFamily: 'Fjalla One' }}
                      >
                        <span>PROFIL ANSEHEN</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Authors Section */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-3xl text-[var(--charcoal)] mb-2"
              style={{ fontFamily: 'Fjalla One' }}
            >
              PASSENDE AUTOR*INNEN
            </h3>
            <p className="text-sm text-gray-600">
              Autor*innen, die dir gefallen könnten
            </p>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {bookMatches.slice(0, 4).map((match, index) => (
            <motion.div
              key={`author-${match.book.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex-shrink-0 w-64"
            >
              <div 
                className="rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group relative w-44 h-[280px] md:w-[260px] md:h-[360px]"
                style={{ 
                  transform: 'perspective(1000px) rotateY(-5deg)',
                  boxShadow: '-8px 8px 12px 2px rgba(0, 0, 0, 0.3)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* Background - Author Initial as decorative element */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#A0CEC8] to-[#5a9690] flex items-center justify-center">
                  <div 
                    className="text-white/20 text-[120px] md:text-[180px]"
                    style={{ fontFamily: 'Fjalla One' }}
                  >
                    {match.book.author.charAt(0)}
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F33]/60 via-[#0B1F33]/30 to-[#0B1F33]/50 p-3 md:p-6 flex flex-col justify-between">
                  {/* Top: Label and Author Name */}
                  <div>
                    <div className="text-[#A0CEC8] text-[10px] md:text-xs mb-1 tracking-wide uppercase text-left">
                      AUTOR*IN
                    </div>
                    <h3 className="text-white text-base md:text-xl text-left" style={{ fontFamily: 'Fjalla One' }}>
                      {match.book.author}
                    </h3>
                  </div>
                  
                  {/* Bottom: Description */}
                  <p className="text-gray-300 text-xs md:text-sm text-left line-clamp-2 md:line-clamp-none">
                    Autor*in von "{match.book.title}"
                  </p>
                </div>

                {/* Action Buttons - Hidden until hover */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite({
                          id: `author-${match.book.author}`,
                          type: 'author',
                          title: match.book.author,
                          subtitle: 'Autor*in',
                        });
                      }}
                      className={`p-2 rounded-lg border transition-all ${
                        isFavorite(`author-${match.book.author}`)
                          ? 'border-[#A0CEC8] bg-[#A0CEC8]/20'
                          : 'border-white/50 hover:border-white bg-black/20'
                      }`}
                      title={isFavorite(`author-${match.book.author}`) ? 'Nicht mehr folgen' : 'Folgen'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFavorite(`author-${match.book.author}`) ? 'fill-[#A0CEC8] text-[#A0CEC8]' : 'text-white'
                        }`}
                      />
                    </button>
                    <button
                      className="flex-1 bg-white/90 hover:bg-white text-[#5a9690] py-2 rounded-lg transition-colors text-xs md:text-sm"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      ALLE BÜCHER
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Publishers Section */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-3xl text-[var(--charcoal)] mb-2"
              style={{ fontFamily: 'Fjalla One' }}
            >
              PASSENDE VERLAGE
            </h3>
            <p className="text-sm text-gray-600">
              Verlage mit Büchern, die zu dir passen
            </p>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {bookMatches.slice(0, 4).map((match, index) => (
            <motion.div
              key={`publisher-${match.book.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="flex-shrink-0 w-64"
            >
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center h-full flex flex-col">
                <div className="w-20 h-20 rounded-lg bg-[#F5F5F0] mx-auto mb-4 flex items-center justify-center text-[#5a9690] text-xl"
                  style={{ fontFamily: 'Fjalla One' }}
                >
                  {match.book.publisher?.substring(0, 3).toUpperCase()}
                </div>
                <h3 className="text-lg mb-2 text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
                  {match.book.publisher}
                </h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">
                  Verlag mit passendem Programm
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite({
                        id: `publisher-${match.book.publisher}`,
                        type: 'publisher',
                        title: match.book.publisher || '',
                        subtitle: 'Verlag',
                      });
                    }}
                    className={`p-2 rounded-lg border transition-all ${
                      isFavorite(`publisher-${match.book.publisher}`)
                        ? 'border-[#5a9690] bg-[#A0CEC8]/10'
                        : 'border-gray-300 hover:border-[#5a9690]'
                    }`}
                    title={isFavorite(`publisher-${match.book.publisher}`) ? 'Nicht mehr folgen' : 'Folgen'}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isFavorite(`publisher-${match.book.publisher}`) ? 'fill-[#5a9690] text-[#5a9690]' : 'text-gray-400'
                      }`}
                    />
                  </button>
                  <button
                    className="flex-1 bg-white border-2 border-[#5a9690] text-[#5a9690] py-2 rounded-lg hover:bg-[#A0CEC8]/10 transition-colors text-sm"
                    style={{ fontFamily: 'Fjalla One' }}
                  >
                    KATALOG ANSEHEN
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-white border-2 border-[#5a9690] text-[#5a9690] rounded-lg hover:bg-[#A0CEC8]/10 transition-colors"
          style={{ fontFamily: 'Fjalla One' }}
        >
          ANTWORTEN ÄNDERN
        </button>

        <button
          onClick={() => navigate('/bücher')}
          className="px-6 py-3 bg-[#5a9690] text-white rounded-lg hover:bg-[#4a8580] transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: 'Fjalla One' }}
        >
          <span>ALLE BÜCHER ANSEHEN</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}