import {
  createContext, useContext, useState, useEffect, useMemo, useCallback,
} from "react";
import { View, Platform, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightColors, darkColors } from "../constants/theme";
import { THEME_KEY } from "../constants/storageKeys";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [saved, setSaved] = useState(null); // "light" | "dark" | null (not chosen yet)
  const [ready, setReady] = useState(false);

  // Load the saved choice once
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((v) => {
        if (v === "light" || v === "dark") setSaved(v);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // First launch follows the device setting; after that, the saved choice wins
  const mode = saved || (systemScheme === "dark" ? "dark" : "light");
  const isDark = mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  const setThemeMode = useCallback((m) => {
    setSaved(m);
    AsyncStorage.setItem(THEME_KEY, m).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(isDark ? "light" : "dark");
  }, [isDark, setThemeMode]);

  // Web: match the page background and the browser/status bar color
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.body.style.backgroundColor = colors.background;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", colors.background);
  }, [colors.background]);

  const value = useMemo(
    () => ({ colors, isDark, themeMode: mode, setThemeMode, toggleTheme }),
    [colors, isDark, mode, setThemeMode, toggleTheme]
  );

  // Wait for the saved choice, so the wrong theme never flashes on startup
  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            systemScheme === "dark" ? darkColors.background : lightColors.background,
        }}
      />
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}