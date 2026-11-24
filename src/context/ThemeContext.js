
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { lightColors, darkColors } from "../constants/theme";

const THEME_STORAGE_KEY = "todo_theme_v1";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();

  const [themeMode, setThemeMode] = useState("system");
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Restore the saved theme preference on startup.
  useEffect(() => {
    let active = true;

    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(
          THEME_STORAGE_KEY
        );

        if (
          active &&
          ["light", "dark", "system"].includes(savedTheme)
        ) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      } finally {
        if (active) {
          setThemeLoaded(true);
        }
      }
    };

    loadTheme();

    return () => {
      active = false;
    };
  }, []);

  // Save the selected theme preference.
  useEffect(() => {
    if (!themeLoaded) return;

    AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode).catch(
      (error) => {
        console.error("Failed to save theme preference:", error);
      }
    );
  }, [themeMode, themeLoaded]);

  // Resolve System mode using the device appearance.
  const activeTheme =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  const colors =
    activeTheme === "dark" ? darkColors : lightColors;

  const value = {
    themeMode,
    activeTheme,
    colors,
    setThemeMode,
  };

  // Prevent the app from showing the wrong theme before
  // the saved preference has been restored.
  if (!themeLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}
