// ============================================================================
// Page Resolve Service - Mock + Remote Data Layer
// ============================================================================

import { PageResolveResponse } from "../types/page-resolve";
import { normalizeSections } from "../types/normalize";

// ============================================================================
// Feature Flag: USE_MOCK
// ============================================================================
const USE_MOCK = true; // ✅ Auf false setzen um auf Backend umzuschalten

// ============================================================================
// Mock Data für path="/"
// ============================================================================
export function getMockPageResolve(path: string): PageResolveResponse {
  // Nur "/" ist aktuell gemockt
  if (path !== "/") {
    return {
      ok: false,
      path,
      error: {
        code: "NOT_FOUND",
        message: `Mock data not available for path: ${path}`,
      },
    };
  }

  return {
    ok: true,
    path: "/",
    page: {
      id: 1,
      slug: "/",
      title: "coratiert – Ausgezeichnete Bücher",
      seo: {
        title: "coratiert",
        description: "Entdecke ausgezeichnete Bücher, kuratiert von Expert*innen",
        keywords: ["Bücher", "Literatur", "Buchempfehlungen", "Auszeichnungen"],
      },
      status: "published",
    },
    layout: {
      id: 1,
      name: "homepage-layout",
      zones: {
        header: [],
        aboveFold: [],
        main: [
          // ========================================
          // Section A: Category Grid
          // ========================================
          {
            id: 1,
            zone: "main",
            sortOrder: 1,
            type: "category_grid",
            section_type: "category_grid",
            config: {
              title: "Was möchtest du lesen?",
            },
            items: [
              {
                id: 1,
                sortOrder: 1,
                itemType: "category_card",
                data: {
                  title: "Belletristik",
                },
                target: {
                  type: "category",
                  category: {
                    id: 1,
                    slug: "belletristik",
                    name: "Belletristik",
                  },
                },
              },
              {
                id: 2,
                sortOrder: 2,
                itemType: "category_card",
                data: {
                  title: "Sachbuch",
                },
                target: {
                  type: "category",
                  category: {
                    id: 2,
                    slug: "sachbuch",
                    name: "Sachbuch",
                  },
                },
              },
              {
                id: 3,
                sortOrder: 3,
                itemType: "category_card",
                data: {
                  title: "Ratgeber",
                },
                target: {
                  type: "category",
                  category: {
                    id: 3,
                    slug: "ratgeber",
                    name: "Ratgeber",
                  },
                },
              },
              {
                id: 4,
                sortOrder: 4,
                itemType: "category_card",
                data: {
                  title: "Kinder & Jugend",
                },
                target: {
                  type: "category",
                  category: {
                    id: 4,
                    slug: "kinder-jugend",
                    name: "Kinder & Jugend",
                  },
                },
              },
              {
                id: 5,
                sortOrder: 5,
                itemType: "category_card",
                data: {
                  title: "Reise",
                },
                target: {
                  type: "category",
                  category: {
                    id: 5,
                    slug: "reise",
                    name: "Reise",
                  },
                },
              },
              {
                id: 6,
                sortOrder: 6,
                itemType: "category_card",
                data: {
                  title: "Lifestyle",
                },
                target: {
                  type: "category",
                  category: {
                    id: 6,
                    slug: "lifestyle",
                    name: "Lifestyle",
                  },
                },
              },
            ],
          },
          // ========================================
          // Section B: Recipient Category Grid
          // ========================================
          {
            id: 2,
            zone: "main",
            sortOrder: 2,
            type: "recipient_category_grid",
            section_type: "recipient_category_grid",
            config: {
              title: "Für wen suchst du ein Buch?",
            },
            items: [
              {
                id: 7,
                sortOrder: 1,
                itemType: "category_card",
                data: {
                  title: "Wissbegierige",
                },
                target: {
                  type: "tag",
                  tag: {
                    id: 1,
                    slug: "wissbegierige",
                    name: "Wissbegierige",
                    tagType: "audience",
                  },
                },
              },
              {
                id: 8,
                sortOrder: 2,
                itemType: "category_card",
                data: {
                  title: "Weltverbesserer",
                },
                target: {
                  type: "tag",
                  tag: {
                    id: 2,
                    slug: "weltverbesserer",
                    name: "Weltverbesserer",
                    tagType: "audience",
                  },
                },
              },
              {
                id: 9,
                sortOrder: 3,
                itemType: "category_card",
                data: {
                  title: "Kids & Teens",
                },
                target: {
                  type: "tag",
                  tag: {
                    id: 3,
                    slug: "kids-teens",
                    name: "Kids & Teens",
                    tagType: "audience",
                  },
                },
              },
              {
                id: 10,
                sortOrder: 4,
                itemType: "category_card",
                data: {
                  title: "Kreative",
                },
                target: {
                  type: "tag",
                  tag: {
                    id: 4,
                    slug: "kreative",
                    name: "Kreative",
                    tagType: "audience",
                  },
                },
              },
              {
                id: 11,
                sortOrder: 5,
                itemType: "category_card",
                data: {
                  title: "Genießer",
                },
                target: {
                  type: "tag",
                  tag: {
                    id: 5,
                    slug: "geniesser",
                    name: "Genießer",
                    tagType: "audience",
                  },
                },
              },
              {
                id: 12,
                sortOrder: 6,
                itemType: "category_card",
                data: {
                  title: "Indie-Fans",
                },
                target: {
                  type: "tag",
                  tag: {
                    id: 6,
                    slug: "indie-fans",
                    name: "Indie-Fans",
                    tagType: "audience",
                  },
                },
              },
            ],
          },
          // ========================================
          // Section C: Topic Tags Grid
          // ========================================
          {
            id: 3,
            zone: "main",
            sortOrder: 3,
            type: "topic_tags_grid",
            section_type: "topic_tags_grid",
            config: {
              title: "Themenschwerpunkte",
            },
            items: [
              // Topics
              {
                id: 13,
                sortOrder: 1,
                itemType: "tag_pill",
                data: { label: "Intersektionalität" },
                target: {
                  type: "tag",
                  tag: {
                    id: 7,
                    slug: "intersektionalitaet",
                    name: "Intersektionalität",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 14,
                sortOrder: 2,
                itemType: "tag_pill",
                data: { label: "Klimagerechtigkeit" },
                target: {
                  type: "tag",
                  tag: {
                    id: 8,
                    slug: "klimagerechtigkeit",
                    name: "Klimagerechtigkeit",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 15,
                sortOrder: 3,
                itemType: "tag_pill",
                data: { label: "Antirassismus" },
                target: {
                  type: "tag",
                  tag: {
                    id: 9,
                    slug: "antirassismus",
                    name: "Antirassismus",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 16,
                sortOrder: 4,
                itemType: "tag_pill",
                data: { label: "Klassismus" },
                target: {
                  type: "tag",
                  tag: {
                    id: 10,
                    slug: "klassismus",
                    name: "Klassismus",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 17,
                sortOrder: 5,
                itemType: "tag_pill",
                data: { label: "Queer" },
                target: {
                  type: "tag",
                  tag: {
                    id: 11,
                    slug: "queer",
                    name: "Queer",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 18,
                sortOrder: 6,
                itemType: "tag_pill",
                data: { label: "Utopien" },
                target: {
                  type: "tag",
                  tag: {
                    id: 12,
                    slug: "utopien",
                    name: "Utopien",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 19,
                sortOrder: 7,
                itemType: "tag_pill",
                data: { label: "Nature Writing" },
                target: {
                  type: "tag",
                  tag: {
                    id: 13,
                    slug: "nature-writing",
                    name: "Nature Writing",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 20,
                sortOrder: 8,
                itemType: "tag_pill",
                data: { label: "Dark Academia" },
                target: {
                  type: "tag",
                  tag: {
                    id: 14,
                    slug: "dark-academia",
                    name: "Dark Academia",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 21,
                sortOrder: 9,
                itemType: "tag_pill",
                data: { label: "Achtsamkeit" },
                target: {
                  type: "tag",
                  tag: {
                    id: 15,
                    slug: "achtsamkeit",
                    name: "Achtsamkeit",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 22,
                sortOrder: 10,
                itemType: "tag_pill",
                data: { label: "Slow Living" },
                target: {
                  type: "tag",
                  tag: {
                    id: 16,
                    slug: "slow-living",
                    name: "Slow Living",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 23,
                sortOrder: 11,
                itemType: "tag_pill",
                data: { label: "True Crime" },
                target: {
                  type: "tag",
                  tag: {
                    id: 17,
                    slug: "true-crime",
                    name: "True Crime",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 24,
                sortOrder: 12,
                itemType: "tag_pill",
                data: { label: "Globaler Süden" },
                target: {
                  type: "tag",
                  tag: {
                    id: 18,
                    slug: "globaler-sueden",
                    name: "Globaler Süden",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 25,
                sortOrder: 13,
                itemType: "tag_pill",
                data: { label: "Regionales" },
                target: {
                  type: "tag",
                  tag: {
                    id: 19,
                    slug: "regionales",
                    name: "Regionales",
                    tagType: "topic",
                  },
                },
              },
              {
                id: 26,
                sortOrder: 14,
                itemType: "tag_pill",
                data: { label: "Debüt" },
                target: {
                  type: "tag",
                  tag: {
                    id: 20,
                    slug: "debuet",
                    name: "Debüt",
                    tagType: "topic",
                  },
                },
              },
              // Features
              {
                id: 27,
                sortOrder: 15,
                itemType: "tag_pill",
                data: { label: "Farbschnitt" },
                target: {
                  type: "tag",
                  tag: {
                    id: 21,
                    slug: "farbschnitt",
                    name: "Farbschnitt",
                    tagType: "feature",
                  },
                },
              },
              {
                id: 28,
                sortOrder: 16,
                itemType: "tag_pill",
                data: { label: "Illustriert" },
                target: {
                  type: "tag",
                  tag: {
                    id: 22,
                    slug: "illustriert",
                    name: "Illustriert",
                    tagType: "feature",
                  },
                },
              },
              {
                id: 29,
                sortOrder: 17,
                itemType: "tag_pill",
                data: { label: "Leinen" },
                target: {
                  type: "tag",
                  tag: {
                    id: 23,
                    slug: "leinen",
                    name: "Leinen",
                    tagType: "feature",
                  },
                },
              },
              // Publisher Cluster
              {
                id: 30,
                sortOrder: 18,
                itemType: "tag_pill",
                data: { label: "Indie" },
                target: {
                  type: "tag",
                  tag: {
                    id: 24,
                    slug: "indie",
                    name: "Indie",
                    tagType: "publisher_cluster",
                  },
                },
              },
            ],
          },
        ],
        footer: [],
      },
    },
    breadcrumbs: [],
    meta: {
      version: 1,
      lastModified: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Remote Data Fetch
// ============================================================================

/**
 * Transform flat sections array into layout.zones structure
 */
function toLayoutZonesFromFlatSections(sections: any[]) {
  const zones: Record<string, any[]> = { header: [], aboveFold: [], main: [], footer: [] };

  for (const s of sections) {
    // normalizeSection() sollte zone bereits auf UI keys mappen: header/aboveFold/main/footer
    const z = s.zone ?? "main";
    if (!zones[z]) zones[z] = [];
    zones[z].push(s);
  }

  // sort within zones
  for (const key of Object.keys(zones)) {
    zones[key] = zones[key].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  return { zones };
}

export async function getRemotePageResolve(path: string): Promise<PageResolveResponse> {
  try {
    const url = `/api/pages/resolve?path=${encodeURIComponent(path)}&includeDraft=true`;

    // ✅ ADD TIMEOUT: Prevent browser hanging if server doesn't respond
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for page resolve
    
    const response = await fetch(url, {
      headers: {
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const raw: any = await response.json();

    // ✅ Handle backend variants:
    // A) raw.layout.zones already present
    // B) raw.sections as flat array
    // C) raw.page + raw.sections
    const flatSections = Array.isArray(raw.sections)
      ? raw.sections
      : Array.isArray(raw.page?.sections)
        ? raw.page.sections
        : null;

    if (flatSections) {
      const normalized = normalizeSections(flatSections);
      raw.layout = toLayoutZonesFromFlatSections(normalized);
      // optional: keep raw.sections in normalized form too
      raw.sections = normalized;
    } else if (raw.layout?.zones) {
      // normalize each zone if backend already returns layout
      const zones = raw.layout.zones;
      for (const zoneKey of Object.keys(zones)) {
        zones[zoneKey] = normalizeSections(zones[zoneKey]);
      }
      raw.layout = { zones };
    }

    return raw as PageResolveResponse;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("⏱️ Page Resolve: Request timeout after 15s for path:", path);
      return {
        ok: false,
        path,
        error: {
          code: "TIMEOUT_ERROR",
          message: "Page resolve request timed out after 15 seconds",
        },
      } as PageResolveResponse;
    }
    console.error("Failed to fetch remote page resolve:", error);
    return {
      ok: false,
      path,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    } as PageResolveResponse;
  }
}

// ============================================================================
// Main Resolver - Switch zwischen Mock und Remote
// ============================================================================
export async function resolvePage(path: string): Promise<PageResolveResponse> {
  if (USE_MOCK) {
    // Mock ist synchron, daher Promise.resolve
    return Promise.resolve(getMockPageResolve(path));
  } else {
    return getRemotePageResolve(path);
  }
}