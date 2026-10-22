import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEY } from "../constants/storageKeys";
import { isDoneOn } from "../utils/taskUtils";

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved tasks once
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setTasks(JSON.parse(saved));
      } catch (e) {
        console.log("Load error", e);
      }
      setLoaded(true);
    };
    load();
  }, []);

  // Save whenever tasks change (after the first load)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch((e) =>
      console.log("Save error", e)
    );
  }, [tasks, loaded]);

  // repeat is "daily" or "none"
  const addTask = ({ title, date, time, repeat }) => {
    const id = Date.now().toString();
    setTasks((prev) => [
      ...prev,
      { id, title, date, time, repeat, done: false, doneDates: [], movedDates: [] },
    ]);
  };

  // viewDate = the day the user is looking at while editing
  const updateTask = (id, { title, time, repeat }, viewDate) =>
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const becameOneTime = t.repeat === "daily" && repeat !== "daily";
        return {
          ...t,
          title,
          time,
          repeat,
          date: becameOneTime ? viewDate : t.date,
          done: becameOneTime ? isDoneOn(t, viewDate) : t.done,
        };
      })
    );

  // Tick / untick for one specific day
  const toggleTask = (id, date) =>
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (t.repeat === "daily") {
          const list = t.doneDates || [];
          const doneDates = list.includes(date)
            ? list.filter((d) => d !== date)
            : [...list, date];
          return { ...t, doneDates };
        }
        return { ...t, done: !t.done };
      })
    );

  // Deleting a daily task removes it from every day
  const deleteTask = (id) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const markDoneOn = (task, date) =>
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== task.id) return t;
        if (t.repeat === "daily") {
          return { ...t, doneDates: [...(t.doneDates || []), date] };
        }
        return { ...t, done: true };
      })
    );

  // One-time task: move it. Daily task: only that day's occurrence moves.
  const rescheduleTask = (taskId, occDate, newDate, newTime) => {
    const newId = Date.now().toString();
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;

      if (task.repeat === "daily") {
        const copy = {
          id: newId,
          title: task.title,
          date: newDate,
          time: newTime,
          repeat: "none",
          done: false,
          doneDates: [],
          movedDates: [],
        };
        return [
          ...prev.map((t) =>
            t.id === taskId
              ? { ...t, movedDates: [...(t.movedDates || []), occDate] }
              : t
          ),
          copy,
        ];
      }

      return prev.map((t) =>
        t.id === taskId ? { ...t, date: newDate, time: newTime, done: false } : t
      );
    });
  };

  return {
    tasks,
    loaded,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    markDoneOn,
    rescheduleTask,
  };
}