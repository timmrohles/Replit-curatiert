import React, { useState, useRef, useMemo } from 'react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { InfoBar } from '../layout/InfoBar';
import { BottomBanner } from '../layout/BottomBanner';
import { CuratedBookSection } from '../book/CuratedBookSection';
import { CategoryCardsGrid } from '../tags/CategoryCardsGrid';
import { RecipientCategoryGridWithBooks } from '../tags/RecipientCategoryGridWithBooks';
// ❌ REMOVED: LatestReviewsSection - Component doesn't exist
import { HomepageSections } from './HomepageSections';
import { RefactoredHeroSection } from '../sections/RefactoredHeroSection.section';
import { Container } from '../ui/container';
import { Heading } from '../ui/typography';
import { Section } from '../ui/section'; // ✅ FIXED: UISection → Section
import { SectionErrorBoundary } from '../common/SectionErrorBoundary'; // ✅ NEW: Granular error handling
import { Book, Event, RawEvent, Storefront, DiverseList, Topic, EventType } from '../../types/homepage';

// Constants
const MAURICE_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400';

const hardcodedCreators = [
  {
    id: 'maurice-oekonomius',
    name: 'Maurice Ökonomius',
    avatar: MAURICE_AVATAR,
    focus: 'Politik & Wirtschaft',
    tags: ['MMT', 'Wirtschaftspolitik', 'Progressive Ökonomie']
  }
];

const availableTags = [
  'MMT',
  'Wirtschaftspolitik',
  'Progressive Ökonomie',
  'Politik',
  'Wirtschaft',
  'Feminismus',
  'LGBTQ+',
  'Klima',
  'Geschichte'
];

const allEvents: RawEvent[] = [
  {
    id: 1,
    title: 'Lesung: Neue deutsche Gegenwartsliteratur',
    date: '2026-02-15',
    time: '19:00',
    location: 'Literaturhaus Berlin',
    locationType: 'Live',
    description: 'Eine Lesung mit ausgewählten Autor*innen der aktuellen Literaturszene',
    type: 'Lesung',
    curatorName: 'coratiert Redaktion',
    curatorImage: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400',
    curatorSlug: 'coratiert-redaktion',
    curatorFocus: 'Literarische Events',
    registrationUrl: 'https://example.com/register'
  },
  {
    id: 2,
    title: 'Panel: Diversität im Literaturbetrieb',
    date: '2026-02-20',
    time: '18:30',
    location: 'Online via Zoom',
    locationType: 'Online',
    description: 'Expert*innen diskutieren über Repräsentation und Vielfalt in der Verlagslandschaft',
    type: 'Panel',
    curatorName: 'Diversity Book Club',
    curatorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    curatorSlug: 'diversity-book-club',
    curatorFocus: 'Diverse Stimmen',
    registrationUrl: 'https://example.com/register'
  },
  {
    id: 3,
    title: 'Workshop: Kreatives Schreiben',
    date: '2026-02-25',
    time: '14:00',
    location: 'Schreibwerkstatt München',
    locationType: 'Live',
    description: 'Praktischer Workshop für Einsteiger*innen und Fortgeschrittene',
    type: 'Workshop',
    curatorName: 'Schreibraum Kollektiv',
    curatorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    curatorSlug: 'schreibraum-kollektiv',
    curatorFocus: 'Kreativität & Praxis',
    registrationUrl: 'https://example.com/register'
  },
  {
    id: 4,
    title: 'Diskussion: Klimakrise in der Literatur',
    date: '2026-03-05',
    time: '20:00',
    location: 'Online via YouTube',
    locationType: 'Online',
    description: 'Wie reflektiert zeitgenössische Literatur die Klimakrise?',
    type: 'Diskussion',
    curatorName: 'Öko-Literatur Initiative',
    curatorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    curatorSlug: 'oeko-literatur',
    curatorFocus: 'Nachhaltigkeit & Literatur',
    registrationUrl: 'https://example.com/register'
  },
  {
    id: 5,
    title: 'Livestream: Buchclub Spezial',
    date: '2026-03-10',
    time: '19:30',
    location: 'Twitch Livestream',
    locationType: 'Online',
    description: 'Monatlicher Buchclub mit Live-Chat und Diskussion',
    type: 'Livestream',
    curatorName: 'Digital Bookworms',
    curatorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    curatorSlug: 'digital-bookworms',
    curatorFocus: 'Digital Community',
    registrationUrl: 'https://example.com/register'
  }
];

