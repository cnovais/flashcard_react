import React, { createContext, useContext, useState, ReactNode } from 'react';
import { lightTheme, darkTheme } from '../theme';

interface ThemeContextData {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  function toggleTheme(): void {
    setIsDarkMode(!isDarkMode);
  }

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleTheme,
      theme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextData {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 