import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

// Small round button: shows 🌙 in light mode and ☀️ in dark mode
export default function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.button,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{isDark ? "☀️" : "🌙"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 20 },
});