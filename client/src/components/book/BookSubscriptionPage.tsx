import { useState } from 'react';
import { Breadcrumb } from "../layout/Breadcrumb";
import { useSafeNavigate } from "../../utils/routing";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Check, Calendar, Package, TrendingUp, BookOpen, Gift } from "lucide-react";
import { 
  DSSectionHeader, 
  DSGenreCard, 
  DSCarousel
} from './design-system';
const genreImage1 = '/placeholder-genre.png';
const genreImage2 = '/placeholder-genre.png';
const genreImage3 = '/placeholder-genre.png';
const genreImage4 = '/placeholder-genre.png';
const genreImage5 = '/placeholder-genre.png';

// Mock curator data with subscription themes
const curatorThemes = [
  {
    id: "1",
    curator: "Maurice Ökonomius",
    avatar: "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?w=200",
    theme: "Wirtschaftspolitik",
    description: "Kuratierte Bücher zu progressiver Wirtschaftspolitik, Modern Monetary Theory und Kapitalismuskritik",
    basePrice: 28.00,
  },
  {
    id: "2",
    curator: "Lisa Schmidt",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    theme: "Feminismus & Gesellschaft",
    description: "Feministische Literatur, intersektionale Perspektiven und Gesellschaftskritik",
    basePrice: 26.00,
  },
  {
    id: "3",
    curator: "Tom Weber",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    theme: "Science-Fiction",
    description: "Die besten Science-Fiction Neuerscheinungen und Klassiker zum Nachdenken",
    basePrice: 24.00,
  },
  {
    id: "4",
    curator: "Dr. Sarah Müller",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    theme: "Kinderliteratur",
    description: "Pädagogisch wertvolle und unterhaltsame Kinderbücher für verschiedene Altersgruppen",
    basePrice: 22.00,
  },
  {
    id: "5",
    curator: "Prof. Maria Schneider",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
    theme: "Klima & Nachhaltigkeit",
    description: "Wissenschaftlich fundierte Bücher zur Klimakrise, Umweltschutz und nachhaltiger Zukunft",
    basePrice: 27.00,
  },
  {
    id: "6",
    curator: "Michael Koch",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200",
    theme: "Geschichte & Biografien",
    description: "Fesselnde historische Werke und inspirierende Biografien",
    basePrice: 25.00,
  },
];

const durations = [
  { months: 3, label: "3 Monate", discount: 0 },
  { months: 6, label: "6 Monate", discount: 0.05 },
  { months: 12, label: "12 Monate", discount: 0.10 },
];

const frequencies = [
  { id: "monthly", label: "Monatlich", booksPerYear: 12, icon: Calendar },
  { id: "bimonthly", label: "Alle 2 Monate", booksPerYear: 6, icon: Package },
  { id: "quarterly", label: "Vierteljährlich", booksPerYear: 4, icon: TrendingUp },
];

