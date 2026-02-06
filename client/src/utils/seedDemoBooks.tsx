import { saveBook, saveONIXTag, getAllONIXTags } from './api';

/**
 * Seed Demo Books with ONIX Tags
 * Creates sample books with proper ONIX tag assignments
 */
export async function seedDemoBooksWithONIXTags() {
  try {
    console.log('📚 Seeding demo books with ONIX tags...');

    // Get existing ONIX tags
    const onixTags = await getAllONIXTags();
    
    // Helper function to find tag ID by display name
    const findTagId = (displayName: string) => {
      const tag = onixTags.find(t => t.displayName === displayName);
      return tag?.id;
    };

    // Demo Book 1: Award-winning literary fiction
    const book1 = {
      id: 'demo-book-1',
      title: 'Die Hauptstadt',
      author: 'Robert Menasse',
      publisher: 'Suhrkamp',
      year: '2017',
      isbn: '978-3518427521',
      coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      price: '€24,00',
      tags: [], // Deprecated
      onixTagIds: [
        findTagId('Shortlist Buchpreis 2025'),
        findTagId('Sprachgewaltig'),
        findTagId('Intellektuelle Tiefe'),
        findTagId('Spielt in Berlin')
      ].filter(Boolean) as string[],
      availability: 'Verfügbar',
      curatorId: '',
      // 🎯 MOCK SORTING DATA
      followCount: 342, // Sehr beliebt
      awards: 3, // Deutscher Buchpreis + 2 weitere
      reviewCount: 28, // Viele Kritiken
      shortlists: 5,
      longlists: 2,
      releaseDate: '2017-09-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Demo Book 2: Translated work with critical acclaim
    const book2 = {
      id: 'demo-book-2',
      title: 'Betrachtungen über die Natur',
      author: 'Annie Dillard',
      publisher: 'Hanser',
      year: '2024',
      isbn: '978-3446280000',
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      price: '€26,00',
      tags: [], // Deprecated
      onixTagIds: [
        findTagId('Im Literarischen Quartett'),
        findTagId('Emotionale Wucht'),
        findTagId('Aus dem Amerikanischen')
      ].filter(Boolean) as string[],
      availability: 'Verfügbar',
      curatorId: '',
      // 🎯 MOCK SORTING DATA
      followCount: 156, // Mittel-beliebt
      awards: 0, // Noch keine Preise
      reviewCount: 42, // SEHR viele Kritiken (Kritiker-Liebling!)
      shortlists: 8, // Viele Nominierungen
      longlists: 4,
      releaseDate: '2024-11-08', // Sehr aktuell!
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Demo Book 3: Beautiful edition crime novel
    const book3 = {
      id: 'demo-book-3',
      title: 'Mitternachtsbibliothek',
      author: 'Matt Haig',
      publisher: 'dtv',
      year: '2023',
      isbn: '978-3423282000',
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
      price: '€22,00',
      tags: [], // Deprecated
      onixTagIds: [
        findTagId('Leineneinband'),
        findTagId('Lesebändchen'),
        findTagId('Atmosphärisch dicht')
      ].filter(Boolean) as string[],
      availability: 'Bestellbar',
      curatorId: '',
      // 🎯 MOCK SORTING DATA
      followCount: 89, // Weniger bekannt
      awards: 1, // Ein Award
      reviewCount: 12, // Weniger Kritiken
      shortlists: 12, // Viele Shortlists
      longlists: 7, // Viele Longlists
      releaseDate: '2023-03-22', // Älter
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 🔥 Demo Book 4: Hidden Gem Champion (viele Nominierungen, kein Preis)
    const book4 = {
      id: 'demo-book-4',
      title: 'Im Schatten des Windes',
      author: 'Carlos Ruiz Zafón',
      publisher: 'S. Fischer',
      year: '2022',
      isbn: '978-3100024000',
      coverUrl: 'https://images.unsplash.com/photo-1509266272358-7701da638078?w=400',
      price: '€25,00',
      tags: [],
      onixTagIds: [
        findTagId('Atmosphärisch dicht'),
        findTagId('Spannung')
      ].filter(Boolean) as string[],
      availability: 'Verfügbar',
      curatorId: '',
      // 🎯 HIDDEN GEM PROFIL
      followCount: 45, // Wenig bekannt
      awards: 0, // KEIN Award (wichtig für Hidden Gem!)
      reviewCount: 8,
      shortlists: 15, // SEHR viele Shortlists
      longlists: 9, // SEHR viele Longlists
      releaseDate: '2022-08-14',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 📚 Demo Book 5: Popularity King (viral auf Plattform)
    const book5 = {
      id: 'demo-book-5',
      title: 'Das Café am Rande der Welt',
      author: 'John Strelecky',
      publisher: 'dtv',
      year: '2024',
      isbn: '978-3423345000',
      coverUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
      price: '€16,90',
      tags: [],
      onixTagIds: [
        findTagId('Emotionale Wucht')
      ].filter(Boolean) as string[],
      availability: 'Verfügbar',
      curatorId: '',
      // 🎯 POPULARITY PROFIL
      followCount: 892, // SEHR SEHR beliebt (Platz 1!)
      awards: 0,
      reviewCount: 34,
      shortlists: 3,
      longlists: 1,
      releaseDate: '2024-01-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 🏆 Demo Book 6: Award Powerhouse
    const book6 = {
      id: 'demo-book-6',
      title: 'Tauben fliegen auf',
      author: 'Melinda Nadj Abonji',
      publisher: 'Jung und Jung',
      year: '2020',
      isbn: '978-3990270000',
      coverUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
      price: '€24,00',
      tags: [],
      onixTagIds: [
        findTagId('Shortlist Buchpreis 2025'),
        findTagId('Sprachgewaltig')
      ].filter(Boolean) as string[],
      availability: 'Verfügbar',
      curatorId: '',
      // 🎯 AWARD PROFIL
      followCount: 234,
      awards: 7, // MEISTE Preise (Platz 1 bei Awards!)
      reviewCount: 31,
      shortlists: 4,
      longlists: 2,
      releaseDate: '2020-10-03',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // ⏰ Demo Book 7: Brandneu (Trending)
    const book7 = {
      id: 'demo-book-7',
      title: 'Morgen ist gestern',
      author: 'Judith Hermann',
      publisher: 'S. Fischer',
      year: '2025',
      isbn: '978-3100024123',
      coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400',
      price: '€23,00',
      tags: [],
      onixTagIds: [
        findTagId('Intellektuelle Tiefe')
      ].filter(Boolean) as string[],
      availability: 'Vorbestellung',
      curatorId: '',
      // 🎯 TRENDING PROFIL
      followCount: 67,
      awards: 0,
      reviewCount: 3, // Noch wenig Rezensionen (neu!)
      shortlists: 0,
      longlists: 0,
      releaseDate: '2025-01-05', // NEUESTE Buch (Platz 1 bei Trending!)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 📰 Demo Book 8: Kritiker-Darling
    const book8 = {
      id: 'demo-book-8',
      title: 'Die Jahre',
      author: 'Annie Ernaux',
      publisher: 'Suhrkamp',
      year: '2021',
      isbn: '978-3518470000',
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
      price: '€22,00',
      tags: [],
      onixTagIds: [
        findTagId('Im Literarischen Quartett'),
        findTagId('Aus dem Amerikanischen')
      ].filter(Boolean) as string[],
      availability: 'Verfügbar',
      curatorId: '',
      // 🎯 CRITICS PROFIL
      followCount: 178,
      awards: 2,
      reviewCount: 56, // MEISTE Rezensionen (Platz 1 bei Kritiker-Lieblinge!)
      shortlists: 6,
      longlists: 3,
      releaseDate: '2021-05-20',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save books
    const books = [book1, book2, book3, book4, book5, book6, book7, book8];
    for (const book of books) {
      console.log(`📖 Creating demo book: ${book.title}`);
      await saveBook(book);
    }

    console.log('✅ Demo books with ONIX tags created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding demo books:', error);
    return false;
  }
}