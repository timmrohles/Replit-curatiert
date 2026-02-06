import { useEffect } from 'react';

interface Book {
  id: number;
  title: string;
  author: string;
  cover?: string;
  year?: string;
  isbn?: string;
  description?: string;
  publisher?: string;
  genre?: string;
  rating?: number;
  reviewCount?: number;
}

interface BookSchemaProps {
  book: Book;
}

export function BookSchema({ book }: BookSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "author": {
      "@type": "Person",
      "name": book.author
    },
    ...(book.isbn && { "isbn": book.isbn }),
    ...(book.description && { "description": book.description }),
    ...(book.cover && { "image": book.cover }),
    ...(book.year && { "datePublished": book.year }),
    ...(book.publisher && {
      "publisher": {
        "@type": "Organization",
        "name": book.publisher
      }
    }),
    ...(book.genre && { "genre": book.genre })
    // Rating entfernt - qualitatives Bewertungssystem ohne numerisches Rating
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ReviewSchemaProps {
  bookTitle: string;
  reviewBody: string;
  rating?: number;
  author?: string;
  datePublished?: string;
}

export function ReviewSchema({ bookTitle, reviewBody, rating, author, datePublished }: ReviewSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "Book",
      "name": bookTitle
    },
    "reviewBody": reviewBody,
    ...(rating && {
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": rating,
        "bestRating": 5,
        "worstRating": 1
      }
    }),
    ...(author && {
      "author": {
        "@type": "Person",
        "name": author
      }
    }),
    ...(datePublished && { "datePublished": datePublished })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ItemListSchemaProps {
  name: string;
  description?: string;
  items: Array<{
    position: number;
    name: string;
    url?: string;
    image?: string;
  }>;
  listType?: 'shortlist' | 'longlist' | 'winners';
}

export function ItemListSchema({ name, description, items, listType }: ItemListSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": name,
    ...(description && { "description": description }),
    "numberOfItems": items.length,
    "itemListElement": items.map((item) => ({
      "@type": "ListItem",
      "position": item.position,
      "name": item.name,
      ...(item.url && { "url": item.url }),
      ...(item.image && { "image": item.image })
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface OrganizationSchemaProps {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

export function OrganizationSchema({ name, url, logo, description, sameAs }: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": name,
    "url": url,
    ...(logo && { "logo": logo }),
    ...(description && { "description": description }),
    ...(sameAs && { "sameAs": sameAs })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebPageSchemaProps {
  name: string;
  description?: string;
  url: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function WebPageSchema({ name, description, url, breadcrumbs }: WebPageSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": name,
    "url": url,
    ...(description && { "description": description }),
    ...(breadcrumbs && breadcrumbs.length > 0 && {
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
