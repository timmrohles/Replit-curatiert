/**
 * Type Definitions für Homepage Components
 * Production-Ready Type Safety (Januar 2026)
 */

// ========================================
// 📚 Book Types
// ========================================

export interface Book {
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
  onixTagIds?: string[];
  shortDescription?: string;
  klappentext?: string;
  followCount?: number;
  awards?: number;
  reviewCount?: number;
  shortlists?: number;
  longlists?: number;
  releaseDate?: string;
  isbn?: string;
  reviews?: Review[];
}

export interface Review {
  source: string;
  quote: string;
}

// ========================================
// 👤 Creator/Curator Types
// ========================================

export interface Creator {
  id: number;
  photo: string;
  name: string;
  specialty: string;
  bio: string;
  tags: string[];
}

export interface CuratorInfo {
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

// ========================================
// 📅 Event Types
// ========================================

export type EventLocationType = 'virtual' | 'physical';

export type EventType = 'Lesung' | 'Podcast Live-Episode' | 'Panel' | 'Workshop' | 'Diskussion';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  locationType: EventLocationType;
  description: string;
  eventType: EventType;
  curatorName: string;
  curatorImage: string;
  curatorSlug: string;
  curatorFocus: string;
  websiteLink?: string;
  image?: string;
}

export interface RawEvent {
  id: number;
  type: string;
  locationType: string;
  isOnline: boolean;
  image?: string;
  curatorImage: string;
  curatorName: string;
  curatorSlug: string;
  curatorFocus: string;
  date: string;
  time: string;
  title: string;
  location: string;
  description: string;
  registrationUrl?: string;
}

// ========================================
// 🏪 Storefront Types
// ========================================

export interface Storefront {
  id: string;
  bannerImage: string;
  avatar: string;
  name: string;
  focus: string;
  bookCount: number;
  description: string;
  bookCovers: string[];
}

// ========================================
// 📋 List Types
// ========================================

export interface DiverseList {
  id: number;
  title: string;
  reason: string;
  curator: string;
  curatorAvatar: string;
  curatorFocus: string;
  covers: string[];
}

// ========================================
// 🏷️ Topic Types
// ========================================

export interface Topic {
  label: string;
  count: number;
}

// ========================================
// 📊 Carousel Refs
// ========================================

export interface CarouselRefs {
  newBooksRef: React.RefObject<HTMLDivElement>;
  queerBooksRef: React.RefObject<HTMLDivElement>;
  debutBooksRef: React.RefObject<HTMLDivElement>;
  translationsRef: React.RefObject<HTMLDivElement>;
  storefrontsCarouselRef: React.RefObject<HTMLDivElement>;
  diverseListsRef: React.RefObject<HTMLDivElement>;
  genreCarouselRef: React.RefObject<HTMLDivElement>;
  eventsCarouselRef: React.RefObject<HTMLDivElement>;
}
