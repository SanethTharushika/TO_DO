import { useState, useEffect } from "react";
import { Platform } from "react-native";

export default function useTick(intervalMs = 30000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), intervalMs);
    let onVisible;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      onVisible = () => setTick((n) => n + 1);
      document.addEventListener("visibilitychange", onVisible);
    }
    return () => {
      clearInterval(id);
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
}