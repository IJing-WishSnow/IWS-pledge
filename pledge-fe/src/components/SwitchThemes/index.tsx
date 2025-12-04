import React, { useContext, useEffect, useState, useCallback } from 'react';

import ThemeLight from '_assets/images/theme_light.svg';
import ThemeDark from '_assets/images/theme_dark.svg';

import './index.less';

interface ThemeContextInjected {
  theme: string; // 当前主题
  setTheme: React.Dispatch<React.SetStateAction<string>>; // 修改当前主题状态
}

export const ThemeContext = React.createContext<ThemeContextInjected>({} as ThemeContextInjected);

// 修复：添加 Props 类型定义，包含 children
interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<string>(localStorage.getItem('theme') ?? 'dark');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    window.document.body.setAttribute('data-theme-type', theme);
  }, [theme]);

  useEffect(() => {
    // 修复：类型声明为 MediaQueryList | null
    let mediaQueryListDark: MediaQueryList | null = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (mediaQueryListEvent: MediaQueryListEvent) => {
      if (mediaQueryListEvent.matches) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    };

    // 修复：检查 mediaQueryListDark 是否存在
    if (mediaQueryListDark) {
      mediaQueryListDark.addEventListener('change', handleChange);
    }

    return () => {
      if (mediaQueryListDark) {
        mediaQueryListDark.removeEventListener('change', handleChange);
        mediaQueryListDark = null;
      }
    };
  }, []);

  const value = {
    theme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * 主题组件
 */
const SwitchThemes: React.FC = () => {
  const { theme, setTheme } = useContext(ThemeContext);

  // 修复箭头函数体风格：直接返回函数
  const handleToggleThemes = useCallback(
    (value: string) => () => {
      if (theme !== value) {
        setTheme(value);
      }
    },
    [theme, setTheme],
  );

  // 修复：将 img 替换为 button 元素，解决可访问性问题
  return (
    <div className="components-switch-themes">
      {theme === 'light' ? (
        <button type="button" className="theme-button" aria-label="切换到深色主题" onClick={handleToggleThemes('dark')}>
          <img src={ThemeDark} alt="深色主题图标" />
        </button>
      ) : (
        <button
          type="button"
          className="theme-button"
          aria-label="切换到浅色主题"
          onClick={handleToggleThemes('light')}
        >
          <img src={ThemeLight} alt="浅色主题图标" />
        </button>
      )}
    </div>
  );
};

export default SwitchThemes;
