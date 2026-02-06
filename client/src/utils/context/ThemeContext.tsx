import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

/**
 * Theme Context für stabile Dark Mode Implementierung
 * 
 * Features:
 * - Globaler Theme State mit React Context
 * - Persists in localStorage
 * - Automatic DOM class management
 * - Detects system preference
 * - Forces re-render on theme change
 */

const THEME_KEY = 'coratiert_theme';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY) as Theme;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    // ✅ DEFAULT: Light Mode (beim ersten Besuch ohne localStorage)
    return 'light';
  });

  // ✅ DEFAULT: Start with light mode
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Get system preference
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Resolve theme (system → actual theme)
  const resolveTheme = useCallback((selectedTheme: Theme): ResolvedTheme => {
    if (selectedTheme === 'system') {
      return getSystemTheme();
    }
    return selectedTheme;
  }, [getSystemTheme]);

  // Apply theme to DOM
  const applyTheme = useCallback((actualTheme: ResolvedTheme) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    if (actualTheme === 'dark') {
      root.classList.add('dark');
      console.log('🌙 DARK MODE ACTIVATED - classList:', root.classList.toString());
    } else {
      root.classList.remove('dark');
      console.log('☀️ LIGHT MODE ACTIVATED - classList:', root.classList.toString());
    }
    
    setResolvedTheme(actualTheme);
  }, []);

  // Set theme
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    const resolved = resolveTheme(newTheme);
    applyTheme(resolved);
  }, [resolveTheme, applyTheme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Initialize theme on mount
  useEffect(() => {
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
  }, [theme, resolveTheme, applyTheme]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      applyTheme(newSystemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]);

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark'
  }), [theme, resolvedTheme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
