/**
 * 화면 테마
 *
 * 다크(퍼플 네온) → 라이트(피치) → 아케이드(아크 네온) 순으로 순환한다. 기본은 다크.
 * 바뀐 테마는 `<html data-theme>`에 반영하고 localStorage에 저장한다.
 */
export type Theme = "dark" | "light" | "arcade";

const THEME_KEY = "listenup-theme";
const THEMES: Theme[] = ["dark", "light", "arcade"];
const THEME_ICONS: Record<Theme, string> = {
  dark: "🌙",
  light: "☀️",
  arcade: "🎮",
};

function loadTheme(): Theme {
  if (typeof localStorage === "undefined") return "dark";
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "light" || saved === "arcade" ? saved : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

class ThemeStore {
  current = $state<Theme>(loadTheme());

  readonly icon = $derived(THEME_ICONS[this.current]);

  cycle() {
    this.current = THEMES[(THEMES.indexOf(this.current) + 1) % THEMES.length];
    applyTheme(this.current);
  }
}

export const themeStore = new ThemeStore();

applyTheme(themeStore.current);
