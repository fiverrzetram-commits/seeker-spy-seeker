import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme-preference');
    if (stored) return stored === 'dark';
    
    // Check system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return true; // Default to dark mode
  });

  useEffect(() => {
    const html = document.documentElement;
    
    if (isDarkMode) {
      html.classList.remove('light');
      html.classList.add('dark');
      localStorage.setItem('theme-preference', 'dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      localStorage.setItem('theme-preference', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return { isDarkMode, toggleDarkMode };
}