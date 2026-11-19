import { useState, useEffect } from "react";
import { Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CLOCK_FORMAT_KEY } from "../constants/storageKeys";
import { dateToString, formatClock, prettyDate } from "../utils/dateUtils";
import useClock from "../hooks/useClock";

export default function Clock() {
  const now = useClock(); // only this component re-renders every second
  const [use24h, setUse24h] = useState(false);

  // Load the saved 12h / 24h choice
  useEffect(() => {
    AsyncStorage.getItem(CLOCK_FORMAT_KEY)
      .then((v) => {
        if (v === "24") setUse24h(true);
      })
      .catch(() => {});
  }, []);

  const toggleFormat = () => {
    const next = !use24h;
    setUse24h(next);
    AsyncStorage.setItem(CLOCK_FORMAT_KEY, next ? "24" : "12").catch(() => {});
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={toggleFormat}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Live clock. Tap to switch between 12 hour and 24 hour format"
    >
      <Text style={styles.time}>{formatClock(now, use24h)}</Text>
      <Text style={styles.date}>{prettyDate(dateToString(now))}</Text>
      <Text style={styles.hint}>Tap to switch {use24h ? "to 12h" : "to 24h"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  time: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontVariant: ["tabular-nums"],
  },
  date: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  hint: { fontSize: 11, color: "#9ca3af", marginTop: 6 },
});