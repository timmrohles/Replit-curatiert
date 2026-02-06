import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';

/**
 * Theme Toggle Button
 * 
 * Features:
 * - Light/Dark modes using ThemeContext
 * - Animated icon transitions
 * - Accessible with keyboard
 * - Shows current mode
 * - Stable theme switching with global context
 */

export function ThemeToggle() {
  const { toggleTheme, resolvedTheme } = useTheme();

  const getIcon = () => {
    return resolvedTheme === 'dark' 
      ? <Moon className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 transition-colors" style={{ strokeWidth: 1.5 }} /> 
      : <Sun className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 transition-colors" style={{ strokeWidth: 1.5 }} />;
  };

  const getLabel = () => {
    return resolvedTheme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 transition-all hover:scale-105 flex items-center justify-center bg-foreground hover:opacity-90"
      style={{ 
        marginRight: 'env(safe-area-inset-right)'
      }}
      aria-label={`Theme: ${getLabel()}. Klicke um zu wechseln.`}
      title={`Aktuell: ${getLabel()} Mode`}
    >
      <span className="text-background">
        {getIcon()}
      </span>
    </button>
  );
}