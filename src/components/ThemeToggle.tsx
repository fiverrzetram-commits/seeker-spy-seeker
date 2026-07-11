import { useDarkMode } from '@/hooks/useDarkMode';

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
      className="relative w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 transition-all duration-300 flex items-center justify-center group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan/0 via-cyan/20 to-cyan/0 group-hover:animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {isDarkMode ? (
        <svg
          className="w-5 h-5 text-cyan relative z-10 group-hover:text-cyan animate-fade-in"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-yellow-400 relative z-10 group-hover:text-yellow-300 animate-fade-in"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l1.414 1.414a1 1 0 001.414-1.414l-1.414-1.414a1 1 0 00-1.414 1.414zm2.828-2.828l1.414-1.414a1 1 0 00-1.414-1.414l-1.414 1.414a1 1 0 001.414 1.414zM13 11a1 1 0 110 2h-2a1 1 0 110-2h2zm1.464 2.536l1.414 1.414a1 1 0 11-1.414 1.414l-1.414-1.414a1 1 0 111.414-1.414zM9 17a1 1 0 100-2 1 1 0 000 2zm-3.536-1.464a1 1 0 10-1.414 1.414l1.414 1.414a1 1 0 001.414-1.414l-1.414-1.414zM7 13a1 1 0 110 2H5a1 1 0 110-2h2zm-.536-2.536a1 1 0 10-1.414-1.414L3.636 9.95a1 1 0 101.414 1.414l1.414-1.414zM10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
      
      <div className={`absolute inset-0 border border-cyan/30 rounded-lg pointer-events-none transition-all duration-300 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  );
}
