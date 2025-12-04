import React from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';
import { light, dark } from '@pancakeswap-libs/uikit';

const CACHE_KEY = 'IS_DARK';

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = React.createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => null,
});

interface ThemeContextProviderProps {
  children?: React.ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    const isDarkUserSetting = localStorage.getItem(CACHE_KEY);
    return isDarkUserSetting ? JSON.parse(isDarkUserSetting) : false;
  });

  const toggleTheme = () => {
    setIsDark((prevState) => {
      const nextValue = !prevState;
      localStorage.setItem(CACHE_KEY, JSON.stringify(nextValue));
      return nextValue;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <SCThemeProvider theme={isDark ? dark : light}>{children}</SCThemeProvider>
    </ThemeContext.Provider>
  );
};

ThemeContextProvider.defaultProps = {
  children: null,
};
