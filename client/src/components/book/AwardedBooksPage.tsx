import { useState, useEffect } from "react";
import { useSafeNavigate } from "../../utils/routing";
import { Breadcrumb } from "../layout/Breadcrumb";
import { BookCard } from "./BookCard";
import { OptimizedImage } from "../common/OptimizedImage";
import { Award, Star, Sparkles } from "lucide-react";
import { getBookUrl } from "../../utils/bookUrlHelper";

// Mock Data für das Gewinnerbuch
const winnerBook = {
  id: "winner-2024",
  cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
  title: "Das Licht zwischen den Welten",
  author: "Sofia Bergström",
  price: "24,99 €",
  publisher: "Literaturverlag Berlin",
  year: "2024",
  category: "Belletristik",
  tags: ["Preisgekrönt", "Bestseller"],
  description: "Ein eindringlicher Roman über Identität, Verlust und die Kraft der Hoffnung. Sofia Bergström erzählt die Geschichte einer jungen Frau, die zwischen zwei Welten steht und ihren Platz im Leben sucht."
};

// Mock Data für Shortlist (6 Bücher)
const shortlistBooks = [
  {
    id: "shortlist-1",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
    title: "Stille Wasser",
    author: "Lars Nordström",
    price: "22,99 €",
    publisher: "Nordwind Verlag",
    year: "2024",
    category: "Krimi",
    tags: ["Shortlist", "Spannend"]
  },
  {
    id: "shortlist-2",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    title: "Der letzte Sommer",
    author: "Anna Klein",
    price: "19,99 €",
    publisher: "Sommerhaus Verlag",
    year: "2024",
    category: "Roman",
    tags: ["Shortlist", "Coming-of-Age"]
  },
  {
    id: "shortlist-3",
    cover: "https://images.unsplash.com/photo-1495640452828-3df6795cf69b?w=400",
    title: "Zwischen den Zeilen",
    author: "Michael Weber",
    price: "21,50 €",
    publisher: "Buchkunst Verlag",
    year: "2024",
    category: "Lyrik",
    tags: ["Shortlist", "Poetisch"]
  },
  {
    id: "shortlist-4",
    cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400",
    title: "Die vergessene Stadt",
    author: "Emma Schneider",
    price: "23,99 €",
    publisher: "Geschichtsverlag München",
    year: "2024",
    category: "Historischer Roman",
    tags: ["Shortlist", "History"]
  },
  {
    id: "shortlist-5",
    cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400",
    title: "Horizont",
    author: "Felix Bauer",
    price: "20,99 €",
    publisher: "Zukunft Verlag",
    year: "2024",
    category: "Science Fiction",
    tags: ["Shortlist", "Dystopie"]
  },
  {
    id: "shortlist-6",
    cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400",
    title: "Wurzeln und Flügel",
    author: "Sarah Hoffmann",
    price: "22,50 €",
    publisher: "Lebenskunst Verlag",
    year: "2024",
    category: "Biografie",
    tags: ["Shortlist", "Inspirierend"]
  }
];

