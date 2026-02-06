import { useState, useRef, useEffect } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Heart, ArrowRight, CheckCircle2, ChevronRight, Check, Sparkles, ShoppingCart, Zap, Target, Microscope, Clock, X, ThumbsUp, ThumbsDown, Shuffle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSafeNavigate } from "../../utils/routing";
import { useFavorites } from "../FavoritesContext";
import { useCart } from "../CartContext";
import { MatchingResults } from "./MatchingResults";

// Sample book data with tags for matching
const sampleBooks = [
  {
    id: "1",
    title: "Das Kapital im 21. Jahrhundert",
    author: "Thomas Piketty",
    publisher: "C.H.Beck",
    year: "2014",
    price: "29,95 €",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
    description: "Eine brillante Analyse der wachsenden Ungleichheit in modernen Gesellschaften.",
    tags: ["nachdenklich", "politisch", "sachbuch", "wirtschaft", "kapitalismus_kritik", "gesellschaft", "aufgeklärt"],
  },
  {
    id: "2",
    title: "Die Welt von gestern",
    author: "Stefan Zweig",
    publisher: "Fischer",
    year: "2013",
    price: "12,00 €",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    description: "Erinnerungen eines Europäers – bewegend und warmherzig erzählt.",
    tags: ["emotional", "tiefgehend", "roman", "geschichte", "beziehungen", "klassiker"],
  },
  {
    id: "3",
    title: "Unsichtbare Frauen",
    author: "Caroline Criado-Perez",
    publisher: "btb",
    year: "2020",
    price: "18,00 €",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    description: "Wie eine von Daten beherrschte Welt die Hälfte der Bevölkerung ignoriert.",
    tags: ["nachdenklich", "politisch", "sachbuch", "diversität", "gesellschaft", "aufgeklärt", "inspiriert", "neuerscheinung"],
  },
  {
    id: "4",
    title: "Klara und die Sonne",
    author: "Kazuo Ishiguro",
    publisher: "Blessing",
    year: "2021",
    price: "24,00 €",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    description: "Eine KI lernt, was es bedeutet zu lieben – emotional und spannend zugleich.",
    tags: ["emotional", "tiefgehend", "spannend", "fantasy_scifi", "zukunft", "mental_health", "unterhalten", "gefordert", "neuerscheinung", "bestseller"],
  },
  {
    id: "5",
    title: "Der Gesang der Flusskrebse",
    author: "Delia Owens",
    publisher: "Hanserblau",
    year: "2019",
    price: "22,00 €",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    description: "Ein atmosphärischer Roman über Einsamkeit, Natur und Selbstbestimmung.",
    tags: ["leicht", "warmherzig", "spannend", "roman", "alltagsflucht", "beziehungen", "entspannt", "verträumt", "bestseller"],
  },
  {
    id: "6",
    title: "Exit Racism",
    author: "Tupoka Ogette",
    publisher: "Unrast",
    year: "2020",
    price: "16,00 €",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
    description: "Rassismuskritisch denken lernen – zugänglich und tiefgehend.",
    tags: ["nachdenklich", "politisch", "sachbuch", "diversität", "gesellschaft", "aufgeklärt", "inspiriert", "independent"],
  },
  {
    id: "7",
    title: "Atomic Habits",
    author: "James Clear",
    publisher: "Goldmann",
    year: "2020",
    price: "16,99 €",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    description: "Die transformative Kraft kleiner Gewohnheiten – wissenschaftlich fundiert und praxisnah.",
    tags: ["motiviert", "gestärkt", "selbstfürsorge", "persönlich", "sachbuch", "psychologie", "inspiriert", "bestseller"],
  },
  {
    id: "8",
    title: "Im Grunde gut",
    author: "Rutger Bregman",
    publisher: "Rowohlt",
    year: "2020",
    price: "24,00 €",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
    description: "Eine neue Geschichte der Menschheit – optimistisch, fundiert und augenöffnend.",
    tags: ["aufgeklärt", "inspiriert", "sachbuch", "wissen", "gesellschaft", "motiviert", "neuerscheinung"],
  },
  {
    id: "9",
    title: "Die Mitternachtsbibliothek",
    author: "Matt Haig",
    publisher: "Droemer",
    year: "2021",
    price: "20,00 €",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    description: "Ein magischer Roman über die unendlichen Möglichkeiten des Lebens.",
    tags: ["entspannt", "verträumt", "leicht", "alltagsflucht", "mental_health", "warmherzig", "roman", "bestseller"],
  },
  {
    id: "10",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    publisher: "Penguin",
    year: "2012",
    price: "18,00 €",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    description: "Wie wir denken und entscheiden – faszinierende Einblicke in unser Gehirn.",
    tags: ["aufgeklärt", "wissen", "sachbuch", "psychologie", "unterhalten", "gefordert", "anspruchsvoll", "klassiker"],
  },
  {
    id: "11",
    title: "Der Alchemist",
    author: "Paulo Coelho",
    publisher: "Diogenes",
    year: "2017",
    price: "12,00 €",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    description: "Eine zeitlose Parabel über Träume, Bestimmung und den Mut, seinem Herzen zu folgen.",
    tags: ["motiviert", "gestärkt", "inspiriert", "entspannt", "verträumt", "roman", "persönlich", "klassiker"],
  },
  {
    id: "12",
    title: "The Hate U Give",
    author: "Angie Thomas",
    publisher: "cbt",
    year: "2017",
    price: "14,99 €",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
    description: "Ein kraftvoller Roman über Rassismus, Identität und die Kraft der eigenen Stimme.",
    tags: ["spannend", "mitreißend", "emotional", "diversität", "nachdenklich", "politisch", "roman", "independent"],
  },
];

// Curator data with tags
const curators = [
  {
    id: "1",
    name: "Maurice Ökonomius",
    avatar: "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?w=400",
    theme: "Wirtschaftspolitik",
    focus: "Progressive Ökonomie & MMT",
    tags: ["wirtschaft", "kapitalismus_kritik", "nachdenklich", "politisch"],
    description: "Ökonom, Podcaster und Autor. Spezialisiert auf Modern Monetary Theory und progressive Wirtschaftspolitik.",
    curationsCount: 6,
    booksCount: 48,
  },
  {
    id: "2",
    name: "Lisa Schmidt",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    theme: "Feminismus",
    focus: "Feministische Literatur & Gesellschaftskritik",
    tags: ["diversität", "gesellschaft", "nachdenklich", "politisch"],
    description: "Literaturwissenschaftlerin und Kulturjournalistin mit Fokus auf feministische und intersektionale Perspektiven.",
    curationsCount: 8,
    booksCount: 67,
  },
  {
    id: "3",
    name: "Tom Weber",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    theme: "Science-Fiction",
    focus: "Sci-Fi & Zukunftsforschung",
    tags: ["fantasy_scifi", "zukunft", "spannend"],
    description: "Sci-Fi-Autor und Futurist. Kuratiert Bücher an der Schnittstelle von Technologie, Gesellschaft und Spekulation.",
    curationsCount: 7,
    booksCount: 52,
  },
];

