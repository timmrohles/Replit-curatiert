import { savePage, saveMenuItem, saveCurator, saveBook, saveTag, getAllPages, getAllMenuItems, deleteMenuItem } from './api';
import { seedDemoBooksWithONIXTags } from './seedDemoBooks';

export async function seedDemoData() {
  try {
    console.log('🌱 Seeding demo data...');

    // First, check what already exists
    const existingPages = await getAllPages();
    const existingMenuItems = await getAllMenuItems();
    
    const existingPageIds = new Set(existingPages.map(p => p.id));
    const existingMenuIds = new Set(existingMenuItems.map(m => m.id));

    // 🗑️ Remove deprecated menu items
    const deprecatedMenuIds = ['nav-awarded-books'];
    for (const menuId of deprecatedMenuIds) {
      if (existingMenuIds.has(menuId)) {
        console.log(`🗑️ Removing deprecated menu item: ${menuId}`);
        await deleteMenuItem(menuId);
        existingMenuIds.delete(menuId);
      }
    }

    // 1. Create Pages for existing routes
    const pages = [
      // Homepage
      {
        id: 'page-home',
        name: 'Home',
        slug: '',
        title: 'coratiert.de - Kuratierte Bücher',
        description: 'Die Homepage von coratiert.de',
        content: '',
        template: 'default' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // NOTE: /awarded-books is handled by a dedicated static route (AwardedBooksPage)
      // Do NOT create a database entry for this slug, as it would conflict
      // Deutscher Buchpreis (specific award)
      {
        id: 'page-deutscher-buchpreis',
        name: 'Deutscher Buchpreis',
        slug: 'deutscher-buchpreis',
        title: 'Deutscher Buchpreis - Ausgezeichnete Bücher',
        description: 'Die Shortlist und Longlist des Deutschen Buchpreises',
        content: '',
        template: 'custom' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Curators
      {
        id: 'page-curators',
        name: 'Kuratoren',
        slug: 'curators',
        title: 'Unsere Kuratoren',
        description: 'Die Buchkuratoren von coratiert.de',
        content: '',
        template: 'creators' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Lists
      {
        id: 'page-lists',
        name: 'Listen',
        slug: 'lists',
        title: 'Buchlisten',
        description: 'Kuratierte Buchlisten',
        content: '',
        template: 'books' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Events
      {
        id: 'page-events',
        name: 'Events',
        slug: 'events',
        title: 'Events & Veranstaltungen',
        description: 'Buchevents und Lesungen',
        content: '',
        template: 'default' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Shop
      {
        id: 'page-shop',
        name: 'Bücher',
        slug: 'shop',
        title: 'Bücher',
        description: 'Durchstöbern Sie unseren kompletten Buchkatalog',
        content: '',
        template: 'books' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Matching
      {
        id: 'page-matching',
        name: 'Buch-Matching',
        slug: 'matching',
        title: 'Finde dein perfektes Buch',
        description: 'Personalisierte Buchempfehlungen',
        content: '',
        template: 'custom' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Design System
      {
        id: 'page-design-system',
        name: 'Design System',
        slug: 'design-system',
        title: 'Design System',
        description: 'Das coratiert.de Design System',
        content: '',
        template: 'default' as const,
        sectionIds: [],
        enabled: false, // Hidden by default
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Category pages
      {
        id: 'page-neuerscheinungen',
        name: 'Neuerscheinungen',
        slug: 'neuerscheinungen',
        title: 'Neuerscheinungen',
        description: 'Die neuesten Bücher',
        content: '',
        template: 'books' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'page-bestseller',
        name: 'Bestseller',
        slug: 'bestseller',
        title: 'Bestseller',
        description: 'Die beliebtesten Bücher',
        content: '',
        template: 'books' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'page-belletristik',
        name: 'Belletristik',
        slug: 'belletristik',
        title: 'Belletristik',
        description: 'Romane und Erzählungen',
        content: '',
        template: 'books' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'page-sachbuch',
        name: 'Sachbuch',
        slug: 'sachbuch',
        title: 'Sachbuch',
        description: 'Sachbücher und Ratgeber',
        content: '',
        template: 'books' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'page-kinder-jugend',
        name: 'Kinder & Jugend',
        slug: 'kinder-jugend',
        title: 'Kinder & Jugend',
        description: 'Bücher für junge Leser',
        content: '',
        template: 'books' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'page-krimi-thriller',
        name: 'Krimi & Thriller',
        slug: 'krimi-thriller',
        title: 'Krimi & Thriller',
        description: 'Spannende Krimis und Thriller',
        content: '',
        template: 'books' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'page-fantasy-scifi',
        name: 'Fantasy & Science Fiction',
        slug: 'fantasy-scifi',
        title: 'Fantasy & Science Fiction',
        description: 'Fantastische Welten und Zukunftsvisionen',
        content: '',
        template: 'books' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Legal pages
      {
        id: 'page-impressum',
        name: 'Impressum',
        slug: 'impressum',
        title: 'Impressum',
        description: 'Angaben gemäß § 5 TMG',
        content: '',
        template: 'default' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'page-datenschutz',
        name: 'Datenschutz',
        slug: 'datenschutz',
        title: 'Datenschutzerklärung',
        description: 'Informationen zum Datenschutz',
        content: '',
        template: 'default' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'page-agb',
        name: 'AGB',
        slug: 'agb',
        title: 'Allgemeine Geschäftsbedingungen',
        description: 'Unsere Geschäftsbedingungen',
        content: '',
        template: 'default' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Additional useful pages
      {
        id: 'page-ueber-uns',
        name: 'Über uns',
        slug: 'ueber-uns',
        title: 'Über coratiert.de',
        description: 'Wer wir sind und was wir machen',
        content: '',
        template: 'default' as const,
        sectionIds: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Save all pages
    for (const page of pages) {
      if (!existingPageIds.has(page.id)) {
        await savePage(page);
        console.log(`✅ Page created: ${page.name}`);
      } else {
        console.log(`✅ Page already exists: ${page.name}`);
      }
    }

    // 2. Create some demo menu items with page assignments
    const menuItems = [
      {
        id: 'nav-neuerscheinungen',
        name: 'Neuerscheinungen',
        order: 2,
        enabled: true,
        pageId: 'page-neuerscheinungen',
        subcategories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'nav-kategorien',
        name: 'Kategorien',
        order: 3,
        enabled: true,
        subcategories: [
          {
            title: 'Literaturpreise',
            items: ['Deutscher Buchpreis', 'Booker Prize', 'Pulitzer Prize'],
            visible: true,
            pageId: 'page-deutscher-buchpreis'
          },
          {
            title: 'Nach Genre',
            items: ['Belletristik', 'Sachbuch', 'Krimi & Thriller', 'Fantasy & SciFi'],
            visible: true,
            pageId: 'page-belletristik'
          },
          {
            title: 'Nach Alter',
            items: ['Kinder & Jugend', 'Erwachsene'],
            visible: true,
            pageId: 'page-kinder-jugend'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'nav-listen',
        name: 'Listen',
        order: 4,
        enabled: true,
        pageId: 'page-lists',
        subcategories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'nav-creators',
        name: 'Kuratoren',
        order: 5,
        enabled: true,
        pageId: 'page-curators',
        subcategories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'nav-events',
        name: 'Events',
        order: 6,
        enabled: true,
        pageId: 'page-events',
        subcategories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'nav-shop',
        name: 'Bücher',
        order: 7,
        enabled: true,
        pageId: 'page-shop',
        subcategories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const item of menuItems) {
      if (!existingMenuIds.has(item.id)) {
        await saveMenuItem(item);
        console.log(`✅ Menu item created: ${item.name}`);
      } else {
        // Update existing menu items to reflect changes
        await saveMenuItem(item);
        console.log(`✅ Menu item updated: ${item.name}`);
      }
    }

    // 3. Seed demo books with ONIX tags
    await seedDemoBooksWithONIXTags();

    console.log('✅ Demo data seeded successfully!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    return { success: false, error: String(error) };
  }
}