// Mock Data für weitere nominierte Bücher (20 Bücher)
const nominatedBooks = [
  {
    id: "nominated-1",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    title: "Morgentau",
    author: "Klara Müller",
    price: "18,99 €",
    publisher: "Naturverlag",
    year: "2024",
    category: "Belletristik",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-2",
    cover: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400",
    title: "Der Klang der Stille",
    author: "Thomas Richter",
    price: "19,50 €",
    publisher: "Musikverlag",
    year: "2024",
    category: "Biografie",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-3",
    cover: "https://images.unsplash.com/photo-1509266272358-7701da638078?w=400",
    title: "Flammendes Herz",
    author: "Julia Fischer",
    price: "21,99 €",
    publisher: "Romantik Verlag",
    year: "2024",
    category: "Romantik",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-4",
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
    title: "Die letzte Stunde",
    author: "Martin Schwarz",
    price: "22,99 €",
    publisher: "Thriller Verlag",
    year: "2024",
    category: "Thriller",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-5",
    cover: "https://images.unsplash.com/photo-1529513342590-2509b77a1aaf?w=400",
    title: "Sternenlicht",
    author: "Lena Schmidt",
    price: "17,99 €",
    publisher: "Fantasie Verlag",
    year: "2024",
    category: "Fantasy",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-6",
    cover: "https://images.unsplash.com/photo-1550399504-8953e1a1e3e1?w=400",
    title: "Im Schatten der Berge",
    author: "Peter Wolf",
    price: "20,50 €",
    publisher: "Bergverlag",
    year: "2024",
    category: "Abenteuer",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-7",
    cover: "https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=400",
    title: "Zeitenwende",
    author: "Andrea Braun",
    price: "19,99 €",
    publisher: "Geschichtsverlag",
    year: "2024",
    category: "Historisch",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-8",
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
    title: "Verborgene Welten",
    author: "Stefan Meyer",
    price: "21,50 €",
    publisher: "Mystery Verlag",
    year: "2024",
    category: "Mystery",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-9",
    cover: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400",
    title: "Der Ruf des Meeres",
    author: "Nina Krüger",
    price: "18,50 €",
    publisher: "Seefahrt Verlag",
    year: "2024",
    category: "Abenteuer",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-10",
    cover: "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=400",
    title: "Gedankenwelt",
    author: "Oliver Hartmann",
    price: "22,50 €",
    publisher: "Philosophie Verlag",
    year: "2024",
    category: "Sachbuch",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-11",
    cover: "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400",
    title: "Herbstleuchten",
    author: "Maria Wagner",
    price: "19,99 €",
    publisher: "Jahreszeiten Verlag",
    year: "2024",
    category: "Roman",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-12",
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
    title: "Nachtschatten",
    author: "David Koch",
    price: "20,99 €",
    publisher: "Dunkel Verlag",
    year: "2024",
    category: "Horror",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-13",
    cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    title: "Der Weg nach Hause",
    author: "Sophie Becker",
    price: "18,99 €",
    publisher: "Heimat Verlag",
    year: "2024",
    category: "Drama",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-14",
    cover: "https://images.unsplash.com/photo-1519764622345-f5e854b5df80?w=400",
    title: "Silberfaden",
    author: "Lisa Neumann",
    price: "21,99 €",
    publisher: "Kunst Verlag",
    year: "2024",
    category: "Fantasy",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-15",
    cover: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400",
    title: "Unter Wölfen",
    author: "Marco Zimmermann",
    price: "22,99 €",
    publisher: "Wildnis Verlag",
    year: "2024",
    category: "Abenteuer",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-16",
    cover: "https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?w=400",
    title: "Kristallnacht",
    author: "Elena Schulz",
    price: "19,50 €",
    publisher: "Erinnerung Verlag",
    year: "2024",
    category: "Historisch",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-17",
    cover: "https://images.unsplash.com/photo-1485322551133-3a4c27a9d925?w=400",
    title: "Windflüsterer",
    author: "Jan Peters",
    price: "20,50 €",
    publisher: "Natur Verlag",
    year: "2024",
    category: "Roman",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-18",
    cover: "https://images.unsplash.com/photo-1527176930608-09cb256ab504?w=400",
    title: "Die Farbe Blau",
    author: "Katharina Lang",
    price: "18,99 €",
    publisher: "Farben Verlag",
    year: "2024",
    category: "Kunstbuch",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-19",
    cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400",
    title: "Sommerträume",
    author: "Robert Zimmermann",
    price: "21,50 €",
    publisher: "Traum Verlag",
    year: "2024",
    category: "Roman",
    tags: ["Nominiert"]
  },
  {
    id: "nominated-20",
    cover: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400",
    title: "Ewige Reise",
    author: "Isabella Hoffmann",
    price: "23,99 €",
    publisher: "Reise Verlag",
    year: "2024",
    category: "Abenteuer",
    tags: ["Nominiert"]
  }
];