// Question data
const moodOptions = [
  {
    id: "leicht",
    title: "Leicht & warmherzig",
    description: "Etwas fürs Herz, nicht zu schwere Kost.",
    tags: ["leicht", "warmherzig", "feelgood"],
  },
  {
    id: "emotional",
    title: "Emotional & tiefgehend",
    description: "Ich will richtig mitfühlen.",
    tags: ["emotional", "tiefgehend", "gefühlsstark"],
  },
  {
    id: "spannend",
    title: "Spannend & mitreißend",
    description: "Page-Turner, bitte.",
    tags: ["spannend", "mitreißend", "pageturner"],
  },
  {
    id: "nachdenklich",
    title: "Nachdenklich & politisch",
    description: "Ich möchte mir die Welt erklären lassen.",
    tags: ["nachdenklich", "politisch", "gesellschaft"],
  },
  {
    id: "aufgeklaert",
    title: "Aufgeklärt & inspiriert",
    description: "Neues Wissen, frische Perspektiven.",
    tags: ["aufgeklärt", "inspiriert", "sachbuch", "wissen"],
  },
  {
    id: "motiviert",
    title: "Motiviert & gestärkt",
    description: "Persönliches Wachstum und Selbstfürsorge.",
    tags: ["motiviert", "gestärkt", "selbstfürsorge", "persönlich"],
  },
  {
    id: "unterhalten",
    title: "Unterhalten & gefordert",
    description: "Anspruchsvoll, aber nicht zu ernst.",
    tags: ["unterhalten", "gefordert", "anspruchsvoll"],
  },
  {
    id: "entspannt",
    title: "Entspannt & verträumt",
    description: "Einfach mal abtauchen und genießen.",
    tags: ["entspannt", "verträumt", "alltagsflucht", "leicht"],
  },
];

const genreOptions = [
  { 
    id: "roman", 
    label: "Roman / Belletristik", 
    tags: ["roman", "belletristik"],
    availableForMoods: ["leicht", "emotional", "spannend", "unterhalten", "entspannt"]
  },
  { 
    id: "sachbuch", 
    label: "Sachbuch / Gesellschaft", 
    tags: ["sachbuch", "gesellschaft"],
    availableForMoods: ["nachdenklich", "aufgeklaert", "motiviert", "unterhalten"]
  },
  { 
    id: "queer", 
    label: "Queere Geschichten", 
    tags: ["queer", "lgbtq", "diversität"],
    availableForMoods: ["leicht", "emotional", "spannend", "nachdenklich"]
  },
  { 
    id: "fantasy", 
    label: "Fantasy & Sci-Fi", 
    tags: ["fantasy_scifi", "zukunft"],
    availableForMoods: ["spannend", "unterhalten", "entspannt", "aufgeklaert"]
  },
  { 
    id: "wirtschaft", 
    label: "Wirtschaft & Arbeit", 
    tags: ["wirtschaft", "arbeit"],
    availableForMoods: ["nachdenklich", "aufgeklaert", "motiviert"]
  },
  { 
    id: "psychologie", 
    label: "Psychologie & Persönliches Wachstum", 
    tags: ["psychologie", "mental_health", "selbstfürsorge"],
    availableForMoods: ["leicht", "emotional", "motiviert", "aufgeklaert", "entspannt"]
  },
];

const themeOptions = [
  { id: "diversität", label: "Diversität & Repräsentation (z. B. queer, PoC)", tags: ["diversität", "queer", "lgbtq"] },
  { id: "kapitalismus", label: "Kritik an Kapitalismus / Arbeit", tags: ["kapitalismus_kritik", "wirtschaft", "arbeit"] },
  { id: "klima", label: "Klimakrise & Zukunft", tags: ["klima", "zukunft", "nachhaltigkeit"] },
  { id: "beziehungen", label: "Beziehungen & Familie", tags: ["beziehungen", "familie"] },
  { id: "mental_health", label: "Mental Health & Selbstfürsorge", tags: ["mental_health", "selbstfürsorge", "psychologie"] },
  { id: "alltagsflucht", label: "Leichte Alltagsfluchten", tags: ["alltagsflucht", "leicht", "feelgood"] },
];

const bookPreferenceOptions = [
  { 
    id: "neuerscheinungen", 
    label: "Neuerscheinungen & aktuelle Bestseller", 
    description: "Die neuesten Bücher und Trends",
    tags: ["neuerscheinung", "bestseller"] 
  },
  { 
    id: "klassiker", 
    label: "Klassiker & zeitlose Werke", 
    description: "Bewährte Literatur, die Bestand hat",
    tags: ["klassiker"] 
  },
  { 
    id: "independent", 
    label: "Independent & Geheimtipps", 
    description: "Entdeckungen abseits des Mainstreams",
    tags: ["independent"] 
  },
  { 
    id: "mix", 
    label: "Bunter Mix aus allem", 
    description: "Keine Präferenz – überrasch mich!",
    tags: [] 
  },
];

// Recipient options
const recipientOptions = [
  { id: "self", label: "Für mich selbst", emoji: "🙋" },
  { id: "gift", label: "Als Geschenk", emoji: "🎁" },
];

// Age cohort options
const ageOptions = [
  { id: "child", label: "Kinder (0-12 Jahre)", tags: ["kinder", "jugend"] },
  { id: "teen", label: "Jugendliche (13-17 Jahre)", tags: ["jugend", "young_adult"] },
  { id: "young_adult", label: "Junge Erwachsene (18-30 Jahre)", tags: ["young_adult", "erwachsene"] },
  { id: "adult", label: "Erwachsene (31-50 Jahre)", tags: ["erwachsene"] },
  { id: "mature", label: "50+ Jahre", tags: ["erwachsene", "mature"] },
];

// Profession options
const professionOptions = [
  { id: "student", label: "Student*in / Schüler*in", emoji: "📚", tags: ["bildung", "lernen"] },
  { id: "creative", label: "Kreativ / Kunst / Design", emoji: "🎨", tags: ["kreativ", "kunst"] },
  { id: "tech", label: "Tech / IT / Wissenschaft", emoji: "💻", tags: ["tech", "wissenschaft"] },
  { id: "business", label: "Business / Management", emoji: "💼", tags: ["business", "führung"] },
  { id: "social", label: "Soziales / Bildung / Care", emoji: "🤝", tags: ["sozial", "care"] },
  { id: "freelance", label: "Selbstständig / Freelance", emoji: "🚀", tags: ["unternehmen", "selbstständig"] },
  { id: "retired", label: "Im Ruhestand", emoji: "🌺", tags: ["ruhestand", "gelassenheit"] },
  { id: "other", label: "Andere / Keine Angabe", emoji: "✨", tags: [] },
];

