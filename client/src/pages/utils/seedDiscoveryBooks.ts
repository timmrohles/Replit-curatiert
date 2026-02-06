import { getAllONIXTags } from '../../utils/api';

const API_BASE_URL = '/api';

/**
 * Seeds Discovery Books
 * Creates books optimized for the Tag-Based Discovery Grid
 * Each book has multiple tags from: Zielgruppe, Genre, Feeling, Status
 */
export async function seedDiscoveryBooks(): Promise<boolean> {
  try {
    console.log('🌱 Seeding Discovery Books...');

    // Fetch all ONIX tags first
    const allTags = await getAllONIXTags();
    
    // Helper function to get tag IDs by displayName
    const getTagIds = (displayNames: string[]): string[] => {
      return displayNames
        .map(name => allTags.find(t => t.displayName === name)?.id)
        .filter(Boolean) as string[];
    };

    const discoveryBooks = [
      // ========================================
      // KRIMI + ADRENALIN + ERWACHSENE
      // ========================================
      {
        title: 'Die Schuld der Anderen',
        author: 'Ella Blix',
        publisher: 'Kiepenheuer & Witsch',
        year: '2023',
        isbn: '978-3-462-00123-4',
        coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
        tags: ['Krimi', 'Spannend', 'Erwachsene'],
        onixTagIds: getTagIds([
          'Krimi',
          'Adrenalin & Puls',
          'Erwachsene',
          'Psychothriller',
          'SPIEGEL Bestseller'
        ]),
        availability: 'Verfügbar',
        price: '€ 16,00',
        curatorId: 'curator-001'
      },

      // ========================================
      // FANTASY + TRÄUMEN + YOUNG ADULT
      // ========================================
      {
        title: 'Im Schatten der Silbertürme',
        author: 'Mara Winterfeld',
        publisher: 'Fischer Tor',
        year: '2024',
        isbn: '978-3-596-70612-8',
        coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
        tags: ['Fantasy', 'Young Adult', 'Magie'],
        onixTagIds: getTagIds([
          'Fantasy',
          'Träumen & Schweben',
          'Young Adult',
          'Debüt'
        ]),
        availability: 'Verfügbar',
        price: '€ 18,00',
        curatorId: 'curator-002'
      },

      // ========================================
      // LIEBESROMAN + WEINEN & FÜHLEN + ERWACHSENE
      // ========================================
      {
        title: 'Alle Farben des Sommers',
        author: 'Lena Johannsen',
        publisher: 'Piper',
        year: '2023',
        isbn: '978-3-492-31245-7',
        coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
        tags: ['Liebesroman', 'Emotional', 'Sommer'],
        onixTagIds: getTagIds([
          'Liebesroman',
          'Weinen & Fühlen',
          'Erwachsene',
          'SPIEGEL Bestseller'
        ]),
        availability: 'Verfügbar',
        price: '€ 12,00',
        curatorId: 'curator-003'
      },

      // ========================================
      // HISTORISCHER ROMAN + NACHDENKEN + PREISGEKRÖNT
      // ========================================
      {
        title: 'Berlin, 1936',
        author: 'Thomas Weber',
        publisher: 'Rowohlt',
        year: '2023',
        isbn: '978-3-498-00567-2',
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
        tags: ['Historischer Roman', 'Berlin', '20. Jahrhundert'],
        onixTagIds: getTagIds([
          'Historischer Roman',
          'Nachdenken & Verstehen',
          'Erwachsene',
          'Deutscher Buchpreis',
          'Preisgekrönt'
        ]),
        availability: 'Verfügbar',
        price: '€ 24,00',
        curatorId: 'curator-004'
      },

      // ========================================
      // SCIENCE FICTION + ADRENALIN + YOUNG ADULT
      // ========================================
      {
        title: 'Neonträume',
        author: 'Kim Schneider',
        publisher: 'Heyne',
        year: '2024',
        isbn: '978-3-453-32145-9',
        coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop',
        tags: ['Science Fiction', 'Dystopie', 'Zukunft'],
        onixTagIds: getTagIds([
          'Science Fiction',
          'Adrenalin & Puls',
          'Young Adult',
          'Verfilmt'
        ]),
        availability: 'Verfügbar',
        price: '€ 15,00',
        curatorId: 'curator-005'
      },

      // ========================================
      // HUMOR + LACHEN + ERWACHSENE
      // ========================================
      {
        title: 'Chaos im Kopf',
        author: 'Felix Humboldt',
        publisher: 'KiWi',
        year: '2023',
        isbn: '978-3-462-05432-1',
        coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop',
        tags: ['Humor', 'Unterhaltung', 'Komisch'],
        onixTagIds: getTagIds([
          'Humor',
          'Lachen & Schmunzeln',
          'Erwachsene',
          'SPIEGEL Bestseller'
        ]),
        availability: 'Verfügbar',
        price: '€ 14,00',
        curatorId: 'curator-006'
      },

      // ========================================
      // BIOGRAFIE + NACHDENKEN + ERWACHSENE
      // ========================================
      {
        title: 'Michelle Obama: Ein Leben',
        author: 'Michelle Obama',
        publisher: 'Goldmann',
        year: '2022',
        isbn: '978-3-442-31498-6',
        coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=600&fit=crop',
        tags: ['Biografie', 'Politik', 'Inspiration'],
        onixTagIds: getTagIds([
          'Biografie',
          'Nachdenken & Verstehen',
          'Erwachsene',
          'Preisgekrönt'
        ]),
        availability: 'Verfügbar',
        price: '€ 22,00',
        curatorId: 'curator-007'
      },

      // ========================================
      // KINDER + ENTSPANNEN + FANTASY
      // ========================================
      {
        title: 'Der kleine Drache Kokosnuss',
        author: 'Ingo Siegner',
        publisher: 'cbj',
        year: '2023',
        isbn: '978-3-570-17654-3',
        coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
        tags: ['Kinderbuch', 'Fantasy', 'Abenteuer'],
        onixTagIds: getTagIds([
          'Fantasy',
          'Entspannen & Genießen',
          'Kinder'
        ]),
        availability: 'Verfügbar',
        price: '€ 10,00',
        curatorId: 'curator-008'
      },

      // ========================================
      // PSYCHOTHRILLER + ADRENALIN + ERWACHSENE
      // ========================================
      {
        title: 'Der Fremde in mir',
        author: 'Sarah Klein',
        publisher: 'Blanvalet',
        year: '2024',
        isbn: '978-3-7341-1234-5',
        coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=600&fit=crop',
        tags: ['Psychothriller', 'Spannung', 'Psychologie'],
        onixTagIds: getTagIds([
          'Psychothriller',
          'Adrenalin & Puls',
          'Erwachsene',
          'Debüt'
        ]),
        availability: 'Verfügbar',
        price: '€ 17,00',
        curatorId: 'curator-009'
      },

      // ========================================
      // LESEEINSTEIGER + LACHEN + KINDER
      // ========================================
      {
        title: 'Conni geht zum Zahnarzt',
        author: 'Liane Schneider',
        publisher: 'Carlsen',
        year: '2023',
        isbn: '978-3-551-08765-4',
        coverUrl: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=600&fit=crop',
        tags: ['Kinderbuch', 'Leseeinsteiger', 'Alltag'],
        onixTagIds: getTagIds([
          'Lachen & Schmunzeln',
          'Leseeinsteiger',
          'Kinder'
        ]),
        availability: 'Verfügbar',
        price: '€ 8,00',
        curatorId: 'curator-010'
      },

      // ========================================
      // FANTASY + YOUNG ADULT + VERFILMT
      // ========================================
      {
        title: 'Selection - Die Elite',
        author: 'Kiera Cass',
        publisher: 'Fischer',
        year: '2023',
        isbn: '978-3-596-19678-9',
        coverUrl: 'https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?w=400&h=600&fit=crop',
        tags: ['Fantasy', 'Young Adult', 'Dystopie'],
        onixTagIds: getTagIds([
          'Fantasy',
          'Träumen & Schweben',
          'Young Adult',
          'Verfilmt',
          'SPIEGEL Bestseller'
        ]),
        availability: 'Verfügbar',
        price: '€ 16,00',
        curatorId: 'curator-011'
      },

      // ========================================
      // HISTORISCHER ROMAN + WEINEN & FÜHLEN
      // ========================================
      {
        title: 'Die Nachtigall',
        author: 'Kristin Hannah',
        publisher: 'Aufbau',
        year: '2023',
        isbn: '978-3-7466-3543-2',
        coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop',
        tags: ['Historischer Roman', 'Zweiter Weltkrieg', 'Emotional'],
        onixTagIds: getTagIds([
          'Historischer Roman',
          'Weinen & Fühlen',
          'Erwachsene',
          'Preisgekrönt',
          'Verfilmt'
        ]),
        availability: 'Verfügbar',
        price: '€ 20,00',
        curatorId: 'curator-012'
      },
    ];

    // Save all books
    let successCount = 0;
    for (const book of discoveryBooks) {
      try {
        const response = await fetch(`${API_BASE_URL}/books`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...book,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }),
        });

        if (response.ok) {
          successCount++;
          console.log(`✅ Created book: ${book.title}`);
        } else {
          const error = await response.text();
          console.error(`❌ Failed to create book: ${book.title}`, error);
        }
      } catch (error) {
        console.error(`❌ Error creating book ${book.title}:`, error);
      }
    }

    console.log(`🎉 Successfully created ${successCount}/${discoveryBooks.length} Discovery books!`);
    return successCount === discoveryBooks.length;
  } catch (error) {
    console.error('❌ Error seeding Discovery books:', error);
    return false;
  }
}