export function AwardedBooksPage() {
  const navigate = useSafeNavigate();

  // Breadcrumb items
  const breadcrumbItems = [
    { label: "Startseite", href: "/", onClick: () => navigate("/") },
    { label: "Ausgezeichnete Bücher" }
  ];

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-multicolor)' }}>
      {/* Hero Section - Großes Gewinnerbuch */}
      <section className="relative w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Linke Spalte: Buchinformationen */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f25f5c] text-white rounded-full">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold">coratiert Buchpreis 2024 - Gewinner</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl leading-tight text-foreground">
                {winnerBook.title}
              </h1>
              
              <div className="space-y-1.5">
                <p className="text-lg md:text-xl font-semibold text-foreground">
                  {winnerBook.author}
                </p>
                <p className="text-sm text-foreground">
                  {winnerBook.publisher}, {winnerBook.year}
                </p>
              </div>

              <p className="text-base leading-relaxed text-foreground">
                {winnerBook.description}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <span className="text-xl font-bold" style={{ color: 'var(--vibrant-coral)' }}>
                  ab {winnerBook.price}
                </span>
                <button
                  onClick={() => navigate(getBookUrl(winnerBook))}
                  className="px-5 py-2.5 bg-[var(--vibrant-coral)] text-white rounded-lg hover:bg-opacity-90 transition-all"
                >
                  Mehr erfahren
                </button>
              </div>
            </div>

            {/* Rechte Spalte: Buchcover */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-xs">
                <div className="aspect-[2/3] rounded-[1px] overflow-hidden" style={{ boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)', border: '1px solid #e5e5e5' }}>
                  <OptimizedImage
                    src={winnerBook.cover}
                    alt={winnerBook.title}
                    className="w-full h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                {/* Award Badge */}
                <div className="absolute -top-3 -right-3 bg-[#f25f5c] text-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-xl transform rotate-12">
                  <Award className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">GEWINNER</span>
                  <span className="text-[10px]">2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Text-Bereich: Erklärung des Buchpreises */}
      <section className="w-full py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 
            className="text-3xl md:text-4xl mb-6" 
            style={{ 
              fontFamily: 'Fjalla One',
              letterSpacing: '0.02em',
              color: '#3A3A3A',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
            }}
          >
            Der coratiert Buchpreis
          </h2>
          
          <div className="space-y-4 text-lg leading-relaxed text-foreground">
            <p>
              Der coratiert Buchpreis ist eine der wichtigsten literarischen Auszeichnungen im deutschsprachigen Raum. 
              Seit 2020 würdigen wir herausragende Werke, die durch literarische Qualität, innovative Erzählweise und 
              gesellschaftliche Relevanz überzeugen.
            </p>
            <p>
              Eine unabhängige Fachjury, bestehend aus renommierten Literaturkritiker:innen, Buchhändler:innen und 
              Autor:innen, wählt jährlich aus über 200 Einreichungen die besten Werke aus. Der Preis ist mit 15.000 Euro 
              dotiert und wird jährlich im November in Berlin verliehen.
            </p>
            <p>
              Neben dem Hauptpreis werden auch eine Shortlist mit sechs nominierten Titeln und eine Longlist mit weiteren 
              herausragenden Büchern veröffentlicht. Alle ausgezeichneten Werke zeichnen sich durch ihre literarische 
              Exzellenz und ihren Beitrag zur zeitgenössischen Literatur aus.
            </p>
          </div>
        </div>
      </section>

      {/* Shortlist Section - 6 Bücher */}
      <section className="w-full py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 
            className="text-3xl md:text-4xl mb-8" 
            style={{ 
              fontFamily: 'Fjalla One',
              letterSpacing: '0.02em',
              color: '#3A3A3A',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
            }}
          >
            Shortlist 2024
          </h2>
          
          <p className="text-lg mb-8" style={{ color: 'var(--charcoal)' }}>
            Diese sechs außergewöhnlichen Bücher haben es auf die Shortlist geschafft und standen zur Wahl für den Hauptpreis.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {shortlistBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book as any}
                cardBackgroundColor="transparent"
                sectionBackgroundColor="transparent"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Nominierte Bücher Section - 20 Bücher im Grid */}
      <section className="w-full py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 
            className="text-3xl md:text-4xl mb-8" 
            style={{ 
              fontFamily: 'Fjalla One',
              letterSpacing: '0.02em',
              color: '#3A3A3A',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)'
            }}
          >
            Longlist 2024
          </h2>
          
          <p className="text-lg mb-8" style={{ color: 'var(--charcoal)' }}>
            Diese herausragenden Titel wurden von unserer Jury nominiert und bereichern die literarische Landschaft mit 
            ihrer Vielfalt und Qualität.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {nominatedBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book as any}
                cardBackgroundColor="transparent"
                sectionBackgroundColor="transparent"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}