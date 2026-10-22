import { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { REMINDED_KEY } from "../constants/storageKeys";
import {
  todayString, nowTimeString, toMinutes, formatTime,
} from "../utils/dateUtils";
import { appearsOn, isDoneOn, isMovedOn } from "../utils/taskUtils";
import {
  playBeep, showSystemNotification, getPermission,
} from "../utils/reminders";

export default function useReminders(tasks, loaded) {
  const [alerts, setAlerts] = useState([]);
  const [permission, setPermission] = useState(getPermission());
  const [remindedLoaded, setRemindedLoaded] = useState(false);
  const remindedRef = useRef(new Set());

  // Load the keys of reminders already shown today
  useEffect(() => {
    const load = async () => {
      try {
        const rem = await AsyncStorage.getItem(REMINDED_KEY);
        if (rem) remindedRef.current = new Set(JSON.parse(rem));
      } catch (e) {}
      setRemindedLoaded(true);
    };
    load();
  }, []);

  // Check for due tasks now, then every 15 seconds
  useEffect(() => {
    if (!loaded || !remindedLoaded) return;

    const check = () => {
      const today = todayString();
      const nowMin = toMinutes(nowTimeString());
      const fresh = [];

      tasks.forEach((t) => {
        if (
          !t.time ||
          !appearsOn(t, today) ||
          isDoneOn(t, today) ||
          isMovedOn(t, today)
        )
          return;
        const diff = nowMin - toMinutes(t.time);
        if (diff < 0 || diff > 10) return;
        const key = `${t.id}|${today}|${t.time}`;
        if (remindedRef.current.has(key)) return;
        remindedRef.current.add(key);
        fresh.push({ key, title: t.title, time: t.time });
      });

      if (fresh.length === 0) return;

      setAlerts((prev) => [...prev, ...fresh]);
      fresh.forEach((f) =>
        showSystemNotification("⏰ Task reminder", `${f.title} (${formatTime(f.time)})`)
      );
      playBeep();

      const keep = [...remindedRef.current].filter(
        (k) => k.split("|")[1] === today
      );
      remindedRef.current = new Set(keep);
      AsyncStorage.setItem(REMINDED_KEY, JSON.stringify(keep)).catch(() => {});
    };

    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [tasks, loaded, remindedLoaded]);

  const dismissAlert = (key) =>
    setAlerts((prev) => prev.filter((a) => a.key !== key));

  const enableNotifications = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (e) {}
  };

  return { alerts, dismissAlert, permission, enableNotifications };
}