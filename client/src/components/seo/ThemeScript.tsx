/**
 * 🎯 BLOCKING THEME SCRIPT
 * 
 * Dieses Script MUSS im <head> VOR allen anderen Stylesheets/Components geladen werden,
 * um FOUC (Flash of Unstyled Content) zu vermeiden.
 * 
 * Es liest den Theme-Wert aus localStorage und setzt die 'dark' Klasse am <html> Element,
 * BEVOR der Browser das erste Pixel rendert.
 * 
 * WHY BLOCKING?
 * - React useEffect läuft NACH dem ersten Render → FOUC!
 * - Dieses Script läuft WÄHREND des HTML-Parsings → kein FOUC!
 * 
 * USAGE in App.tsx oder index.html:
 * 
 * ```tsx
 * import { ThemeScript } from './components/ThemeScript';
 * 
 * function App() {
 *   return (
 *     <>
 *       <ThemeScript />  {/* ⚠️ Muss VOR allem anderen stehen! *\/}
 *       <ThemeProvider>
 *         <YourApp />
 *       </ThemeProvider>
 *     </>
 *   );
 * }
 * ```
 */

export function ThemeScript() {
  const themeScript = `
    (function() {
      const THEME_KEY = 'coratiert_theme';
      
      function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      function resolveTheme(theme) {
        if (theme === 'system') return getSystemTheme();
        // ✅ DEFAULT: Light Mode (wenn kein Theme gespeichert ist)
        return theme || 'light';
      }
      
      try {
        const storedTheme = localStorage.getItem(THEME_KEY);
        const resolved = resolveTheme(storedTheme);
        
        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        // ✅ LocalStorage not available → default to light mode
        console.warn('Could not access localStorage for theme:', e);
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      // ⚠️ KEIN async/defer! Muss blockierend sein!
    />
  );
}