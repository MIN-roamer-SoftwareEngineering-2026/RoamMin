export type Theme = "light" | "dark";

export function readTheme(): Theme {
  try {
    return localStorage.getItem("min-roamer.theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#252c2b" : "#f6f7f3");
  try {
    localStorage.setItem("min-roamer.theme", theme);
  } catch {
    /* Theme still works when browser storage is unavailable. */
  }
}
