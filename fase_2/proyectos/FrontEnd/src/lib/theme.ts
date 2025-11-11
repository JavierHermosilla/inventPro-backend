import { SETTINGS_STORAGE_KEY } from "./constants";

export type ThemeName = "light" | "dark";

export const applyDocumentTheme = (theme: ThemeName) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  const isDark = theme === "dark";

  if (process.env.NODE_ENV === "development") {
    console.debug("[theme] applying", theme, {
      rootClass: root.className,
      bodyClass: body?.className ?? "",
    });
  }

  root.dataset.theme = theme;
  root.setAttribute("data-theme", theme);
  if (body) {
    body.dataset.theme = theme;
  }

  const darkNodes = document.querySelectorAll(".dark");
  darkNodes.forEach((node) => {
    if (node !== root) {
      node.classList.remove("dark");
    }
  });

  root.classList.remove("dark");
  if (isDark) {
    root.classList.add("dark");
  }

  if (body) {
    body.classList.remove("theme-dark", "theme-light");
    body.classList.add(isDark ? "theme-dark" : "theme-light");
    body.classList.remove("dark");
    if (isDark) {
      body.classList.add("dark");
    }
  }

  root.style.colorScheme = isDark ? "dark" : "light";
};

export const readStoredTheme = (): ThemeName | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { appearance?: { theme?: string } };
    } | null;
    const theme = parsed?.state?.appearance?.theme;
    if (theme === "dark" || theme === "light") {
      return theme;
    }
    return null;
  } catch {
    return null;
  }
};
