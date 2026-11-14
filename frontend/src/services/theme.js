export const THEME_KEY = 'timphongonline.theme';
export const isTheme = value => ['light', 'dark', 'system'].includes(value);

export function createThemeController(env = window) {
  const media = env.matchMedia('(prefers-color-scheme: dark)');
  const listeners = new Set();
  let preference = 'system';
  try { const stored = env.localStorage.getItem(THEME_KEY); if (isTheme(stored)) preference = stored; } catch { /* Private browsing may disable storage. */ }
  const snapshot = () => ({ preference, resolved: preference === 'system' ? (media.matches ? 'dark' : 'light') : preference });
  const apply = () => {
    const state = snapshot();
    env.document.documentElement.dataset.theme = state.resolved;
    env.document.documentElement.style.colorScheme = state.resolved;
    listeners.forEach(listener => listener(state));
  };
  const onSystem = () => { if (preference === 'system') apply(); };
  const onStorage = event => {
    if (event.key === THEME_KEY || event.key === null) {
      preference = isTheme(event.newValue) ? event.newValue : 'system';
      apply();
    }
  };
  media.addEventListener('change', onSystem);
  env.addEventListener('storage', onStorage);
  apply();
  return {
    snapshot,
    set(value) {
      if (!isTheme(value)) return;
      preference = value;
      try { env.localStorage.setItem(THEME_KEY, value); } catch { /* Keep the choice in memory. */ }
      apply();
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    destroy() { media.removeEventListener('change', onSystem); env.removeEventListener('storage', onStorage); listeners.clear(); },
  };
}
