export type Theme = "light" | "dark";

export function readTheme(): Theme {
  try {
    return localStorage.getItem("min-roamer.theme") === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#1c212a" : "#f8fafc");
  try {
    localStorage.setItem("min-roamer.theme", theme);
  } catch {
    /* Theme still works when browser storage is unavailable. */
  }
}
