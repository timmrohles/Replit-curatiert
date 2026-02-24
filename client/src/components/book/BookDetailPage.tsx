import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { Heart, Share2, ShoppingCart, Check, Play, Tv, Youtube, Mic, Newspaper, Award, Trophy, Medal, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, ExternalLink, Info, Tags } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Button } from "../ui/button";
import { useSafeNavigate } from "../../utils/routing";
import { useFavorites } from "../favorites/FavoritesContext";
import { useCart } from "../shop/CartContext";
import { Breadcrumb } from "../layout/Breadcrumb";
import { LikeButton } from "../favorites/LikeButton";
import { CreatorCarousel } from "../creator/CreatorCarousel";
import { BookCarouselItem, BookCarouselItemData } from "./BookCarouselItem";
import { SimilarBooksSection } from "./SimilarBooksSection";
import { BookRatingWidget } from "./BookRatingWidget";
import { BookReaderAssessment } from "./BookReaderAssessment";
import { CarouselContainer } from "../carousel/CarouselContainer";
import { ReviewCard, Review } from "../common/ReviewCard";
import { Heading, Text } from "../ui/typography";
import { Section } from "../ui/section";
import { Container } from "../ui/container";
import { AccordionButton } from "../common/AccordionButton";
import { getAllAwards, getBookAwards, Award as AwardType, BookAward as BookAwardInfo, getAllONIXTags, ONIXTag, getGoogleBooksRating, GoogleBooksRating, getAllBooks, Book as APIBook, getRecommendedBooks } from "../../utils/api";
import { useTheme } from "../../utils/ThemeContext";
import { BRAND_COLORS } from '../../utils/tag-colors';
import { getBookImageMetadata } from "../../utils/onixImageMetadata";
import { Header } from "../layout/Header";
import { Footer } from "../layout/Footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// ============================================
// UTILITY FUNCTIONS - Extracted for reusability
// ============================================

// Partner Logo Mapping - moved outside component
const getPartnerLogo = (partnerName: string, url: string): string => {
  const name = partnerName.toLowerCase();
  const urlLower = url.toLowerCase();
  
  if (name.includes('bücher.de') || urlLower.includes('buecher.de')) {
    return 'https://www.buecher.de/img/logo-buecher-de.svg';
  }
  if (name.includes('geniallokal') || urlLower.includes('genialokal')) {
    return 'https://www.genialokal.de/static/genialokal-logo.svg';
  }
  if (name.includes('thalia') || urlLower.includes('thalia')) {
    return 'https://www.thalia.de/static/img/thalia-logo.svg';
  }
  if (name.includes('amazon') || urlLower.includes('amazon')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg';
  }
  if (name.includes('hugendubel') || urlLower.includes('hugendubel')) {
    return 'https://www.hugendubel.de/static/hugendubel-logo.svg';
  }
  return '';
};

// Press quotes data - extracted for maintainability
const PRESS_QUOTES = [
  {
    quote: "Ein bahnbrechendes Werk, das komplexe medizinische Zusammenhänge verständlich macht und gleichzeitig praktische Lösungen bietet.",
    source: "Der Standard"
  },
  {
    quote: "Biritz-Wagenbichler gelingt es meisterhaft, wissenschaftliche Erkenntnisse in alltagstaugliche Strategien zu übersetzen.",
    source: "Kurier"
  },
  {
    quote: "Ein Muss für alle, die ihre Gesundheit selbst in die Hand nehmen wollen. Fundiert, motivierend und inspirierend.",
    source: "Falter"
  }
];