// Hobbies options
const hobbyOptions = [
  { id: "reading", label: "Lesen & Literatur", tags: ["literatur", "lesen"] },
  { id: "sports", label: "Sport & Fitness", tags: ["sport", "gesundheit", "aktiv"] },
  { id: "art", label: "Kunst & Kreatives", tags: ["kunst", "kreativ", "kultur"] },
  { id: "music", label: "Musik & Konzerte", tags: ["musik", "kultur"] },
  { id: "cooking", label: "Kochen & Essen", tags: ["kulinarik", "genuss"] },
  { id: "travel", label: "Reisen & Natur", tags: ["reisen", "natur", "abenteuer"] },
  { id: "gaming", label: "Gaming & Tech", tags: ["gaming", "tech", "digital"] },
  { id: "activism", label: "Aktivismus & Politik", tags: ["aktivismus", "politisch", "gesellschaft"] },
  { id: "meditation", label: "Meditation & Achtsamkeit", tags: ["achtsamkeit", "mental_health", "ruhe"] },
  { id: "diy", label: "Handwerk & DIY", tags: ["handwerk", "selbermachen"] },
];

// Swipe card data
type SwipeCardType = "book" | "author" | "curator" | "quote";

interface SwipeCard {
  id: string;
  type: SwipeCardType;
  image?: string;
  title?: string;
  subtitle?: string;
  quote?: string;
  author?: string;
  videoThumbnail?: string;
  tags: string[];
}

