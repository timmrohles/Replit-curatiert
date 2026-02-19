/**
 * BOOKS API
 * ===========
 * CRUD operations for books
 */

import { API_BASE_URL, getAdminAuthHeaders, safeJsonParse, type ApiResponse } from './config';
import { BookSchema, validateData, validateArray, type Book } from '../apiSchemas';

// ============================================
// TYPES
// ============================================

// ✅ TYPE SAFETY: Book type is now inferred from Zod schema
export type { Book } from '../apiSchemas';

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getAllBooks(): Promise<Book[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/books`, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.info('ℹ️ Books API not available, using mock data');
      const mockData = getMockBooksWithTags();
      console.log('📚 Using mock books data:', mockData.length, 'books');
      return mockData;
    }
    
    const result: ApiResponse<Book[]> = await response.json();
    
    // If no books from backend, return mock data with ONIX tags
    if (!result.data || result.data.length === 0) {
      const mockData = getMockBooksWithTags();
      console.log('📚 No books in database yet.');
      console.log('💡 TIP: Go to /sys-mgmt-xK9/login to add books via Admin Panel');
      console.log('📚 Using mock books data:', mockData.length, 'books');
      return mockData;
    }
    
    // ✅ VALIDATION: Validate books array with Zod
    const validatedBooks = validateArray(BookSchema, result.data);
    console.log('✅ Loaded', validatedBooks.length, 'books from database');
    return validatedBooks;
  } catch (error) {
    // Silent fallback - this is expected when server is not running
    const mockData = getMockBooksWithTags();
    console.info('ℹ️ Using local book data');
    return mockData;
  }
}

export async function getBook(id: string): Promise<Book | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
          credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await safeJsonParse<Book>(response);
    
    // ✅ VALIDATION: Validate book with Zod
    if (result?.data) {
      return validateData(BookSchema, result.data, null);
    }
    return null;
  } catch (error) {
    // Silent fallback
    return null;
  }
}

// Alias for consistency
export const getBookById = getBook;
export const getBooks = getAllBooks; // Alias for consistency

// ⚡ PERFORMANCE: Batch-fetch multiple books at once
export async function getBooksBatch(ids: string[]): Promise<Book[]> {
  try {
    if (ids.length === 0) return [];
    
    const response = await fetch(`${API_BASE_URL}/books/batch`, {
          credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    const result: ApiResponse<Book[]> = await response.json();
    return result.data || [];
  } catch (error) {
    // Silent fallback
    return [];
  }
}

export async function saveBook(book: Book): Promise<Book | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/books`, {
      method: 'POST',
      credentials: 'include',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(book),
    });
    const result: ApiResponse<Book> = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error saving book:', error);
    return null;
  }
}

// ============================================
// FILE UPLOADS
// ============================================

