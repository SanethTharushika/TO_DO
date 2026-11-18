import { useState, useEffect } from "react";
import { Platform } from "react-native";

// Returns the current Date, updated every second.
// Ticks are aligned to the real second, and the clock resyncs
// when the user comes back to the tab.
export default function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let timeoutId;

    const tick = () => {
      setNow(new Date());
      timeoutId = setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();

    let onVisible;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      onVisible = () => {
        if (document.visibilityState === "visible") setNow(new Date());
      };
      document.addEventListener("visibilitychange", onVisible);
    }

    return () => {
      clearTimeout(timeoutId);
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return now;
}