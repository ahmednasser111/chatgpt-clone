"use client";

const STORAGE_KEY = "chatgpt-clone-theme";

export function useTheme() {
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  }

  return { toggleTheme };
}