export async function uploadBookCover(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/books/upload-cover`, {
          credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: formData,
    });
    
    const result: any = await response.json();
    
    if (!result.success) {
      console.error('Book cover upload failed:', result.error, result.details);
      throw new Error(result.error || 'Upload failed');
    }
    
    return result.url;
  } catch (error) {
    console.error('Error uploading book cover:', error);
    throw error;
  }
}

// ============================================
// MOCK DATA - Development fallback
// ============================================

function getMockBooksWithTags(): Book[] {
  return [
    {
      id: 'mock-1',
      title: 'Die unendliche Geschichte',
      author: 'Michael Ende',
      isbn: '9783522202305',
      coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      publisher: 'Thienemann-Esslinger',
      year: '1979',
      price: '19,99 €',
      newPrice: '19,99 €',
      usedPrice: '8,99 €',
      tags: ['Fantasy', 'Jugendbuch', 'Abenteuer'],
      onixTagIds: ['genre-fantasy', 'zielgruppe-jugend', 'feeling-abenteuer', 'motiv-freundschaft'],
      availability: 'lieferbar',
      curatorId: 'curator-1',
      shortDescription: 'Ein Junge wird selbst zum Helden der magischen Geschichte, die er liest.',
      klappentext: 'Bastian Balthasar Bux entdeckt in einem Antiquariat ein geheimnisvolles Buch. Es ist die Geschichte des Phantásischen Reiches, das vom Nichts bedroht wird. Nur ein Menschenkind kann Phantásien retten – und bald wird Bastian selbst zum Helden dieser magischen Welt.',
      onix: {
        subtitle: 'Von Phantásien und der Macht der Geschichten',
        bookWorld: 'belletristik',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      title: 'Der Herr der Ringe',
      author: 'J.R.R. Tolkien',
      isbn: '9783608938043',
      coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
      publisher: 'Klett-Cotta',
      year: '1954',
      price: '29,99 €',
      newPrice: '29,99 €',
      usedPrice: '12,50 €',
      tags: ['Fantasy', 'Klassiker', 'Abenteuer'],
      onixTagIds: ['genre-fantasy', 'feeling-abenteuer', 'motiv-freundschaft', 'auszeichnung-bestseller'],
      availability: 'lieferbar',
      curatorId: 'curator-1',
      shortDescription: 'Ein Hobbit und seine Gefährten müssen einen mächtigen Ring zerstören, um die Welt zu retten.',
      klappentext: 'Im Auenland findet der Hobbit Frodo einen Ring, der die Macht hat, die Welt zu vernichten. Gemeinsam mit der Gefährtenschaft muss er den Ring zum Schicksalsberg bringen, um ihn zu zerstören. Ein episches Abenteuer zwischen Gut und Böse beginnt.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-3',
      title: 'Harry Potter und der Stein der Weisen',
      author: 'J.K. Rowling',
      isbn: '9783551551672',
      coverUrl: 'https://images.unsplash.com/photo-1607948937289-5ca19c59e70f?w=400',
      publisher: 'Carlsen',
      year: '1997',
      price: '14,99 €',
      newPrice: '14,99 €',
      usedPrice: '6,99 €',
      tags: ['Fantasy', 'Jugendbuch', 'Magie'],
      onixTagIds: ['genre-fantasy', 'zielgruppe-jugend', 'feeling-abenteuer', 'serie-harry-potter'],
      availability: 'lieferbar',
      curatorId: 'curator-2',
      shortDescription: 'Ein Junge entdeckt, dass er ein Zauberer ist und besucht eine magische Schule.',
      klappentext: 'Harry Potter erfährt an seinem elften Geburtstag, dass er ein Zauberer ist. Er wird in die Hogwarts-Schule für Hexerei und Zauberei aufgenommen, wo er Freunde findet und das Geheimnis um den Stein der Weisen entdeckt.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-4',
      title: 'Der kleine Prinz',
      author: 'Antoine de Saint-Exupéry',
      isbn: '9783792000014',
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      publisher: 'Karl Rauch Verlag',
      year: '1943',
      price: '12,99 €',
      newPrice: '12,99 €',
      usedPrice: '5,49 €',
      tags: ['Klassiker', 'Kinderbuch', 'Philosophie'],
      onixTagIds: ['genre-klassiker', 'zielgruppe-kinder', 'feeling-philosophisch', 'motiv-freundschaft'],
      availability: 'lieferbar',
      curatorId: 'curator-1',
      shortDescription: 'Eine zeitlose Geschichte über Freundschaft und die wirklich wichtigen Dinge im Leben.',
      klappentext: 'Ein Pilot strandet in der Wüste und trifft auf den kleinen Prinzen von einem fernen Asteroiden. Durch dessen Erzählungen über seine Reisen lernt er über Freundschaft, Liebe und die wichtigen Dinge im Leben.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-5',
      title: 'Die Verwandlung',
      author: 'Franz Kafka',
      isbn: '9783596521579',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      publisher: 'Fischer',
      year: '1915',
      price: '9,99 €',
      newPrice: '9,99 €',
      usedPrice: '3,99 €',
      tags: ['Klassiker', 'Literatur', 'Philosophie'],
      onixTagIds: ['genre-klassiker', 'feeling-philosophisch', 'stil-avantgarde', 'zeitgeist-modern'],
      availability: 'lieferbar',
      curatorId: 'curator-3',
      shortDescription: 'Ein Mann erwacht als Käfer – eine verstörende Parabel über Entfremdung und Identität.',
      klappentext: 'Gregor Samsa erwacht eines Morgens als Ungeziefer. Diese absurde Verwandlung stellt sein gesamtes Leben, seine Familie und seine Existenz in Frage. Eine beklemmende Parabel über Entfremdung und Isolation.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-6',
      title: 'Percy Jackson - Diebe im Olymp',
      author: 'Rick Riordan',
      isbn: '9783551556745',
      coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
      publisher: 'Carlsen',
      year: '2005',
      price: '16,99 €',
      newPrice: '16,99 €',
      usedPrice: '7,95 €',
      tags: ['Fantasy', 'Jugendbuch', 'Mythologie'],
      onixTagIds: ['genre-fantasy', 'zielgruppe-jugend', 'feeling-abenteuer', 'serie-percy-jackson'],
      availability: 'lieferbar',
      curatorId: 'curator-2',
      shortDescription: 'Ein Teenager erfährt, dass er der Sohn eines griechischen Gottes ist.',
      klappentext: 'Percy Jackson entdeckt, dass er ein Halbgott ist – Sohn des Poseidon. Als Zeus\' Blitz gestohlen wird, muss Percy beweisen, dass er unschuldig ist und das mächtigste Artefakt der Götter zurückbringen.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-7',
      title: 'Der Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '9783608960495',
      coverUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400',
      publisher: 'Klett-Cotta',
      year: '1937',
      price: '18,99 €',
      newPrice: '18,99 €',
      usedPrice: '9,95 €',
      tags: ['Fantasy', 'Abenteuer', 'Klassiker'],
      onixTagIds: ['genre-fantasy', 'feeling-abenteuer', 'motiv-freundschaft', 'auszeichnung-klassiker'],
      availability: 'lieferbar',
      curatorId: 'curator-1',
      shortDescription: 'Ein Hobbit bricht auf zu einem großen Abenteuer mit Zwergen und einem Drachen.',
      klappentext: 'Bilbo Beutlin führt ein gemütliches Leben im Auenland, bis der Zauberer Gandalf mit dreizehn Zwergen auftaucht. Gemeinsam ziehen sie aus, um den Schatz des Drachen Smaug zurückzuerobern.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-8',
      title: 'Das Parfum',
      author: 'Patrick Süskind',
      isbn: '9783257228007',
      coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
      publisher: 'Diogenes',
      year: '1985',
      price: '15,99 €',
      newPrice: '15,99 €',
      usedPrice: '7,49 €',
      tags: ['Roman', 'Thriller', 'Literatur'],
      onixTagIds: ['genre-thriller', 'feeling-spannend', 'stil-literarisch', 'auszeichnung-bestseller'],
      availability: 'lieferbar',
      curatorId: 'curator-3',
      shortDescription: 'Ein Mann mit außergewöhnlichem Geruchssinn wird zum Mörder auf der Suche nach dem perfekten Duft.',
      klappentext: 'Jean-Baptiste Grenouille wird im Paris des 18. Jahrhunderts geboren und besitzt einen übernatürlichen Geruchssinn. Seine Obsession für den perfekten Duft führt ihn auf einen mörderischen Weg.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}