export function Homepage() {
  // State management
  const [selectedEventType, setSelectedEventType] = useState<string>('Alle');
  const [selectedEventLocation, setSelectedEventLocation] = useState<string>('Alle');
  
  // Carousel refs
  const genreCarouselRef = useRef<HTMLDivElement>(null);
  const eventsCarouselRef = useRef<HTMLDivElement>(null);
  const storefrontsCarouselRef = useRef<HTMLDivElement>(null);
  const newBooksRef = useRef<HTMLDivElement>(null);
  const queerBooksRef = useRef<HTMLDivElement>(null);
  const debutBooksRef = useRef<HTMLDivElement>(null);
  const translationsRef = useRef<HTMLDivElement>(null);
  const diverseListsRef = useRef<HTMLDivElement>(null);

  // Mock data
  const newBooks: Book[] = [
    {
      id: 1,
      cover: 'https://i.ibb.co/q3d4RtzF/lichtungen.jpg',
      title: 'Lichtungen',
      author: 'Iris Wolff',
      publisher: 'Klett-Cotta',
      year: '2024',
      price: '24,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Familiengeschichte'],
      isbn: '9783608981896',
      klappentext: 'Eine epische Familiengeschichte über vier Generationen, die sich in poetischer Sprache durch das 20. Jahrhundert bewegt.',
      reviews: [
        { source: 'Die Zeit', quote: 'Ein außergewöhnliches Buch über Heimat, Familie und Identität.' },
        { source: 'Süddeutsche Zeitung', quote: 'Iris Wolff schreibt mit einer Leichtigkeit, die verzaubert.' }
      ]
    },
    {
      id: 2,
      cover: 'https://i.ibb.co/KcbQr6wq/Kairos.jpg',
      title: 'Kairos',
      author: 'Jenny Erpenbeck',
      publisher: 'Penguin',
      year: '2024',
      price: '24,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Deutscher Buchpreis'],
      isbn: '9783328602644',
      klappentext: 'Eine Liebesgeschichte vor dem Hintergrund des Mauerfalls, die von Macht, Abhängigkeit und dem Ende einer Ära erzählt.',
      reviews: [
        { source: 'Frankfurter Allgemeine', quote: 'Der verdiente Gewinner des Deutschen Buchpreises 2024.' },
        { source: 'Der Spiegel', quote: 'Erpenbeck gelingt ein literarisches Meisterwerk.' }
      ]
    },
    {
      id: 3,
      cover: 'https://i.ibb.co/fzztP0nY/die-mitternachtsbibliothek.jpg',
      title: 'Die Mitternachtsbibliothek',
      author: 'Matt Haig',
      publisher: 'Droemer',
      year: '2021',
      price: '12,00 €',
      category: 'Science-Fiction & Fantasy',
      tags: ['Bestseller'],
      isbn: '9783426282892',
      klappentext: 'Zwischen Leben und Tod gibt es eine Bibliothek. Hier bekommt Nora Seed die Chance, alle Leben zu erleben, die sie hätte führen können.',
      reviews: [
        { source: 'Guardian', quote: 'Ein Buch, das Leben retten kann.' },
        { source: 'New York Times', quote: 'Warmherzig, philosophisch und unglaublich bewegend.' }
      ]
    },
    {
      id: 4,
      cover: 'https://i.ibb.co/yBkXZ74g/Klara-und-die-Sonne.jpg',
      title: 'Klara und die Sonne',
      author: 'Kazuo Ishiguro',
      publisher: 'Blessing',
      year: '2021',
      price: '24,00 €',
      category: 'Science-Fiction & Fantasy',
      tags: ['Philosophisch'],
      isbn: '9783896675552',
      klappentext: 'Eine künstliche Freundin beobachtet die Welt mit ungewöhnlicher Klarheit und stellt dabei die großen Fragen: Was bedeutet es zu lieben?',
      reviews: [
        { source: 'Financial Times', quote: 'Ishiguro in Bestform – berührend und zeitlos.' },
        { source: 'The Times', quote: 'Ein Meisterwerk über Menschlichkeit und künstliche Intelligenz.' }
      ]
    },
    {
      id: 5,
      cover: 'https://i.ibb.co/1J0wsVyT/Eine-Frage-der-Chemie.jpg',
      title: 'Eine Frage der Chemie',
      author: 'Bonnie Garmus',
      publisher: 'Piper',
      year: '2023',
      price: '24,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Feminismus'],
      isbn: '9783492061315',
      klappentext: 'Elizabeth Zott ist Chemikerin in den 1960ern und wird zur Star-Moderatorin einer Kochshow. Ein Roman über Wissenschaft, Kochen und weibliche Selbstbestimmung.',
      reviews: [
        { source: 'Washington Post', quote: 'Witzig, klug und unglaublich inspirierend.' },
        { source: 'Vogue', quote: 'Eine Protagonistin, die man nie vergisst.' }
      ]
    },
    {
      id: 6,
      cover: 'https://i.ibb.co/tJ8hS5bX/Demon-Copperhead.jpg',
      title: 'Demon Copperhead',
      author: 'Barbara Kingsolver',
      publisher: 'C.H. Beck',
      year: '2023',
      price: '28,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Pulitzer-Preis'],
      isbn: '9783406797262',
      klappentext: 'Eine moderne Adaption von David Copperfield im Appalachengebirge. Die Geschichte eines Jungen, der allen Widrigkeiten zum Trotz seinen Weg geht.',
      reviews: [
        { source: 'The Atlantic', quote: 'Ein amerikanisches Meisterwerk.' },
        { source: 'New Yorker', quote: 'Kingsolver schreibt mit großem Herz und scharfem Blick.' }
      ]
    },
  ];

  const queerBooks: Book[] = [
    {
      id: 1,
      cover: 'https://i.ibb.co/ZRqSrvHf/paul-takes-the-form-of-a-mortal-girl.jpg',
      title: 'Paul Takes the Form of a Mortal Girl',
      author: 'Andrea Lawlor',
      publisher: 'Hanser Berlin',
      year: '2023',
      price: '25,00 €',
      category: 'Romane & Erzählungen',
      tags: ['LGBTQ+', 'Coming-of-Age'],
      klappentext: 'Paul kann seine Gestalt verändern – mal Mann, mal Frau. Eine queere Odyssee durch die 90er Jahre, die von Identität, Begehren und Selbstfindung erzählt.',
      reviews: [
        { source: 'The New York Times', quote: 'Ein wilder, brillanter Roman über Identität und Freiheit.' },
        { source: 'NPR', quote: 'Andrea Lawlor schreibt mit außergewöhnlicher Kühnheit.' }
      ]
    },
    {
      id: 2,
      cover: 'https://i.ibb.co/Kp8qJhLL/detransition-baby.jpg',
      title: 'Detransition, Baby',
      author: 'Torrey Peters',
      publisher: 'Hanser',
      year: '2022',
      price: '24,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Trans*', 'Familie'],
      klappentext: 'Reese, Ames und Katrina verhandeln, was Familie bedeuten kann. Ein radikaler Roman über trans Identität, Mutterschaft und die vielen Formen von Liebe.',
      reviews: [
        { source: 'The Guardian', quote: 'Mutig, witzig und herzzerreißend ehrlich.' },
        { source: 'Vogue', quote: 'Ein Meilenstein der Trans-Literatur.' }
      ]
    },
    {
      id: 3,
      cover: 'https://i.ibb.co/xtLc3gjJ/auf-erden-sind-wir-grandios.jpg',
      title: 'Auf Erden sind wir kurz grandios',
      author: 'Ocean Vuong',
      publisher: 'Hanser',
      year: '2020',
      price: '22,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Migration', 'LGBTQ+'],
      klappentext: 'Ein Brief eines Sohnes an seine analphabetische Mutter. Eine Geschichte über Flucht, Trauma, queere Liebe und die Kraft der Sprache.',
      reviews: [
        { source: 'The New York Times', quote: 'Ein literarisches Meisterwerk – poetisch und bewegend.' },
        { source: 'The Atlantic', quote: 'Vuong schreibt wie niemand sonst.' }
      ]
    },
    {
      id: 4,
      cover: 'https://i.ibb.co/6JBf1r5p/freshwater.jpg',
      title: 'Freshwater',
      author: 'Akwaeke Emezi',
      publisher: 'Eichborn',
      year: '2019',
      price: '20,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Non-Binary', 'Identität'],
      klappentext: 'Ada ist von Gottheiten bewohnt, die um die Kontrolle über ihren Körper kämpfen. Ein außergewöhnlicher Roman über Identität jenseits binärer Kategorien.',
      reviews: [
        { source: 'The Guardian', quote: 'Kühn, innovativ und absolut fesselnd.' },
        { source: 'Elle', quote: 'Emezi revolutioniert das Erzählen über Identität.' }
      ]
    },
    {
      id: 5,
      cover: 'https://i.ibb.co/Y7zdD7VD/red-white-and-royal-blue.jpg',
      title: 'Red, White & Royal Blue',
      author: 'Casey McQuiston',
      publisher: 'Heyne',
      year: '2020',
      price: '16,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Romance', 'LGBTQ+'],
      klappentext: 'Der Sohn der US-Präsidentin verliebt sich in einen britischen Prinzen. Eine romantische Komödie über Politik, Liebe und den Mut, zu sich selbst zu stehen.',
      reviews: [
        { source: 'Cosmopolitan', quote: 'Die perfekte Feel-Good-Romanze mit Tiefgang.' },
        { source: 'Buzzfeed', quote: 'Witzig, herzerwärmend und hoffnungsvoll.' }
      ]
    },
    {
      id: 6,
      cover: 'https://i.ibb.co/twkQjMrF/stone-butch-blues.jpg',
      title: 'Stone Butch Blues',
      author: 'Leslie Feinberg',
      publisher: 'Argument Verlag',
      year: '2023',
      price: '18,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Klassiker', 'Trans*'],
      klappentext: 'Die Geschichte von Jess Goldberg, die in den 1960er und 70er Jahren um Anerkennung und Würde kämpft. Ein Klassiker der Trans-Literatur über Widerstand und Gemeinschaft.',
      reviews: [
        { source: 'Lambda Literary', quote: 'Ein unverzichtbares Werk der LGBTQ+ Literatur.' },
        { source: 'The Advocate', quote: 'Feinbergs Roman hat Generationen geprägt.' }
      ]
    },
  ];

  const debutBooks: Book[] = [
    {
      id: 1,
      cover: 'https://i.ibb.co/s9FJ7VNb/Identitti.jpg',
      title: 'Identitti',
      author: 'Mithu Sanyal',
      publisher: 'Hanser',
      year: '2021',
      price: '22,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Debüt'],
      klappentext: 'Saraswati ist eine gefeierte Professorin für Postcolonial Studies – bis sich herausstellt, dass sie weiß ist. Ein Roman über Identität, Zugehörigkeit und die Frage: Wer darf was sagen?',
      reviews: [
        { source: 'Süddeutsche Zeitung', quote: 'Ein brillanter Debütroman über Identität und Selbstinszenierung.' },
        { source: 'Der Spiegel', quote: 'Mithu Sanyal gelingt ein kluges, unterhaltsames Buch über ein brisantes Thema.' }
      ]
    },
    {
      id: 2,
      cover: 'https://i.ibb.co/TMyWw2n2/streulicht.jpg',
      title: 'Streulicht',
      author: 'Deniz Ohde',
      publisher: 'Suhrkamp',
      year: '2020',
      price: '20,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Debüt'],
      klappentext: 'Ein Mädchen wächst in einer Trabantenstadt auf, kämpft gegen Vorurteile und findet ihren eigenen Weg. Ein eindringliches Debüt über Klassismus und Aufstieg.',
      reviews: [
        { source: 'Frankfurter Allgemeine', quote: 'Ein beeindruckendes literarisches Debüt.' },
        { source: 'Die Zeit', quote: 'Deniz Ohde schreibt mit großer Präzision über soziale Ungleichheit.' }
      ]
    },
    {
      id: 3,
      cover: 'https://i.ibb.co/qFm72tNw/Eurotrash.jpg',
      title: 'Eurotrash',
      author: 'Christian Kracht',
      publisher: 'Kiepenheuer & Witsch',
      year: '2021',
      price: '22,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Humor'],
      klappentext: 'Eine Reise durch die Schweiz mit der sterbenden Mutter wird zu einer Abrechnung mit der eigenen Herkunft. Komisch, böse und erschütternd zugleich.',
      reviews: [
        { source: 'Süddeutsche Zeitung', quote: 'Kracht in Hochform – böse, komisch, brillant.' },
        { source: 'Frankfurter Rundschau', quote: 'Ein literarisches Feuerwerk.' }
      ]
    },
    {
      id: 4,
      cover: 'https://i.ibb.co/QvpCQt6R/Buch-in-der-Fremde.jpg',
      title: 'Buch in der Fremde',
      author: 'Senthuran Varatharajah',
      publisher: 'S. Fischer',
      year: '2020',
      price: '22,00 €',
      category: 'Romane & Erzählungen',
      tags: ['Migration'],
      klappentext: 'Ein Dialog zwischen zwei Menschen über Flucht, Sprache und die Unmöglichkeit von Heimat. Ein philosophisches Debüt von großer Intensität.',
      reviews: [
        { source: 'Die Zeit', quote: 'Ein außergewöhnliches Debüt über Migration und Identität.' },
        { source: 'taz', quote: 'Varatharajah schreibt mit bestechender Klarheit.' }
      ]
    },
  ];

  const translations: Book[] = [
    {
      id: 1,
      cover: 'https://i.ibb.co/x8SWJ4Tz/Die-Stadt-und-ihre-ungewisse-Mauer.jpg',
      title: 'Die Stadt und ihre ungewisse Mauer',
      author: 'Haruki Murakami',
      publisher: 'DuMont',
      year: '2024',
      price: '28,00 €',
      category: 'Roman',
      tags: ['Japan'],
      klappentext: 'Eine Stadt hinter einer Mauer, ein Mann auf der Suche nach verlorener Liebe. Murakamis neuester Roman ist eine magische Reise zwischen Realität und Traum.',
      reviews: [
        { source: 'The Guardian', quote: 'Murakami in seinem Element – poetisch und rätselhaft.' },
        { source: 'Le Monde', quote: 'Ein Meisterwerk der surrealen Literatur.' }
      ]
    },
    {
      id: 2,
      cover: 'https://i.ibb.co/6Ry6xCTH/Griechischstunden.jpg',
      title: 'Griechischstunden',
      author: 'Han Kang',
      publisher: 'Aufbau',
      year: '2024',
      price: '24,00 €',
      category: 'Roman',
      tags: ['Korea'],
      klappentext: 'Eine Frau verliert ihre Sprache nach einem Trauma. Ihr Griechischlehrer versucht, ihr das Sprechen zurückzugeben. Ein poetischer Roman über Verlust und Heilung.',
      reviews: [
        { source: 'The New York Times', quote: 'Han Kang schreibt mit unvergleichlicher Zartheit.' },
        { source: 'Financial Times', quote: 'Ein stiller, kraftvoller Roman über Trauma und Sprache.' }
      ]
    },
    {
      id: 3,
      cover: 'https://i.ibb.co/jZfXqRKs/Intermezzo.jpg',
      title: 'Intermezzo',
      author: 'Sally Rooney',
      publisher: 'Luchterhand',
      year: '2024',
      price: '26,00 €',
      category: 'Roman',
      tags: [],
      klappentext: 'Zwei Brüder nach dem Tod ihres Vaters. Sally Rooney erkundet Trauer, Familie und die Komplexität von Beziehungen mit ihrer unverwechselbaren Stimme.',
      reviews: [
        { source: 'The Guardian', quote: 'Rooney beweist erneut ihr außergewöhnliches Talent.' },
        { source: 'Vogue', quote: 'Ein emotionaler, kluger Roman über Brüderlichkeit.' }
      ]
    },
    {
      id: 4,
      cover: 'https://i.ibb.co/8nfYMtrD/Hurrikan.jpg',
      title: 'Hurrikan',
      author: 'Fernanda Melchor',
      publisher: 'Wagenbach',
      year: '2024',
      price: '24,00 €',
      category: 'Roman',
      tags: ['Mexiko'],
      klappentext: 'Eine Stadt im Ausnahmezustand, ein Mord, viele Perspektiven. Melchor erzählt in eindringlicher Sprache von Gewalt, Armut und den Abgründen der mexikanischen Gesellschaft.',
      reviews: [
        { source: 'El País', quote: 'Eine literarische Offenbarung aus Mexiko.' },
        { source: 'The Guardian', quote: 'Melchor schreibt mit schonungsloser Intensität.' }
      ]
    },
    {
      id: 5,
      cover: 'https://i.ibb.co/WWv0dFr7/Die-Jakobsb-cher.jpg',
      title: 'Die Jakobsbücher',
      author: 'Olga Tokarczuk',
      publisher: 'Kampa',
      year: '2024',
      price: '35,00 €',
      category: 'Roman',
      tags: ['Polen'],
      klappentext: 'Ein monumentales Epos über Jakob Frank und seine messianische Bewegung im 18. Jahrhundert. Tokarczuks Meisterwerk über Religion, Macht und die Suche nach Wahrheit.',
      reviews: [
        { source: 'The New York Times', quote: 'Ein literarisches Monument von epischen Ausmaßen.' },
        { source: 'Le Figaro', quote: 'Tokarczuk in Höchstform – grandios und vielschichtig.' }
      ]
    },
  ];

  const storefronts: Storefront[] = [
    {
      id: 'maurice-oekonomius',
      bannerImage: 'https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?w=800',
      avatar: MAURICE_AVATAR,
      name: 'Maurice Ökonomius',
      focus: 'Politik & Wirtschaft',
      bookCount: 87,
      description: 'Moderne Geldtheorie, Wirtschaftspolitik und progressive Ökonomie',
      bookCovers: [
        'https://i.ibb.co/s9FJ7VNb/Identitti.jpg',
        'https://i.ibb.co/KcbQr6wq/Kairos.jpg',
        'https://i.ibb.co/qFm72tNw/Eurotrash.jpg',
        'https://i.ibb.co/1J0wsVyT/Eine-Frage-der-Chemie.jpg'
      ]
    },
  ];

  const diverseLists: DiverseList[] = [
    {
      id: 1,
      title: 'Frauen erzählen',
      reason: 'Starke weibliche Stimmen der Gegenwartsliteratur',
      curator: 'Lisa Weber',
      curatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      curatorFocus: 'Feministische Literatur',
      covers: [
        'https://i.ibb.co/1J0wsVyT/Eine-Frage-der-Chemie.jpg',
        'https://i.ibb.co/KcbQr6wq/Kairos.jpg',
        'https://i.ibb.co/6Ry6xCTH/Griechischstunden.jpg'
      ]
    },
    {
      id: 2,
      title: 'Queere Perspektiven',
      reason: 'LGBTQIA+ Geschichten, die bewegen',
      curator: 'Max Richter',
      curatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      curatorFocus: 'LGBTQIA+ Literatur',
      covers: [
        'https://i.ibb.co/s9FJ7VNb/Identitti.jpg',
        'https://i.ibb.co/jZfXqRKs/Intermezzo.jpg',
        'https://i.ibb.co/TMyWw2n2/streulicht.jpg'
      ]
    },
    {
      id: 3,
      title: 'Diaspora & Migration',
      reason: 'Zwischen Kulturen und Identitäten',
      curator: 'Ayşe Yılmaz',
      curatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      curatorFocus: 'Postkoloniale Literatur',
      covers: [
        'https://i.ibb.co/QvpCQt6R/Buch-in-der-Fremde.jpg',
        'https://i.ibb.co/8nfYMtrD/Hurrikan.jpg',
        'https://i.ibb.co/WWv0dFr7/Die-Jakobsb-cher.jpg'
      ]
    },
  ];

  const topics: Topic[] = [
    { label: 'Politik', count: 234 },
    { label: 'Wirtschaft', count: 189 },
    { label: 'Feminismus', count: 156 },
    { label: 'Klima', count: 142 },
    { label: 'Fantasy', count: 298 },
    { label: 'Thriller', count: 276 },
    { label: 'Wissenschaft', count: 167 },
    { label: 'Biografie', count: 134 },
    { label: 'Geschichte', count: 201 },
    { label: 'Philosophie', count: 123 },
    { label: 'Psychologie', count: 145 },
    { label: 'Kinderbücher', count: 187 },
  ];

  // Filter events
  const filteredEvents: Event[] = useMemo(() => 
    allEvents
      .filter(event => {
        const matchesType = selectedEventType === 'Alle' || event.type === selectedEventType;
        const matchesLocation = selectedEventLocation === 'Alle' || event.locationType === selectedEventLocation;
        return matchesType && matchesLocation;
      })
      .map(event => ({
        id: event.id.toString(),
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        locationType: event.locationType === 'Online' ? 'virtual' as const : 'physical' as const,
        description: event.description,
        eventType: event.type as EventType,
        curatorName: event.curatorName,
        curatorImage: event.curatorImage,
        curatorSlug: event.curatorSlug,
        curatorFocus: event.curatorFocus,
        websiteLink: event.registrationUrl
      })),
    [selectedEventType, selectedEventLocation]
  );

  return (
    <>
      {/* InfoBar - Beta Hinweis */}
      <InfoBar />
      
      <Header 
        isHomePage={true}
        hideRegionSelector={false}
      />
      <main className="min-h-screen">
        {/* Hero Section */}
        <RefactoredHeroSection 
          creators={hardcodedCreators}
          availableTags={availableTags}
        />

        {/* Content Area */}
        <div className="content-area">
          {/* Genre Categories */}
          <Section variant="compact" ariaLabel="Genre-Kategorien">
            <Container>
              <Heading as="h2" variant="h2" className="mb-8 text-center">
                Was möchtest du lesen?
              </Heading>
              <CategoryCardsGrid location="homepage" />
            </Container>
          </Section>

          {/* Video Book Carousel - Entdecke unsere Auswahl mit Video */}
          <CuratedBookSection
            curator={{
              avatar: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400",
              name: "coratiert Redaktion",
              focus: "Handverlesen",
              occasion: "Entdecke unsere Buchempfehlungen",
              curationReason: "Die besten Neuerscheinungen und Klassiker für dich zusammengestellt.",
              showSocials: false,
            }}
            books={newBooks}
            showVideo={true}
            videoUrl="https://player.vimeo.com/progressive_redirect/playback/402978260/rendition/360p/file.mp4?loc=external&signature=ee5bb470c53bd4e1e906e7b1d8c8b8e5f3d8c9d8"
            videoTitle="Unsere Buchauswahl im Video"
            videoThumbnail="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800"
            showCta={false}
            backgroundColor="white"
            sectionBackgroundColor="transparent"
            bookCardBgColor="beige"
          />

          {/* Selfpublishing-Buchpreis - TODO: Add complete book data */}
          <CuratedBookSection
            curator={{
              avatar: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400",
              name: "coratiert Redaktion",
              focus: "Sachbuch & Ratgeber",
              occasion: "Die Longlist des Selfpublishing-Buchpreises 2025/26 steht fest",
              curationReason: "Zehn herausragende Sachbücher und Ratgeber haben es auf die Longlist geschafft.",
              showSocials: false,
            }}
            category="Selfpublishing-Buchpreis"
            useEditorialLayout={true}
            books={[
              {
                id: 1,
                cover: 'https://i.ibb.co/q3d4RtzF/lichtungen.jpg',
                title: 'Lichtungen',
                author: 'Iris Wolff',
                publisher: 'Klett-Cotta',
                year: '2024',
                price: '24,00 €',
                category: 'Romane & Erzählungen',
                tags: ['Familiengeschichte'],
                isbn: '9783608981896',
                klappentext: 'Eine epische Familiengeschichte über vier Generationen, die sich in poetischer Sprache durch das 20. Jahrhundert bewegt.',
                reviews: [
                  { source: 'Die Zeit', quote: 'Ein außergewöhnliches Buch über Heimat, Familie und Identität.' },
                  { source: 'Süddeutsche Zeitung', quote: 'Iris Wolff schreibt mit einer Leichtigkeit, die verzaubert.' }
                ]
              },
              {
                id: 2,
                cover: 'https://i.ibb.co/KcbQr6wq/Kairos.jpg',
                title: 'Kairos',
                author: 'Jenny Erpenbeck',
                publisher: 'Penguin',
                year: '2024',
                price: '24,00 €',
                category: 'Romane & Erzählungen',
                tags: ['Deutscher Buchpreis'],
                isbn: '9783328602644',
                klappentext: 'Eine Liebesgeschichte vor dem Hintergrund des Mauerfalls, die von Macht, Abhängigkeit und dem Ende einer Ära erzählt.',
                reviews: [
                  { source: 'Frankfurter Allgemeine', quote: 'Der verdiente Gewinner des Deutschen Buchpreises 2024.' },
                  { source: 'Der Spiegel', quote: 'Erpenbeck gelingt ein literarisches Meisterwerk.' }
                ]
              },
              {
                id: 3,
                cover: 'https://i.ibb.co/fzztP0nY/die-mitternachtsbibliothek.jpg',
                title: 'Die Mitternachtsbibliothek',
                author: 'Matt Haig',
                publisher: 'Droemer',
                year: '2021',
                price: '12,00 €',
                category: 'Science-Fiction & Fantasy',
                tags: ['Bestseller'],
                isbn: '9783426282892',
                klappentext: 'Zwischen Leben und Tod gibt es eine Bibliothek. Hier bekommt Nora Seed die Chance, alle Leben zu erleben, die sie hätte führen können.',
                reviews: [
                  { source: 'Guardian', quote: 'Ein Buch, das Leben retten kann.' },
                  { source: 'New York Times', quote: 'Warmherzig, philosophisch und unglaublich bewegend.' }
                ]
              },
              {
                id: 4,
                cover: 'https://i.ibb.co/yBkXZ74g/Klara-und-die-Sonne.jpg',
                title: 'Klara und die Sonne',
                author: 'Kazuo Ishiguro',
                publisher: 'Blessing',
                year: '2021',
                price: '24,00 €',
                category: 'Science-Fiction & Fantasy',
                tags: ['Philosophisch'],
                isbn: '9783896675552',
                klappentext: 'Eine künstliche Freundin beobachtet die Welt mit ungewöhnlicher Klarheit und stellt dabei die großen Fragen: Was bedeutet es zu lieben?',
                reviews: [
                  { source: 'Financial Times', quote: 'Ishiguro in Bestform – berührend und zeitlos.' },
                  { source: 'The Times', quote: 'Ein Meisterwerk über Menschlichkeit und künstliche Intelligenz.' }
                ]
              },
              {
                id: 5,
                cover: 'https://i.ibb.co/1J0wsVyT/Eine-Frage-der-Chemie.jpg',
                title: 'Eine Frage der Chemie',
                author: 'Bonnie Garmus',
                publisher: 'Piper',
                year: '2023',
                price: '24,00 €',
                category: 'Romane & Erzählungen',
                tags: ['Feminismus'],
                isbn: '9783492061315',
                klappentext: 'Elizabeth Zott ist Chemikerin in den 1960ern und wird zur Star-Moderatorin einer Kochshow. Ein Roman über Wissenschaft, Kochen und weibliche Selbstbestimmung.',
                reviews: [
                  { source: 'Washington Post', quote: 'Witzig, klug und unglaublich inspirierend.' },
                  { source: 'Vogue', quote: 'Eine Protagonistin, die man nie vergisst.' }
                ]
              },
              {
                id: 6,
                cover: 'https://i.ibb.co/tJ8hS5bX/Demon-Copperhead.jpg',
                title: 'Demon Copperhead',
                author: 'Barbara Kingsolver',
                publisher: 'C.H. Beck',
                year: '2023',
                price: '28,00 €',
                category: 'Romane & Erzählungen',
                tags: ['Pulitzer-Preis'],
                isbn: '9783406797262',
                klappentext: 'Eine moderne Adaption von David Copperfield im Appalachengebirge. Die Geschichte eines Jungen, der allen Widrigkeiten zum Trotz seinen Weg geht.',
                reviews: [
                  { source: 'The Atlantic', quote: 'Ein amerikanisches Meisterwerk.' },
                  { source: 'New Yorker', quote: 'Kingsolver schreibt mit großem Herz und scharfem Blick.' }
                ]
              },
            ]}
            backgroundColor="var(--creator-light-bg)"
            bookCardBgColor="transparent"
            sectionBackgroundColor="transparent"
            borderColor="rgba(0,0,0,0.2)"
            tagBorderColor="rgba(255,255,255,0.2)"
            selectBg="transparent"
            selectBorder="rgba(0,0,0,0.2)"
            arrowBg="var(--creator-dark-bg)"
            arrowHoverBg="var(--creator-accent)"
            videoCardBg="transparent"
            showCta={false}
            showVideo={false}
          />

          {/* Recipient Category Grid */}
          <RecipientCategoryGridWithBooks />

          {/* All other homepage sections (Books, Events, Storefronts, etc.) */}
          <HomepageSections 
            newBooks={newBooks}
            queerBooks={queerBooks}
            debutBooks={debutBooks}
            translations={translations}
            storefronts={storefronts}
            diverseLists={diverseLists}
            topics={topics}
            filteredEvents={filteredEvents}
            selectedEventType={selectedEventType}
            selectedEventLocation={selectedEventLocation}
            setSelectedEventType={setSelectedEventType}
            setSelectedEventLocation={setSelectedEventLocation}
            refs={{
              newBooksRef,
              queerBooksRef,
              debutBooksRef,
              translationsRef,
              storefrontsCarouselRef,
              diverseListsRef,
              genreCarouselRef,
              eventsCarouselRef
            }}
          />
        </div>
        <Footer />
      </main>
      <BottomBanner />
      <Footer />
    </>
  );
}