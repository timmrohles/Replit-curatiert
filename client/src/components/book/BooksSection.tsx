import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { CreatorCarousel } from "../creator/CreatorCarousel";
import { OwnBooksSection } from "./OwnBooksSection";

interface Book {
  id: number;
  title: string;
  author: string;
  price: string;
  cover: string;
  publisher?: string;
  year?: string;
}

const books: Book[] = [
  { id: 1, title: "Das Kapital im 21. Jahrhundert", author: "Thomas Piketty", price: "24,90 €", cover: "https://images.unsplash.com/photo-1755545730104-3cb4545282b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDYXBpdGFsJTIwVHdlbnR5JTIwRmlyc3QlMjBDZW50dXJ5JTIwUGlrZXR0eSUyMGJvb2slMjByZWQlMjBjb3ZlcnxlbnwxfHx8fDE3NjQyMzIzMzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", publisher: "C.H.Beck", year: "2014" },
  { id: 2, title: "Die Große Transformation", author: "Karl Polanyi", price: "18,50 €", cover: "https://images.unsplash.com/photo-1566460515138-fcc72d83caf7?w=400", publisher: "Suhrkamp", year: "1944" },
  { id: 3, title: "Modern Monetary Theory", author: "L. Randall Wray", price: "29,90 €", cover: "https://images.unsplash.com/photo-1646032538629-6b8647ab0761?w=400", publisher: "Palgrave", year: "2015" },
  { id: 4, title: "Der Preis der Ungleichheit", author: "Joseph Stiglitz", price: "22,00 €", cover: "https://images.unsplash.com/photo-1607948937289-5ca19c59e70f?w=400", publisher: "Siedler", year: "2012" },
  { id: 5, title: "Gemeinwohl-Ökonomie", author: "Christian Felber", price: "19,90 €", cover: "https://images.unsplash.com/photo-1566460515138-fcc72d83caf7?w=400", publisher: "Deuticke", year: "2018" },
  { id: 6, title: "Die Solidarische Moderne", author: "Klaus Dörre", price: "26,50 €", cover: "https://images.unsplash.com/photo-1646032538629-6b8647ab0761?w=400", publisher: "Campus", year: "2019" },
  { id: 7, title: "Wirtschaft neu denken", author: "Maja Göpel", price: "17,90 €", cover: "https://images.unsplash.com/photo-1607948937289-5ca19c59e70f?w=400", publisher: "Ullstein", year: "2020" },
  { id: 8, title: "Die Nullzinsfalle", author: "Daniel Stelter", price: "24,00 €", cover: "https://images.unsplash.com/photo-1566460515138-fcc72d83caf7?w=400", publisher: "Campus", year: "2019" },
  { id: 9, title: "Schuldenbremse & Co", author: "Achim Truger", price: "21,50 €", cover: "https://images.unsplash.com/photo-1646032538629-6b8647ab0761?w=400", publisher: "VSA", year: "2016" },
  { id: 10, title: "Wirtschaftspolitik", author: "Heiner Flassbeck", price: "28,90 €", cover: "https://images.unsplash.com/photo-1607948937289-5ca19c59e70f?w=400", publisher: "Westend", year: "2018" },
];

const tags = ["Wirtschaft", "Politik", "MMT", "Empfehlung"];

const ownBooks = [
  { 
    id: 1, 
    title: "Mythbusting Modern Monetary Theory", 
    author: "Maurice Ökonomius",
    subtitle: "Eine kritische Auseinandersetzung mit gängigen Missverständnissen",
    publisher: "Campus Verlag", 
    publisherUrl: "https://www.campus.de/",
    year: "2023",
    price: "29,90 €",
    cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400",
    availability: "lieferbar" as const
  },
  { 
    id: 2, 
    title: "Geld für die Welt", 
    author: "Maurice Ökonomius",
    subtitle: "Warum wir eine neue Wirtschaftspolitik brauchen",
    publisher: "Ullstein", 
    publisherUrl: "https://www.ullstein-buchverlage.de/",
    year: "2021",
    price: "24,00 €",
    cover: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400",
    availability: "lieferbar" as const
  },
  { 
    id: 3, 
    title: "Die Staatsfinanzierung", 
    author: "Maurice Ökonomius",
    subtitle: "Grundlagen moderner Geldpolitik verstehen",
    publisher: "Beck Verlag", 
    publisherUrl: "https://www.beck.de/",
    year: "2020",
    price: "26,50 €",
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
    availability: "vorbestellung" as const
  },
];

export function BooksSection() {
  return (
    <>
      {/* Own Books Section - First */}
      <OwnBooksSection
        creatorAvatar="https://images.unsplash.com/photo-1648522168784-067e98df88c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb2RjYXN0ZXIlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjM3MzM0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
        creatorName="Maurice Ökonomius"
        creatorFocus="Politökonom, Host von Geld für die Welt"
        books={ownBooks}
        backgroundColor="white"
      />

      {/* Regular Recommendations */}
      <CreatorCarousel
        creatorAvatar="https://images.unsplash.com/photo-1648522168784-067e98df88c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb2RjYXN0ZXIlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjM3MzM0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
        creatorName="Maurice Ökonomius"
        creatorFocus="Politökonom, Host von Geld für die Welt"
        occasion="5 Bücher über MMT"
        curationReason="Diese Bücher bieten einen guten Einstieg in die moderne Geldtheorie."
        showSocials={true}
        books={books}
        showCta={true}
        ctaText="Alle Bücher ansehen"
        backgroundColor="beige"
      />
    </>
  );
}