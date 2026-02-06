/**
 * ==================================================================
 * FEATURE FLAGS - SINGLE SOURCE OF TRUTH
 * ==================================================================
 * 
 * Zentrale Feature-Steuerung für schrittweise Aktivierung von:
 * - ONIX-Integration (Phase 2)
 * - Erweiterte Admin-Features
 * - Experimentelle Funktionen
 * 
 * ==================================================================
 */

export const FEATURE_FLAGS = {
  /**
   * ONIX Master-Switch
   * Aktiviert ALLE ONIX-Features global
   */
  onix_enabled: false,

  /**
   * ONIX Tag Import
   * Erlaubt Import von ONIX-Subjects (THEMA, BIC, etc.)
   */
  onix_tag_import: false,

  /**
   * ONIX Book Import
   * Erlaubt Import von ONIX-Buchdaten (Titel, Beiträger, etc.)
   */
  onix_book_import: false,

  /**
   * ONIX Derived Tags
   * Erlaubt automatische Ableitung von Tags via tag_mappings
   */
  onix_derived_tags: false,

  /**
   * Admin Diagnostics
   * Zeigt erweiterte Debug-Informationen im Admin
   */
  admin_diagnostics: true,

  /**
   * Soft Delete UI
   * Zeigt "Archivieren" statt "Löschen" als Standard
   */
  soft_delete_ui: true,

  /**
   * Audit Log Viewer
   * Zeigt Audit-Log im Admin Backend
   */
  audit_log_viewer: false, // Wird aktiviert nach Auth-Migration

  /**
   * Book Editorial Overrides
   * Zeigt Import/Editorial-Trennung in Books-UI
   */
  book_editorial_overrides: true,
} as const;

/**
 * Environment-basierte Feature-Flags
 * Überschreibt Defaults basierend auf Umgebung
 */
export function getFeatureFlags(): typeof FEATURE_FLAGS {
  // In Produktion: Alle Features deaktiviert (außer explizit aktiviert)
  // In Development: Mehr Features verfügbar
  
  const env = typeof window !== 'undefined' 
    ? (window as any).__ENV__ 
    : Deno?.env?.get('ENVIRONMENT');

  if (env === 'production') {
    return {
      ...FEATURE_FLAGS,
      admin_diagnostics: false,
      audit_log_viewer: false,
    };
  }

  return FEATURE_FLAGS;
}

/**
 * Check if specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  const flags = getFeatureFlags();
  return flags[feature] ?? false;
}