export function BookSubscriptionPage() {
  const navigate = useSafeNavigate();
  const [selectedTheme, setSelectedTheme] = useState(curatorThemes[0]);
  const [selectedDuration, setSelectedDuration] = useState(durations[1]); // Default: 6 months
  const [selectedFrequency, setSelectedFrequency] = useState(frequencies[0]); // Default: monthly

  // Calculate price
  const calculatePrice = () => {
    const basePrice = selectedTheme.basePrice;
    const booksPerMonth = selectedFrequency.booksPerYear / 12;
    const totalMonths = selectedDuration.months;
    const totalBooks = booksPerMonth * totalMonths;
    const subtotal = basePrice * totalBooks;
    const discount = subtotal * selectedDuration.discount;
    const total = subtotal - discount;
    
    return {
      basePrice,
      totalBooks: Math.round(totalBooks),
      subtotal,
      discount,
      total,
      perMonth: total / totalMonths,
    };
  };

  const price = calculatePrice();

  return (
    <div className="gradient-bg">
      {/* Hero Section */}
      <section className="category-hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="category-title">
              BUCH ABONNEMENT
            </h1>
            <p className="category-description max-w-3xl">
              Lass dir regelmäßig sorgfältig kuratierte Bücher von unseren Expert*innen liefern
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Buch Abonnement" },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Choose Theme */}
            <div className="rounded-lg p-6">
              <h2 
                className="text-2xl mb-2 text-[#3A3A3A]"
                style={{ fontFamily: 'Fjalla One' }}
              >
                1. WÄHLE DEIN THEMA
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Unsere Kurator*innen stellen für dich passende Bücher zusammen
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {curatorThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTheme.id === theme.id
                        ? "border-[#5a9690] bg-[#A0CEC8]/10"
                        : "border-gray-200 hover:border-[#A0CEC8]"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <ImageWithFallback
                        src={theme.avatar}
                        alt={theme.curator}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-sm text-gray-600 mb-1"
                          style={{ fontFamily: 'Fjalla One' }}
                        >
                          {theme.curator}
                        </div>
                        <div className="font-medium text-[#3A3A3A] mb-1">
                          {theme.theme}
                        </div>
                      </div>
                      {selectedTheme.id === theme.id && (
                        <Check className="w-5 h-5 text-[#5a9690] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {theme.description}
                    </p>
                    <div className="mt-3 text-sm">
                      <span className="text-[#5a9690] font-medium">
                        Ab {theme.basePrice.toFixed(2)}€ pro Buch
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Choose Duration */}
            <div className="rounded-lg p-6">
              <h2 
                className="text-2xl mb-2 text-[#3A3A3A]"
                style={{ fontFamily: 'Fjalla One' }}
              >
                2. WÄHLE DIE LAUFZEIT
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Längere Laufzeiten = größere Rabatte
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {durations.map((duration) => (
                  <button
                    key={duration.months}
                    onClick={() => setSelectedDuration(duration)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      selectedDuration.months === duration.months
                        ? "border-[#5a9690] bg-[#A0CEC8]/10"
                        : "border-gray-200 hover:border-[#A0CEC8]"
                    }`}
                  >
                    <div 
                      className="text-xl mb-1 text-[#3A3A3A]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      {duration.label}
                    </div>
                    {duration.discount > 0 && (
                      <div className="text-sm text-[#5a9690] font-medium">
                        {(duration.discount * 100).toFixed(0)}% Rabatt
                      </div>
                    )}
                    {duration.discount === 0 && (
                      <div className="text-sm text-gray-400">
                        Kein Rabatt
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Choose Frequency */}
            <div className="rounded-lg p-6">
              <h2 
                className="text-2xl mb-2 text-[#3A3A3A]"
                style={{ fontFamily: 'Fjalla One' }}
              >
                3. WÄHLE DEN TURNUS
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Wie oft möchtest du ein neues Buch erhalten?
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {frequencies.map((frequency) => {
                  const FrequencyIcon = frequency.icon;
                  return (
                    <button
                      key={frequency.id}
                      onClick={() => setSelectedFrequency(frequency)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedFrequency.id === frequency.id
                          ? "border-[#5a9690] bg-[#A0CEC8]/10"
                          : "border-gray-200 hover:border-[#A0CEC8]"
                      }`}
                    >
                      <FrequencyIcon className="w-8 h-8 mx-auto mb-2 text-[#5a9690]" />
                      <div 
                        className="text-lg mb-1 text-[#3A3A3A]"
                        style={{ fontFamily: 'Fjalla One' }}
                      >
                        {frequency.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {frequency.booksPerYear} Bücher/Jahr
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* What's Included */}
            <div className="rounded-lg p-6">
              <h2 
                className="text-2xl mb-4 text-[#3A3A3A]"
                style={{ fontFamily: 'Fjalla One' }}
              >
                WAS IST ENTHALTEN?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A0CEC8]/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-[#5a9690]" />
                  </div>
                  <div>
                    <div className="font-medium text-[#3A3A3A] mb-1">
                      Handverlesene Bücher
                    </div>
                    <div className="text-sm text-gray-600">
                      Persönlich ausgewählt von unseren Kurator*innen
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A0CEC8]/20 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-[#5a9690]" />
                  </div>
                  <div>
                    <div className="font-medium text-[#3A3A3A] mb-1">
                      Kostenloser Versand
                    </div>
                    <div className="text-sm text-gray-600">
                      Lieferung direkt zu dir nach Hause
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A0CEC8]/20 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-[#5a9690]" />
                  </div>
                  <div>
                    <div className="font-medium text-[#3A3A3A] mb-1">
                      Exklusive Beigaben
                    </div>
                    <div className="text-sm text-gray-600">
                      Lesezeichen, Notizen und Empfehlungskarten
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A0CEC8]/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#5a9690]" />
                  </div>
                  <div>
                    <div className="font-medium text-[#3A3A3A] mb-1">
                      Jederzeit kündbar
                    </div>
                    <div className="text-sm text-gray-600">
                      Flexible Anpassung deines Abonnements
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg p-6 sticky top-8">
              <h3 
                className="text-xl mb-4 text-[#3A3A3A]"
                style={{ fontFamily: 'Fjalla One' }}
              >
                DEINE AUSWAHL
              </h3>

              {/* Selected Theme */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <ImageWithFallback
                    src={selectedTheme.avatar}
                    alt={selectedTheme.curator}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm text-gray-600">
                      {selectedTheme.curator}
                    </div>
                    <div className="font-medium text-[#3A3A3A]">
                      {selectedTheme.theme}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Options */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Laufzeit:</span>
                  <span className="font-medium text-[#3A3A3A]">{selectedDuration.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Turnus:</span>
                  <span className="font-medium text-[#3A3A3A]">{selectedFrequency.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Anzahl Bücher:</span>
                  <span className="font-medium text-[#3A3A3A]">{price.totalBooks} Bücher</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Zwischensumme:</span>
                  <span className="text-[#3A3A3A]">{price.subtotal.toFixed(2)}€</span>
                </div>
                {price.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rabatt ({(selectedDuration.discount * 100).toFixed(0)}%):</span>
                    <span className="text-[#5a9690]">-{price.discount.toFixed(2)}€</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="mb-6">
                <div className="flex justify-between items-baseline mb-1">
                  <span 
                    className="text-lg text-[#3A3A3A]"
                    style={{ fontFamily: 'Fjalla One' }}
                  >
                    GESAMT
                  </span>
                  <span 
                    className="text-2xl text-[#3A3A3A]"
                    style={{ fontFamily: 'Fjalla One' }}
                  >
                    {price.total.toFixed(2)}€
                  </span>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {price.perMonth.toFixed(2)}€ pro Monat
                </div>
              </div>

              {/* CTA Button */}
              <button
                className="w-full bg-[#5a9690] text-white py-3 rounded-lg hover:bg-[#4a8580] transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'Fjalla One' }}
              >
                <span>ABONNEMENT STARTEN</span>
                <Check className="w-5 h-5" />
              </button>

              <p className="text-xs text-center text-gray-500 mt-3">
                Jederzeit kündbar • Versandkostenfrei
              </p>
            </div>
          </div>
        </div>

        {/* Hero Image Section */}
        <div className="mt-12 rounded-lg overflow-hidden">
          <div className="aspect-[21/9] relative">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1574959540245-2a2a574a0375?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwc3Vic2NyaXB0aW9uJTIwYm94fGVufDF8fHx8MTc2NDc3MDgxNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Book Subscription"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
              <div className="max-w-2xl px-12">
                <h2 
                  className="text-white text-3xl md:text-4xl mb-4"
                  style={{ fontFamily: 'Fjalla One' }}
                >
                  JEDEN MONAT NEUE LITERARISCHE ENTDECKUNGEN
                </h2>
                <p className="text-white/90 text-lg">
                  Lass dich von unseren Kurator*innen durch die Welt der Bücher führen
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Genre Footer Carousel */}
      <section className="py-12 px-4 md:px-8 bg-[var(--creator-genre-section-bg)]">
        <div className="max-w-7xl mx-auto">
          <DSSectionHeader
            title="Weitere Genres entdecken"
            backgroundColor="var(--creator-genre-section-bg)"
            titleColor="#FFFFFF"
          />
          
          <DSCarousel
            itemWidth={176}
            gap={16}
            showArrows={true}
            arrowColor="#FFFFFF"
            arrowBg="rgba(255, 255, 255, 0.1)"
            arrowHoverBg="#70c1b3"
            className="snap-x snap-proximity md:snap-mandatory"
          >
            <DSGenreCard
              label="Belletristik"
              image={genreImage1}
              onClick={() => navigate("/belletristik")}
              size="medium"
            />
            <DSGenreCard
              label="Romane & Erzählungen"
              image={genreImage2}
              onClick={() => navigate("/romane-erzaehlungen")}
              size="medium"
            />
            <DSGenreCard
              label="Krimis & Thriller"
              image={genreImage3}
              onClick={() => navigate("/krimis-thriller")}
              size="medium"
            />
            <DSGenreCard
              label="Science-Fiction"
              image={genreImage4}
              onClick={() => navigate("/science-fiction")}
              size="medium"
            />
            <DSGenreCard
              label="Fantasy"
              image={genreImage5}
              onClick={() => navigate("/fantasy")}
              size="medium"
            />
          </DSCarousel>
        </div>
      </section>
    </div>
  );
}