const swipeCards: SwipeCard[] = [
  // Book covers
  { id: "book1", type: "book", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400", title: "Das Kapital im 21. Jahrhundert", subtitle: "Thomas Piketty", tags: ["nachdenklich", "politisch", "sachbuch", "analytisch"] },
  { id: "book2", type: "book", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400", title: "Die Welt von gestern", subtitle: "Stefan Zweig", tags: ["emotional", "roman", "klassiker", "poetisch"] },
  { id: "book3", type: "book", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400", title: "Unsichtbare Frauen", subtitle: "Caroline Criado-Perez", tags: ["nachdenklich", "sachbuch", "diversität", "klar"] },
  { id: "book4", type: "book", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400", title: "Klara und die Sonne", subtitle: "Kazuo Ishiguro", tags: ["emotional", "fantasy_scifi", "bestseller", "poetisch"] },
  { id: "book5", type: "book", image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400", title: "Qualityland", subtitle: "Marc-Uwe Kling", tags: ["humorvoll", "satire", "gesellschaft", "schnell"] },
  { id: "book6", type: "book", image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400", title: "Sapiens", subtitle: "Yuval Noah Harari", tags: ["sachbuch", "wissen", "geschichte", "klar"] },
  
  // Authors
  { id: "author1", type: "author", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400", title: "Chimamanda Ngozi Adichie", subtitle: "Autorin", tags: ["diversität", "roman", "politisch", "poetisch"] },
  { id: "author2", type: "author", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400", title: "Yuval Noah Harari", subtitle: "Autor", tags: ["sachbuch", "wissen", "geschichte", "klar"] },
  { id: "author3", type: "author", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400", title: "Sally Rooney", subtitle: "Autorin", tags: ["roman", "emotional", "young_adult", "schnell"] },
  { id: "author4", type: "author", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", title: "Marc-Uwe Kling", subtitle: "Autor", tags: ["humorvoll", "satire", "gesellschaft", "schnell"] },
  
  // Curators (video thumbnails)
  { id: "curator1", type: "curator", videoThumbnail: "https://images.unsplash.com/photo-1736939681295-bb2e6759dddc?w=400", title: "Maurice Ökonomius", subtitle: "Wirtschaftspolitik & MMT", tags: ["wirtschaft", "politisch", "sachbuch", "analytisch"] },
  { id: "curator2", type: "curator", videoThumbnail: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400", title: "Lisa Schmidt", subtitle: "Feminismus & Gesellschaft", tags: ["diversität", "gesellschaft", "politisch", "klar"] },
  { id: "curator3", type: "curator", videoThumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", title: "Tom Weber", subtitle: "Science Fiction & Zukunft", tags: ["fantasy_scifi", "zukunft", "schnell"] },
  
  // Quote cards - verschiedene Stile
  // Poetisch & metaphorisch
  { id: "quote1", type: "quote", quote: "Das einzige Mittel, den Irrtum zu vermeiden, ist die Unwissenheit.", author: "Jean-Jacques Rousseau", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["philosophie", "nachdenklich", "klassiker", "poetisch"] },
  { id: "quote2", type: "quote", quote: "Wir können den Wind nicht ändern, aber die Segel anders setzen.", author: "Aristoteles", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["philosophie", "gestärkt", "klassiker", "poetisch"] },
  { id: "quote3", type: "quote", quote: "Die Welt ist ein Buch. Wer nie reist, sieht nur eine Seite davon.", author: "Augustinus von Hippo", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["reisen", "natur", "poetisch", "inspiriert"] },
  
  // Direkt & klar
  { id: "quote4", type: "quote", quote: "In der Mitte von Schwierigkeiten liegen die Möglichkeiten.", author: "Albert Einstein", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["motiviert", "inspiriert", "wissenschaft", "klar"] },
  { id: "quote5", type: "quote", quote: "Sei du selbst die Veränderung, die du dir wünschst für diese Welt.", author: "Mahatma Gandhi", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["aktivismus", "inspiriert", "gesellschaft", "klar"] },
  { id: "quote6", type: "quote", quote: "Wissen ist Macht.", author: "Francis Bacon", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["wissen", "bildung", "klar", "kurz"] },
  
  // Humorvoll & leicht
  { id: "quote7", type: "quote", quote: "Wenn das Leben dir Zitronen gibt, frag nach Tequila und Salz.", author: "Unbekannt", image: "https://images.unsplash.com/photo-1514594808943-31f951cf5f9b?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["humorvoll", "leicht", "lebensfreude", "schnell"] },
  { id: "quote8", type: "quote", quote: "Ich habe keine Zeit für einen kurzen Brief, also schreibe ich einen langen.", author: "Mark Twain", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["humorvoll", "satire", "klassiker", "ironisch"] },
  
  // Analytisch & präzise
  { id: "quote9", type: "quote", quote: "Ohne Daten bist du nur eine weitere Person mit einer Meinung.", author: "W. Edwards Deming", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["analytisch", "wissenschaft", "sachbuch", "präzise"] },
  { id: "quote10", type: "quote", quote: "Die Struktur der wissenschaftlichen Revolutionen definiert den Fortschritt neu.", author: "Thomas Kuhn", image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80&blend=000000&blend-alpha=40&blend-mode=normal", tags: ["analytisch", "wissenschaft", "philosophie", "komplex"] },
];

type Stage = "intro" | "matchingTypeSelect" | "quickFavorites" | "recipient" | "age" | "profession" | "hobbies" | "mood" | "themes" | "genres" | "bookPreferences" | "swipeGenre" | "swipeCards" | "loading" | "results";
type MatchingType = "quick" | "medium" | "complete" | "swipe" | null;

interface UserPreferences {
  matchingType: MatchingType;
  quickFavoriteBook: string;
  recipient: string | null;
  age: string | null;
  profession: string | null;
  hobbies: string[];
  mood: string | null;
  genres: string[];
  themes: string[];
  bookPreferences: string[];
  swipeGenre: string | null;
  swipeLikes: string[];
  swipeDislikes: string[];
  allTags: string[];
}

interface BookMatch {
  book: typeof sampleBooks[0];
  score: number;
  matchedTags: string[];
}

export function CuratorMatchmaking() {
  const navigate = useSafeNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, isInCart } = useCart();
  const [stage, setStage] = useState<Stage>("intro");
  const [preferences, setPreferences] = useState<UserPreferences>({
    matchingType: null,
    quickFavoriteBook: "",
    recipient: null,
    age: null,
    profession: null,
    hobbies: [],
    mood: null,
    genres: [],
    themes: [],
    bookPreferences: [],
    swipeGenre: null,
    swipeLikes: [],
    swipeDislikes: [],
    allTags: [],
  });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentSwipeCards, setCurrentSwipeCards] = useState<SwipeCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  // Refs for cleanup
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Dynamic total questions based on matching type
  const getTotalQuestions = () => {
    if (preferences.matchingType === "quick") return 1;
    if (preferences.matchingType === "medium") return 6; // recipient, age, profession, hobbies, mood, themes
    if (preferences.matchingType === "complete") return 8; // + genres, bookPreferences
    return 0;
  };

  const getCurrentQuestionNumber = () => {
    if (stage === "quickFavorites") return 1;
    if (stage === "recipient") return 1;
    if (stage === "age") return 2;
    if (stage === "profession") return 3;
    if (stage === "hobbies") return 4;
    if (stage === "mood") return 5;
    if (stage === "themes") return 6;
    if (stage === "genres") return 7;
    if (stage === "bookPreferences") return 8;
    return 0;
  };

  const handleMatchingTypeSelect = (type: MatchingType) => {
    setPreferences({ ...preferences, matchingType: type });
  };

  const handleStartMatching = () => {
    if (preferences.matchingType === "quick") {
      setStage("quickFavorites");
    } else if (preferences.matchingType === "medium") {
      setStage("recipient");
    } else if (preferences.matchingType === "complete") {
      setStage("recipient");
    } else if (preferences.matchingType === "swipe") {
      setStage("swipeGenre");
    }
  };

  const handleRecipientSelect = (recipientId: string) => {
    setPreferences({ ...preferences, recipient: recipientId });
  };

  const handleAgeSelect = (ageId: string) => {
    setPreferences({ ...preferences, age: ageId });
  };

  const handleProfessionSelect = (professionId: string) => {
    setPreferences({ ...preferences, profession: professionId });
  };

  const handleHobbyToggle = (hobbyId: string) => {
    if (preferences.hobbies.includes(hobbyId)) {
      setPreferences({
        ...preferences,
        hobbies: preferences.hobbies.filter((h) => h !== hobbyId),
      });
    } else {
      setPreferences({
        ...preferences,
        hobbies: [...preferences.hobbies, hobbyId],
      });
    }
  };

  const handleMoodSelect = (moodId: string) => {
    setPreferences({ ...preferences, mood: moodId });
  };

  const handleGenreToggle = (genreId: string) => {
    if (preferences.genres.includes(genreId)) {
      setPreferences({
        ...preferences,
        genres: preferences.genres.filter((g) => g !== genreId),
      });
    } else {
      // Max 3 genres
      if (preferences.genres.length < 3) {
        setPreferences({
          ...preferences,
          genres: [...preferences.genres, genreId],
        });
      }
    }
  };

  const handleThemeToggle = (themeId: string) => {
    if (preferences.themes.includes(themeId)) {
      setPreferences({
        ...preferences,
        themes: preferences.themes.filter((t) => t !== themeId),
      });
    } else {
      setPreferences({
        ...preferences,
        themes: [...preferences.themes, themeId],
      });
    }
  };

  const handleBookPreferenceToggle = (prefId: string) => {
    if (preferences.bookPreferences.includes(prefId)) {
      setPreferences({
        ...preferences,
        bookPreferences: preferences.bookPreferences.filter((p) => p !== prefId),
      });
    } else {
      setPreferences({
        ...preferences,
        bookPreferences: [...preferences.bookPreferences, prefId],
      });
    }
  };

  const handleSwipeGenreSelect = (genreId: string) => {
    setPreferences({ ...preferences, swipeGenre: genreId });
  };

  const handleSwipeGenreStart = () => {
    // Initialize swipe cards
    setCurrentSwipeCards(swipeCards);
    setCurrentCardIndex(0);
    setStage("swipeCards");
  };

  const handleSwipe = (direction: "like" | "dislike") => {
    const currentCard = currentSwipeCards[currentCardIndex];
    
    if (direction === "like") {
      setPreferences({
        ...preferences,
        swipeLikes: [...preferences.swipeLikes, currentCard.id],
      });
    } else {
      setPreferences({
        ...preferences,
        swipeDislikes: [...preferences.swipeDislikes, currentCard.id],
      });
    }

    // Move to next card
    if (currentCardIndex < currentSwipeCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // All cards swiped, calculate results
      calculateSwipeResults();
    }
  };

  const calculateSwipeResults = () => {
    const allTags: string[] = [];
    
    // Add genre tags
    if (preferences.swipeGenre) {
      const genre = genreOptions.find((g) => g.id === preferences.swipeGenre);
      if (genre) allTags.push(...genre.tags);
    }

    // Add tags from liked cards
    preferences.swipeLikes.forEach((likedId) => {
      const card = swipeCards.find((c) => c.id === likedId);
      if (card) allTags.push(...card.tags);
    });

    setPreferences({ ...preferences, allTags });
    setStage("loading");
    startLoading();
  };

  const handleNext = () => {
    if (stage === "quickFavorites") {
      // Calculate tags for quick matching
      const allTags: string[] = [];
      // For quick matching, we'd use the favorite book to infer tags
      // For demo purposes, let's just add some generic tags
      allTags.push("leicht", "roman", "bestseller");
      setPreferences({ ...preferences, allTags });
      setStage("loading");
      startLoading();
    } else if (stage === "recipient") {
      if (preferences.matchingType === "medium") {
        setStage("age");
      } else if (preferences.matchingType === "complete") {
        setStage("age");
      }
    } else if (stage === "age") {
      if (preferences.matchingType === "medium") {
        setStage("profession");
      } else if (preferences.matchingType === "complete") {
        setStage("profession");
      }
    } else if (stage === "profession") {
      if (preferences.matchingType === "medium") {
        setStage("hobbies");
      } else if (preferences.matchingType === "complete") {
        setStage("hobbies");
      }
    } else if (stage === "hobbies") {
      if (preferences.matchingType === "medium") {
        setStage("mood");
      } else if (preferences.matchingType === "complete") {
        setStage("mood");
      }
    } else if (stage === "mood") {
      if (preferences.matchingType === "medium") {
        setStage("themes");
      } else if (preferences.matchingType === "complete") {
        setStage("themes");
      }
    } else if (stage === "themes") {
      if (preferences.matchingType === "medium") {
        // Calculate tags and show results
        calculateTagsAndShowResults();
      } else if (preferences.matchingType === "complete") {
        setStage("genres");
      }
    } else if (stage === "genres") {
      setStage("bookPreferences");
    } else if (stage === "bookPreferences") {
      calculateTagsAndShowResults();
    }
  };

  const calculateTagsAndShowResults = () => {
    const allTags: string[] = [];

    // Add recipient tags
    if (preferences.recipient) {
      const recipientOption = recipientOptions.find((r) => r.id === preferences.recipient);
      if (recipientOption) allTags.push(...recipientOption.tags);
    }

    // Add age tags
    if (preferences.age) {
      const ageOption = ageOptions.find((a) => a.id === preferences.age);
      if (ageOption) allTags.push(...ageOption.tags);
    }

    // Add profession tags
    if (preferences.profession) {
      const professionOption = professionOptions.find((p) => p.id === preferences.profession);
      if (professionOption) allTags.push(...professionOption.tags);
    }

    // Add hobby tags
    preferences.hobbies.forEach((hobbyId) => {
      const hobby = hobbyOptions.find((h) => h.id === hobbyId);
      if (hobby) allTags.push(...hobby.tags);
    });

    // Add mood tags
    if (preferences.mood) {
      const moodOption = moodOptions.find((m) => m.id === preferences.mood);
      if (moodOption) allTags.push(...moodOption.tags);
    }

    // Add genre tags
    preferences.genres.forEach((genreId) => {
      const genre = genreOptions.find((g) => g.id === genreId);
      if (genre) allTags.push(...genre.tags);
    });

    // Add theme tags
    preferences.themes.forEach((themeId) => {
      const theme = themeOptions.find((t) => t.id === themeId);
      if (theme) allTags.push(...theme.tags);
    });

    // Add book preference tags
    preferences.bookPreferences.forEach((prefId) => {
      const pref = bookPreferenceOptions.find((p) => p.id === prefId);
      if (pref) allTags.push(...pref.tags);
    });

    setPreferences({ ...preferences, allTags });
    setStage("loading");
    startLoading();
  };

  const startLoading = () => {
    // Clear any existing timers
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    
    let progress = 0;
    loadingIntervalRef.current = setInterval(() => {
      progress += 33;
      setLoadingProgress(progress);
      if (progress >= 100) {
        if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        loadingTimeoutRef.current = setTimeout(() => setStage("results"), 500);
      }
    }, 600);
  };

  const handleBack = () => {
    if (stage === "quickFavorites") {
      setStage("matchingTypeSelect");
    } else if (stage === "swipeGenre") {
      setStage("matchingTypeSelect");
    } else if (stage === "swipeCards") {
      if (currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      } else {
        setStage("swipeGenre");
      }
    } else if (stage === "recipient") {
      setStage("matchingTypeSelect");
    } else if (stage === "age") {
      setStage("recipient");
    } else if (stage === "profession") {
      setStage("age");
    } else if (stage === "hobbies") {
      setStage("profession");
    } else if (stage === "mood") {
      setStage("hobbies");
    } else if (stage === "themes") {
      setStage("mood");
    } else if (stage === "genres") {
      setStage("themes");
    } else if (stage === "bookPreferences") {
      setStage("genres");
    }
  };

  // Calculate book matches
  const getBookMatches = (): BookMatch[] => {
    return sampleBooks
      .map((book) => {
        const matchedTags = book.tags.filter((tag) => preferences.allTags.includes(tag));
        const score = matchedTags.length;
        return { book, score, matchedTags };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  };

  // Calculate curator matches
  const getCuratorMatches = () => {
    return curators
      .map((curator) => {
        const matchedTags = curator.tags.filter((tag) => preferences.allTags.includes(tag));
        const score = matchedTags.length;
        return { curator, score };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const getUserSelectionLabels = () => {
    const labels: string[] = [];

    if (preferences.recipient) {
      const recipient = recipientOptions.find((r) => r.id === preferences.recipient);
      if (recipient) labels.push(recipient.label);
    }

    if (preferences.age) {
      const age = ageOptions.find((a) => a.id === preferences.age);
      if (age) labels.push(age.label);
    }

    if (preferences.profession) {
      const profession = professionOptions.find((p) => p.id === preferences.profession);
      if (profession) labels.push(profession.label);
    }

    preferences.hobbies.forEach((hobbyId) => {
      const hobby = hobbyOptions.find((h) => h.id === hobbyId);
      if (hobby) labels.push(hobby.label);
    });

    if (preferences.mood) {
      const mood = moodOptions.find((m) => m.id === preferences.mood);
      if (mood) labels.push(mood.title);
    }

    preferences.genres.forEach((genreId) => {
      const genre = genreOptions.find((g) => g.id === genreId);
      if (genre) labels.push(genre.label);
    });

    preferences.themes.forEach((themeId) => {
      const theme = themeOptions.find((t) => t.id === themeId);
      if (theme) labels.push(theme.label);
    });

    return labels;
  };

  return (
    <section className="py-16 px-4 md:px-8 bg-[#F5F5F0]">
      <div className="max-w-7xl mx-auto">
        {/* Intro Stage */}
        {stage === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-[#A0CEC8]/20 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5 text-[#5a9690]" />
              <span className="text-sm text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
                BUCH MATCHING
              </span>
            </div>

            <h2
              className="text-4xl md:text-5xl mb-6 text-[var(--charcoal)]"
              style={{ fontFamily: 'Fjalla One' }}
            >
              FINDE DEIN NÄCHSTES BUCH
            </h2>

            <p className="text-lg text-gray-600 mb-12">
              Wähle, wie viel Zeit du hast – wir finden das perfekte Buch für dich.
            </p>

            <button
              onClick={() => setStage("matchingTypeSelect")}
              className="inline-flex items-center justify-center gap-2 bg-[#5a9690] text-white px-8 py-4 rounded-lg hover:bg-[#4a8580] transition-colors text-lg mb-4"
              style={{ fontFamily: 'Fjalla One' }}
            >
              <span>MATCHING STARTEN</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Preview Books */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {sampleBooks.slice(0, 4).map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="aspect-[3/4] rounded-lg overflow-hidden shadow-md"
                >
                  <ImageWithFallback
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Matching Type Selection */}
        {stage === "matchingTypeSelect" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <h3
              className="text-3xl md:text-4xl mb-4 text-center text-[var(--charcoal)]"
              style={{ fontFamily: 'Fjalla One' }}
            >
              WIE VIEL ZEIT HAST DU?
            </h3>
            <p className="text-center text-gray-600 mb-12">
              Je mehr Fragen du beantwortest, desto genauer wird dein Match.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Quick Matching - 10 Seconds */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMatchingTypeSelect("quick")}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  preferences.matchingType === "quick"
                    ? "border-[#5a9690] bg-[#A0CEC8]/10 shadow-lg"
                    : "border-gray-300 bg-white hover:border-[#A0CEC8] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#5a9690]/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#5a9690]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">~10 Sekunden</span>
                  </div>
                </div>
                <h4 className="text-2xl mb-2 text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
                  SCHNELL-MATCHING
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Nenne uns ein Lieblingsbuch und wir schlagen dir ähnliche Bücher vor.
                </p>
                <div className="flex items-center gap-2 text-xs text-[#5a9690]">
                  <Check className="w-4 h-4" />
                  <span>1 Frage</span>
                </div>
              </motion.button>

              {/* Medium Matching - 60 Seconds */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMatchingTypeSelect("medium")}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  preferences.matchingType === "medium"
                    ? "border-[#5a9690] bg-[#A0CEC8]/10 shadow-lg"
                    : "border-gray-300 bg-white hover:border-[#A0CEC8] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#5a9690]/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#5a9690]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">~60 Sekunden</span>
                  </div>
                </div>
                <h4 className="text-2xl mb-2 text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
                  BASIS-MATCHING
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Für wen, Alter, Beruf, Hobbies, Gefühl & Perspektive – die wichtigsten Faktoren.
                </p>
                <div className="flex items-center gap-2 text-xs text-[#5a9690]">
                  <Check className="w-4 h-4" />
                  <span>6 Fragen</span>
                </div>
              </motion.button>

              {/* Complete Matching - 120 Seconds */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMatchingTypeSelect("complete")}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  preferences.matchingType === "complete"
                    ? "border-[#5a9690] bg-[#A0CEC8]/10 shadow-lg"
                    : "border-gray-300 bg-white hover:border-[#A0CEC8] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#5a9690]/10 flex items-center justify-center">
                    <Microscope className="w-6 h-6 text-[#5a9690]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">~120 Sekunden</span>
                  </div>
                </div>
                <h4 className="text-2xl mb-2 text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
                  PRÄZISIONS-MATCHING
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Alle Fragen für das genaueste Match – inkl. Genre-Auswahl & Buchpräferenzen.
                </p>
                <div className="flex items-center gap-2 text-xs text-[#5a9690]">
                  <Check className="w-4 h-4" />
                  <span>8 Fragen</span>
                </div>
              </motion.button>

              {/* Swipe Matching - Playful */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMatchingTypeSelect("swipe")}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  preferences.matchingType === "swipe"
                    ? "border-[#5a9690] bg-[#A0CEC8]/10 shadow-lg"
                    : "border-gray-300 bg-white hover:border-[#A0CEC8] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#5a9690]/10 flex items-center justify-center">
                    <Shuffle className="w-6 h-6 text-[#5a9690]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">~90 Sekunden</span>
                  </div>
                </div>
                <h4 className="text-2xl mb-2 text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
                  SWIPE-MATCHING
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Swipe dich durch Cover, Zitate, Kuratoren & Fragen – spielerisch & intuitiv.
                </p>
                <div className="flex items-center gap-2 text-xs text-[#5a9690]">
                  <Heart className="w-4 h-4" />
                  <span>Swipe-basiert</span>
                </div>
              </motion.button>
            </div>

            <div className="flex justify-center gap-4 mt-12">
              <button
                onClick={() => setStage("intro")}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-[var(--charcoal)] rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'Fjalla One' }}
              >
                ZURÜCK
              </button>
              <button
                onClick={handleStartMatching}
                disabled={!preferences.matchingType}
                className={`px-8 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  !preferences.matchingType
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#5a9690] text-white hover:bg-[#4a8580]"
                }`}
                style={{ fontFamily: 'Fjalla One' }}
              >
                <span>WEITER</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Question Stages */}
        {(stage === "quickFavorites" || stage === "recipient" || stage === "age" || stage === "profession" || stage === "hobbies" || stage === "mood" || stage === "themes" || stage === "genres" || stage === "bookPreferences") && (
          <div className="max-w-3xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Frage {getCurrentQuestionNumber()} von {getTotalQuestions()}
                </span>
                <div className="text-sm text-[#5a9690]" style={{ fontFamily: 'Fjalla One' }}>
                  {Math.round((getCurrentQuestionNumber() / getTotalQuestions()) * 100)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#5a9690] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(getCurrentQuestionNumber() / getTotalQuestions()) * 100}%` }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                {/* Quick Favorites Question */}
                {stage === "quickFavorites" && (
                  <div>
                    <h3
                      className="text-3xl mb-2 text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      NENNE UNS DEIN LIEBLINGSBUCH
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Welches Buch hast du geliebt? Wir finden ähnliche Empfehlungen für dich.
                    </p>

                    <div>
                      <label className="block text-sm mb-2 text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
                        BUCHTITEL ODER AUTOR*IN
                      </label>
                      <input
                        type="text"
                        value={preferences.quickFavoriteBook}
                        onChange={(e) => setPreferences({ ...preferences, quickFavoriteBook: e.target.value })}
                        placeholder="z.B. Der Alchemist von Paulo Coelho"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#5a9690] focus:outline-none text-[var(--charcoal)]"
                      />
                      <p className="text-xs text-gray-500 italic mt-2">
                        💡 Gib einfach einen Titel oder Autor*in ein, den/die du mochtest.
                      </p>
                    </div>
                  </div>
                )}

                {/* Recipient Question */}
                {stage === "recipient" && (
                  <div>
                    <h3
                      className="text-3xl mb-2 text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      WER SOLLT DAS BUCH ERHALTEN?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Für dich selbst oder als Geschenk?
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipientOptions.map((recipient) => (
                        <button
                          key={recipient.id}
                          onClick={() => handleRecipientSelect(recipient.id)}
                          className={`p-6 rounded-lg border-2 transition-all text-left relative ${
                            preferences.recipient === recipient.id
                              ? "border-[#5a9690] bg-[#A0CEC8]/10"
                              : "border-gray-300 hover:border-[#A0CEC8]"
                          }`}
                        >
                          {preferences.recipient === recipient.id && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-[#5a9690] rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <h4
                            className="text-xl mb-2 text-[var(--charcoal)]"
                            style={{ fontFamily: 'Fjalla One' }}
                          >
                            {recipient.label}
                          </h4>
                          <p className="text-sm text-gray-600">{recipient.emoji}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Age Question */}
                {stage === "age" && (
                  <div>
                    <h3
                      className="text-3xl mb-2 text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      WELCHE ALTERSKATEGORIE PASST AM BESTEN?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Wähle eine Altersgruppe.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ageOptions.map((age) => (
                        <button
                          key={age.id}
                          onClick={() => handleAgeSelect(age.id)}
                          className={`p-6 rounded-lg border-2 transition-all text-left relative ${
                            preferences.age === age.id
                              ? "border-[#5a9690] bg-[#A0CEC8]/10"
                              : "border-gray-300 hover:border-[#A0CEC8]"
                          }`}
                        >
                          {preferences.age === age.id && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-[#5a9690] rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <h4
                            className="text-xl mb-2 text-[var(--charcoal)]"
                            style={{ fontFamily: 'Fjalla One' }}
                          >
                            {age.label}
                          </h4>
                          <p className="text-sm text-gray-600">{age.tags.join(", ")}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profession Question */}
                {stage === "profession" && (
                  <div>
                    <h3
                      className="text-3xl mb-2 text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      WELCHE PROFESSION PASST AM BESTEN?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Wähle eine Berufsgruppe.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {professionOptions.map((profession) => (
                        <button
                          key={profession.id}
                          onClick={() => handleProfessionSelect(profession.id)}
                          className={`p-6 rounded-lg border-2 transition-all text-left relative ${
                            preferences.profession === profession.id
                              ? "border-[#5a9690] bg-[#A0CEC8]/10"
                              : "border-gray-300 hover:border-[#A0CEC8]"
                          }`}
                        >
                          {preferences.profession === profession.id && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-[#5a9690] rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <h4
                            className="text-xl mb-2 text-[var(--charcoal)]"
                            style={{ fontFamily: 'Fjalla One' }}
                          >
                            {profession.label}
                          </h4>
                          <p className="text-sm text-gray-600">{profession.emoji}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hobbies Question */}
                {stage === "hobbies" && (
                  <div>
                    <h3
                      className="text-3xl mb-2 text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      WELCHE HOBBYS HAST DU?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Du kannst mehrere auswählen.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {hobbyOptions.map((hobby) => {
                        const isSelected = preferences.hobbies.includes(hobby.id);

                        return (
                          <button
                            key={hobby.id}
                            onClick={() => handleHobbyToggle(hobby.id)}
                            className="flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left hover:bg-gray-50"
                            style={{
                              borderColor: isSelected ? "#5a9690" : "#e5e7eb",
                              backgroundColor: isSelected ? "#A0CEC8" + "10" : "white",
                            }}
                          >
                            <div
                              className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                                isSelected
                                  ? "bg-[#5a9690] border-[#5a9690]"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="text-sm text-[var(--charcoal)]">{hobby.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mood Question */}
                {stage === "mood" && (
                  <div>
                    <h3
                      className="text-3xl mb-2 text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      WIE MÖCHTEST DU DICH BEIM LESEN FÜHLEN?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Wähle eine Stimmung, die zu dir passt.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {moodOptions.map((mood) => (
                        <button
                          key={mood.id}
                          onClick={() => handleMoodSelect(mood.id)}
                          className={`p-6 rounded-lg border-2 transition-all text-left relative ${
                            preferences.mood === mood.id
                              ? "border-[#5a9690] bg-[#A0CEC8]/10"
                              : "border-gray-300 hover:border-[#A0CEC8]"
                          }`}
                        >
                          {preferences.mood === mood.id && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-[#5a9690] rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <h4
                            className="text-xl mb-2 text-[var(--charcoal)]"
                            style={{ fontFamily: 'Fjalla One' }}
                          >
                            {mood.title}
                          </h4>
                          <p className="text-sm text-gray-600">{mood.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Themes Question */}
                {stage === "themes" && (
                  <div>
                    <h3
                      className="text-3xl mb-2 text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      WELCHE THEMEN UND PERSPEKTIVEN SIND DIR WICHTIG?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Du kannst mehrere auswählen.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {themeOptions.map((theme) => {
                        const isSelected = preferences.themes.includes(theme.id);

                        return (
                          <button
                            key={theme.id}
                            onClick={() => handleThemeToggle(theme.id)}
                            className="flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left hover:bg-gray-50"
                            style={{
                              borderColor: isSelected ? "#5a9690" : "#e5e7eb",
                              backgroundColor: isSelected ? "#A0CEC8" + "10" : "white",
                            }}
                          >
                            <div
                              className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                                isSelected
                                  ? "bg-[#5a9690] border-[#5a9690]"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="text-sm text-[var(--charcoal)]">{theme.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Genres Question */}
                {stage === "genres" && (
                  <div>
                    <h3
                      className="text-3xl mb-2 text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      WELCHE GENRES INTERESSIEREN DICH GERADE AM MEISTEN?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Wähle bis zu 3. ({preferences.genres.length}/3)
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {genreOptions
                        .filter((genre) => 
                          preferences.mood ? genre.availableForMoods.includes(preferences.mood) : true
                        )
                        .map((genre) => {
                          const isSelected = preferences.genres.includes(genre.id);
                          const isDisabled = !isSelected && preferences.genres.length >= 3;

                          return (
                            <button
                              key={genre.id}
                              onClick={() => handleGenreToggle(genre.id)}
                              disabled={isDisabled}
                              className={`px-6 py-3 rounded-full border-2 transition-all ${
                                isSelected
                                  ? "bg-[#5a9690] border-[#5a9690] text-white"
                                  : isDisabled
                                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-white border-gray-300 text-[var(--charcoal)] hover:border-[#A0CEC8]"
                              }`}
                              style={{ fontFamily: 'Fjalla One' }}
                            >
                              {genre.label}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Book Preferences Question */}
                {stage === "bookPreferences" && (
                  <div>
                    <h3
                      className="text-3xl mb-2 text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      WELCHE ARTEN VON BÜCHERN INTERESSIEREN DICH?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Neue Bücher, Klassiker oder Independent-Literatur? Du kannst mehrere wählen.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bookPreferenceOptions.map((pref) => {
                        const isSelected = preferences.bookPreferences.includes(pref.id);

                        return (
                          <button
                            key={pref.id}
                            onClick={() => handleBookPreferenceToggle(pref.id)}
                            className="flex items-start gap-3 p-5 rounded-lg border-2 transition-all text-left hover:bg-gray-50"
                            style={{
                              borderColor: isSelected ? "#5a9690" : "#e5e7eb",
                              backgroundColor: isSelected ? "#A0CEC8" + "10" : "white",
                            }}
                          >
                            <div
                              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-1 ${
                                isSelected
                                  ? "bg-[#5a9690] border-[#5a9690]"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <h4 className="text-base mb-1 text-[var(--charcoal)]" style={{ fontFamily: 'Fjalla One' }}>
                                {pref.label}
                              </h4>
                              <p className="text-xs text-gray-600">{pref.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-[var(--charcoal)] rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ fontFamily: 'Fjalla One' }}
                  >
                    ZURÜCK
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={
                      (stage === "quickFavorites" && !preferences.quickFavoriteBook.trim()) ||
                      (stage === "recipient" && !preferences.recipient) ||
                      (stage === "age" && !preferences.age) ||
                      (stage === "profession" && !preferences.profession) ||
                      (stage === "hobbies" && preferences.hobbies.length === 0) ||
                      (stage === "mood" && !preferences.mood) ||
                      (stage === "genres" && preferences.genres.length === 0)
                    }
                    className={`flex-1 py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      (stage === "quickFavorites" && !preferences.quickFavoriteBook.trim()) ||
                      (stage === "recipient" && !preferences.recipient) ||
                      (stage === "age" && !preferences.age) ||
                      (stage === "profession" && !preferences.profession) ||
                      (stage === "hobbies" && preferences.hobbies.length === 0) ||
                      (stage === "mood" && !preferences.mood) ||
                      (stage === "genres" && preferences.genres.length === 0)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#5a9690] text-white hover:bg-[#4a8580]"
                    }`}
                    style={{ fontFamily: 'Fjalla One' }}
                  >
                    <span>
                      {stage === "quickFavorites" || stage === "themes" && preferences.matchingType === "medium" || stage === "bookPreferences" 
                        ? "ERGEBNISSE ANZEIGEN" 
                        : "WEITER"}
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Swipe Genre Selection */}
        {stage === "swipeGenre" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3
                className="text-3xl mb-2 text-[var(--charcoal)]"
                style={{ fontFamily: 'Fjalla One' }}
              >
                WÄHLE EIN GENRE FÜR DEIN SWIPE-MATCHING
              </h3>
              <p className="text-gray-600 mb-6">
                Wir zeigen dir Buchcover, Zitate und Kuratoren aus diesem Genre.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {genreOptions.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleSwipeGenreSelect(genre.id)}
                    className={`p-6 rounded-lg border-2 transition-all text-left relative ${
                      preferences.swipeGenre === genre.id
                        ? "border-[#5a9690] bg-[#A0CEC8]/10"
                        : "border-gray-300 hover:border-[#A0CEC8]"
                    }`}
                  >
                    {preferences.swipeGenre === genre.id && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-[#5a9690] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <h4
                      className="text-base text-[var(--charcoal)]"
                      style={{ fontFamily: 'Fjalla One' }}
                    >
                      {genre.label}
                    </h4>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-[var(--charcoal)] rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'Fjalla One' }}
                >
                  ZURÜCK
                </button>
                <button
                  onClick={handleSwipeGenreStart}
                  disabled={!preferences.swipeGenre}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    !preferences.swipeGenre
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#5a9690] text-white hover:bg-[#4a8580]"
                  }`}
                  style={{ fontFamily: 'Fjalla One' }}
                >
                  <span>SWIPE STARTEN</span>
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Swipe Cards */}
        {stage === "swipeCards" && currentSwipeCards.length > 0 && currentCardIndex < currentSwipeCards.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <span className="text-sm text-gray-600">
                  {currentCardIndex + 1} / {currentSwipeCards.length}
                </span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSwipeCards[currentCardIndex].id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative"
              >
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden aspect-[3/4]">
                  {/* Book Cover Card */}
                  {currentSwipeCards[currentCardIndex].type === "book" && (
                    <div className="relative h-full">
                      <ImageWithFallback
                        src={currentSwipeCards[currentCardIndex].image!}
                        alt={currentSwipeCards[currentCardIndex].title!}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                        <h3 className="text-white text-xl mb-1" style={{ fontFamily: 'Fjalla One' }}>
                          {currentSwipeCards[currentCardIndex].title}
                        </h3>
                        <p className="text-white/80 text-sm">{currentSwipeCards[currentCardIndex].subtitle}</p>
                      </div>
                    </div>
                  )}

                  {/* Author Card */}
                  {currentSwipeCards[currentCardIndex].type === "author" && (
                    <div className="relative h-full">
                      <ImageWithFallback
                        src={currentSwipeCards[currentCardIndex].image!}
                        alt={currentSwipeCards[currentCardIndex].title!}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                        <p className="text-white/60 text-xs mb-1" style={{ fontFamily: 'Fjalla One' }}>
                          {currentSwipeCards[currentCardIndex].subtitle}
                        </p>
                        <h3 className="text-white text-2xl" style={{ fontFamily: 'Fjalla One' }}>
                          {currentSwipeCards[currentCardIndex].title}
                        </h3>
                      </div>
                    </div>
                  )}

                  {/* Curator Video Card */}
                  {currentSwipeCards[currentCardIndex].type === "curator" && (
                    <div className="relative h-full bg-gradient-to-br from-[#5a9690] to-[#A0CEC8] flex items-center justify-center p-8">
                      <div className="text-center text-white">
                        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-white">
                          <ImageWithFallback
                            src={currentSwipeCards[currentCardIndex].videoThumbnail!}
                            alt={currentSwipeCards[currentCardIndex].title!}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="text-2xl mb-2" style={{ fontFamily: 'Fjalla One' }}>
                          {currentSwipeCards[currentCardIndex].title}
                        </h3>
                        <p className="text-white/80 text-sm mb-4">{currentSwipeCards[currentCardIndex].subtitle}</p>
                        <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs">Kurator*in</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quote Card */}
                  {currentSwipeCards[currentCardIndex].type === "quote" && (
                    <div className="relative h-full">
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${currentSwipeCards[currentCardIndex].image})` }}
                      />
                      <div className="absolute inset-0 bg-black/50" />
                      <div className="relative h-full flex flex-col items-center justify-center p-8 text-center text-white">
                        <div className="text-6xl mb-6 opacity-50">"</div>
                        <p className="text-xl mb-6 italic leading-relaxed">
                          {currentSwipeCards[currentCardIndex].quote}
                        </p>
                        <p className="text-sm opacity-80" style={{ fontFamily: 'Fjalla One' }}>
                          — {currentSwipeCards[currentCardIndex].author}
                        </p>
                      </div>
                    </div>
                  )}


                </div>

                {/* Swipe Buttons */}
                <div className="flex justify-center gap-6 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSwipe("dislike")}
                    className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-gray-200 hover:border-red-400 transition-colors"
                  >
                    <X className="w-8 h-8 text-red-500" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSwipe("like")}
                    className="w-16 h-16 rounded-full bg-[#5a9690] shadow-lg flex items-center justify-center hover:bg-[#4a8580] transition-colors"
                  >
                    <Heart className="w-8 h-8 text-white" fill="white" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Loading Stage */}
        {stage === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="bg-white rounded-2xl shadow-xl p-12">
              {/* Animated Loader */}
              <div className="mb-8 flex justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-[#A0CEC8] border-t-[#5a9690] rounded-full"
                />
              </div>

              <h3
                className="text-2xl mb-8 text-[var(--charcoal)]"
                style={{ fontFamily: 'Fjalla One' }}
              >
                WIR DURCHSUCHEN 70.000 BÜCHER FÜR DICH ...
              </h3>

              <div className="space-y-3 text-left">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: loadingProgress >= 33 ? 1 : 0.3 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      loadingProgress >= 33 ? "text-[#5a9690]" : "text-gray-300"
                    }`}
                  />
                  <span className="text-sm text-gray-600">Stimmung analysiert</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: loadingProgress >= 66 ? 1 : 0.3 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      loadingProgress >= 66 ? "text-[#5a9690]" : "text-gray-300"
                    }`}
                  />
                  <span className="text-sm text-gray-600">Genres abgeglichen</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: loadingProgress >= 100 ? 1 : 0.3 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      loadingProgress >= 100 ? "text-[#5a9690]" : "text-gray-300"
                    }`}
                  />
                  <span className="text-sm text-gray-600">Kuratierte Empfehlungen ausgewählt</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Stage */}
        {stage === "results" && (
          <MatchingResults
            bookMatches={getBookMatches()}
            curatorMatches={getCuratorMatches()}
            userSelectionLabels={getUserSelectionLabels()}
            allTags={preferences.allTags}
            onRestart={() => {
              setStage("intro");
              setPreferences({
                matchingType: null,
                quickFavoriteBook: "",
                recipient: null,
                age: null,
                profession: null,
                hobbies: [],
                mood: null,
                genres: [],
                themes: [],
                bookPreferences: [],
                swipeGenre: null,
                swipeLikes: [],
                swipeDislikes: [],
                allTags: [],
              });
              setLoadingProgress(0);
              setCurrentSwipeCards([]);
              setCurrentCardIndex(0);
            }}
          />
        )}
      </div>
    </section>
  );
}