// ============================================================================
// Link Resolver - zentraler Link-Generator für ItemTargets
// ============================================================================

import { ItemTarget } from "../types/page-resolve";

/**
 * Konvertiert ein ItemTarget in einen Link-String
 * 
 * Regeln:
 * - category → /kategorie/${slug}
 * - tag → /themen/${slug}
 * - page → slug (as-is wenn mit "/" beginnt, sonst prefix "/")
 * - template → /t/${templateKey} (params als Querystring wenn vorhanden)
 */
export function linkForTarget(target: ItemTarget): string {
  switch (target.type) {
    case "category":
      return `/kategorie/${target.category.slug}`;
    
    case "tag":
      return `/themen/${target.tag.slug}`;
    
    case "page":
      // Robust: slug kann bereits "/" oder "/irgendwas" sein
      const slug = target.page.slug;
      return slug.startsWith("/") ? slug : `/${slug}`;
    
    case "template":
      if (target.params && Object.keys(target.params).length > 0) {
        const queryString = new URLSearchParams(
          Object.entries(target.params).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
        ).toString();
        return `/t/${target.templateKey}?${queryString}`;
      }
      return `/t/${target.templateKey}`;
    
    default:
      // Sollte nicht vorkommen durch TypeScript
      console.warn("Unknown target type:", target);
      return "/";
  }
}

/**
 * Helper: Extrahiert den Display-Namen aus einem Target
 */
export function displayNameForTarget(target: ItemTarget): string {
  switch (target.type) {
    case "category":
      return target.category.name;
    case "tag":
      return target.tag.name;
    case "page":
      return target.page.slug; // Pages haben keinen name im Type
    case "template":
      return target.templateKey;
    default:
      return "";
  }
}