export function BookDetailPage() {
  const { t } = useTranslation();
  const navigate = useSafeNavigate();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { addToCart, isInCart } = useCart();
  const { resolvedTheme } = useTheme();
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [bookAwards, setBookAwards] = useState<BookAwardInfo[]>([]);
  const [googleRating, setGoogleRating] = useState<GoogleBooksRating | null>(null);
  const [isLoadingRating, setIsLoadingRating] = useState(true);
  const [activeAffiliates, setActiveAffiliates] = useState<Array<{
    id: number; name: string; slug: string; website_url: string | null;
    link_template: string; icon_url: string | null; favicon_url: string | null;
    display_order: number;
  }>>([]);
  
  // Accordion states for mobile
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [isAwardsOpen, setIsAwardsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  
  // Book data
  const book = {
    id: "bewegung-alltag-1",
    title: "Bring Bewegung in deinen Alltag",
    author: "Mag. Miriam Biritz-Wagenbichler",
    publisher: "Selfpublishing",
    year: "2024",
    price: "19,99 €",
    newPrice: "19,99 €",
    usedPrice: "10,99 €",
    isbn: "978-3-7423-2134-5",
    pages: 352,
    format: "Hardcover",
    language: "Deutsch",
    weight: "620 g",
    dimensions: "21,0 x 14,8 x 2,8 cm",
    edition: "1. Auflage",
    binding: "Gebunden",
    // ONIX Tags für Similar Books (moved to main onixTagIds below)
    // Collection info
    collection: "Gesundheitsreihe",
    collectionNumber: 1,
    // Serie Books - andere Bücher aus derselben Reihe
    seriesBooks: [
      {
        id: "gesundheitsreihe-2",
        title: "Ernährung für ein langes Leben",
        author: "Mag. Miriam Biritz-Wagenbichler",
        collectionNumber: 2,
        price: "19,99 €",
        isbn: "9783742321352",
        coverImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=600&fit=crop",
        shortDescription: "Wissenschaftlich fundierte Ernährungsstrategien für Langlebigkeit und Vitalität. Entdecken Sie, wie Sie durch bewusste Ernährung Ihre Gesundheit nachhaltig fördern können. Praktische Tipps für jeden Tag. Ihr Weg zu einem langen, gesunden Leben!",
        categories: ["Gesundheit & Fitness", "Ernährung", "Ratgeber"],
        tags: ["Langlebigkeit", "Ernährung", "Vitalität", "Gesundheit"]
      },
      {
        id: "gesundheitsreihe-3",
        title: "Stressmanagement im Alltag",
        author: "Mag. Miriam Biritz-Wagenbichler",
        collectionNumber: 3,
        price: "18,99 €",
        isbn: "9783742321369",
        coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop",
        shortDescription: "Effektive Strategien zur Stressbewältigung im modernen Alltag. Lernen Sie, wie Sie Belastungen erkennen und gezielt reduzieren können. Wissenschaftlich fundiert und alltagstauglich. Für mehr Gelassenheit und Balance!",
        categories: ["Gesundheit & Fitness", "Psychologie", "Ratgeber"],
        tags: ["Stress", "Entspannung", "Achtsamkeit", "Balance"]
      },
      {
        id: "gesundheitsreihe-4",
        title: "Regeneration & Schlaf",
        author: "Mag. Miriam Biritz-Wagenbichler",
        collectionNumber: 4,
        price: "19,99 €",
        isbn: "9783742321376",
        coverImage: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=600&fit=crop",
        shortDescription: "Optimieren Sie Ihre Regeneration durch besseren Schlaf. Die neuesten Erkenntnisse der Schlafforschung verständlich erklärt. Praktische Methoden für erholsame Nächte. Wachen Sie erfrischt und energiegeladen auf!",
        categories: ["Gesundheit & Fitness", "Schlaf", "Ratgeber"],
        tags: ["Schlaf", "Regeneration", "Erholung", "Gesundheit"]
      }
    ],
    // Weitere Bücher vom Autor - alle Werke desselben Autors (nicht nur aus der Reihe)
    authorBooks: [
      {
        id: "autor-werk-1",
        title: "Meditation für Anfänger",
        author: "Mag. Miriam Biritz-Wagenbichler",
        price: "16,99 €",
        isbn: "9783742320001",
        publisher: "Selfpublishing",
        coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop",
        shortDescription: "Eine sanfte Einführung in die Welt der Meditation. Lernen Sie einfache Techniken für mehr Ruhe und Klarheit im Alltag. Wissenschaftlich fundiert und leicht umsetzbar. Ihr Einstieg in ein achtsames Leben!",
        categories: ["Gesundheit & Fitness", "Meditation", "Ratgeber"],
        tags: ["Meditation", "Achtsamkeit", "Anfänger", "Entspannung"]
      },
      {
        id: "autor-werk-2",
        title: "Yoga für den Rücken",
        author: "Mag. Miriam Biritz-Wagenbichler",
        price: "18,99 €",
        isbn: "9783742320002",
        publisher: "Achtsamkeit Verlag",
        coverImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=600&fit=crop",
        shortDescription: "Gezielte Yoga-Übungen für einen gesunden und starken Rücken. Sanfte Dehnungen und Kräftigungsübungen gegen Rückenschmerzen. Von der Expertin entwickelt und praxiserprobt. Für mehr Lebensqualität ohne Schmerzen!",
        categories: ["Gesundheit & Fitness", "Yoga", "Ratgeber"],
        tags: ["Yoga", "Rücken", "Schmerzfrei", "Beweglichkeit"]
      },
      {
        id: "autor-werk-3",
        title: "Gesunde Gelenke",
        author: "Mag. Miriam Biritz-Wagenbichler",
        price: "17,99 €",
        isbn: "9783742320003",
        publisher: "Selfpublishing",
        coverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
        shortDescription: "Bewahren Sie Ihre Gelenkgesundheit durch gezielte Bewegung. Präventive Strategien und therapeutische Übungen vereint. Wissenschaftlich fundiert und alltagstauglich. Bleiben Sie beweglich bis ins hohe Alter!",
        categories: ["Gesundheit & Fitness", "Prävention", "Ratgeber"],
        tags: ["Gelenke", "Mobilität", "Prävention", "Gesundheit"]
      },
      {
        id: "autor-werk-4",
        title: "Kraft im Alter",
        author: "Mag. Miriam Biritz-Wagenbichler",
        price: "19,99 €",
        isbn: "9783742320004",
        publisher: "Gesundheit & Leben Verlag",
        coverImage: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=600&fit=crop",
        shortDescription: "Krafttraining speziell für die Generation 60+. Sicher, effektiv und auf die Bedürfnisse älterer Menschen abgestimmt. Wissenschaftlich fundierte Methoden für mehr Vitalität. Bleiben Sie stark und selbstständig!",
        categories: ["Gesundheit & Fitness", "Senioren", "Ratgeber"],
        tags: ["Kraft", "Alter", "Fitness", "Vitalität"]
      },
      {
        id: "autor-werk-5",
        title: "Beweglich bleiben",
        author: "Mag. Miriam Biritz-Wagenbichler",
        price: "15,99 €",
        isbn: "9783742320005",
        publisher: "Selfpublishing",
        coverImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop",
        shortDescription: "Ihre tägliche Routine für lebenslange Beweglichkeit. Einfache Übungen für jeden Tag, die wirklich funktionieren. Wissenschaftlich fundiert und sofort umsetzbar. Für ein aktives Leben ohne Einschränkungen!",
        categories: ["Gesundheit & Fitness", "Beweglichkeit", "Ratgeber"],
        tags: ["Beweglichkeit", "Flexibilität", "Alltag", "Gesundheit"]
      },
      {
        id: "autor-werk-6",
        title: "Entspannung & Stressmanagement",
        author: "Mag. Miriam Biritz-Wagenbichler",
        price: "18,99 €",
        isbn: "9783742320006",
        publisher: "Balance Verlag",
        coverImage: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=600&fit=crop",
        shortDescription: "Effektive Strategien gegen Stress und für mehr innere Ruhe. Wissenschaftlich erprobte Entspannungsmethoden für den Alltag. Von Atemtechniken bis zur progressiven Muskelentspannung. Finden Sie Ihre Balance!",
        categories: ["Gesundheit & Fitness", "Stress", "Ratgeber"],
        tags: ["Entspannung", "Stress", "Balance", "Achtsamkeit"]
      }
    ],
    // ONIX Product Form - wird später aus ONIX-Feed geladen
    productForm: "Hardcover", // z.B. "Hardcover", "Taschenbuch", "eBook", "Hörbuch"
    // Rating-System entfernt - ersetzt durch qualitatives Bewertungssystem
    // ONIX Metadata für Bewertungs-Routing
    onix: {
      subtitle: "30 Übungen für mehr Vitalität und Gesundheit",
      bookWorld: 'sachbuch' as const,
      warengruppe: '2480', // Gesundheit/Fitness
      themaCodes: ['VFM', 'VFMG1'], // Fitness, Bewegung
      keywords: ['Bewegung', 'Alltag', 'Gesundheit', 'Fitness'],
      lesemotive: ['Selbstoptimierung', 'Gesundheit'],
      audience: 'Allgemeines Publikum',
      readingLevel: 'Einsteiger',
    },
    description: "Ein revolutionärer Ansatz für mehr Mobilität, Gesundheit und Lebensqualität im Alltag. Dieses Buch zeigt, wie kleine Veränderungen im täglichen Leben große Wirkung entfalten können.",
    shortDescription: "Ein praktischer Ratgeber, der zeigt, wie Sie durch einfache Bewegungsübungen Ihre Gesundheit nachhaltig verbessern können. Die Autorin kombiniert wissenschaftliche Erkenntnisse mit alltagstauglichen Strategien. Perfekt für alle, die mehr Bewegung in ihren Alltag integrieren möchten. Ein Muss für Gesundheitsbewusste!",
    longDescription: "Entdecken Sie praktische Übungen und wissenschaftlich fundierte Methoden, um beweglicher, gesünder und leistungsfähiger zu werden. Mit einem ganzheitlichen Konzept für jeden Lebensbereich – von der Arbeit bis zur Freizeit. Lernen Sie, wie Sie durch einfache Anpassungen Ihrer täglichen Gewohnheiten nachhaltig Ihre Gesundheit verbessern können. Dieses Buch verbindet modernste Erkenntnisse aus der Bewegungsforschung mit jahrzehntelanger praktischer Erfahrung in der Betreuung von Patient*innen. Die Autorin zeigt anhand zahlreicher Fallbeispiele und Erfolgsgeschichten, wie Menschen jeden Alters und jeder Fitnessstufe mehr Bewegung in ihren Alltag integrieren können – ohne zusätzlichen Zeitaufwand oder teure Fitness-Studios. Von ergonomischen Arbeitsplatzgestaltungen über Mobilitätsübungen für zwischendurch bis hin zu ganzheitlichen Bewegungsroutinen bietet dieses Werk einen umfassenden Leitfaden für ein aktiveres Leben. Mit über 100 bebilderten Übungen, praktischen Wochenplänen und wissenschaftlich belegten Strategien zur Motivationssteigerung. Die Autorin legt besonderen Wert auf die Biomechanik des menschlichen Körpers und erklärt, wie verschiedene Bewegungsmuster unsere Gesundheit beeinflussen. Sie geht auf häufige Fehlhaltungen ein und zeigt, wie diese durch gezielte Übungen korrigiert werden können. Ein besonderes Highlight sind die alltagsintegrierten Bewegungskonzepte: Vom richtigen Sitzen am Schreibtisch über optimale Hebetechniken bis hin zu Mobilisationsübungen während der Hausarbeit. Das Buch richtet sich sowohl an Bewegungseinsteiger als auch an erfahrene Sportler, die ihre Bewegungsqualität optimieren möchten. Mit einem wissenschaftlich fundierten Ansatz, der dennoch leicht verständlich und sofort umsetzbar ist, macht dieses Werk Bewegung zu einem natürlichen und freudvollen Teil des Alltags.",
    coverImage: "https://images.unsplash.com/photo-1591311630200-ffa9120a540f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd2VsbG5lc3MlMjBib29rfGVufDF8fHx8MTc2NzYwNDY1OXww&ixlib=rb-4.1.0&q=80&w=1080",
    // ONIX Categories (BISAC Subject Codes) - werden später aus Admin-Backend geladen
    categories: ["Gesundheit & Fitness", "Ratgeber", "Sport"],
    // ONIX Tags (Keywords/Thema Subject Categories) - werden später aus Admin-Backend geladen
    tags: ["Mobilität", "Alltag", "Prävention", "Selbsthilfe", "Wissenschaft"],
    // ONIX Tag IDs - Mock: später werden diese Buchdaten aus dem Backend geladen mit verknüpften ONIX-Tags (Auszeichnungen)
    onixTagIds: ["Shortlisted - Deutscher Buchpreis 2025", "Winner - Booker Prize 2024", "Longlisted - National Book Award 2025"],
    
    // ========== ERWEITERTE ONIX-FELDER ==========
    
    // 1. Verfügbarkeit & Lieferstatus (ONIX ProductAvailability)
    availability: "lieferbar", // ONIX ProductAvailability
    expectedShipDate: null, // z.B. "2025-03-15" für Vorbestellungen
    
    // 2. Dimensionen & Gewicht (detailliert für haptische Beschreibungen)
    heightMm: 210, // Höhe in mm
    widthMm: 148, // Breite in mm
    thicknessMm: 28, // Rückenbreite in mm
    weightG: 620, // Gewicht in Gramm
    
    // 3. Verknüpfte Produkte (Alternative Formate per ONIX RelatedProduct)
    relatedProducts: [
      { type: "eBook", isbn: "978-3-7423-2135-2", relationCode: "13" }, // Code 13 = E-Book-Version
      { type: "Hörbuch", isbn: "978-3-7423-2136-9", relationCode: "06" } // Code 06 = Alternatives Format
    ],
    
    // 4. Erweiterte Mitwirkende (ONIX ContributorRole)
    contributors: [
      { name: "Mag. Miriam Biritz-Wagenbichler", role: "A01", roleDescription: "Autorin" }, // A01 = Autor
      // Beispiel für Übersetzer: { name: "Dr. Sophie Müller", role: "B06", roleDescription: "Übersetzerin" }, // B06 = Übersetzer
      { name: "Anna Schmidt", role: "A12", roleDescription: "Illustratorin" }, // A12 = Illustrator
      { name: "Prof. Dr. Martin Weber", role: "A19", roleDescription: "Fachliche Beratung" } // A19 = Fachliche Beratung
    ],
    
    formats: [
      { type: "Hardcover", price: "19,99 €", available: true },
      { type: "Softcover", price: "14,99 €", available: true },
      { type: "eBook", price: "9,99 €", available: true },
      { type: "Hörbuch", price: "16,99 €", available: false }
    ],
    deliveryStatus: "Sofort lieferbar",
    affiliatePartners: [
      { 
        name: "Bücher.de", 
        logo: "https://www.buecher.de/bundles/buecherde/img/logo.svg",
        urlTemplate: "https://www.buecher.de/shop/buecher/ean{ISBN}"
      },
      { 
        name: "Genialokal", 
        logo: "https://www.genialokal.de/static/img/genialokal-logo.svg",
        urlTemplate: "https://www.genialokal.de/Produkt/{ISBN}"
      },
      { 
        name: "Amazon", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
        urlTemplate: "https://www.amazon.de/dp/{ISBN}"
      },
      { 
        name: "Thalia", 
        logo: "https://www.thalia.de/shop/dist/assets/logo.svg",
        urlTemplate: "https://www.thalia.de/shop/home/artikeldetails/EAN{ISBN}"
      },
      { 
        name: "Hugendubel", 
        logo: "https://www.hugendubel.de/themes/hugendubel_2020/assets/images/logo.svg",
        urlTemplate: "https://www.hugendubel.de/de/ean/{ISBN}"
      }
    ],
    curations: [
      {
        id: "curation-1",
        title: "Bücher, die dein Leben verändern",
        reason: "Praktische Ratgeber für mehr Gesundheit, Achtsamkeit und persönliches Wachstum im Alltag.",
        curator: "Dr. Sarah Wellness",
        curatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        curatorBio: "Gesundheitsexpertin & Bestseller-Autorin",
        covers: [
          "https://i.ibb.co/vxjmkcZH/bring-bewegung.jpg",
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400"
        ]
      },
      {
        id: "curation-2",
        title: "Bewegung & Körperbewusstsein",
        reason: "Eine Sammlung inspirierender Werke über die Verbindung von Körper und Geist.",
        curator: "Prof. Michael Körper",
        curatorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        curatorBio: "Sportwissenschaftler & Coach",
        covers: [
          "https://i.ibb.co/vxjmkcZH/bring-bewegung.jpg",
          "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400",
          "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400"
        ]
      },
      {
        id: "curation-3",
        title: "Die besten Gesundheitsratgeber 2024",
        reason: "Aktuelle und wissenschaftlich fundierte Bücher für ein gesünderes Leben.",
        curator: "Lisa Buchmann",
        curatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        curatorBio: "Buchhändlerin & Wellness-Coach",
        covers: [
          "https://i.ibb.co/vxjmkcZH/bring-bewegung.jpg",
          "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400",
          "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400"
        ]
      }
    ],
    curatorReviews: [
      {
        id: "review-1",
        curatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        curatorName: "Dr. Sarah Wellness",
        curatorFocus: "Gesundheitsexpertin",
        reviewTitle: "Ein Must-Read für jeden, der gesünder leben will",
        reviewText: "Dieses Buch hat meine Sichtweise auf Bewegung im Alltag komplett verändert. Die praktischen Tipps sind leicht umzusetzen und wissenschaftlich fundiert. Besonders beeindruckend ist, wie die Autorin es schafft, komplexe medizinische Zusammenhänge verständlich zu erklären. Nach nur zwei Wochen habe ich bereits positive Veränderungen in meiner Mobilität gespürt.",
      },
      {
        id: "review-2",
        curatorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        curatorName: "Prof. Michael Körper",
        curatorFocus: "Sportwissenschaftler",
        reviewVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        reviewVideoThumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
      },
      {
        id: "review-3",
        curatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        curatorName: "Lisa Buchmann",
        curatorFocus: "Buchhändlerin & Wellness-Coach",
        reviewTitle: "Perfekt für Einsteiger und Fortgeschrittene",
        reviewText: "Als Buchhändlerin habe ich schon viele Gesundheitsratgeber gelesen, aber dieser sticht heraus. Die Übungen sind alltagstauglich und die Erklärungen motivierend. Ich empfehle es allen meinen Kund*innen!",
      },
      {
        id: "review-4",
        curatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        curatorName: "Tom Fitness",
        curatorFocus: "Personal Trainer",
        reviewTitle: "Wissenschaftlich fundiert und praxisnah",
        reviewText: "Endlich ein Buch, das die Brücke zwischen Theorie und Praxis schlägt. Die Autorin versteht es, komplexe Bewegungsabläufe einfach zu erklären. Ich nutze viele Übungen aus diesem Buch in meinen Trainings mit Klient*innen.",
      }
    ],
    reviews: [
      {
        id: 1,
        userName: "Anna M.",
        date: "15. Dez 2024",
        text: "Absolut empfehlenswert! Die Übungen sind einfach in den Alltag zu integrieren und zeigen schnell Wirkung.",
        verified: true
      },
      {
        id: 2,
        userName: "Michael S.",
        date: "8. Dez 2024",
        text: "Sehr gutes Buch mit praktischen Tipps. Hätte mir mehr bebilderte Übungen gewünscht.",
        verified: true
      },
      {
        id: 3,
        userName: "Lisa K.",
        date: "1. Dez 2024",
        text: "Hat mir wirklich geholfen, mehr Bewegung in meinen Büroalltag zu bringen. Danke!",
        verified: false
      }
    ],
    collections: [
      {
        id: "collection-1",
        name: "Gesundheit & Wohlbefinden",
        bookCount: 24
      },
      {
        id: "collection-2",
        name: "Ratgeber Bewegung",
        bookCount: 18
      },
      {
        id: "collection-3",
        name: "Bestseller 2024",
        bookCount: 42
      },
      {
        id: "collection-4",
        name: "Wissenschaftlich fundiert",
        bookCount: 31
      }
    ],
    
    // ============================================
    // ONIX 3.0 IMAGE METADATA (ResourceFeature - Codelist 160)
    // ============================================
    coverImageAlt: "Buchcover von 'Bring Bewegung in deinen Alltag' – zeigt eine aktive Person bei einer Alltagsbewegung mit farbenfrohem, modernem Design",
    coverImageCaption: "Buchcover der ersten Ausgabe, Selfpublishing 2024",
    coverImageCredit: "© 2024 Selfpublishing, Covergestaltung: Studio Bewegung"
  };
  
  const [selectedFormat, setSelectedFormat] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareBookTitle, setShareBookTitle] = useState("");
  const [bookDescExpanded, setBookDescExpanded] = useState(false);
  const [authorBioExpanded, setAuthorBioExpanded] = useState(false);
  const [isCoverFlipped, setIsCoverFlipped] = useState(false);
  const [showTagsOverlay, setShowTagsOverlay] = useState(false);
  
  // Recommended Books State
  const [allBooks, setAllBooks] = useState<APIBook[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<APIBook[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  
  // Sort/Filter State for Recommended Books
  const [sortBy, setSortBy] = useState('popularity');
  const sortChipsRef = useRef<HTMLDivElement>(null);
  
  // Sort State for Series Books
  const [seriesSortBy, setSeriesSortBy] = useState('popularity');
  const seriesSortChipsRef = useRef<HTMLDivElement>(null);
  
  // Sort State for Author Books
  const [authorBooksSortBy, setAuthorBooksSortBy] = useState('popularity');
  const authorBooksSortChipsRef = useRef<HTMLDivElement>(null);
  
  // Reviews Sort State
  const [reviewSortBy, setReviewSortBy] = useState<'helpful' | 'newest'>('helpful');
  
  // Media appearances with embeds
  const mediaAppearances = [
    {
      id: "1",
      type: "youtube",
      title: "Fitness & Gesundheit Podcast",
      embedUrl: "https://open.spotify.com/embed/show/0dyJdydMz1i9We0sDfpBwi?utm_source=generator"
    },
    {
      id: "2",
      type: "podcast",
      title: "Bewegung im Alltag",
      embedUrl: "https://open.spotify.com/embed/show/1wZEFFvEnvPiQ5xDbLazUs?utm_source=generator"
    },
    {
      id: "3",
      type: "youtube",
      title: "Health Talk Show",
      embedUrl: "https://open.spotify.com/embed/show/3y2v9YFuNnHOSMeK1QDxA5?utm_source=generator"
    }
  ];
  
  // Reviews
  const reviews = [
    {
      id: "1",
      author: "Dr. Sarah Klein",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      date: "vor 2 Wochen",
      text: "Ein absolut bahnbrechendes Werk! Die Autorin schafft es, komplexe biomechanische Konzepte in praktische, alltagstaugliche Strategien zu übersetzen. Besonders beeindruckend ist der ganzheitliche Ansatz, der über bloße Übungen hinausgeht.",
      upvotes: 42,
      downvotes: 2,
      comments: 8,
      isCurator: true
    },
    {
      id: "2",
      author: "Michael R.",
      authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      date: "vor 1 Monat",
      text: "Nachdem ich jahrelang unter Rückenschmerzen litt, hat mir dieses Buch wirklich geholfen. Die Übungen sind einfach umzusetzen und die Erklärungen sehr verständlich.",
      upvotes: 28,
      downvotes: 1,
      comments: 5,
      isCurator: false
    },
    {
      id: "3",
      author: "Lisa M.",
      authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      date: "vor 2 Monaten",
      text: "Sehr praxisorientiert und gut strukturiert. Manchmal etwas detailliert, aber insgesamt ein großartiger Ratgeber für alle, die ihre Bewegungsqualität verbessern wollen.",
      upvotes: 19,
      downvotes: 3,
      comments: 3,
      isCurator: false
    }
  ];
  
  // Related books
  const relatedBooks = [
    {
      id: "1",
      title: "Werde ein geschmeidiger Leopard",
      author: "Kelly Starrett",
      publisher: "Riva Verlag",
      year: 2016,
      price: "34,99 €",
      cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop"
    },
    {
      id: "2",
      title: "Born to Run",
      author: "Christopher McDougall",
      publisher: "Heyne",
      year: 2011,
      price: "12,99 €",
      cover: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=400&h=600&fit=crop"
    },
    {
      id: "3",
      title: "Breath",
      author: "James Nestor",
      publisher: "Piper",
      year: 2021,
      price: "22,00 €",
      cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"
    },
    {
      id: "4",
      title: "Outlive",
      author: "Peter Attia",
      publisher: "Penguin",
      year: 2023,
      price: "28,00 €",
      cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop"
    }
  ];
  
  const inCart = isInCart(book.id);
  const [pressExpanded, setPressExpanded] = useState(false);
  
  // Load awards and ONIX tags from backend
  useEffect(() => {
    let isMounted = true;
    
    async function loadAwardsAndTags() {
      try {
        const [awardsData, tagsData] = await Promise.all([
          getAllAwards(),
          getAllONIXTags()
        ]);
        
        if (isMounted) {
          setAwards(awardsData);
          setOnixTags(tagsData);
          
          // Parse and match awards using the new getBookAwards helper
          const parsedAwards = await getBookAwards(book.id);
          setBookAwards(parsedAwards);
        }
      } catch (error) {
        if (isMounted) {
          // Gracefully handle error without exposing system internals
          // Set empty arrays as fallback
          setAwards([]);
          setOnixTags([]);
          setBookAwards([]);
        }
      }
    }
    
    async function loadGoogleRating() {
      try {
        if (isMounted) {
          setIsLoadingRating(true);
        }
        const rating = await getGoogleBooksRating(book.isbn);
        if (isMounted) {
          setGoogleRating(rating);
        }
      } catch (error) {
        if (isMounted) {
          // Gracefully handle error - fallback to no rating
          setGoogleRating(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingRating(false);
        }
      }
    }
    
    loadAwardsAndTags();
    loadGoogleRating();

    fetch('/api/affiliates/active')
      .then(r => r.json())
      .then(data => { if (isMounted && data.ok) setActiveAffiliates(data.data || []); })
      .catch(() => { if (isMounted) setActiveAffiliates([]); });
    
    return () => {
      isMounted = false;
    };
  }, [book.isbn]);

  // Load all books for recommendations
  useEffect(() => {
    let isMounted = true;
    
    getAllBooks()
      .then(books => {
        if (isMounted) {
          setAllBooks(books);
          setLoadingRecommended(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          // Gracefully handle error - fallback to empty list
          setLoadingRecommended(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate recommended books when allBooks or book changes
  useEffect(() => {
    if (allBooks.length === 0) {
      setRecommendedBooks([]);
      return;
    }

    getRecommendedBooks(
      {
        ...book,
        tags: book.tags || [],
        onixTagIds: book.onixTagIds || [],
        availability: book.availability || 'lieferbar',
        curatorId: (book as any).curator?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as APIBook,
      allBooks,
      4 // Max 4 Empfehlungen
    ).then(recommendations => {
      setRecommendedBooks(recommendations);
    }).catch(() => {
      // Gracefully handle error - fallback to empty recommendations
      setRecommendedBooks([]);
    });
  }, [allBooks, book.id]);

  // Calculate recommendation score
  const calculateRecommendationScore = (recommendBook: APIBook): number => {
    let score = 0;
    
    // Same publisher (high priority)
    if (recommendBook.publisher && book.publisher && recommendBook.publisher === book.publisher) {
      score += 30;
    }
    
    // Same author (very high priority)
    if (recommendBook.author && book.author && recommendBook.author === book.author) {
      score += 50;
    }
    
    // Same series (highest priority)
    if (recommendBook.collection && book.collection && recommendBook.collection === book.collection) {
      score += 100;
    }
    
    // Recent books (published in last 2 years) get bonus
    const currentYear = new Date().getFullYear();
    if (recommendBook.year && parseInt(recommendBook.year) >= currentYear - 2) {
      score += 15;
    }
    
    // Books with awards get bonus
    if (recommendBook.onixTagIds && recommendBook.onixTagIds.length > 0) {
      score += 10;
    }
    
    // Add some randomness for variety (0-10 points)
    score += Math.random() * 10;
    
    return score;
  };

  // Sort options for recommended books
  const sortOptions = useMemo(() => [
    { 
      id: 'popularity', 
      label: 'Beliebtheit',
      tooltip: 'Sortiert nach Saves, Interaktionen und Plattform-Engagement'
    },
    { 
      id: 'awarded', 
      label: 'Anzahl Buchpreise',
      tooltip: 'Sortiert nach Anzahl und Bedeutung von Preisen'
    },
    { 
      id: 'trending', 
      label: 'Relevant (aktuell)',
      tooltip: 'Sortiert Neuerscheinungen nach Veröffentlichungszeitpunkt'
    },
  ], []);

  // Apply sorting to recommended books based on sortBy preference
  const sortedRecommendedBooks = useMemo(() => {
    if (sortBy === 'awarded') {
      return [...recommendedBooks].sort((a, b) => {
        const aAwards = (a.onixTagIds?.length || 0);
        const bAwards = (b.onixTagIds?.length || 0);
        return bAwards - aAwards;
      });
    } else if (sortBy === 'trending') {
      return [...recommendedBooks].sort((a, b) => {
        const aYear = parseInt(a.year || '0');
        const bYear = parseInt(b.year || '0');
        return bYear - aYear;
      });
    }
    
    // Default: use algorithm's score-based sorting
    return recommendedBooks;
  }, [recommendedBooks, sortBy]);

  // Apply sorting to series books
  const sortedSeriesBooks = useMemo(() => {
    if (!book.seriesBooks) return [];
    
    if (seriesSortBy === 'awarded') {
      return [...book.seriesBooks].sort((a, b) => {
        const aAwards = (a.tags?.length || 0);
        const bAwards = (b.tags?.length || 0);
        return bAwards - aAwards;
      });
    } else if (seriesSortBy === 'trending') {
      return [...book.seriesBooks].sort((a, b) => {
        const aNum = a.collectionNumber || 0;
        const bNum = b.collectionNumber || 0;
        return bNum - aNum; // Newest volumes first
      });
    }
    
    // Default: popularity (use collection order)
    return [...book.seriesBooks].sort((a, b) => {
      const aNum = a.collectionNumber || 0;
      const bNum = b.collectionNumber || 0;
      return aNum - bNum; // Series order
    });
  }, [book.seriesBooks, seriesSortBy]);

  // Apply sorting to author books
  const sortedAuthorBooks = useMemo(() => {
    if (!book.authorBooks) return [];
    
    if (authorBooksSortBy === 'awarded') {
      return [...book.authorBooks].sort((a, b) => {
        const aAwards = (a.tags?.length || 0);
        const bAwards = (b.tags?.length || 0);
        return bAwards - aAwards;
      });
    } else if (authorBooksSortBy === 'trending') {
      return [...book.authorBooks].sort((a, b) => {
        // Use price as a proxy for "newness" if no year available
        const aPrice = parseFloat((a.price || '0').replace(/[^\d.,]/g, '').replace(',', '.'));
        const bPrice = parseFloat((b.price || '0').replace(/[^\d.,]/g, '').replace(',', '.'));
        return bPrice - aPrice;
      });
    }
    
    // Default: popularity (alphabetical by title)
    return [...book.authorBooks].sort((a, b) => a.title.localeCompare(b.title));
  }, [book.authorBooks, authorBooksSortBy]);
  
  const handleAddToCart = () => {
    addToCart({
      id: book.id,
      title: book.title,
      price: book.price,
      image: book.coverImage,
    } as any);
  };
  
  const handleToggleFavorite = () => {
    if (isFavorite(book.id)) {
      removeFavorite(book.id);
    } else {
      addFavorite({
        id: book.id,
        type: 'book',
        title: book.title,
        subtitle: book.author,
        image: book.coverImage
      });
    }
  };
  
  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'tv': return Tv;
      case 'youtube': return Youtube;
      case 'podcast': return Mic;
      case 'press': return Newspaper;
      default: return Play;
    }
  };
  
  return (
    <>
      <Header />
      <div className="gradient-bg">
        {/* Schema.org JSON-LD für besseres SEO */}
        <Helmet>
        <title>{book.title} von {book.author} | coratiert.de</title>
        <meta name="description" content={book.description} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            "@id": `https://coratiert.de/book/${book.id}`,
            "name": book.title,
            "isbn": book.isbn?.replace(/-/g, ''), // ISBN ohne Bindestriche
            "image": book.coverImage,
            "description": book.description,
            "author": {
              "@type": "Person",
              "name": book.author,
              "url": `https://coratiert.de/autoren/${book.author.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')}`
            },
            "publisher": {
              "@type": "Organization",
              "name": book.publisher
            },
            "datePublished": book.year.toString(),
            "inLanguage": "de",
            "numberOfPages": book.pages,
            "bookFormat": "https://schema.org/Hardcover",
            ...(book.collection && book.collectionNumber ? {
              "isPartOf": {
                "@type": "BookSeries",
                "name": book.collection,
                "position": book.collectionNumber
              }
            } : {}),
            "offers": {
              "@type": "Offer",
              "price": book.price.replace(/[^\d,]/g, '').replace(',', '.'),
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `https://coratiert.de/book/${book.id}`
            },
            "review": {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": googleRating?.averageRating || "4.5",
                "bestRating": "5",
                "worstRating": "1"
              },
              "author": {
                "@type": "Person",
                "name": book.author
              },
              "reviewBody": book.description,
              "reviewedBy": {
                "@type": "Person",
                "@id": "https://coratiert.de/curator/1",
                "name": "Mag. Miriam Biritz-Wagenbichler",
                "jobTitle": "Gesundheitsexpertin & Bewegungstherapeutin",
                "description": "Expertin für Bewegung und ganzheitliche Gesundheit"
              }
            },
            "aggregateRating": googleRating ? {
              "@type": "AggregateRating",
              "ratingValue": googleRating.averageRating,
              "reviewCount": googleRating.ratingsCount,
              "bestRating": "5",
              "worstRating": "1"
            } : undefined
          })}
        </script>
      </Helmet>

      {/* Breadcrumb Navigation - erweitert mit Serie */}
      <Breadcrumb 
        items={[
          { label: "Start", href: "/" },
          { label: "Bücher", href: "/" },
          { label: book.author, href: "/buecher" },
          ...(book.collection ? [{ 
            label: `${book.collection} (Reihe)`, 
            href: "/series" 
          }] : []),
          { label: book.collectionNumber ? `Band ${book.collectionNumber}: ${book.title}` : book.title }
        ]}
      />
      
      {/* Hero Section mit türkisem Hintergrund */}
      <section className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 lg:pt-24 lg:pb-8 pt-[30px] pb-2">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 xl:gap-16 items-start">
            {/* Left: Book Cover with Mini Images */}
            <div className="relative flex flex-col items-center justify-start w-full lg:px-0">
              {/* Tablet 2-Column Layout: Images & Press Quotes Side-by-Side */}
              <div className="flex flex-col md:flex-row md:gap-6 lg:flex-col w-full items-start">
                {/* Column 1: Book Covers */}
                <div className="w-full md:w-1/2 lg:w-full">
                  <div className="flex flex-row gap-1.5 lg:gap-4 items-start justify-center lg:justify-start w-full">
                    {/* Main Book Cover */}
                    <div className="relative pb-4">
                      <div className="book-container-3d">
                        <div 
                          className="book-cover-3d w-52 lg:w-96 aspect-[2/3] shadow-[0_6px_16px_-2px_rgba(0,0,0,0.25)] dark:shadow-[0_6px_16px_-2px_rgba(0,0,0,0.6)]"
                          style={{ 
                            transform: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'rotateY(5deg)' : 'none'
                          }}
                        >
                          <ImageWithFallback
                            src={book.coverImage || ''}
                            alt={getBookImageMetadata(book as any).alt || book.title}
                            title={getBookImageMetadata(book as any).caption || ''}
                            className="w-full aspect-[2/3] object-cover object-center"
                          />
                        </div>
                      </div>
                      {/* Copyright Credit Line (ONIX ResourceFeature 06) */}
                      {book.coverImageCredit && (
                        <Text variant="xs" className="mt-2 text-center opacity-70 max-w-[208px] lg:max-w-[384px] leading-tight">
                          {book.coverImageCredit}
                        </Text>
                      )}
                    </div>
                    
                    {/* Mini Book Covers - Responsive Scrollable Gallery */}
                    <div 
                      className="flex flex-col gap-2 lg:gap-3 lg:max-h-[576px] w-auto overflow-y-auto lg:pr-2 scrollbar-hide pb-4" 
                      role="list" 
                      aria-label="Buchvorschau-Galerie"
                    >
                      {[
                        { src: book.coverImage, label: 'Vorderseite' },
                        { src: book.coverImage, label: 'Rückseite' },
                        { src: book.coverImage, label: 'Innenansicht' }
                      ].map((img, index) => (
                        <button
                          key={index}
                          type="button"
                          className="book-cover-thumb flex-shrink-0 !w-[90px] lg:!w-[100px]"
                          aria-label={`${book.title} - ${img.label} anzeigen`}
                          role="listitem"
                        >
                          <ImageWithFallback
                            src={img.src}
                            alt={`${book.title} - ${img.label}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 2: Press Quotes (Tablet only) */}
                <div className="hidden md:block md:w-1/2 lg:hidden">
                  <section aria-labelledby="press-quotes-heading-tablet">
                    <Heading 
                      as="h2"
                      variant="h2"
                      id="press-quotes-heading-tablet"
                      className="mb-3 md:mb-4 text-left text-shadow-sm text-foreground"
                    >
                      Pressestimmen
                    </Heading>
                    
                    <div style={{ position: 'relative' }}>
                      <div 
                        className={`press-quotes-container ${pressExpanded ? 'expanded' : 'collapsed'}`}
                        style={{ maxHeight: pressExpanded ? 'none' : '300px' }}
                      >
                        <div className="space-y-2 md:space-y-3">
                          {PRESS_QUOTES.map((press, index) => (
                            <blockquote 
                              key={index} 
                              className="press-quote group"
                            >
                              <Text variant="small" className="press-quote-text group-hover:opacity-90 transition-opacity">
                                "{press.quote}"
                              </Text>
                              <footer className="press-quote-source">
                                <Text variant="xs" as="span">— {press.source}</Text>
                              </footer>
                            </blockquote>
                          ))}
                        </div>
                      </div>
                      
                      {/* Fade-Out Gradient */}
                      {!pressExpanded && PRESS_QUOTES.length >= 3 && (
                        <div 
                          className="press-quotes-fade"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    
                    {PRESS_QUOTES.length >= 3 && (
                      <button
                        type="button"
                        onClick={() => setPressExpanded(!pressExpanded)}
                        className="press-quotes-expand-btn"
                        aria-expanded={pressExpanded}
                        aria-controls="press-quotes-container"
                      >
                        {pressExpanded ? 'Weniger lesen' : 'Mehr lesen'}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${pressExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>
                    )}
                  </section>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 lg:gap-3 mt-4 lg:mt-6 justify-center w-full">
                <Button 
                  variant="outline" 
                  className="flex-1 lg:flex-none px-4 lg:px-6 py-5 lg:py-6 transition-all border-2 text-sm lg:text-base"
                  style={{
                    backgroundColor: 'var(--button-product-bg)',
                    borderColor: 'var(--button-product-border)',
                    color: 'var(--button-product-text)'
                  }}
                  onClick={handleToggleFavorite}
                  aria-label={isFavorite(book.id) ? t('bookComponents.removeFromWishlist') : t('bookComponents.addToWishlist')}
                  aria-pressed={isFavorite(book.id)}
                >
                  <Heart className={`w-4 h-4 lg:w-5 lg:h-5 mr-2 ${isFavorite(book.id) ? 'fill-current' : ''}`} aria-hidden="true" />
                  {isFavorite(book.id) ? 'Gemerkt' : 'Merken'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1 lg:flex-none px-4 lg:px-6 py-5 lg:py-6 transition-all border-2 text-sm lg:text-base"
                  style={{
                    backgroundColor: 'var(--button-product-bg)',
                    borderColor: 'var(--button-product-border)',
                    color: 'var(--button-product-text)'
                  }}
                  aria-label="Buch teilen"
                >
                  <Share2 className="w-4 h-4 lg:w-5 lg:h-5 mr-2" aria-hidden="true" />
                  Teilen
                </Button>
              </div>
              
              {/* Pressestimmen - Mobile & Desktop (lg+) only */}
              <section className="mt-6 md:hidden lg:block lg:mt-8 w-full" aria-labelledby="press-quotes-heading">
                <Heading 
                  as="h2"
                  variant="h2"
                  id="press-quotes-heading"
                  className="mb-3 md:mb-4 text-center text-shadow-sm text-foreground"
                >
                  Pressestimmen
                </Heading>
                
<div style={{ position: 'relative' }}>
                  <div 
                    className={`press-quotes-container ${pressExpanded ? 'expanded' : 'collapsed'}`}
                    style={{ maxHeight: pressExpanded ? 'none' : '300px' }}
                  >
                    <div className="space-y-2 md:space-y-3">
                      {PRESS_QUOTES.map((press, index) => (
                        <blockquote 
                          key={index} 
                          className="press-quote group"
                        >
                          <Text variant="small" className="press-quote-text group-hover:opacity-90 transition-opacity">
                            "{press.quote}"
                          </Text>
                          <footer className="press-quote-source">
                            <Text variant="xs" as="span">— {press.source}</Text>
                          </footer>
                        </blockquote>
                      ))}
                    </div>
                  </div>
                  
                  {/* Fade-Out Gradient */}
                  {!pressExpanded && PRESS_QUOTES.length >= 3 && (
                    <div 
                      className="press-quotes-fade"
                      aria-hidden="true"
                    />
                  )}
                </div>
                
                {PRESS_QUOTES.length >= 3 && (
                  <button
                    type="button"
                    onClick={() => setPressExpanded(!pressExpanded)}
                    className="press-quotes-expand-btn mt-3 font-normal text-[color:var(--color-blue)] transition-all duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[color:var(--color-blue)] focus-visible:outline-offset-2 focus-visible:rounded"
                    aria-expanded={pressExpanded}
                    aria-controls="press-quotes-container"
                  >
                    {pressExpanded ? 'Weniger lesen' : 'Mehr lesen'}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${pressExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                )}
              </section>
            </div>
            
            {/* Right: Book Info */}
            <div className="w-full pr-0 lg:pr-4 xl:pr-0">
              <Heading 
                as="h1"
                variant="h1"
                className="mb-4 text-shadow-sm text-foreground"
              >
                {book.title}
              </Heading>
              
              {/* Subtitle - ALWAYS SHOW FOR DEBUG */}
              <Heading 
                as="h2"
                variant="h3"
                className="mb-4 text-shadow-sm text-foreground opacity-80 !normal-case"
              >
                {book.onix.subtitle}
              </Heading>
              
              {book.collection && (
                <>
                  {/* Series Logo or Badge */}
                  {(book as any).seriesLogo ? (
                    <a 
                      href={`/serien/${(book as any).collectionId || book.collection.toLowerCase().replace(/\s+/g, '-')}`}
                      className="inline-block mb-3 hover:opacity-80 transition-opacity"
                    >
                      <ImageWithFallback
                        src={(book as any).seriesLogo}
                        alt={`${book.collection} Series Logo`}
                        className="h-12 md:h-16 w-auto object-contain"
                      />
                    </a>
                  ) : (
                    <Text
                      as="a"
                      variant="base"
                      href={`/serien/${book.collection.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={(e: any) => {
                        e.preventDefault();
                        navigate(`/serien/${book.collection.toLowerCase().replace(/\s+/g, '-')}`);
                      }}
                      className="series-link inline-block mb-3 !font-sans !normal-case font-semibold"
                    >
                      Band {book.collectionNumber} der {book.collection}
                    </Text>
                  )}
                </>
              )}
              
              <Text variant="default" className="mb-1 leading-relaxed font-semibold" style={{ color: '#6B7280' }}>
                {book.author}
              </Text>
              
              <Text variant="small" className="mb-4 leading-relaxed opacity-90">
                {book.publisher}, {book.year}
              </Text>
              
              {/* Rating - Google Books API */}
              <div className="flex items-center gap-3 mb-5" role="region" aria-label="Buchbewertung">
                {isLoadingRating ? (
                  <span className="text-sm opacity-70" role="status">Bewertungen werden geladen...</span>
                ) : googleRating ? (
                  <Text variant="small">
                    {googleRating.ratingsCount} Bewertungen via Google Books
                  </Text>
                ) : (
                  <Text variant="small" className="opacity-70">{t('bookComponents.noRatingsYet')}</Text>
                )}
              </div>
              
              {/* Description */}
              <Text variant="default" className="mb-5 leading-relaxed">
                {book.description}
              </Text>
              
              {/* Price - Dual Price Display (Neu + Gebraucht) */}

              
              {/* Versandkosten-Hinweis */}

              
              {/* Format Switcher - ONIX RelatedProducts */}

              
              {/* Affiliate Partners - dynamisch aus DB */}
              {activeAffiliates.length > 0 && book.isbn && (
              <section className="mb-6" aria-labelledby="buy-links-heading">
                <Heading 
                  as="h3"
                  variant="h3"
                  id="buy-links-heading"
                  className="mb-3 text-shadow-sm text-foreground"
                >
                  Kaufen bei:
                </Heading>
                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3" role="list">
                  {activeAffiliates.map((aff) => {
                    const cleanIsbn = book.isbn.replace(/-/g, '');
                    const purchaseUrl = aff.link_template
                      .replace(/\{isbn13\}/g, cleanIsbn)
                      .replace(/\{isbn\}/g, cleanIsbn)
                      .replace(/\{ISBN\}/g, cleanIsbn);
                    const iconSrc = aff.icon_url || aff.favicon_url || (aff.website_url ? `https://www.google.com/s2/favicons?domain=${new URL(aff.website_url).hostname}&sz=64` : '');
                    
                    return (
                      <Button
                        key={aff.id}
                        variant="outline"
                        className="px-2 py-4 md:px-4 md:py-6 transition-all border-2 w-full justify-between"
                        style={{
                          backgroundColor: 'var(--button-product-bg)',
                          borderColor: 'var(--button-product-border)',
                          color: 'var(--button-product-text)'
                        }}
                        asChild
                      >
                        <a
                          href={purchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          role="listitem"
                          aria-label={`Buch bei ${aff.name} kaufen`}
                          data-testid={`button-detail-affiliate-${aff.slug}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {iconSrc && (
                              <img src={iconSrc} alt="" className="w-4 h-4 flex-shrink-0" loading="lazy" />
                            )}
                            <Text variant="small" as="span" className="truncate">
                              {aff.name}
                            </Text>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 transition-colors flex-shrink-0" aria-hidden="true" />
                        </a>
                      </Button>
                    );
                  })}
                </div>
                <Text variant="xs" className="opacity-70 !normal-case">
                  {t('bookComponents.shippingNote')}
                </Text>
              </section>
              )}
              
              {/* Used Books Section */}
              <section className="mb-6 pt-4 border-t border-surface-muted" aria-labelledby="used-books-heading">
                {(() => {
                  // Mock-Daten für gebrauchte Bücher - später aus Backend/Feed
                  const usedBookPlatforms = [
                    { name: 'Medimops', price: 10.99, url: `https://www.medimops.de/produkte-C0/?fcIsSearch=1&searchparam=${book.isbn.replace(/-/g, '')}` },
                    { name: 'reBuy', price: 12.49, url: `https://www.rebuy.de/kaufen/buecher?q=${book.isbn.replace(/-/g, '')}` },
                    { name: 'bol.de', price: 11.95, url: `https://www.bol.de/shop/home/suchartikel/${book.isbn.replace(/-/g, '')}` },
                    { name: 'Booklooker', price: 13.50, url: `https://www.booklooker.de/app/search.php?isbn=${book.isbn.replace(/-/g, '')}` }
                  ];
                  
                  const sortedPlatforms = usedBookPlatforms.sort((a, b) => a.price - b.price);
                  
                  return (
                    <>
                      <Heading 
                        as="h3"
                        variant="h3"
                        id="used-books-heading"
                        className="mb-3 text-shadow-sm text-foreground"
                      >
                        Gebraucht kaufen bei:
                      </Heading>
                      
                      <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3" role="list">
                        {sortedPlatforms.map(platform => (
                          <Button
                            key={platform.name}
                            variant="outline"
                            className="px-2 py-4 md:px-4 md:py-6 transition-all border-2 w-full justify-between"
                            style={{
                              backgroundColor: 'var(--button-product-bg)',
                              borderColor: 'var(--button-product-border)',
                              color: 'var(--button-product-text)'
                            }}
                            asChild
                          >
                            <a
                              href={platform.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              role="listitem"
                              aria-label={`${platform.name}: ab ${platform.price.toFixed(2).replace('.', ',')} Euro`}
                            >
                              <Text variant="small" as="span" className="truncate">
                                {platform.name}
                              </Text>
                              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                                <Text variant="small" as="span" className="font-semibold">
                                  ab {platform.price.toFixed(2).replace('.', ',')} €
                                </Text>
                                <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 transition-colors" aria-hidden="true" />
                              </div>
                            </a>
                          </Button>
                        ))}
                      </div>
                      
                      <Text variant="xs" className="opacity-70 mb-3 !normal-case">
                        {t('bookComponents.shippingNote')}
                      </Text>
                    </>
                  );
                })()}
                
                {/* Affiliate Disclaimer - DSGVO compliant */}
                <Text variant="small" className="opacity-80 mt-3 leading-relaxed">
                  {t('bookComponents.affiliateNote')}
                </Text>
              </section>
            </div>
          </div>
        </div>
      </section>
      
      {/* Produktdetails, Auszeichnungen & Tags - Schwarze Sektion (immer angezeigt) */}
      <section>
          <Section background="charcoal" variant="compact">
            <Container>
              {/* Produktdetails */}
              <div className="mb-4">
                {/* Header - auf Desktop und Mobile klickbar */}
                <AccordionButton 
                  title="Produktdetails"
                  isOpen={isProductDetailsOpen}
                  onToggle={() => setIsProductDetailsOpen(!isProductDetailsOpen)}
                />
                
                {/* Content - auf Desktop und Mobile aufklappbar */}
                <div className={`${isProductDetailsOpen ? 'block' : 'hidden'}`}>
                  <div className="grid lg:grid-cols-4 gap-6 text-white">
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">ISBN</span>
                  <span>{book.isbn}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">Verlag</span>
                  <span>{book.publisher}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">Erscheinungsjahr</span>
                  <span>{book.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">Auflage</span>
                  <span>{book.edition}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">Seiten</span>
                  <span>{book.pages}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">Format</span>
                  <span>{book.format}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">Einband</span>
                  <span>{book.binding}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">Sprache</span>
                  <span>{book.language}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">Gewicht</span>
                  <span>{book.weight}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/20">
                  <span className="opacity-70">Abmessungen</span>
                  <span className="text-right">{book.dimensions}</span>
                </div>
                
                {/* Mitwirkende in der Tabelle */}
                {book.contributors && book.contributors.map((contributor, index) => (
                  <div key={index} className="flex gap-4 py-2 border-b border-white/20">
                    <span className="opacity-70 flex-shrink-0">{contributor.roleDescription}</span>
                    <span className="text-right flex-1">{contributor.name}</span>
                  </div>
                ))}
                  </div>
                </div>
              </div>

              {/* Auszeichnungen (nur wenn vorhanden) */}
              {bookAwards.length > 0 && (
                <div className="mb-4">
                  {/* Header - auf Desktop und Mobile klickbar */}
                  <AccordionButton 
                    title="Auszeichnungen"
                    isOpen={isAwardsOpen}
                    onToggle={() => setIsAwardsOpen(!isAwardsOpen)}
                  />
                  
                  {/* Content - auf Desktop und Mobile aufklappbar */}
                  <div className={`${isAwardsOpen ? 'block' : 'hidden'}`}>
                    {/* Award-Related Categories as Coral Tags */}
                    {book.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {book.categories.map((cat) => (
                          <span 
                            key={cat}
                            className="tag-coral px-2.5 py-1 md:px-3 md:py-1.5 border border-transparent rounded-full transition-all duration-200 inline-flex items-center gap-1 shadow-sm"
                          >
                            <Text variant="xs" as="span" className="whitespace-nowrap !text-white">
                              {cat}
                            </Text>
                            <LikeButton 
                              entityId={`category-${cat.toLowerCase()}`}
                              entityType="category"
                              entityTitle={cat}
                              variant="minimal"
                              size="sm"
                              iconColor="#FFFFFF"
                              backgroundColor="#ff6f59"
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Themen (nur wenn vorhanden) */}
              {book.tags.length > 0 && (
                <div>
                  {/* Header - auf Desktop und Mobile klickbar */}
                  <AccordionButton 
                    title="Themen"
                    isOpen={isCategoriesOpen}
                    onToggle={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  />
                  
                  {/* Content - auf Desktop und Mobile aufklappbar */}
                  <div className={`${isCategoriesOpen ? 'block' : 'hidden'}`}>
                    {book.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {book.tags.map((tag) => (
                          <span 
                            key={tag}
                            className="tag-coral px-2.5 py-1 md:px-3 md:py-1.5 border border-transparent rounded-full transition-all duration-200 inline-flex items-center gap-1 shadow-sm"
                          >
                            <Text variant="xs" as="span" className="whitespace-nowrap !text-white">
                              {tag}
                            </Text>
                            <LikeButton 
                              entityId={`tag-${tag.toLowerCase()}`}
                              entityType="tag"
                              entityTitle={tag}
                              variant="minimal"
                              size="sm"
                              iconColor="#FFFFFF"
                              backgroundColor="#ff6f59"
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Container>
          </Section>
        </section>
      
      {/* aboutBookAndAuthor */}
      <section className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Über das Buch - volle Breite */}
          <div className="mb-12">
            <Heading 
              as="h2"
              variant="h2"
              className="mt-8 md:mt-12 mb-6 text-foreground"
            >
              Über „{book.title}"
            </Heading>
            <div className="mb-8">
              <Text
                variant="default"
                className={`leading-relaxed ${!bookDescExpanded ? (resolvedTheme === 'dark' ? 'fade-out-text-dark' : 'fade-out-text-light') : ''}`}
              >
                {book.longDescription}
              </Text>
              <button
                type="button"
                onClick={() => setBookDescExpanded(!bookDescExpanded)}
                className="expand-btn hover-text-blue"
                aria-expanded={bookDescExpanded}
                aria-label={bookDescExpanded ? t('bookComponents.collapseDescription') : t('bookComponents.expandDescription')}
              >
                {bookDescExpanded ? 'Weniger anzeigen' : 'Mehr lesen'}
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${bookDescExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </div>
            
            {/* Übersetzer-Highlight (falls vorhanden) */}
            {book.contributors && book.contributors.some(c => c.role === 'B06') && (
              <div className="translator-highlight">
                <p className="translator-highlight-text">
                  ✨ Meisterhaft übertragen von{' '}
                  <strong>{book.contributors.find(c => c.role === 'B06')?.name}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Buchreihe - Weitere Bücher aus der Serie */}
          {book.seriesBooks && book.seriesBooks.length > 0 && (
            <div className="mb-12">
              <Heading 
                as="h3"
                variant="h3"
                className="mb-4 text-foreground"
              >
                {t('bookComponents.moreFromSeries')}
              </Heading>
              
              {/* Sort Chips */}
              <div className="mb-4 flex justify-end">
                <div 
                  ref={seriesSortChipsRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full lg:flex-wrap lg:overflow-visible"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {sortOptions.map((option) => {
                    const isActive = seriesSortBy === option.id;
                    
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSeriesSortBy(option.id)}
                        className="sort-chip"
                        aria-pressed={isActive}
                        aria-label={t('bookComponents.sortBy', { label: option.label })}
                      >
                        <Text 
                          as="span" 
                          variant="xs" 
                          className="whitespace-nowrap !normal-case !tracking-normal !font-semibold"
                        >
                          {option.label}
                        </Text>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <CarouselContainer
                showDesktopButtons={sortedSeriesBooks.length >= 6}
                showMobileButtons={sortedSeriesBooks.length >= 3}
                className="pb-4"
                buttonOffset={8}
              >
                <div className="flex -ml-4">
                    {sortedSeriesBooks.map((seriesBook) => {
                      const bookData: BookCarouselItemData = {
                        id: seriesBook.id,
                        title: seriesBook.title,
                        author: book.author,
                        coverImage: seriesBook.coverImage,
                        price: seriesBook.price,
                        isbn: seriesBook.isbn,
                        publisher: book.publisher,
                        shortDescription: seriesBook.shortDescription,
                        categories: seriesBook.categories,
                        tags: seriesBook.tags,
                        collectionNumber: seriesBook.collectionNumber
                      };
                      
                      return (
                        <div key={seriesBook.id} className="flex-[0_0_50%] lg:flex-[0_0_25%] min-w-0 pl-4">
                          <BookCarouselItem 
                            book={bookData}
                            size="md"
                          />
                        </div>
                      );
                    })}
                  </div>
              </CarouselContainer>
            </div>
          )}

          {/* Über den Autor - volle Breite */}
          <div className="mb-12">
            <Heading 
              as="h2"
              variant="h2"
              className="mb-6 text-foreground"
            >
              Über {book.author}
            </Heading>
            
            <div className="flex gap-4 mb-4">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1733231291465-d86afc9336ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBhdXRob3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjQ2MjI4ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt={book.author}
                className="w-24 h-32 object-cover rounded shadow-lg border border-surface-muted"
              />
              <div className="flex-1">
                <Text
                  variant="default"
                  className={`leading-relaxed ${!authorBioExpanded ? (resolvedTheme === 'dark' ? 'fade-out-text-dark' : 'fade-out-text-light') : ''}`}
                >
                  Mag. Miriam Biritz-Wagenbichler ist eine renommierte Expertin für Bewegungsmedizin und Gesundheitsprävention. Mit über 15 Jahren Erfahrung in der Betreuung von Patient*innen hat sie sich auf die Integration von Bewegung in den Alltag spezialisiert. Nach ihrem Studium der Sportwissenschaften und mehreren Jahren in der klinischen Praxis gründete sie ihre eigene Praxis, in der sie einen ganzheitlichen Ansatz verfolgt. Ihre wissenschaftlich fundierte und gleichzeitig praxisnahe Herangehensweise hat bereits tausenden Menschen geholfen, ein aktiveres und gesünderes Leben zu führen. Sie verbindet modernste Erkenntnisse aus der Bewegungsforschung mit einfach umsetzbaren Alltagsstrategien. Als gefragte Referentin auf internationalen Konferenzen und regelmäßige Autorin in Fachzeitschriften setzt sie sich leidenschaftlich für präventive Gesundheitskonzepte ein. Ihr besonderes Anliegen ist es, Bewegung nicht als zusätzliche Pflicht, sondern als natürlichen und bereichernden Teil des Alltags zu vermitteln. Neben ihrer Arbeit als Therapeutin bildet sie auch andere Gesundheitsfachkräfte in ihren innovativen Methoden aus.
                </Text>
                
                <button
                  type="button"
                  onClick={() => setAuthorBioExpanded(!authorBioExpanded)}
                  className="expand-btn"
                  aria-expanded={authorBioExpanded}
                  aria-label={authorBioExpanded ? 'Autor-Biografie verkürzen' : 'Vollständige Autor-Biografie anzeigen'}
                >
                  {authorBioExpanded ? 'Weniger anzeigen' : 'Mehr lesen'}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${authorBioExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Weitere Bücher vom Autor */}
          {book.authorBooks && book.authorBooks.length > 0 && (
            <div className="mb-12">
              <Heading 
                as="h3"
                variant="h3"
                className="mb-4 text-foreground"
              >
                Weitere Bücher von {book.author}
              </Heading>
              
              {/* Sort Chips */}
              <div className="mb-4 flex justify-end">
                <div 
                  ref={authorBooksSortChipsRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full lg:flex-wrap lg:overflow-visible"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {sortOptions.map((option) => {
                    const isActive = authorBooksSortBy === option.id;
                    
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAuthorBooksSortBy(option.id)}
                        className="sort-chip"
                        aria-pressed={isActive}
                        aria-label={t('bookComponents.sortBy', { label: option.label })}
                      >
                        <Text 
                          as="span" 
                          variant="xs" 
                          className="whitespace-nowrap !normal-case !tracking-normal !font-semibold"
                        >
                          {option.label}
                        </Text>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <CarouselContainer
                showDesktopButtons={sortedAuthorBooks.length >= 6}
                showMobileButtons={sortedAuthorBooks.length >= 3}
                className="pb-4"
                buttonOffset={8}
              >
                <div className="flex -ml-4">
                    {sortedAuthorBooks.map((authorBook) => {
                      const bookData: BookCarouselItemData = {
                        id: authorBook.id,
                        title: authorBook.title,
                        author: book.author,
                        coverImage: authorBook.coverImage,
                        price: authorBook.price,
                        isbn: authorBook.isbn,
                        publisher: book.publisher,
                        shortDescription: authorBook.shortDescription,
                        categories: authorBook.categories,
                        tags: authorBook.tags,
                        collectionNumber: (authorBook as any).collectionNumber
                      };
                      
                      return (
                        <div key={authorBook.id} className="flex-[0_0_50%] lg:flex-[0_0_25%] min-w-0 pl-4">
                          <BookCarouselItem 
                            book={bookData}
                            size="md"
                          />
                        </div>
                      );
                    })}
                  </div>
              </CarouselContainer>
            </div>
          )}
          
        </div>
      </section>
      
      
      {/* Dieses Buch wurde besprochen in */}
      <section className="bg-charcoal pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="mb-12">
            <Heading 
              as="h2"
              variant="h2"
              className="mb-3 uppercase text-shadow-sm text-white"
            >
              Dieses Buch wurde besprochen in:
            </Heading>
            <Text className="text-white/70">
              Podcasts und YouTube-Episoden über dieses Buch
            </Text>
          </div>
          
          {/* Media Embeds Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {mediaAppearances.map((media) => (
              <div key={media.id}>
                <iframe 
                  data-testid="embed-iframe" 
                  className="rounded-xl"
                  src={media.embedUrl}
                  width="100%" 
                  height="352" 
                  frameBorder="0" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Bewertungen & Rezensionen */}
      <section className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
          <Heading 
            as="h2"
            variant="h2"
            className="mb-8 text-foreground"
          >
            Bewertungen & Rezensionen
          </Heading>
          
          {/* Bewertungs-Karussell */}
          <div className="mb-12">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <Heading 
                  as="h3"
                  variant="h3"
                  className="mb-2"
                >
                  Wie war das Buch für dich?
                </Heading>
                <Text variant="default">
                  Bewerte auf den Skalen, um anderen zu helfen und passende Empfehlungen zu erhalten
                </Text>
              </div>
            </div>
            
            {/* Grid: Karussell links, Assessment rechts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Linke Spalte: Bewertungs-Karussell */}
              <div>
                <BookRatingWidget 
                  bookId={book.id}
                  bookWorld={book.onix?.bookWorld || 'belletristik'}
                  userId={undefined} // DSGVO: Will be fetched from auth context in production
                />
              </div>

              {/* Rechte Spalte: Community Assessment */}
              <div>
                <BookReaderAssessment 
                  bookId={book.id}
                  bookWorld={book.onix?.bookWorld || 'belletristik'}
                  minRatings={1}
                />
              </div>
            </div>
          </div>

          {/* Rezensions-Karussell */}
          <div>
            {/* Header mit Sortierung */}
            <div className="flex items-center justify-between mb-6">
              <Heading 
                as="h3"
                variant="h3"
              >
                Leser-Rezensionen
              </Heading>
              
              {/* Sortierung Chips */}
              <div 
                className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full lg:flex-wrap lg:overflow-visible"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {[
                  { id: 'helpful', label: 'Hilfreich' },
                  { id: 'newest', label: 'Neueste' }
                ].map((option) => {
                  const isActive = reviewSortBy === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setReviewSortBy(option.id as 'helpful' | 'newest')}
                      className="sort-chip"
                      aria-pressed={isActive}
                      aria-label={`Nach ${option.label} sortieren`}
                    >
                      <Text 
                        as="span" 
                        variant="xs" 
                        className="whitespace-nowrap !normal-case !tracking-normal !font-semibold"
                      >
                        {option.label}
                      </Text>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <CarouselContainer scrollAmount={400} className="mb-6" showDesktopButtons={true} showMobileButtons={true}>
              <div className="flex gap-8">
                  {[...book.reviews].sort((a, b) => {
                    if (reviewSortBy === 'helpful') {
                      return ((b as any).helpful || 0) - ((a as any).helpful || 0);
                    } else {
                      // Sort by date (newest first)
                      return new Date(b.date).getTime() - new Date(a.date).getTime();
                    }
                  }).map((review) => (
                    <div key={review.id} className="w-[420px] flex-shrink-0 bg-gray-100/80 dark:bg-white/5 rounded-lg p-5">
                      <ReviewCard review={review as any} />
                    </div>
                  ))}
                </div>
            </CarouselContainer>
            
            {/* Buttons below carousel */}
            <div className="flex flex-col lg:flex-row gap-3 lg:justify-center">
              <button className="px-6 py-3 rounded-md font-semibold bg-blue text-white dark:bg-blue dark:text-white hover:opacity-90 transition-all duration-200 cursor-pointer">
                Rezension schreiben
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Books Section - "Bücher, die dich interessieren können" */}
      {!loadingRecommended && sortedRecommendedBooks.length > 0 && (
        <section className="bg-transparent">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {/* Section Header */}
            <div className="mb-8">
              <Heading 
                as="h2"
                variant="h2"
                className="mb-3"
              >
                Weitere Empfehlungen
              </Heading>
              <Text variant="default" className="mb-6">
                Entdecke weitere spannende Bücher aus unserem Sortiment – handverlesen von unseren Kuratoren
              </Text>
            </div>

            <div className="mb-12">
              <Heading 
                as="h3"
                variant="h3"
                className="mb-4 text-shadow-sm text-foreground"
              >
                Bücher, die dich interessieren können
              </Heading>
              
              {/* Sort Chips */}
              <div className="mb-4 flex justify-end">
                <div 
                  ref={sortChipsRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full lg:flex-wrap lg:overflow-visible"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {sortOptions.map((option) => {
                    const isActive = sortBy === option.id;
                    
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSortBy(option.id)}
                        className="sort-chip"
                        aria-pressed={isActive}
                        aria-label={t('bookComponents.sortBy', { label: option.label })}
                      >
                        <Text 
                          as="span" 
                          variant="xs" 
                          className="whitespace-nowrap !normal-case !tracking-normal !font-semibold"
                        >
                          {option.label}
                        </Text>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <CarouselContainer
                showDesktopButtons={sortedRecommendedBooks.length >= 6}
                showMobileButtons={sortedRecommendedBooks.length >= 3}
                className="pb-4"
                buttonOffset={8}
              >
                <div className="flex -ml-4">
                    {sortedRecommendedBooks.map((recommendBook) => {
                      // Generate a fallback short description from available data
                      const generateShortDescription = (b: APIBook): string => {
                        // Use klappentext if available
                        if (b.klappentext) {
                          return b.klappentext;
                        }
                        
                        // Otherwise, generate from available data
                        const parts: string[] = [];
                        
                        if (b.publisher) {
                          parts.push(`Erschienen bei ${b.publisher}`);
                        }
                        
                        if (b.year) {
                          parts.push(`Veröffentlicht ${b.year}`);
                        }
                        
                        if (b.collection && b.collectionNumber) {
                          parts.push(`Band ${b.collectionNumber} der Serie "${b.collection}"`);
                        } else if (b.collection) {
                          parts.push(`Teil der Serie "${b.collection}"`);
                        }
                        
                        if (b.tags && b.tags.length > 0) {
                          parts.push(`Themen: ${b.tags.slice(0, 3).join(', ')}`);
                        }
                        
                        return parts.length > 0 
                          ? parts.join('. ') + '.'
                          : `Ein empfehlenswertes Buch von ${b.author}.`;
                      };
                      
                      const bookData: BookCarouselItemData = {
                        id: recommendBook.id,
                        title: recommendBook.title,
                        author: recommendBook.author,
                        coverImage: recommendBook.coverUrl, // API uses coverUrl, not coverImage
                        price: recommendBook.price,
                        isbn: recommendBook.isbn,
                        publisher: recommendBook.publisher,
                        shortDescription: generateShortDescription(recommendBook), // Generate from available data
                        categories: undefined, // Not available in API Book interface
                        tags: recommendBook.tags, // Available in API
                        collectionNumber: recommendBook.collectionNumber
                      };
                      
                      return (
                        <div key={recommendBook.id} className="flex-[0_0_50%] lg:flex-[0_0_25%] min-w-0 pl-4">
                          <BookCarouselItem 
                            book={bookData}
                            size="md"
                          />
                        </div>
                      );
                    })}
                  </div>
              </CarouselContainer>
            </div>
          </div>
        </section>
      )}

      {/* Similar Books Section - Bücher, die dich auch interessieren können */}
      <SimilarBooksSection currentBook={book as any} maxSuggestions={8} />

      </div>
      <Footer />
    </>
  );
}
