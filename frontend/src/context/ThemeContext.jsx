import { createContext, useContext, useEffect, useState } from 'react';
import { createThemeController } from '../services/theme';

const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [state, setState] = useState(() => ({ preference: 'system', resolved: document.documentElement.dataset.theme || 'light' }));
  const [controller, setController] = useState(null);
  useEffect(() => {
    const theme = createThemeController();
    setController(theme);
    setState(theme.snapshot());
    const unsubscribe = theme.subscribe(setState);
    return () => { unsubscribe(); theme.destroy(); };
  }, []);
  return <ThemeContext.Provider value={{ ...state, setTheme: value => controller?.set(value) }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
